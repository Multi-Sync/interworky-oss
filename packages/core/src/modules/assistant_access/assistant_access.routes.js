const express = require('express');
const assistantAccessRouter = express.Router();
const {
  createAssistantAccess,
  getAssistantAccess,
  updateAssistantAccess,
  deleteAssistantAccess,
  listAssistantAccess,
} = require('./assistant_access.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');
const { updateAssistantAccessValidator } = require('./assistant_access.validators');

assistantAccessRouter.post('/', authenticateToken, createAssistantAccess);
assistantAccessRouter.get('/:id', authenticateToken, getAssistantAccess);
assistantAccessRouter.put('/:id', authenticateToken, updateAssistantAccessValidator, updateAssistantAccess);
assistantAccessRouter.delete('/:id', authenticateToken, deleteAssistantAccess);
assistantAccessRouter.get('/', authenticateToken, listAssistantAccess);

module.exports = assistantAccessRouter;
