const path = require('path');
const mime = require('mime-types');
const { getStorageProvider } = require('@interworky/providers');

const ENVIRONMENT = process.env.NODE_ENV || 'development';
const ORG_PREFIX = path.posix.join('interworky', 'interworky-orgs', ENVIRONMENT);

const createOrganizationPath = async (organizationId, orgAssistantInfo) => {
  const storage = getStorageProvider();
  const assistantInfoFilePath = path.posix.join(ORG_PREFIX, organizationId, 'assistant-info.json');

  try {
    const jsonData = JSON.stringify(orgAssistantInfo, null, 2);
    const url = await storage.upload(Buffer.from(jsonData), assistantInfoFilePath, {
      resumable: false,
      contentType: 'application/json',
    });

    return { assistantInfoFileUrl: url };
  } catch (error) {
    throw new Error(`Failed to create organization path: ${error.message}`);
  }
};

const uploadFileToOrganizationBucket = async (organizationId, fileBuffer, originalname) => {
  const storage = getStorageProvider();
  const sanitizedFileName = originalname.replace(/ /g, '_');
  let isKnowledgeFile = !mime.lookup(originalname)?.startsWith('image/');
  const fileName = isKnowledgeFile ? sanitizedFileName : `${Date.now()}_${sanitizedFileName}`;
  const destination = path.posix.join(ORG_PREFIX, organizationId, fileName);

  try {
    const contentType = mime.lookup(originalname) || 'application/octet-stream';
    const url = await storage.upload(fileBuffer, destination, {
      resumable: true,
      contentType,
      metadata: {
        cacheControl: isKnowledgeFile ? 'no-cache' : 'public, max-age=31536000',
      },
    });
    return url;
  } catch (error) {
    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

const deleteFileFromOrganizationBucket = async fileUrl => {
  const storage = getStorageProvider();
  try {
    // Extract the file path from the URL — works for both GCP URLs and local paths
    const filePath = fileUrl.includes('storage.googleapis.com')
      ? fileUrl.replace(/https:\/\/storage\.googleapis\.com\/[^/]+\//, '')
      : fileUrl;
    await storage.delete(filePath);
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

const listFilesInOrganizationBucket = async organizationId => {
  const storage = getStorageProvider();
  try {
    const destination = path.posix.join(ORG_PREFIX, organizationId);
    return await storage.list(destination);
  } catch (error) {
    throw new Error(`Failed to list files in bucket: ${error.message}`);
  }
};

const createOrUpdateAssistantInfoJson = async (organizationId, data) => {
  const storage = getStorageProvider();
  const filePath = path.posix.join(ORG_PREFIX, organizationId, 'assistant-info.json');

  try {
    data.organization_id = organizationId;
    const jsonData = JSON.stringify(data, null, 2);
    const url = await storage.upload(Buffer.from(jsonData), filePath, {
      resumable: false,
      contentType: 'application/json',
      metadata: {
        cacheControl: 'no-store',
      },
    });
    return url;
  } catch (error) {
    throw new Error(`Failed to create or update assistant-info.json: ${error.message}`);
  }
};

module.exports = {
  createOrUpdateAssistantInfoJson,
  uploadFileToOrganizationBucket,
  deleteFileFromOrganizationBucket,
  createOrganizationPath,
  listFilesInOrganizationBucket,
};
