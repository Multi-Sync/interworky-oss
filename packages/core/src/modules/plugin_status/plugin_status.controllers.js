const PluginStatus = require('./plugin_status.model');
const Organization = require('../organization/organization.model');
const { asyncHandler } = require('../../utils/asyncHandler');

// Create or update plugin installation status
const createOrUpdateStatus = asyncHandler(async (req, res) => {
  console.log('Received plugin installation status update:', req.body);
  const { organizationId, installationData } = req.body;

  // Get organization data for website URL
  const organization = await Organization.findOne({ id: organizationId });
  if (!organization) {
    return res.status(404).json({
      success: false,
      message: 'Organization not found',
    });
  }

  let status = await PluginStatus.findOne({ organizationId });

  if (status) {
    console.log(`Updating existing plugin status for organization ${organizationId}`);
    // Update existing status
    status.updateInstallationStatus(organization.organization_website, installationData);
  } else {
    console.log(`Creating new plugin status for organization ${organizationId}`);
    // Create new status
    status = new PluginStatus({
      organizationId,
      isInstalled: true,
      installation: {
        websiteUrl: organization.organization_website,
        installationDate: new Date(),
        lastVerified: new Date(),
        version: installationData?.version || null,
      },
      lastHeartbeat: new Date(),
      isResponding: true,
    });
  }

  await status.save();

  res.status(200).json({
    success: true,
    message: 'Plugin installation status updated',
    statusId: status.id,
    isInstalled: status.isInstalled,
    isResponding: status.isResponding,
    websiteUrl: status.installation.websiteUrl,
  });
}, 'Failed to create or update plugin status');

// Send heartbeat - confirms plugin is responding
const sendHeartbeat = asyncHandler(async (req, res) => {
  const { organizationId } = req.body;
  console.log(`Received heartbeat from organization ${organizationId}`);

  const status = await PluginStatus.findOne({ organizationId });
  if (!status) {
    return res.status(404).json({
      success: false,
      message: 'Plugin status not found. Please register installation first.',
    });
  }

  status.updateHeartbeat();
  await status.save();

  res.status(200).json({
    success: true,
    message: 'Heartbeat received',
    isInstalled: status.isInstalled,
    isResponding: status.isResponding,
    nextHeartbeat: new Date(Date.now() + 60000), // Next expected in 1 minute
  });
}, 'Failed to process heartbeat');

// Get plugin installation status for organization
const getStatus = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;

  const status = await PluginStatus.findOne({ organizationId });

  if (!status) {
    return res.status(200).json({
      success: true,
      isInstalled: false,
      isResponding: false,
      message: 'Plugin not installed for this organization',
    });
  }

  res.status(200).json({
    success: true,
    isInstalled: status.isInstalled,
    isResponding: status.isResponding,
    installation: {
      websiteUrl: status.installation.websiteUrl,
      installationDate: status.installation.installationDate,
      lastVerified: status.installation.lastVerified,
      version: status.installation.version,
    },
    lastHeartbeat: status.lastHeartbeat,
    createdAt: status.createdAt,
    updatedAt: status.updatedAt,
  });
}, 'Failed to get plugin status');

// Mark plugin as uninstalled
const markUninstalled = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;

  const status = await PluginStatus.findOne({ organizationId });
  if (!status) {
    return res.status(404).json({
      success: false,
      message: 'Plugin status not found',
    });
  }

  status.isInstalled = false;
  status.isResponding = false;
  await status.save();

  res.status(200).json({
    success: true,
    message: 'Plugin marked as uninstalled',
    isInstalled: status.isInstalled,
  });
}, 'Failed to mark plugin as uninstalled');

// Get installation summary for all organizations (admin endpoint)
const getInstallationSummary = asyncHandler(async (req, res) => {
  const statuses = await PluginStatus.find({}).select(
    'organizationId isInstalled isResponding installation.websiteUrl lastHeartbeat',
  );

  const summary = {
    totalOrganizations: statuses.length,
    installedCount: statuses.filter(s => s.isInstalled).length,
    respondingCount: statuses.filter(s => s.isResponding).length,
    installationRate: statuses.length > 0 ? (statuses.filter(s => s.isInstalled).length / statuses.length) * 100 : 0,
  };

  res.status(200).json({
    success: true,
    summary,
    statuses: statuses.map(status => ({
      organizationId: status.organizationId,
      isInstalled: status.isInstalled,
      isResponding: status.isResponding,
      websiteUrl: status.installation?.websiteUrl,
      lastHeartbeat: status.lastHeartbeat,
    })),
  });
}, 'Failed to get installation summary');

// Check plugin status and update onboarding step if connected
const checkAndUpdateOnboarding = asyncHandler(async (req, res) => {
  const { organizationId } = req.params;

  const pluginStatus = await PluginStatus.findOne({ organizationId });
  const organization = await Organization.findOne({ id: organizationId });

  if (!organization) {
    return res.status(404).json({
      success: false,
      error: 'Organization not found',
    });
  }

  const isConnected = pluginStatus?.isInstalled && pluginStatus?.isResponding;

  // FLEXIBLE ONBOARDING: If plugin is connected, mark onboarding as complete
  // This works regardless of which step the user is currently on (setup, plugin, etc.)
  if (isConnected && organization.onboarding_step !== 'complete') {
    organization.onboarding_step = 'complete';
    await organization.save();
    console.log(
      `[PluginStatus] Marked onboarding as complete for organization ${organizationId}`,
    );
  }

  res.status(200).json({
    success: true,
    isConnected,
    shouldRedirect: false,
    onboarding_step: organization.onboarding_step,
    pluginStatus: pluginStatus
      ? {
          isInstalled: pluginStatus.isInstalled,
          isResponding: pluginStatus.isResponding,
          websiteUrl: pluginStatus.installation?.websiteUrl,
          lastHeartbeat: pluginStatus.lastHeartbeat,
        }
      : null,
  });
}, 'Failed to check plugin status and update onboarding');

module.exports = {
  createOrUpdateStatus,
  sendHeartbeat,
  getStatus,
  markUninstalled,
  getInstallationSummary,
  checkAndUpdateOnboarding,
};
