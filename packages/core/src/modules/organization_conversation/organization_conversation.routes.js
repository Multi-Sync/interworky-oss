const express = require('express');
const organizationConversationRouter = express.Router();
const {
  createOrganizationConversation,
  getOrganizationConversationById,
  getOrganizationConversationByOrganizationIdAndEmail,
  updateOrganizationConversation,
  deleteOrganizationConversation,
  getOrganizationConversationsByOrganizationId,
} = require('./organization_conversation.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');
const {
  createOrganizationConversationValidator,
  updateOrganizationConversationValidator,
  organizationConversationIdValidator,
  organizationConversationByOrganizationIdAndEmailValidator,
  organizationConversationByOrganizationId,
} = require('./organization_conversation.validators');

organizationConversationRouter.post(
  '/',
  authenticateToken,
  createOrganizationConversationValidator,
  createOrganizationConversation,
);
organizationConversationRouter.get(
  '/organization/:organization_id',
  authenticateToken,
  organizationConversationByOrganizationId,
  getOrganizationConversationsByOrganizationId,
);
organizationConversationRouter.get(
  '/:id',
  authenticateToken,
  organizationConversationIdValidator,
  getOrganizationConversationById,
);
organizationConversationRouter.get(
  '/organization/:organization_id/email/:email',
  authenticateToken,
  organizationConversationByOrganizationIdAndEmailValidator,
  getOrganizationConversationByOrganizationIdAndEmail,
);
organizationConversationRouter.put(
  '/:id',
  authenticateToken,
  updateOrganizationConversationValidator,
  updateOrganizationConversation,
);
organizationConversationRouter.delete(
  '/:id',
  authenticateToken,
  organizationConversationIdValidator,
  deleteOrganizationConversation,
);

module.exports = organizationConversationRouter;
