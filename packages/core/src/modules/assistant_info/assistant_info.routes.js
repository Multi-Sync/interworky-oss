const express = require('express');
const multer = require('multer');
const assistantInfoRouter = express.Router();
const assistantInfoController = require('./assistant_info.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');
const {
  createAssistantInfoValidator,
  getAssistantInfoValidator,
  updateAssistantInfoValidator,
  deleteAssistantInfoValidator,
  updateAssistantInfoImageValidator,
} = require('./assistant_info.validators');

// Initialize Multer for file uploads
const upload = multer();

assistantInfoRouter.post(
  '/',
  authenticateToken,
  createAssistantInfoValidator,
  assistantInfoController.createAssistantInfo,
);

assistantInfoRouter.get('/all', authenticateToken, assistantInfoController.getAllAssistantInfo);

assistantInfoRouter.get(
  '/:organization_id',
  authenticateToken,
  getAssistantInfoValidator,
  assistantInfoController.getAssistantInfo,
);

assistantInfoRouter.put(
  '/:organization_id',
  authenticateToken,
  updateAssistantInfoValidator,
  assistantInfoController.updateAssistantInfo,
);

assistantInfoRouter.delete(
  '/:organization_id',
  authenticateToken,
  deleteAssistantInfoValidator,
  assistantInfoController.deleteAssistantInfo,
);

// New route for updating assistant image
assistantInfoRouter.put(
  '/:organization_id/image',
  authenticateToken,
  updateAssistantInfoImageValidator,
  upload.single('file'), // Use Multer to handle single file uploads
  assistantInfoController.updateAssistantInfoImage,
);

module.exports = assistantInfoRouter;
