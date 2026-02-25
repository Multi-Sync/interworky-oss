const axios = require('axios');
const { CVEAlert } = require('./organization_security.model');
const OrganizationVersionControl = require('../organization_version_control/organization_version_control.model');
const { getInstallationAccessToken } = require('../../utils/githubApp');

/**
 * Organization Security Service
 *
 * Simplified service that:
 * 1. Fetches CVEs from GitHub Advisory DB (once for all orgs)
 * 2. Checks each org's dependencies
 * 3. Sends to WS-Assistant for fix (like error auto-fix flow)
 */

// Known critical Next.js CVEs for quick detection
const NEXTJS_CRITICAL_CVES = {
  'CVE-2025-29927': {
    package: 'next',
    title: 'Next.js Middleware Authorization Bypass',
    affected: ['>=11.1.4 <12.3.5', '>=13.0.0 <13.5.9', '>=14.0.0 <14.2.25', '>=15.0.0 <15.2.3'],
    patched: '15.2.3',
    severity: 'critical',
    description: 'Authorization bypass via x-middleware-subrequest header allows attackers to bypass middleware authentication.',
  },
  'CVE-2025-55182': {
    package: 'react',
    title: 'React Server Components Remote Code Execution',
    affected: ['19.0.0', '19.1.0', '19.1.1', '19.2.0'],
    patched: '19.2.1',
    severity: 'critical',
    description: 'Critical RCE vulnerability in React Flight protocol. Allows unauthenticated remote code execution on the server.',
  },
};

/**
 * Fetch package.json from GitHub repository
 */
