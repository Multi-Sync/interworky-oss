const fs = require('fs');
const path = require('path');
const StorageProvider = require('./StorageProvider');
const { registerProvider } = require('../registry');

/**
 * Local filesystem storage provider.
 * Zero-config default — stores files on disk.
 *
 * Env vars:
 *   STORAGE_LOCAL_PATH — Base directory for file storage (default: ./uploads)
 */
class LocalStorageProvider extends StorageProvider {
  constructor() {
    super();
    this.basePath = process.env.STORAGE_LOCAL_PATH || './uploads';
    // Ensure base directory exists
    fs.mkdirSync(this.basePath, { recursive: true });
  }

  _fullPath(filePath) {
    return path.join(this.basePath, filePath);
  }

  async upload(fileBuffer, filePath, opts = {}) {
    const fullPath = this._fullPath(filePath);
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    fs.writeFileSync(fullPath, fileBuffer);
    return fullPath;
  }

  async download(filePath) {
    const fullPath = this._fullPath(filePath);
    return fs.readFileSync(fullPath);
  }

  async delete(filePath) {
    const fullPath = this._fullPath(filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
  }

  async list(prefix) {
    const fullPath = this._fullPath(prefix);
    if (!fs.existsSync(fullPath)) return [];

    const entries = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const entryPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          walk(entryPath);
        } else {
          // Return path relative to basePath
          entries.push(path.relative(this.basePath, entryPath));
        }
      }
    };
    walk(fullPath);
    return entries;
  }
}

registerProvider('storage', 'local', () => new LocalStorageProvider());
registerProvider('storage', 'default', () => new LocalStorageProvider());

module.exports = LocalStorageProvider;
