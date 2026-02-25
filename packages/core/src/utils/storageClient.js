const { Storage } = require('@google-cloud/storage');
const path = require('path');
const fs = require('fs');

class StorageClient {
  constructor() {
    // Define the path to the JSON file
    const serviceAccountFilePath = path.resolve(__dirname, '../config/cloud-storage.json');

    // Ensure the file exists before reading
    if (!fs.existsSync(serviceAccountFilePath)) {
      throw new Error(`Service account file not found at: ${serviceAccountFilePath}`);
    }

    // Read and parse the JSON file
    const serviceAccountKey = JSON.parse(fs.readFileSync(serviceAccountFilePath, 'utf8'));

    // Initialize the Storage client with the credentials object
    this.storage = new Storage({
      credentials: serviceAccountKey,
      projectId: serviceAccountKey.project_id, // Use project_id from the JSON file
    });

    // Set the bucket name (can be configured separately if needed)
    this.bucket = this.storage.bucket(process.env.GCP_BUCKET_NAME);
  }

  getBucket() {
    return this.bucket;
  }
}

module.exports = new StorageClient();
