/**
 * StorageProvider — Base class for file storage providers.
 */
class StorageProvider {
  /**
   * Upload a file.
   * @param {Buffer} fileBuffer - File data
   * @param {string} filePath - Destination path/key
   * @param {object} [opts] - Options (contentType, metadata, resumable)
   * @returns {Promise<string>} Public URL or path of the uploaded file
   */
  async upload(fileBuffer, filePath, opts = {}) {
    throw new Error('upload() not implemented');
  }

  /**
   * Download a file.
   * @param {string} filePath - File path/key
   * @returns {Promise<Buffer>} File contents
   */
  async download(filePath) {
    throw new Error('download() not implemented');
  }

  /**
   * Delete a file.
   * @param {string} filePath - File path/key
   * @returns {Promise<void>}
   */
  async delete(filePath) {
    throw new Error('delete() not implemented');
  }

  /**
   * List files under a prefix.
   * @param {string} prefix - Path prefix to list
   * @returns {Promise<string[]>} Array of file paths/keys
   */
  async list(prefix) {
    throw new Error('list() not implemented');
  }
}

module.exports = StorageProvider;