async function fetchPackageJson(installationId, repoFullName, branch = 'main') {
  const { token } = await getInstallationAccessToken(installationId);

  try {
    const response = await axios.get(
      `https://api.github.com/repos/${repoFullName}/contents/package.json?ref=${branch}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
      },
    );

    const content = Buffer.from(response.data.content, 'base64').toString('utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('[Security] Error fetching package.json:', error.message);
    throw new Error(`Failed to fetch package.json: ${error.message}`);
  }
}

/**
 * Check if a version is vulnerable
 */
function isVersionVulnerable(installedVersion, vulnerableRanges) {
  if (!installedVersion) return false;

  const cleanVersion = installedVersion.replace(/^[\^~]/, '');
  const [major, minor, patch] = cleanVersion.split('.').map(v => parseInt(v) || 0);

  for (const range of vulnerableRanges) {
    // Handle exact version match (e.g., "19.0.0")
    if (!range.includes('<') && !range.includes('>')) {
      if (cleanVersion === range || cleanVersion.startsWith(range)) {
        return true;
      }
      continue;
    }

    // Parse range like ">=15.0.0 <15.2.3"
    const parts = range.split(' ');
    const minPart = parts.find(p => p.startsWith('>='));
    const maxPart = parts.find(p => p.startsWith('<'));

    if (minPart && maxPart) {
      const minVersion = minPart.replace('>=', '').split('.').map(Number);
      const maxVersion = maxPart.replace('<', '').split('.').map(Number);

      const isAboveMin =
        major > minVersion[0] ||
        (major === minVersion[0] && minor > minVersion[1]) ||
        (major === minVersion[0] && minor === minVersion[1] && patch >= minVersion[2]);

      const isBelowMax =
        major < maxVersion[0] ||
        (major === maxVersion[0] && minor < maxVersion[1]) ||
        (major === maxVersion[0] && minor === maxVersion[1] && patch < maxVersion[2]);

      if (isAboveMin && isBelowMax) return true;
    }
  }

  return false;
}

/**
 * Check package.json against known CVEs
 */
function checkForKnownCVEs(packageJson) {
  const vulnerabilities = [];
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const [cveId, cveInfo] of Object.entries(NEXTJS_CRITICAL_CVES)) {
    const installedVersion = allDeps[cveInfo.package];

    if (installedVersion && isVersionVulnerable(installedVersion, cveInfo.affected)) {
      vulnerabilities.push({
        cve_id: cveId,
        package_name: cveInfo.package,
        installed_version: installedVersion.replace(/^[\^~]/, ''),
        patched_version: cveInfo.patched,
        severity: cveInfo.severity,
        title: cveInfo.title,
        description: cveInfo.description,
      });
    }
  }

  return vulnerabilities;
}

/**
 * Fetch advisories for a specific severity level
 * @param {string} severity - 'critical' or 'high'
 * @returns {Promise<Array>} Advisories
 */
async function fetchAdvisoriesBySeverity(severity) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Add auth token if available (higher rate limits)
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const response = await axios.get('https://api.github.com/advisories', {
      params: {
        ecosystem: 'npm',
        severity: severity,
        per_page: 25,
        sort: 'published',
        direction: 'desc',
      },
      headers,
    });

    console.log(`[Security] Fetched ${response.data.length} ${severity} advisories`);
    return response.data;
  } catch (error) {
    console.error(`[Security] Error fetching ${severity} advisories:`, error.message);
    if (error.response?.data) {
      console.error(`[Security] API response:`, JSON.stringify(error.response.data));
    }
    return [];
  }
}

/**
 * Fetch latest advisories from GitHub Advisory Database
 * Fetches critical and high severity advisories separately and combines them
 */
async function fetchGitHubAdvisories() {
  console.log('[Security] Fetching advisories from GitHub Advisory Database...');

  try {
    // Fetch critical and high severity in parallel
    const [criticalAdvisories, highAdvisories] = await Promise.all([
      fetchAdvisoriesBySeverity('critical'),
      fetchAdvisoriesBySeverity('high'),
    ]);

    // Combine and deduplicate by ghsa_id
    const seen = new Set();
    const allAdvisories = [];

    for (const advisory of [...criticalAdvisories, ...highAdvisories]) {
      if (!seen.has(advisory.ghsa_id)) {
        seen.add(advisory.ghsa_id);
        allAdvisories.push(advisory);
      }
    }

    console.log(`[Security] Total unique advisories: ${allAdvisories.length}`);
    return allAdvisories;
  } catch (error) {
    console.error('[Security] Error fetching GitHub advisories:', error.message);
    return [];
  }
}

/**
 * Check if org's dependencies are affected by an advisory
 */
function checkAdvisoryAffectsOrg(advisory, packageJson) {
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };

  for (const vuln of advisory.vulnerabilities || []) {
    const pkgName = vuln.package?.name;
    if (pkgName && allDeps[pkgName]) {
      return {
        cve_id: advisory.cve_id || advisory.ghsa_id,
        ghsa_id: advisory.ghsa_id,
        package_name: pkgName,
        installed_version: allDeps[pkgName].replace(/^[\^~]/, ''),
        patched_version: vuln.first_patched_version?.identifier,
        severity: advisory.severity,
        title: advisory.summary,
        description: advisory.description?.substring(0, 500),
      };
    }
  }

  return null;
}

/**
 * Send vulnerability to WS-Assistant for auto-fix
 */
async function sendToWSAssistantForFix(organizationId, vulnerability, alertId) {
  const wsAssistantUrl = process.env.WS_ASSISTANT_HTTP_URL;

  if (!wsAssistantUrl) {
    console.error('[Security] WS_ASSISTANT_HTTP_URL not configured');
    return false;
  }

  try {
    console.log(`[Security] Sending CVE ${vulnerability.cve_id} to WS-Assistant for org ${organizationId}`);

    await axios.post(`${wsAssistantUrl}/fix-security-vulnerability`, {
      organizationId,
      alertId,
      vulnerability: {
        cve_id: vulnerability.cve_id,
        ghsa_id: vulnerability.ghsa_id,
        package_name: vulnerability.package_name,
        installed_version: vulnerability.installed_version,
        patched_version: vulnerability.patched_version,
        severity: vulnerability.severity,
        title: vulnerability.title,
        description: vulnerability.description,
      },
    });

    console.log(`[Security] Successfully sent CVE ${vulnerability.cve_id} to WS-Assistant`);
    return true;
  } catch (error) {
    console.error(`[Security] Failed to send to WS-Assistant:`, error.message);
    return false;
  }
}

/**
 * Main CVE check function - runs every 12 hours
 *
 * Flow:
 * 1. Fetch CVEs from GitHub Advisory DB (ONCE)
 * 2. Get all orgs with auto_fix_enabled
 * 3. For each org, check if affected
 * 4. If affected, send to WS-Assistant for fix
 */
async function checkForNewCVEs() {
  console.log('[Security] ========== CVE CHECK STARTED ==========');
  const startTime = new Date();

  try {
    // Step 1: Fetch latest advisories from GitHub (ONCE for all orgs)
    console.log('[Security] Fetching latest GitHub advisories...');
    const advisories = await fetchGitHubAdvisories();
    console.log(`[Security] Fetched ${advisories.length} advisories`);

    // Step 2: Get all organizations with auto_fix_enabled
    const orgsWithAutoFix = await OrganizationVersionControl.find({
      auto_fix_enabled: true,
      github_app_installation_id: { $exists: true, $ne: null },
      github_repo_full_name: { $exists: true, $ne: null },
    });
    console.log(`[Security] Found ${orgsWithAutoFix.length} orgs with auto-fix enabled`);

    if (orgsWithAutoFix.length === 0) {
      console.log('[Security] No organizations with auto-fix enabled. Skipping.');
      return;
    }

    let totalVulnsFound = 0;
    let totalFixesSent = 0;

    // Step 3: For each org, check dependencies
    for (const org of orgsWithAutoFix) {
      console.log(`[Security] Checking org ${org.organization_id} (${org.github_repo_full_name})`);

      try {
        // Fetch package.json
        const packageJson = await fetchPackageJson(
          org.github_app_installation_id,
          org.github_repo_full_name,
        );

        // Check known critical CVEs first
        const knownVulns = checkForKnownCVEs(packageJson);

        // Check GitHub advisories
        const advisoryVulns = [];
        for (const advisory of advisories) {
          const affected = checkAdvisoryAffectsOrg(advisory, packageJson);
          if (affected) {
            // Avoid duplicates with known CVEs
            if (!knownVulns.some(v => v.cve_id === affected.cve_id)) {
              advisoryVulns.push(affected);
            }
          }
        }

        const allVulns = [...knownVulns, ...advisoryVulns];

        if (allVulns.length === 0) {
          console.log(`[Security] No vulnerabilities found for org ${org.organization_id}`);
          continue;
        }

        console.log(`[Security] Found ${allVulns.length} vulnerabilities for org ${org.organization_id}`);
        totalVulnsFound += allVulns.length;

        // Step 4: For each vulnerability, create alert and send to WS-Assistant
        for (const vuln of allVulns) {
          // Check if alert already exists
          const existingAlert = await CVEAlert.findOne({
            organization_id: org.organization_id,
            cve_id: vuln.cve_id,
          });

          if (existingAlert) {
            console.log(`[Security] Alert already exists for ${vuln.cve_id}, skipping`);
            continue;
          }

          // Create new alert
          const alert = new CVEAlert({
            organization_id: org.organization_id,
            cve_id: vuln.cve_id,
            ghsa_id: vuln.ghsa_id,
            package_name: vuln.package_name,
            installed_version: vuln.installed_version,
            patched_version: vuln.patched_version,
            severity: vuln.severity,
            title: vuln.title,
            description: vuln.description,
            status: 'pending',
          });
          await alert.save();
          console.log(`[Security] Created alert for ${vuln.cve_id}`);

          // Send to WS-Assistant for auto-fix
          const sent = await sendToWSAssistantForFix(org.organization_id, vuln, alert.id);

          if (sent) {
            alert.status = 'notified';
            alert.notified_at = new Date();
            alert.scan_triggered = true;
            await alert.save();
            totalFixesSent++;
          }
        }
      } catch (error) {
        console.error(`[Security] Error processing org ${org.organization_id}:`, error.message);
      }
    }

    const duration = (new Date() - startTime) / 1000;
    console.log('[Security] ========== CVE CHECK COMPLETED ==========');
    console.log(`[Security] Duration: ${duration}s`);
    console.log(`[Security] Vulnerabilities found: ${totalVulnsFound}`);
    console.log(`[Security] Fixes sent to WS-Assistant: ${totalFixesSent}`);

  } catch (error) {
    console.error('[Security] CVE check failed:', error.message);
    throw error;
  }
}

/**
 * Get alerts for an organization
 */
async function getAlerts(organizationId, status = null, limit = 50) {
  const query = { organization_id: organizationId };
  if (status) {
    query.status = status;
  }

  return CVEAlert.find(query).sort({ created_at: -1 }).limit(limit);
}

/**
 * Update alert status (called by WS-Assistant after fix)
 */
async function updateAlertStatus(alertId, status, prUrl = null) {
  const update = { status };

  if (status === 'resolved' && prUrl) {
    update.pr_created = true;
    update.pr_url = prUrl;
    update.resolved_at = new Date();
  }

  return CVEAlert.findOneAndUpdate({ id: alertId }, update, { new: true });
}

/**
 * Get security summary for an organization
 */
async function getSecuritySummary(organizationId) {
  const alerts = await CVEAlert.find({ organization_id: organizationId }).sort({ created_at: -1 }).limit(10);

  const pendingCount = alerts.filter(a => a.status === 'pending').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;
  const criticalCount = alerts.filter(a => a.severity === 'critical').length;

  return {
    total_alerts: alerts.length,
    pending: pendingCount,
    resolved: resolvedCount,
    critical: criticalCount,
    recent_alerts: alerts.slice(0, 5),
  };
}

module.exports = {
  checkForNewCVEs,
  fetchPackageJson,
  getAlerts,
  updateAlertStatus,
  getSecuritySummary,
  NEXTJS_CRITICAL_CVES,
};
