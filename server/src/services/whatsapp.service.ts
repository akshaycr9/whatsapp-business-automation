import axios from 'axios';
import { metaApi } from '../lib/meta-api.js';
import { env } from '../config/env.js';
import { AppError } from '../lib/app-error.js';
import { logger } from '../lib/logger.js';

export interface TextMessagePayload {
  type: 'text';
  text: string;
}

export interface TemplateMessagePayload {
  type: 'template';
  templateName: string;
  languageCode: string;
  components: TemplateComponent[];
}

export type TemplateComponent = {
  type: 'body' | 'header' | 'button';
  parameters: Array<{ type: 'text'; text: string } | { type: 'image'; image: { link: string } }>;
  index?: number;
  sub_type?: 'quick_reply' | 'url';
};

export interface SendMessageResult {
  messageId: string;
}

export interface MediaInfo {
  id: string;
  url: string;
  mime_type: string;
  sha256: string;
  file_size: number;
}

/**
 * Human-readable hints appended to Meta API error messages when a known
 * error code is returned. Stored in AutomationLog.errorMessage so failures
 * are immediately actionable without digging through raw API responses.
 */
const META_ERROR_HINTS: Record<number, string> = {
  // Sandbox restriction — phone not in developer portal allowed list
  131030:
    'Recipient phone number is not in the Meta sandbox allowed list. ' +
    'Add it at: Meta Developer Portal → WhatsApp → API Setup → "To" field. ' +
    'For production use, complete Meta Business Verification to lift this restriction.',
  // Tried to send free-form text outside the 24-hour window
  131047: 'Message was sent outside the 24-hour customer service window — use a template message instead.',
  // Number does not have an active WhatsApp account
  131026: 'Recipient number is not a valid WhatsApp account.',
  // Sending tier rate limit hit
  130429: 'Meta rate limit reached. Wait before retrying or request a tier upgrade.',
};

function handleMetaError(error: unknown, context: string): never {
  if (axios.isAxiosError(error)) {
    const metaError = (error.response?.data as Record<string, unknown> | undefined)
      ?.['error'] as Record<string, unknown> | undefined;
    const rawMessage = (metaError?.['message'] as string | undefined) ?? error.message;
    const errorCode = metaError?.['code'] as number | undefined;
    const hint = errorCode !== undefined ? META_ERROR_HINTS[errorCode] : undefined;
    const fullMessage = hint ? `${rawMessage} | ${hint}` : rawMessage;
    logger.error(`${context} [code=${errorCode ?? 'unknown'}]:`, fullMessage);
    throw new AppError(502, fullMessage ?? 'Meta API error', 'META_API_ERROR');
  }
  logger.error(`${context}:`, error);
  throw new AppError(502, 'Meta API error', 'META_API_ERROR');
}

export const sendTextMessage = async (to: string, text: string): Promise<SendMessageResult> => {
  try {
    const response = await metaApi.post<{ messages: Array<{ id: string }> }>(
      `/${env.META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: { preview_url: false, body: text },
      },
    );
    return { messageId: response.data.messages[0]!.id };
  } catch (error) {
    handleMetaError(error, 'sendTextMessage');
  }
};

export const sendTemplateMessage = async (
  to: string,
  payload: TemplateMessagePayload,
): Promise<SendMessageResult> => {
  try {
    const response = await metaApi.post<{ messages: Array<{ id: string }> }>(
      `/${env.META_PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'template',
        template: {
          name: payload.templateName,
          language: { code: payload.languageCode },
          components: payload.components,
        },
      },
    );
    return { messageId: response.data.messages[0]!.id };
  } catch (error) {
    handleMetaError(error, 'sendTemplateMessage');
  }
};

export const getMediaInfo = async (mediaId: string): Promise<MediaInfo> => {
  try {
    const response = await metaApi.get<MediaInfo>(`/${mediaId}`);
    return response.data;
  } catch (error) {
    handleMetaError(error, 'getMediaInfo');
  }
};

export const downloadMedia = async (mediaUrl: string): Promise<Buffer> => {
  try {
    const response = await axios.get<ArrayBuffer>(mediaUrl, {
      headers: { Authorization: `Bearer ${env.META_ACCESS_TOKEN}` },
      responseType: 'arraybuffer',
    });
    return Buffer.from(response.data);
  } catch (error) {
    handleMetaError(error, 'downloadMedia');
  }
};
