const StorageProvider = require('./StorageProvider');
const { registerProvider } = require('../registry');

/**
 * Google Cloud Storage provider.
 *
 * Env vars:
 *   GCP_BUCKET_NAME    — GCS bucket name
 *   GCP_PROJECT_ID     — GCP project ID
 *   GOOGLE_APPLICATION_CREDENTIALS — Path to service account JSON (standard GCP auth)
 */
class GCPStorageProvider extends StorageProvider {
  constructor() {
    super();
    // Lazy-require so users without GCP don't need @google-cloud/storage
    const { Storage } = require('@google-cloud/storage');
    this.storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
    });
    this.bucketName = process.env.GCP_BUCKET_NAME;
    this.bucket = this.storage.bucket(this.bucketName);
  }

  async upload(fileBuffer, filePath, opts = {}) {
    const file = this.bucket.file(filePath);
    await file.save(fileBuffer, {
      resumable: opts.resumable !== false,
      contentType: opts.contentType || 'application/octet-stream',
      metadata: opts.metadata,
    });
    return `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
  }

  async download(filePath) {
    const [contents] = await this.bucket.file(filePath).download();
    return contents;
  }

  async delete(filePath) {
    await this.bucket.file(filePath).delete();
  }

  async list(prefix) {
    const [files] = await this.bucket.getFiles({ prefix });
    return files.map(file => file.name);
  }

  /** Expose the raw bucket for advanced usage (e.g., gcp.js helpers). */
  getBucket() {
    return this.bucket;
  }
}

registerProvider('storage', 'gcp', () => new GCPStorageProvider());

module.exports = GCPStorageProvider;
