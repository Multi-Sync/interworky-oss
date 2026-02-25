const express = require('express');
const conversionConfigRouter = express.Router();
const conversionConfigController = require('./conversion_config.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');

// Create conversion config
conversionConfigRouter.post('/:organization_id', authenticateToken, conversionConfigController.createConversionConfig);

// Get active conversion config
conversionConfigRouter.get('/:organization_id', authenticateToken, conversionConfigController.getConversionConfig);

// Get all conversion configs (including inactive)
conversionConfigRouter.get(
  '/:organization_id/all',
  authenticateToken,
  conversionConfigController.getAllConversionConfigs,
);

// Update conversion config
conversionConfigRouter.put(
  '/:organization_id/:id',
  authenticateToken,
  conversionConfigController.updateConversionConfig,
);

// Delete conversion config
conversionConfigRouter.delete(
  '/:organization_id/:id',
  authenticateToken,
  conversionConfigController.deleteConversionConfig,
);

// Verify conversion config
conversionConfigRouter.post(
  '/:organization_id/:id/verify',
  authenticateToken,
  conversionConfigController.verifyConversionConfig,
);

// Report validation failure (element not found)
conversionConfigRouter.post(
  '/:organization_id/validation-failure',
  authenticateToken,
  conversionConfigController.reportValidationFailure,
);

module.exports = conversionConfigRouter;
