const OrganizationVersionControl = require('./organization_version_control.model');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const {
  getInstallationAccessToken,
  getInstallationDetails,
  getInstallationRepositories,
} = require('../../utils/githubApp');

/**
 * Save GitHub App installation for an organization
 * Called after user completes GitHub App installation
 */
exports.saveInstallation = asyncHandler(async (req, res) => {
  const { organization_id, installation_id, repository_id } = req.body;

  if (!organization_id || !installation_id) {
    throw new HttpError('organization_id and installation_id are required').BadRequest();
  }

  // Get installation details from GitHub
  const installation = await getInstallationDetails(installation_id);

  // Get repositories accessible to this installation
  const repositories = await getInstallationRepositories(installation_id);

  // Find the specific repository if repository_id is provided
  let selectedRepo;
  if (repository_id) {
    selectedRepo = repositories.find(repo => repo.id === parseInt(repository_id));
    if (!selectedRepo) {
      throw new HttpError('Repository not found in installation').NotFound();
    }
  } else {
    // If no specific repo ID, use the first one (or you can require it)
    if (repositories.length === 0) {
      throw new HttpError('No repositories found in installation').BadRequest();
    }
    selectedRepo = repositories[0];
  }

  // Check for existing installation for this organization
  const existing = await OrganizationVersionControl.findOne({ organization_id });

  const installationData = {
    organization_id,
    github_app_installation_id: installation_id,
    github_app_installation_account_id: installation.account.id.toString(),
    github_app_installation_account_login: installation.account.login,
    github_app_installation_target_type: installation.target_type,
    github_repo_owner: selectedRepo.owner.login,
    github_repo_name: selectedRepo.name,
    github_repo_id: selectedRepo.id,
    github_repo_full_name: selectedRepo.full_name,
    has_write_access: selectedRepo.permissions?.push || selectedRepo.permissions?.admin || false,
    permissions: installation.permissions || {},
    connected_at: new Date(),
  };

  let versionControl;
  if (existing) {
    // Update existing record
    Object.assign(existing, installationData);
    versionControl = await existing.save();
  } else {
    // Create new record
    versionControl = await OrganizationVersionControl.create(installationData);
  }

  res.status(existing ? 200 : 201).json({
    success: true,
    data: versionControl,
    message: existing ? 'GitHub App installation updated successfully' : 'GitHub App installation saved successfully',
  });

  // Trigger repository analysis and snapshot generation in background (don't wait)
  const axios = require('axios');
  const wsAssistantUrl = process.env.WS_ASSISTANT_HTTP_URL;

  console.log(`[OrgVersionControl] Triggering repository analysis for organization ${organization_id}`);

  // Trigger repository analysis
  axios
    .post(`${wsAssistantUrl}/analyze-repository`, {
      organizationId: organization_id,
    })
    .then(() => {
      console.log(`[OrgVersionControl] ✅ Repository analysis triggered for organization ${organization_id}`);
    })
    .catch(err => {
      console.error(
        `[OrgVersionControl] ⚠️ Failed to trigger repository analysis for organization ${organization_id}:`,
        err.message,
      );
      // Don't throw - analysis failure shouldn't block installation
    });

  // Trigger Repomix snapshot generation
  console.log(`[OrgVersionControl] Triggering snapshot generation for organization ${organization_id}`);

  axios
    .post(`${wsAssistantUrl}/generate-repo-snapshot`, {
      organizationId: organization_id,
      force: false,
    })
    .then(() => {
      console.log(`[OrgVersionControl] ✅ Snapshot generation triggered for organization ${organization_id}`);
    })
    .catch(err => {
      console.error(
        `[OrgVersionControl] ⚠️ Failed to trigger snapshot generation for organization ${organization_id}:`,
        err.message,
      );
      // Don't throw - snapshot failure shouldn't block installation
    });
}, 'Failed to save GitHub App installation');

/**
 * Get GitHub App installation by organization ID
 */
exports.getInstallation = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const installation = await OrganizationVersionControl.findOne({ organization_id });
  if (!installation) {
    throw new HttpError('GitHub App not installed for this organization').NotFound();
  }

  res.status(200).json({
    success: true,
    data: installation,
  });
}, 'Failed to retrieve GitHub App installation');

/**
 * Get installation access token for organization
 * Returns a fresh installation token (valid for 1 hour)
 * This is used by WS assistant and other services to access GitHub
 */
exports.getInstallationToken = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const installation = await OrganizationVersionControl.findOne({ organization_id });
  if (!installation) {
    throw new HttpError('GitHub App not installed for this organization').NotFound();
  }

  // Generate fresh installation access token
  const tokenData = await getInstallationAccessToken(installation.github_app_installation_id);
  console.log({ tokenData });
  // Update last used timestamp
  installation.last_used_at = new Date();
  await installation.save();

  res.status(200).json({
    success: true,
    data: {
      token: tokenData.token,
      expires_at: tokenData.expires_at,
      permissions: tokenData.permissions,
      repository: {
        owner: installation.github_repo_owner,
        name: installation.github_repo_name,
        full_name: installation.github_repo_full_name,
        id: installation.github_repo_id,
      },
    },
  });
}, 'Failed to get installation access token');

