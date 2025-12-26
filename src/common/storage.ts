import * as fs from 'fs';
import * as path from 'path';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { ensureUploadsDir, getUploadsRoot } from './uploads';

type StoredFileLocation =
  | { type: 's3'; bucket: string; key: string; filename: string }
  | { type: 'local'; filePath: string; filename: string };

const S3_REGION = process.env.AWS_REGION;
const S3_BUCKET = process.env.AWS_S3_BUCKET;
const S3_ACCESS_KEY = process.env.AWS_ACCESS_KEY_ID;
const S3_SECRET = process.env.AWS_SECRET_ACCESS_KEY;
const S3_ENDPOINT = process.env.AWS_S3_ENDPOINT;

function isS3Configured() {
  return Boolean(S3_REGION && S3_BUCKET && S3_ACCESS_KEY && S3_SECRET);
}

function getS3Client() {
  return new S3Client({
    region: S3_REGION,
    endpoint: S3_ENDPOINT || undefined,
    credentials: {
      accessKeyId: S3_ACCESS_KEY || '',
      secretAccessKey: S3_SECRET || '',
    },
  });
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

function buildUniqueFilename(original: string) {
  const safeName = sanitizeFilename(original || 'file');
  return `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName}`;
}

function buildLocalUrl(folder: string, filename: string) {
  return `/uploads/${folder}/${filename}`;
}

function isS3Url(fileUrl?: string) {
  return Boolean(fileUrl && fileUrl.startsWith('s3://'));
}

function parseS3Url(fileUrl: string) {
  const trimmed = fileUrl.replace('s3://', '');
  const [bucket, ...rest] = trimmed.split('/');
  const key = rest.join('/');
  return { bucket, key };
}

export async function storeUploadedFile(params: {
  folder: 'knowledge' | 'policies';
  buffer: Buffer;
  contentType?: string;
  originalName: string;
}) {
  const filename = buildUniqueFilename(params.originalName);
  const key = `${params.folder}/${filename}`;

  if (isS3Configured()) {
    const client = getS3Client();
    await client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: params.buffer,
        ContentType: params.contentType,
      }),
    );
    return `s3://${S3_BUCKET}/${key}`;
  }

  const dir = ensureUploadsDir(params.folder);
  const filePath = path.join(dir, filename);
  await fs.promises.writeFile(filePath, params.buffer);
  return buildLocalUrl(params.folder, filename);
}

export function resolveStoredFileLocation(
  folder: 'knowledge' | 'policies',
  fileUrl?: string,
): StoredFileLocation | null {
  if (!fileUrl) return null;
  if (isS3Url(fileUrl)) {
    const { bucket, key } = parseS3Url(fileUrl);
    const filename = key.split('/').pop() || 'file';
    return { type: 's3', bucket, key, filename };
  }

  const normalized = fileUrl.replace(/\\/g, '/');
  const prefix = `/uploads/${folder}/`;
  const startIndex = normalized.indexOf(prefix);
  const filename =
    startIndex >= 0
      ? normalized.slice(startIndex + prefix.length)
      : normalized.split('/').pop();
  if (!filename) return null;

  const primaryRoot = getUploadsRoot();
  const primaryPath = path.join(primaryRoot, folder, filename);
  if (fs.existsSync(primaryPath)) {
    return { type: 'local', filePath: primaryPath, filename };
  }

  if (process.env.UPLOADS_DIR) {
    const fallbackPath = path.join(process.cwd(), 'uploads', folder, filename);
    if (fs.existsSync(fallbackPath)) {
      return { type: 'local', filePath: fallbackPath, filename };
    }
  }

  return null;
}

export async function getSignedDownloadUrl(location: StoredFileLocation) {
  if (location.type !== 's3') return null;
  const client = getS3Client();
  const command = new GetObjectCommand({
    Bucket: location.bucket,
    Key: location.key,
    ResponseContentDisposition: `attachment; filename="${location.filename}"`,
  });
  return getSignedUrl(client, command, { expiresIn: 60 * 5 });
}

export async function removeStoredFile(fileUrl?: string) {
  if (!fileUrl) return;
  if (isS3Url(fileUrl)) {
    if (!isS3Configured()) return;
    const { bucket, key } = parseS3Url(fileUrl);
    const client = getS3Client();
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucket,
        Key: key,
      }),
    );
    return;
  }

  const localPath = fileUrl.replace(/\\/g, '/');
  const filename = localPath.split('/').pop();
  if (!filename) return;
  const folder = localPath.includes('/uploads/knowledge/')
    ? 'knowledge'
    : localPath.includes('/uploads/policies/')
    ? 'policies'
    : null;
  if (!folder) return;
  const primaryPath = path.join(getUploadsRoot(), folder, filename);
  try {
    await fs.promises.unlink(primaryPath);
    return;
  } catch (error: any) {
    if (error?.code !== 'ENOENT') {
      console.warn(`Failed to delete file ${primaryPath}`, error);
      return;
    }
  }

  if (process.env.UPLOADS_DIR) {
    const fallbackPath = path.join(process.cwd(), 'uploads', folder, filename);
    try {
      await fs.promises.unlink(fallbackPath);
    } catch (error: any) {
      if (error?.code !== 'ENOENT') {
        console.warn(`Failed to delete file ${fallbackPath}`, error);
      }
    }
  }
}
