import { getApiBaseUrl } from '@/utils/api';

export function resolveAttachmentUrl(attachmentPath: string) {
  if (!attachmentPath.startsWith('/')) {
    return attachmentPath;
  }
  return `${getApiBaseUrl()}${attachmentPath}`;
}