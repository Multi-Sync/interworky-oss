/**
 * CVE Watch Cron Job
 *
 * Polls for new CVEs every 12 hours and alerts affected organizations.
 * Uses node-cron for scheduling.
 *
 * Schedule: Every 12 hours (at midnight and noon UTC)
 * Cron expression: '0 0,12 * * *'
 */

const cron = require('node-cron');
const { checkForNewCVEs } = require('../modules/organization_security/organization_security.service');

// Track job state
let isRunning = false;
let lastRunAt = null;
let lastRunStatus = null;
let scheduledTask = null;

/**
 * Execute the CVE check job
 */
async function runCVECheck() {
  if (isRunning) {
    console.log('[CVE Watch Job] Skipping - previous job still running');
    return;
  }

  isRunning = true;
  const startTime = new Date();
  console.log(`[CVE Watch Job] Starting CVE check at ${startTime.toISOString()}`);

  try {
    await checkForNewCVEs();
    lastRunStatus = 'success';
    console.log(`[CVE Watch Job] Completed successfully`);
  } catch (error) {
    lastRunStatus = 'failed';
    console.error(`[CVE Watch Job] Failed:`, error.message);
  } finally {
    isRunning = false;
    lastRunAt = new Date();
    const duration = (lastRunAt - startTime) / 1000;
    console.log(`[CVE Watch Job] Duration: ${duration}s`);
  }
}

/**
 * Start the CVE watch cron job
 * Runs every 12 hours at midnight and noon UTC
 */
function startCVEWatchJob() {
  // Cron expression: '0 0,12 * * *' means at minute 0 of hour 0 and 12, every day
  // This runs at 00:00 UTC and 12:00 UTC
  scheduledTask = cron.schedule(
    '0 0,12 * * *',
    async () => {
      await runCVECheck();
    },
    {
      scheduled: true,
      timezone: 'UTC',
    },
  );

  console.log('[CVE Watch Job] Scheduled to run every 12 hours (00:00 and 12:00 UTC)');

  // Run immediately on startup if in production (optional - comment out for dev)
  if (process.env.NODE_ENV === 'production') {
    console.log('[CVE Watch Job] Running initial check on startup...');
    runCVECheck();
  }
}

/**
 * Stop the CVE watch cron job
 */
function stopCVEWatchJob() {
  if (scheduledTask) {
    scheduledTask.stop();
    console.log('[CVE Watch Job] Stopped');
  }
}

/**
 * Get job status
 */
function getJobStatus() {
  return {
    isRunning,
    lastRunAt,
    lastRunStatus,
    nextRun: scheduledTask ? getNextRunTime() : null,
    schedule: 'Every 12 hours (00:00 and 12:00 UTC)',
  };
}

/**
 * Calculate next run time
 */
function getNextRunTime() {
  const now = new Date();
  const hour = now.getUTCHours();

  // Next run is at 00:00 or 12:00 UTC
  let nextHour;
  if (hour < 12) {
    nextHour = 12;
  } else {
    nextHour = 24; // midnight next day
  }

  const nextRun = new Date(now);
  nextRun.setUTCHours(nextHour === 24 ? 0 : nextHour, 0, 0, 0);
  if (nextHour === 24) {
    nextRun.setUTCDate(nextRun.getUTCDate() + 1);
  }

  return nextRun;
}

/**
 * Manually trigger a CVE check (for testing/admin)
 */
async function triggerManualCheck() {
  console.log('[CVE Watch Job] Manual check triggered');
  await runCVECheck();
  return getJobStatus();
}

module.exports = {
  startCVEWatchJob,
  stopCVEWatchJob,
  getJobStatus,
  triggerManualCheck,
  runCVECheck,
};
