import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

type StoredFileLocation =
  | { type: 's3'; bucket: string; key: string; filename: string }
  | { type: 'local'; filePath: string; filename: string };

function getS3Config() {
  return {
    region: process.env.AWS_REGION,
    bucket: process.env.AWS_S3_BUCKET,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    endpoint: process.env.AWS_S3_ENDPOINT,
  };
}

function isS3Configured() {
  const { region, bucket, accessKeyId, secretAccessKey } = getS3Config();
  return Boolean(region && bucket && accessKeyId && secretAccessKey);
}

function getS3Client() {
  const { region, accessKeyId, secretAccessKey, endpoint } = getS3Config();
  return new S3Client({
    region,
    endpoint: endpoint || undefined,
    credentials: {
      accessKeyId: accessKeyId || '',
      secretAccessKey: secretAccessKey || '',
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
  folder: 'knowledge' | 'policies' | 'tickets';
  buffer: Buffer;
  contentType?: string;
  originalName: string;
}) {
  const filename = buildUniqueFilename(params.originalName);
  const key = `${params.folder}/${filename}`;

  if (isS3Configured()) {
    const client = getS3Client();
    const { bucket } = getS3Config();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: params.buffer,
        ContentType: params.contentType,
      }),
    );
    return `s3://${bucket}/${key}`;
  }
  throw new Error(
    'S3 not configured. Set AWS_REGION, AWS_S3_BUCKET, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY.',
  );
}

export function resolveStoredFileLocation(
  folder: 'knowledge' | 'policies' | 'tickets',
  fileUrl?: string,
): StoredFileLocation | null {
  if (!fileUrl) return null;
  if (!isS3Url(fileUrl)) return null;
  const { bucket, key } = parseS3Url(fileUrl);
  const filename = key.split('/').pop() || 'file';
  return { type: 's3', bucket, key, filename };
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
}