/**
 * Delete/disconnect GitHub App installation for an organization
 */
exports.deleteInstallation = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const installation = await OrganizationVersionControl.findOneAndDelete({ organization_id });
  if (!installation) {
    throw new HttpError('GitHub App installation not found for this organization').NotFound();
  }

  res.status(200).json({
    success: true,
    message: 'GitHub App disconnected successfully. User should also uninstall the app from GitHub settings.',
  });
}, 'Failed to delete GitHub App installation');

/**
 * Verify GitHub App installation (test connection)
 */
exports.verifyInstallation = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const installation = await OrganizationVersionControl.findOne({ organization_id });
  if (!installation) {
    throw new HttpError('GitHub App not installed for this organization').NotFound();
  }

  try {
    // Try to get a fresh token to verify installation is still valid
    const tokenData = await getInstallationAccessToken(installation.github_app_installation_id);

    // Update last_used_at timestamp
    installation.last_used_at = new Date();
    await installation.save();

    res.status(200).json({
      success: true,
      data: {
        connected: true,
        installation_id: installation.github_app_installation_id,
        repository: installation.github_repo_full_name,
        has_write_access: installation.has_write_access,
        permissions: tokenData.permissions,
        verified_at: new Date(),
      },
    });
  } catch (error) {
    // Installation token generation failed - installation might be suspended or deleted
    res.status(200).json({
      success: false,
      data: {
        connected: false,
        error: error.message,
        repository: installation.github_repo_full_name,
        message: 'GitHub App installation is no longer valid. Please reinstall.',
      },
    });
  }
}, 'Failed to verify GitHub App installation');

/**
 * Get installation URL for installing the GitHub App
 * Returns the URL where users should be redirected to install the app
 */
exports.getInstallationURL = asyncHandler(async (req, res) => {
  const { organization_id } = req.query;

  if (!organization_id) {
    throw new HttpError('organization_id query parameter is required').BadRequest();
  }

  // Generate installation URL with state parameter to track organization
  const state = Buffer.from(JSON.stringify({ organization_id })).toString('base64');
  const installationURL = `https://github.com/apps/carla-nextjs/installations/new?state=${state}`;

  res.status(200).json({
    success: true,
    data: {
      installation_url: installationURL,
      state: state,
    },
  });
}, 'Failed to generate installation URL');

/**
 * Update PR information after PR is created
 * Called by WS-Assistant after successfully creating a PR
 */
exports.updatePRInfo = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { pr_url, pr_number, pr_created_at } = req.body;

  if (!pr_url) {
    throw new HttpError('pr_url is required').BadRequest();
  }

  const installation = await OrganizationVersionControl.findOneAndUpdate(
    { organization_id },
    {
      pr_url,
      pr_number,
      pr_created_at: pr_created_at || new Date(),
    },
    { new: true },
  );

  if (!installation) {
    throw new HttpError('GitHub App installation not found for this organization').NotFound();
  }

  console.log(`[OrgVersionControl] PR info updated for organization ${organization_id}: ${pr_url}`);

  res.status(200).json({
    success: true,
    data: {
      pr_url: installation.pr_url,
      pr_number: installation.pr_number,
      pr_created_at: installation.pr_created_at,
    },
    message: 'PR information saved successfully',
  });
}, 'Failed to update PR information');

/**
 * Update repository knowledge
 * Called by WS-Assistant after analyzing the repository
 * PUT /api/organization-version-control/:organization_id/repository-knowledge
 */
exports.updateRepositoryKnowledge = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { knowledge, analyzed_at } = req.body;

  if (!knowledge) {
    throw new HttpError('knowledge is required').BadRequest();
  }

  const installation = await OrganizationVersionControl.findOneAndUpdate(
    { organization_id },
    {
      repository_knowledge: knowledge,
      repository_knowledge_analyzed_at: analyzed_at || new Date(),
    },
    { new: true },
  );

  if (!installation) {
    throw new HttpError('GitHub App installation not found for this organization').NotFound();
  }

  console.log(`[OrgVersionControl] Repository knowledge updated for organization ${organization_id}`);

  res.status(200).json({
    success: true,
    data: {
      knowledge: installation.repository_knowledge,
      analyzed_at: installation.repository_knowledge_analyzed_at,
    },
    message: 'Repository knowledge updated successfully',
  });
}, 'Failed to update repository knowledge');

/**
 * Get repository knowledge
 * Used by WS-Assistant when analyzing errors
 * GET /api/organization-version-control/:organization_id/repository-knowledge
 */
