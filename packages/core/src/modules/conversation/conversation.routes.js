const express = require('express');
const {
  createConversation,
  addMessage,
  getConversations,
  getConversationById,
  getConversationsByOrganizationId,
  getConversationsByPatientId,
  closeConversation,
  updateConversation,
  updateMessageReaction,
  getDashboardConversation,
  getCarlaConversations,
  createCarlaConversation,
  updateCarlaConversationTitle,
  archiveCarlaConversation,
  getCarlaConversationMessages,
} = require('./conversation.controllers');
const {
  createConversationValidator,
  addMessageValidator,
  conversationIdValidator,
  organizationConversationsValidator,
  getConversationsByPatientIdValidator,
  closeConversationValidator,
  updateConversationValidator,
  updateMessageReactionValidator,
  carlaInitValidator,
  getCarlaConversationMessagesValidator,
} = require('./conversation.validators');
const authenticateToken = require('../../middlewares/auth.middleware');
// const { checkMessageLimit } = require('../../middlewares/utils.middleware');

const conversationRouter = express.Router();

conversationRouter.post('/', createConversationValidator, createConversation);
conversationRouter.get('/', getConversations);
conversationRouter.get('/:conversationId', conversationIdValidator, getConversationById);
conversationRouter.post('/:conversationId/messages', addMessageValidator, addMessage);
conversationRouter.get(
  '/organization/:organizationId',
  organizationConversationsValidator,
  getConversationsByOrganizationId,
);
conversationRouter.get('/patient/:patientId', getConversationsByPatientIdValidator, getConversationsByPatientId);

conversationRouter.post(
  '/close/patient/:patientId/organization/:organizationId',
  closeConversationValidator,
  closeConversation,
);
conversationRouter.put('/:conversationId', updateConversationValidator, updateConversation);
conversationRouter.put(
  '/:conversationId/messages/:messageId/reaction',
  updateMessageReactionValidator,
  updateMessageReaction,
);

// Carla dashboard conversation routes
conversationRouter.post('/carla/init', authenticateToken, carlaInitValidator, getDashboardConversation);
conversationRouter.get(
  '/carla/:conversationId/messages',
  authenticateToken,
  getCarlaConversationMessagesValidator,
  getCarlaConversationMessages,
);

// Carla conversation management routes
conversationRouter.get('/carla/conversations', authenticateToken, getCarlaConversations);
conversationRouter.post('/carla/conversations/new', authenticateToken, createCarlaConversation);
conversationRouter.patch('/carla/conversations/:conversationId/title', authenticateToken, updateCarlaConversationTitle);
conversationRouter.delete('/carla/conversations/:conversationId', authenticateToken, archiveCarlaConversation);

module.exports = conversationRouter;
