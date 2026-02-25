// src/modules/flow/flow.routes.js
const express = require('express');
const flowRouter = express.Router();
const flowController = require('./flow.controllers');
const flowAuthController = require('./flow-auth.controller');
const flowAgentsController = require('./flow-agents.controller');
const authenticateToken = require('../../middlewares/auth.middleware');
const {
  createFlowValidator,
  updateFlowValidator,
  duplicateFlowValidator,
  saveFlowResultValidator,
  chargeFlowUsageValidator,
  getUserResultsValidator,
  validateFlowDataValidator,
  generateFlowResultsValidator,
  validateAndGenerateValidator,
  validateFlowId,
  validateOrganizationId,
  validateResultId,
} = require('./flow.validators');

// Public routes (for embed script)
// Get flow config by flow_id - used by embed script
flowRouter.get(
  '/public/:flow_id',
  validateFlowId,
  flowController.getFlowByFlowId
);

// Get all public flows (marketplace)
flowRouter.get('/public', flowController.getPublicFlows);

// Generate visual companion for voice session (public - no auth required)
// Visuals are ephemeral and generated on-demand during conversations
flowRouter.post(
  '/:flow_id/visual-companion',
  validateFlowId,
  flowController.generateVisualCompanion
);

// Protected routes (require authentication)
// Create a new flow
flowRouter.post(
  '/',
  authenticateToken,
  createFlowValidator,
  flowController.createFlow
);

// Get all flows for an organization
flowRouter.get(
  '/organization/:organization_id',
  authenticateToken,
  validateOrganizationId,
  flowController.getFlowsByOrganization
);

// Get a specific flow for an organization
flowRouter.get(
  '/organization/:organization_id/:flow_id',
  authenticateToken,
  validateOrganizationId,
  validateFlowId,
  flowController.getFlowByOrgAndFlowId
);

// Update a flow
flowRouter.put(
  '/organization/:organization_id/:flow_id',
  authenticateToken,
  validateOrganizationId,
  validateFlowId,
  updateFlowValidator,
  flowController.updateFlow
);

// Delete a flow
flowRouter.delete(
  '/organization/:organization_id/:flow_id',
  authenticateToken,
  validateOrganizationId,
  validateFlowId,
  flowController.deleteFlow
);

// ============================================
// User Results Routes (require authentication)
// IMPORTANT: Must be defined BEFORE /:flow_id routes
// ============================================

// Get all results for current user
flowRouter.get(
  '/results',
  authenticateToken,
  getUserResultsValidator,
  flowController.getUserResults
);

// Get a specific result by ID
flowRouter.get(
  '/results/:result_id',
  authenticateToken,
  validateResultId,
  flowController.getResultById
);

// Delete a result
flowRouter.delete(
  '/results/:result_id',
  authenticateToken,
  validateResultId,
  flowController.deleteResult
);

// ============================================
// Flow-specific routes (with :flow_id param)
// ============================================

// Duplicate a flow (for templates)
flowRouter.post(
  '/:flow_id/duplicate',
  authenticateToken,
  validateFlowId,
  duplicateFlowValidator,
  flowController.duplicateFlow
);

// Save flow result (requires auth)
flowRouter.post(
  '/:flow_id/result',
  authenticateToken,
  validateFlowId,
  saveFlowResultValidator,
  flowController.saveFlowResult
);

// Charge tokens for flow usage (requires auth)
flowRouter.post(
  '/:flow_id/charge',
  authenticateToken,
  validateFlowId,
  chargeFlowUsageValidator,
  flowController.chargeFlowUsage
);

// ============================================
// Flow AI Agents Routes (validation & generation)
// ============================================

// Validate collected flow data (checks completeness, returns follow-up questions)
flowRouter.post(
  '/:flow_id/validate',
  authenticateToken,
  validateFlowId,
  validateFlowDataValidator,
  flowAgentsController.validateFlowData
);

// Generate flow results using dual-agent system (Creator + Judge)
flowRouter.post(
  '/:flow_id/generate-results',
  authenticateToken,
  validateFlowId,
  generateFlowResultsValidator,
  flowAgentsController.generateResults
);

// Combined: Validate and generate if complete (single request)
flowRouter.post(
  '/:flow_id/validate-and-generate',
  authenticateToken,
  validateFlowId,
  validateAndGenerateValidator,
  flowAgentsController.validateAndGenerate
);

// ============================================
// Flow User Authentication Routes
// ============================================

// Google OAuth for flow users (creates standalone user)
flowRouter.post('/auth/google', flowAuthController.flowGoogleAuth);

// Get current flow user (requires auth)
flowRouter.get('/auth/me', authenticateToken, flowAuthController.getFlowUser);

// Get token balance
flowRouter.get('/auth/balance', authenticateToken, flowAuthController.getTokenBalance);

// Get transaction history
flowRouter.get('/auth/transactions', authenticateToken, flowAuthController.getTransactionHistory);

// Check if user can afford a flow
flowRouter.post('/auth/check-affordability', authenticateToken, flowAuthController.checkFlowAffordability);

module.exports = flowRouter;
