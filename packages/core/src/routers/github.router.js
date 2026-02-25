const express = require('express');
const githubRouter = express.Router();
const { asyncHandler } = require('../utils/asyncHandler');
const {
  getInstallationDetails,
  getInstallationRepositories,
  getInstallationAccessToken,
} = require('../utils/githubApp');
const OrganizationVersionControl = require('../modules/organization_version_control/organization_version_control.model');
const Organization = require('../modules/organization/organization.model');
const axios = require('axios');

/**
 * GitHub App OAuth Callback
 * Handles the callback after user installs the GitHub App
 * URL: /api/github/callback
 */
githubRouter.get(
  '/callback',
  asyncHandler(async (req, res) => {
    const { installation_id, setup_action, state } = req.query;

    console.log('[GitHub Callback] Received:', { installation_id, setup_action, state });

    if (!installation_id) {
      return res.status(400).send('Missing installation_id parameter');
    }

    // Decode state to get organization_id
    let organizationId;
    try {
      if (state) {
        const stateData = JSON.parse(Buffer.from(state, 'base64').toString('utf8'));
        organizationId = stateData.organization_id;
      }
    } catch (error) {
      console.error('[GitHub Callback] Failed to decode state:', error);
    }

    // Get installation details from GitHub
    try {
      const installation = await getInstallationDetails(installation_id);
      const repositories = await getInstallationRepositories(installation_id);

      console.log('[GitHub Callback] Installation details:', {
        installation_id,
        account: installation.account.login,
        repositories: repositories.length,
      });

      // If we have organization_id from state, save the installation automatically
      if (organizationId && repositories.length > 0) {
        // Use first repository (or you could show a selection page)
        const selectedRepo = repositories[0];

        const installationData = {
          organization_id: organizationId,
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

        // Check if installation already exists
        const existing = await OrganizationVersionControl.findOne({ organization_id: organizationId });

        if (existing) {
          Object.assign(existing, installationData);
          await existing.save();
        } else {
          await OrganizationVersionControl.create(installationData);
        }

        console.log('[GitHub Callback] Installation saved for organization:', organizationId);

        // Update organization onboarding_step to 'plugin'
        await Organization.findOneAndUpdate({ id: organizationId }, { onboarding_step: 'plugin' }, { new: true });

        console.log('[GitHub Callback] Updated onboarding_step to plugin for organization:', organizationId);

        // PR generation disabled for plugin integration
        // GitHub connection is now only for Auto-Fix feature (performance monitoring)
        // Users will integrate plugin manually via /dashboard/tutorial

        /* DISABLED: PR generation for plugin integration
        const wsAssistantUrl = process.env.WS_ASSISTANT_HTTP_URL;
        console.log(`wsAssistantUrl ${wsAssistantUrl}`);

        axios
          .post(`${wsAssistantUrl}/generate-integration-pr`, {
            organizationId,
            installationId: installation_id,
            repoFullName: selectedRepo.full_name,
            repoOwner: selectedRepo.owner.login,
            repoName: selectedRepo.name,
          })
          .then(response => {
            console.log('[GitHub Callback] PR generation triggered successfully:', response.data);
          })
          .catch(error => {
            console.error({ error });
            console.error('[GitHub Callback] Failed to trigger PR generation:', error.response?.data || error.message);
          });
        */

        // Redirect to dashboard home after successful GitHub connection
        return res.redirect(
          `${process.env.DASHBOARD_URL || 'https://interworky.com'}/dashboard/home?github=connected&repo=${selectedRepo.full_name}`,
        );
      }

      // If no organization_id in state, redirect to settings page
      // User will see the connected status there
      return res.redirect(
        `${process.env.DASHBOARD_URL || 'https://interworky.com'}/dashboard/settings?github=installed&installation_id=${installation_id}`,
      );
    } catch (error) {
      console.error('[GitHub Callback] Error processing installation:', error);
      return res.redirect(
        `${process.env.DASHBOARD_URL || 'https://interworky.com'}/dashboard/settings?github=error&message=${encodeURIComponent(error.message)}`,
      );
    }
  }, 'GitHub App callback failed'),
);

/**
 * Manually trigger integration PR generation
 * URL: /api-core/github/generate-integration-pr
 */
githubRouter.post(
  '/generate-integration-pr',
  asyncHandler(async (req, res) => {
    const { organizationId } = req.body;

    console.log('[GitHub Generate PR] Request for organization:', organizationId);

    if (!organizationId) {
      return res.status(400).json({
        success: false,
        error: 'organizationId is required',
      });
    }

    try {
      // Get GitHub installation details for this organization
      const versionControl = await OrganizationVersionControl.findOne({ organization_id: organizationId });

      if (!versionControl) {
        return res.status(404).json({
          success: false,
          error: 'GitHub installation not found for this organization',
        });
      }

      // Trigger PR generation via ws-assistant
      const wsAssistantUrl = process.env.WS_ASSISTANT_HTTP_URL;
      console.log(`wsAssistantUrl ${wsAssistantUrl}`);
      axios
        .post(`${wsAssistantUrl}/generate-integration-pr`, {
          organizationId,
          installationId: versionControl.github_app_installation_id,
          repoFullName: versionControl.github_repo_full_name,
          repoOwner: versionControl.github_repo_owner,
          repoName: versionControl.github_repo_name,
        })
        .then(response => {
          console.log('[GitHub Generate PR] PR generation triggered successfully:', response.data);
        })
        .catch(error => {
          console.error('[GitHub Generate PR] Failed to trigger PR generation:', error.response?.data || error.message);
        });

      // Return immediately (PR generation happens asynchronously)
      res.status(202).json({
        success: true,
        message: 'PR generation started. Check back in a moment for the PR URL.',
      });
    } catch (error) {
      console.error('[GitHub Generate PR] Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }, 'GitHub PR generation trigger failed'),
);

/**
 * Get GitHub App installation access token
 * Returns a fresh installation access token for ws-assistant to use
 * URL: /api-core/github/installation/:installationId/token
 */
githubRouter.get(
  '/installation/:installationId/token',
  asyncHandler(async (req, res) => {
    const { installationId } = req.params;

    console.log('[GitHub Token] Generating installation token for:', installationId);

    try {
      const tokenData = await getInstallationAccessToken(installationId);

      res.status(200).json({
        success: true,
        data: {
          token: tokenData.token,
          expires_at: tokenData.expires_at,
        },
      });
    } catch (error) {
      console.error('[GitHub Token] Error:', error.message);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  }, 'GitHub installation token retrieval failed'),
);

/**
 * GitHub App Webhook Handler
 * Handles events from GitHub (installation created, deleted, etc.)
 * URL: /api/github/webhook
 */
githubRouter.post(
  '/webhook',
  express.json(),
  asyncHandler(async (req, res) => {
    const event = req.headers['x-github-event'];
    const payload = req.body;

    console.log('[GitHub Webhook] Event:', event);
    console.log('[GitHub Webhook] Payload:', JSON.stringify(payload, null, 2));

    // Handle different webhook events
    switch (event) {
      case 'installation':
        await handleInstallationEvent(payload);
        break;

      case 'installation_repositories':
        await handleInstallationRepositoriesEvent(payload);
        break;

      case 'installation_target':
        console.log('[GitHub Webhook] Installation target event (usually when user changes settings)');
        break;

      default:
        console.log(`[GitHub Webhook] Unhandled event type: ${event}`);
    }

    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ success: true, message: 'Webhook received' });
  }, 'GitHub webhook processing failed'),
);

/**
 * Handle installation created/deleted events
 */
async function handleInstallationEvent(payload) {
  const { action, installation } = payload;
  const installationId = installation.id.toString();

  console.log(`[GitHub Webhook] Installation ${action}:`, installationId);

  if (action === 'deleted') {
    // Remove installation from our database
    const result = await OrganizationVersionControl.findOneAndDelete({
      github_app_installation_id: installationId,
    });

    if (result) {
      console.log(`[GitHub Webhook] Removed installation ${installationId} for org ${result.organization_id}`);
    }
  } else if (action === 'created') {
    console.log(`[GitHub Webhook] New installation created: ${installationId}`);
    // Installation will be saved when user completes the callback flow
  } else if (action === 'suspend' || action === 'unsuspend') {
    console.log(`[GitHub Webhook] Installation ${action}: ${installationId}`);
    // You could add a status field to track suspended installations
  }
}

/**
 * Handle repository added/removed from installation
 */
async function handleInstallationRepositoriesEvent(payload) {
  const { action, installation, repositories_added, repositories_removed } = payload;
  const installationId = installation.id.toString();

  console.log(`[GitHub Webhook] Installation repositories ${action}:`, installationId);
  console.log('  Added:', repositories_added?.length || 0);
  console.log('  Removed:', repositories_removed?.length || 0);

  // Find the organization using this installation
  const orgVersionControl = await OrganizationVersionControl.findOne({
    github_app_installation_id: installationId,
  });

  if (orgVersionControl && repositories_removed) {
    // Check if the connected repository was removed
    const wasRemoved = repositories_removed.some(repo => repo.id === orgVersionControl.github_repo_id);

    if (wasRemoved) {
      console.log(
        `[GitHub Webhook] Connected repository was removed from installation for org ${orgVersionControl.organization_id}`,
      );
      // You might want to notify the user or update the connection status
    }
  }
}

module.exports = githubRouter;
