// src/modules/organization_assistants/organization_assistants.routes.js
const express = require('express');
const organizationAssistantsRouter = express.Router();

const {
  createOrganizationAssistant,
  listOrganizationsAssistants,
  listOrganizationAssistants,
  deleteOrganizationAssistant,
} = require('./organization_assistants.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');

const {
  createOrganizationAssistantValidator,
  deleteOrganizationAssistantValidator,
  listOrganizationAssistantsValidator,
} = require('./organization_assistants.validators');

organizationAssistantsRouter.post(
  '/',
  authenticateToken,
  createOrganizationAssistantValidator,
  createOrganizationAssistant,
);
organizationAssistantsRouter.get(
  '/',
  authenticateToken,
  listOrganizationAssistantsValidator,
  listOrganizationsAssistants,
);
organizationAssistantsRouter.get('/organization/:organization_id', authenticateToken, listOrganizationAssistants);
organizationAssistantsRouter.delete(
  '/:id',
  authenticateToken,
  deleteOrganizationAssistantValidator,
  deleteOrganizationAssistant,
);

module.exports = organizationAssistantsRouter;
