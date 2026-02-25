const express = require('express');
const organizationMethodsRouter = express.Router();
const organizationMethodsController = require('./organization_methods.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');
const {
  createOrganizationMethodValidator,
  updateOrganizationMethodValidator,
  deleteOrganizationMethodValidator,
  getOrganizationMethodsValidator,
  createBulkOrganizationMethodValidator,
  generateCapabilityValidator,
  executeCapabilityValidator,
} = require('./organization_methods.validators');

organizationMethodsRouter.post(
  '/',
  authenticateToken,
  createOrganizationMethodValidator,
  organizationMethodsController.createOrganizationMethod,
);
organizationMethodsRouter.post(
  '/bulk',
  authenticateToken,
  createBulkOrganizationMethodValidator,
  organizationMethodsController.createBulkOrganizationMethod,
);
organizationMethodsRouter.put(
  '/:id',
  authenticateToken,
  updateOrganizationMethodValidator,
  organizationMethodsController.updateOrganizationMethod,
);
organizationMethodsRouter.delete(
  '/:id',
  authenticateToken,
  deleteOrganizationMethodValidator,
  organizationMethodsController.deleteOrganizationMethod,
);
organizationMethodsRouter.get(
  '/organization/:organization_id',
  authenticateToken,
  getOrganizationMethodsValidator,
  organizationMethodsController.getOrganizationMethods,
);
organizationMethodsRouter.get('/public', organizationMethodsController.getPublicOrganizationMethods);

// AI capability generation endpoint
organizationMethodsRouter.post(
  '/generate',
  authenticateToken,
  generateCapabilityValidator,
  organizationMethodsController.generateCapabilityFromDescription,
);

// Execute capability endpoint (HTTP or Email)
organizationMethodsRouter.post('/execute', executeCapabilityValidator, organizationMethodsController.executeCapability);

module.exports = organizationMethodsRouter;
