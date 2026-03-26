import { isAxiosError } from 'axios';
import { type Template } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { notFound, duplicate, badRequest } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';
import { metaApi } from '../lib/meta-api.js';
import { env } from '../config/env.js';

// ── Types ────────────────────────────────────────────────────────────────────

export interface TemplateButton {
  type: 'QUICK_REPLY' | 'URL' | 'PHONE_NUMBER' | 'COPY_CODE';
  text: string;
  url?: string;
  phone_number?: string;
  /** Dynamic URL example value (for URL buttons with {{1}}) or copy code example */
  example?: string;
}

export interface TemplateComponent {
  type: 'HEADER' | 'BODY' | 'FOOTER' | 'BUTTONS';
  format?: 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  text?: string;
  /** Sample values for {{1}}, {{2}}, … — required by Meta when variables are present */
  example?: string[];
  buttons?: TemplateButton[];
}

export interface CreateTemplateInput {
  name: string;
  language: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  components: TemplateComponent[];
}

interface ListParams {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

interface ListMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface ListResult {
  items: Template[];
  meta: ListMeta;
}

interface MetaTemplateRecord {
  id: string;
  name: string;
  status: string;
  rejected_reason?: string;
}

interface MetaListResponse {
  data: MetaTemplateRecord[];
}

interface MetaCreateResponse {
  id: string;
  status: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const VARIABLE_RE = /\{\{\d+\}\}/;

/** Convert our TemplateComponent[] into the shape Meta's API expects */
function buildMetaComponents(components: TemplateComponent[]): unknown[] {
  return components.map((c) => {
    if (c.type === 'HEADER') {
      const base: Record<string, unknown> = {
        type: 'HEADER',
        format: c.format ?? 'TEXT',
      };
      if (c.text !== undefined) base['text'] = c.text;
      // Meta requires example when header text contains variables
      if (c.text && VARIABLE_RE.test(c.text) && c.example && c.example.length > 0) {
        base['example'] = { header_text: c.example };
      }
      return base;
    }

    if (c.type === 'BODY') {
      const base: Record<string, unknown> = {
        type: 'BODY',
        text: c.text ?? '',
      };
      // Meta requires example when body contains variables
      if (c.example && c.example.length > 0) {
        base['example'] = { body_text: [c.example] };
      }
      return base;
    }

    if (c.type === 'FOOTER') {
      return { type: 'FOOTER', text: c.text ?? '' };
    }

    // BUTTONS
    const metaButtons = (c.buttons ?? []).map((btn) => {
      if (btn.type === 'QUICK_REPLY') {
        return { type: 'QUICK_REPLY', text: btn.text };
      }
      if (btn.type === 'URL') {
        const b: Record<string, unknown> = {
          type: 'URL',
          text: btn.text,
          url: btn.url ?? '',
        };
        // Dynamic URL with {{1}} requires an example
        if (btn.url && VARIABLE_RE.test(btn.url) && btn.example) {
          b['example'] = [btn.example];
        }
        return b;
      }
      if (btn.type === 'PHONE_NUMBER') {
        return { type: 'PHONE_NUMBER', text: btn.text, phone_number: btn.phone_number ?? '' };
      }
      // COPY_CODE (AUTHENTICATION only)
      return { type: 'COPY_CODE', example: btn.example ?? '' };
    });

    return { type: 'BUTTONS', buttons: metaButtons };
  });
}

// ── Service functions ─────────────────────────────────────────────────────────

export const list = async (params: ListParams): Promise<ListResult> => {
  const page = Math.max(1, params.page ?? 1);
  const limit = Math.min(100, Math.max(1, params.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};

  if (params.status && params.status !== 'all') {
    where['status'] = params.status;
  }

  if (params.search?.trim()) {
    where['name'] = { contains: params.search.trim(), mode: 'insensitive' };
  }

  const [items, total] = await Promise.all([
    prisma.template.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.template.count({ where }),
  ]);

  return {
    items,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getById = async (id: string): Promise<Template> => {
  const template = await prisma.template.findUnique({ where: { id } });
  if (!template) throw notFound('Template');
  return template;
};

export const create = async (input: CreateTemplateInput): Promise<Template> => {
  if (!/^[a-z0-9_]+$/.test(input.name)) {
    throw badRequest('Template name must contain only lowercase letters, numbers, and underscores');
  }

  const metaComponents = buildMetaComponents(input.components);

  const payload = {
    name: input.name,
    language: input.language,
    category: input.category,
    allow_category_change: true,
    components: metaComponents,
  };

  // Log the full payload so we can debug Meta rejections easily
  logger.info('Sending template to Meta:', JSON.stringify(payload, null, 2));

  let metaResponse: MetaCreateResponse;

  try {
    const response = await metaApi.post<MetaCreateResponse>(
      `/${env.META_WABA_ID}/message_templates`,
      payload,
    );
    metaResponse = response.data;
  } catch (err: unknown) {
    if (isAxiosError(err) && err.response?.status === 409) {
      throw duplicate('Template name already exists on Meta');
    }

    // Log the full Meta error response for debugging (subcode + error_data pinpoint the bad field)
    if (isAxiosError(err) && err.response?.data) {
      logger.error('Meta API error response:', JSON.stringify(err.response.data, null, 2));
    } else {
      logger.error('Meta create template error:', err);
    }

    interface MetaErrorBody {
      error?: {
        message?: string;
        code?: number;
        error_subcode?: number;
        error_data?: string;
        fbtrace_id?: string;
      };
    }

    const metaErr = isAxiosError(err)
      ? (err.response?.data as MetaErrorBody | undefined)?.error
      : undefined;

    // Build a useful error message that includes the subcode when available
    let errorMessage = metaErr?.message ?? 'Meta API rejected the template';
    if (metaErr?.error_subcode) {
      errorMessage += ` (subcode: ${metaErr.error_subcode})`;
    }
    if (metaErr?.error_data) {
      errorMessage += ` — ${metaErr.error_data}`;
    }

    throw badRequest(errorMessage);
  }

  const template = await prisma.template.create({
    data: {
      name: input.name,
      language: input.language,
      category: input.category,
      components: input.components as unknown as import('@prisma/client').Prisma.InputJsonValue,
      metaTemplateId: metaResponse.id,
      status: 'PENDING',
    },
  });

  logger.info(`Template created: ${template.id} (Meta ID: ${metaResponse.id})`);
  return template;
};

export const syncOne = async (id: string): Promise<Template> => {
  const template = await getById(id);

  if (!template.metaTemplateId) {
    throw badRequest('Template has no Meta ID');
  }

  const response = await metaApi.get<MetaListResponse>(
    `/${env.META_WABA_ID}/message_templates`,
    { params: { name: template.name, fields: 'id,name,status,rejected_reason' } },
  );

  const records = response.data.data;
  if (!records || records.length === 0) {
    throw notFound('Template on Meta');
  }

  const metaRecord = records[0];
  const updatedStatus = metaRecord.status.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED';

  const updated = await prisma.template.update({
    where: { id },
    data: {
      status: updatedStatus,
      rejectedReason: metaRecord.rejected_reason ?? null,
    },
  });

  logger.info(`Template synced: ${id} — status: ${updatedStatus}`);
  return updated;
};

export const syncAll = async (): Promise<{ synced: number }> => {
  const templates = await prisma.template.findMany({
    where: { metaTemplateId: { not: null } },
  });

  if (templates.length === 0) return { synced: 0 };

  const response = await metaApi.get<MetaListResponse>(
    `/${env.META_WABA_ID}/message_templates`,
    { params: { fields: 'id,name,status,rejected_reason', limit: 100 } },
  );

  const metaByName = new Map<string, MetaTemplateRecord>();
  for (const record of response.data.data) {
    metaByName.set(record.name, record);
  }

  let synced = 0;

  for (const template of templates) {
    const metaRecord = metaByName.get(template.name);
    if (!metaRecord) continue;

    const updatedStatus = metaRecord.status.toUpperCase() as 'PENDING' | 'APPROVED' | 'REJECTED';

    await prisma.template.update({
      where: { id: template.id },
      data: {
        status: updatedStatus,
        rejectedReason: metaRecord.rejected_reason ?? null,
      },
    });

    synced++;
  }

  logger.info(`Sync all templates complete — synced: ${synced}`);
  return { synced };
};

export const remove = async (id: string): Promise<void> => {
  const template = await getById(id);

  if (template.metaTemplateId) {
    try {
      await metaApi({
        method: 'DELETE',
        url: `/${env.META_WABA_ID}/message_templates`,
        data: { name: template.name, hsm_id: template.metaTemplateId },
      });
    } catch (err: unknown) {
      logger.error(`Failed to delete template from Meta (ID: ${template.metaTemplateId}):`, err);
    }
  }

  await prisma.template.delete({ where: { id } });
  logger.info(`Template deleted: ${id}`);
};
