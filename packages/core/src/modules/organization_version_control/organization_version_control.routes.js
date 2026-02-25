const express = require('express');
const versionControlRouter = express.Router();
const {
  saveInstallation,
  getInstallation,
  getInstallationToken,
  deleteInstallation,
  verifyInstallation,
  getInstallationURL,
  updatePRInfo,
  updateRepositoryKnowledge,
  getRepositoryKnowledge,
  updateAutoFixEnabled,
  updateSnapshot,
  refreshSnapshot,
} = require('./organization_version_control.controllers');
const { updateAutoFixEnabledValidator } = require('./organization_version_control.validators');
const authenticateToken = require('../../middlewares/auth.middleware');

// Get installation URL (initiate installation flow)
// GET /api/organization-version-control/install-url?organization_id=xxx
versionControlRouter.get('/install-url', authenticateToken, getInstallationURL);

// Save GitHub App installation after callback
// POST /api/organization-version-control
versionControlRouter.post('/', authenticateToken, saveInstallation);

// Get GitHub App installation by organization ID
// GET /api/organization-version-control/:organization_id
versionControlRouter.get('/:organization_id', authenticateToken, getInstallation);

// Get fresh installation access token
// GET /api/organization-version-control/:organization_id/token
versionControlRouter.get('/:organization_id/token', authenticateToken, getInstallationToken);

// Verify GitHub App installation (test connection)
// GET /api/organization-version-control/:organization_id/verify
versionControlRouter.get('/:organization_id/verify', authenticateToken, verifyInstallation);

// Delete/disconnect GitHub App installation
// DELETE /api/organization-version-control/:organization_id
versionControlRouter.delete('/:organization_id', authenticateToken, deleteInstallation);

// Update PR information after PR is created
// PUT /api/organization-version-control/:organization_id/pr
versionControlRouter.put('/:organization_id/pr', updatePRInfo);

// Update repository knowledge (called by WS-Assistant after analysis)
// PUT /api/organization-version-control/:organization_id/repository-knowledge
versionControlRouter.put('/:organization_id/repository-knowledge', updateRepositoryKnowledge);

// Get repository knowledge (used by WS-Assistant for error fixing)
// GET /api/organization-version-control/:organization_id/repository-knowledge
versionControlRouter.get('/:organization_id/repository-knowledge', getRepositoryKnowledge);

// Update auto-fix enabled status
// PATCH /api/organization-version-control/:organization_id/auto-fix
versionControlRouter.patch(
  '/:organization_id/auto-fix',
  authenticateToken,
  updateAutoFixEnabledValidator,
  updateAutoFixEnabled,
);

// Update repository snapshot metadata (called by WS-Assistant)
// PUT /api/organization-version-control/:organization_id/snapshot
versionControlRouter.put('/:organization_id/snapshot', updateSnapshot);

// Trigger manual snapshot refresh
// POST /api/organization-version-control/:organization_id/refresh-snapshot
versionControlRouter.post('/:organization_id/refresh-snapshot', authenticateToken, refreshSnapshot);

module.exports = versionControlRouter;
