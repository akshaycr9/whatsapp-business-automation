import { api } from '@/lib/api';
import type {
  Template,
  CreateTemplateInput,
  UpdateTemplateInput,
  TemplateMeta,
  StatusCounts,
  FetchTemplatesArg,
  PaginatedResponse,
  ApiResponse,
} from '@/types';

export const fetchTemplatesApi = async ({
  search,
  page,
  statusFilter,
}: FetchTemplatesArg): Promise<{ templates: Template[]; meta: TemplateMeta }> => {
  const params: Record<string, string | number> = { page, limit: 20 };
  if (search.trim()) params.search = search.trim();
  if (statusFilter !== 'all') params.status = statusFilter;
  const res = await api.get<PaginatedResponse<Template>>('/templates', { params });
  return { templates: res.data.data, meta: res.data.meta };
};

export const createTemplateApi = async (input: CreateTemplateInput): Promise<Template> => {
  const res = await api.post<ApiResponse<Template>>('/templates', input);
  return res.data.data;
};

export const deleteTemplateApi = async (id: string): Promise<string> => {
  await api.delete(`/templates/${id}`);
  return id;
};

export const syncTemplateApi = async (id: string): Promise<Template> => {
  const res = await api.post<ApiResponse<Template>>(`/templates/${id}/sync`);
  return res.data.data;
};

export const syncAllTemplatesApi = async (): Promise<{ synced: number }> => {
  const res = await api.post<ApiResponse<{ synced: number }>>('/templates/sync-all');
  return res.data.data;
};

export const fetchStatusCountsApi = async (): Promise<StatusCounts> => {
  const res = await api.get<ApiResponse<StatusCounts>>('/templates/status-counts');
  return res.data.data;
};

export const updateTemplateApi = async ({ id, components }: UpdateTemplateInput): Promise<Template> => {
  const res = await api.patch<ApiResponse<Template>>(`/templates/${id}`, { components });
  return res.data.data;
};
