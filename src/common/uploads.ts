import * as fs from 'fs';
import * as path from 'path';

export function getUploadsRoot() {
  return process.env.UPLOADS_DIR || path.join(process.cwd(), 'uploads');
}

function getFallbackUploadsRoot() {
  if (!process.env.UPLOADS_DIR) return null;
  return path.join(process.cwd(), 'uploads');
}

export function ensureUploadsDir(...parts: string[]) {
  const target = path.join(getUploadsRoot(), ...parts);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  return target;
}

export function resolveUploadsFilePath(
  subfolder: string,
  fileUrl?: string,
) {
  if (!fileUrl) return null;
  const normalized = fileUrl.replace(/\\/g, '/');
  const prefix = `/uploads/${subfolder}/`;
  const startIndex = normalized.indexOf(prefix);
  const filename =
    startIndex >= 0
      ? normalized.slice(startIndex + prefix.length)
      : normalized.split('/').pop();
  if (!filename) return null;
  const primary = path.join(getUploadsRoot(), subfolder, filename);
  if (fs.existsSync(primary)) return primary;

  const fallbackRoot = getFallbackUploadsRoot();
  if (fallbackRoot) {
    const fallback = path.join(fallbackRoot, subfolder, filename);
    if (fs.existsSync(fallback)) return fallback;
  }

  return null;
}
