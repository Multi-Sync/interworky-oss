const StorageProvider = require('./StorageProvider');
const { registerProvider } = require('../registry');

/**
 * S3-compatible storage provider (AWS S3, MinIO, DigitalOcean Spaces, etc.).
 *
 * Env vars:
 *   AWS_S3_BUCKET   — Bucket name
 *   AWS_REGION      — AWS region (default: us-east-1)
 *   AWS_ENDPOINT    — Custom endpoint URL (for MinIO, DO Spaces, etc.)
 *   AWS_ACCESS_KEY_ID — Access key (standard AWS env var)
 *   AWS_SECRET_ACCESS_KEY — Secret key (standard AWS env var)
 */
class S3StorageProvider extends StorageProvider {
  constructor() {
    super();
    // Lazy-require so users without S3 don't need @aws-sdk/client-s3
    const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } = require('@aws-sdk/client-s3');

    const config = {
      region: process.env.AWS_REGION || 'us-east-1',
    };
    if (process.env.AWS_ENDPOINT) {
      config.endpoint = process.env.AWS_ENDPOINT;
      config.forcePathStyle = true; // Required for MinIO
    }

    this.client = new S3Client(config);
    this.bucket = process.env.AWS_S3_BUCKET;
    this.Commands = { PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command };
  }

  async upload(fileBuffer, filePath, opts = {}) {
    const { PutObjectCommand } = this.Commands;
    await this.client.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
      Body: fileBuffer,
      ContentType: opts.contentType || 'application/octet-stream',
    }));

    const endpoint = process.env.AWS_ENDPOINT || `https://s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`;
    return `${endpoint}/${this.bucket}/${filePath}`;
  }

  async download(filePath) {
    const { GetObjectCommand } = this.Commands;
    const response = await this.client.send(new GetObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    }));
    // Convert readable stream to buffer
    const chunks = [];
    for await (const chunk of response.Body) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async delete(filePath) {
    const { DeleteObjectCommand } = this.Commands;
    await this.client.send(new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: filePath,
    }));
  }

  async list(prefix) {
    const { ListObjectsV2Command } = this.Commands;
    const response = await this.client.send(new ListObjectsV2Command({
      Bucket: this.bucket,
      Prefix: prefix,
    }));
    return (response.Contents || []).map(obj => obj.Key);
  }
}

registerProvider('storage', 's3', () => new S3StorageProvider());

module.exports = S3StorageProvider;