exports.getRepositoryKnowledge = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const installation = await OrganizationVersionControl.findOne({ organization_id });

  if (!installation) {
    throw new HttpError('GitHub App installation not found for this organization').NotFound();
  }

  res.status(200).json({
    success: true,
    data: installation.repository_knowledge || null,
    analyzed_at: installation.repository_knowledge_analyzed_at || null,
  });
}, 'Failed to get repository knowledge');

/**
 * Update auto-fix enabled status
 * PATCH /api/organization-version-control/:organization_id/auto-fix
 */
exports.updateAutoFixEnabled = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { auto_fix_enabled } = req.body;

  // Find and update the organization version control record
  const installation = await OrganizationVersionControl.findOneAndUpdate(
    { organization_id },
    { auto_fix_enabled, updated_at: new Date() },
    { new: true, runValidators: true },
  );

  if (!installation) {
    throw new HttpError('GitHub App installation not found for this organization').NotFound();
  }

  console.log(
    `[OrgVersionControl] Auto-fix ${auto_fix_enabled ? 'enabled' : 'disabled'} for organization ${organization_id}`,
  );

  res.status(200).json({
    success: true,
    data: {
      organization_id: installation.organization_id,
      auto_fix_enabled: installation.auto_fix_enabled,
      updated_at: installation.updated_at,
    },
  });
}, 'Failed to update auto-fix status');

/**
 * Update repository snapshot metadata
 * Called by WS-Assistant after generating a Repomix snapshot
 * PUT /api/organization-version-control/:organization_id/snapshot
 */
exports.updateSnapshot = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const {
    status,
    snapshot_url,
    token_count,
    file_count,
    size_bytes,
    commit_sha,
    branch,
    generated_at,
    error_message,
  } = req.body;

  if (!status) {
    throw new HttpError('status is required').BadRequest();
  }

  const updateData = {
    repo_snapshot_status: status,
  };

  // Add optional fields if provided
  if (snapshot_url) updateData.repo_snapshot_url = snapshot_url;
  if (token_count) updateData.repo_snapshot_token_count = token_count;
  if (file_count) updateData.repo_snapshot_file_count = file_count;
  if (size_bytes) updateData.repo_snapshot_size_bytes = size_bytes;
  if (commit_sha) updateData.repo_snapshot_commit_sha = commit_sha;
  if (branch) updateData.repo_snapshot_branch = branch;
  if (generated_at) updateData.repo_snapshot_generated_at = generated_at;
  if (error_message) updateData.repo_snapshot_error = error_message;

  // Clear error on success
  if (status === 'ready') {
    updateData.repo_snapshot_error = null;
  }

  const installation = await OrganizationVersionControl.findOneAndUpdate(
    { organization_id },
    updateData,
    { new: true },
  );

  if (!installation) {
    throw new HttpError('GitHub App installation not found for this organization').NotFound();
  }

  console.log(`[OrgVersionControl] Snapshot metadata updated for organization ${organization_id}: status=${status}`);

  res.status(200).json({
    success: true,
    data: {
      repo_snapshot_url: installation.repo_snapshot_url,
      repo_snapshot_status: installation.repo_snapshot_status,
      repo_snapshot_generated_at: installation.repo_snapshot_generated_at,
      repo_snapshot_token_count: installation.repo_snapshot_token_count,
      repo_snapshot_file_count: installation.repo_snapshot_file_count,
    },
    message: 'Snapshot metadata updated successfully',
  });
}, 'Failed to update snapshot metadata');

/**
 * Trigger snapshot refresh (manual)
 * POST /api/organization-version-control/:organization_id/refresh-snapshot
 */
exports.refreshSnapshot = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const installation = await OrganizationVersionControl.findOne({ organization_id });

  if (!installation) {
    throw new HttpError('GitHub App installation not found for this organization').NotFound();
  }

  // Trigger snapshot generation via WS-Assistant
  const axios = require('axios');
  const wsAssistantUrl = process.env.WS_ASSISTANT_HTTP_URL;

  if (!wsAssistantUrl) {
    throw new HttpError('WS_ASSISTANT_HTTP_URL not configured').InternalError();
  }

  console.log(`[OrgVersionControl] Triggering snapshot refresh for organization ${organization_id}`);

  // Fire and forget - don't wait for completion
  axios
    .post(`${wsAssistantUrl}/generate-repo-snapshot`, {
      organizationId: organization_id,
      force: true,
    })
    .then(() => {
      console.log(`[OrgVersionControl] Snapshot refresh triggered for organization ${organization_id}`);
    })
    .catch(err => {
      console.error(
        `[OrgVersionControl] Failed to trigger snapshot refresh for organization ${organization_id}:`,
        err.message,
      );
    });

  res.status(202).json({
    success: true,
    message: 'Snapshot refresh initiated. This may take 1-2 minutes.',
  });
}, 'Failed to trigger snapshot refresh');
