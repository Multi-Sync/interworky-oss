// src/services/scraperService.js

const axios = require('axios');
const { URL } = require('url');

/**
 * Axios client pre-configured with your API base URL and auth header.
 * Adjust BASE_API_URL to your real backend URL if needed.
 */
const apiClient = axios.create({
  baseURL: process.env.SCRAPER_URL,
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
  },
});

/**
 * Kick off a scrape job.
 * @param {string} domain
 * @param {string} assistantId
 * @returns {Promise<string>} jobId
 */
async function startScraper(domain, token) {
  apiClient.defaults.headers.Authorization = `Bearer ${token}`;
  const resp = await apiClient.post('/api/create-extensive-knowledge-realtime', { domain });
  if (resp.status !== 200 || !resp.data.jobId) {
    throw new Error(`Failed to start scrape: ${resp.status} ${resp.statusText}`);
  }
  return resp.data.jobId;
}

/**
 * Check the status of a scrape job.
 * @param {string} jobId
 * @returns {Promise<{status: string, result?: any}>}
 */
async function getJobStatus(jobId, token) {
  apiClient.defaults.headers.Authorization = `Bearer ${token}`;
  const resp = await apiClient.get(`/api/status/${jobId}`);
  if (resp.status !== 200) {
    throw new Error(`Failed to fetch job status: ${resp.status} ${resp.statusText}`);
  }
  return resp.data;
}

/**
 * Polls the scraper until completion, then returns a result object.
 * @param {string} domain
 * @param {string} assistantId
 * @param {string|number} orgId
 * @param {number} [pollInterval=5000] milliseconds between polls
 */
async function syncWebsiteContent(domain, token, pollInterval = 5_000) {
  // 1) start the job
  const jobId = await startScraper(domain, token);

  // 2) poll until status === 'completed'
  let statusData;
  do {
    await new Promise(r => setTimeout(r, pollInterval));
    statusData = await getJobStatus(jobId, token);
  } while (statusData.status !== 'completed');

  // 3) build return value
  const success = Boolean(statusData.result);
  if (!success) {
    return false;
  }

  return true;
}

module.exports = {
  startScraper,
  getJobStatus,
  syncWebsiteContent,
};
