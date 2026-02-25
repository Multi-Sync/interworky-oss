const express = require('express');
const assistantDataRouter = express.Router();
const {
  createAssistantData,
  getAssistantData,
  updateAssistantData,
  deleteAssistantData,
  listAssistantData,
} = require('./assistant_data.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');
const { createAssistantDataValidator, updateAssistantDataValidator } = require('./assistant_data.validators');

assistantDataRouter.post('/', authenticateToken, createAssistantDataValidator, createAssistantData);
assistantDataRouter.get('/:id', authenticateToken, getAssistantData);
assistantDataRouter.put('/:id', authenticateToken, updateAssistantDataValidator, updateAssistantData);
assistantDataRouter.delete('/:id', authenticateToken, deleteAssistantData);
assistantDataRouter.get('/', authenticateToken, listAssistantData);

module.exports = assistantDataRouter;
