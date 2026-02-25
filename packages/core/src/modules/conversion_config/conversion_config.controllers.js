const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const ConversionConfig = require('./conversion_config.model');

// Create a new conversion config
exports.createConversionConfig = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const configData = {
    ...req.body,
    organization_id,
  };

  // Check if an active config already exists for this organization
  const existingConfig = await ConversionConfig.findOne({
    organization_id,
    status: 'active',
  });

  if (existingConfig) {
    // Deactivate the existing config
    existingConfig.status = 'inactive';
    await existingConfig.save();
  }

  const config = await ConversionConfig.create(configData);
  res.status(201).json({ config });
}, 'Failed to create conversion config');

// Get conversion config for an organization
exports.getConversionConfig = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const config = await ConversionConfig.findOne({
    organization_id,
    status: 'active',
  });

  if (!config) {
    throw new HttpError('No active conversion config found').NotFound();
  }

  res.status(200).json({ config });
}, 'Failed to fetch conversion config');

// Get all conversion configs for an organization (including inactive)
exports.getAllConversionConfigs = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const configs = await ConversionConfig.find({ organization_id }).sort({ created_at: -1 });

  res.status(200).json({ configs });
}, 'Failed to fetch conversion configs');

// Update conversion config
exports.updateConversionConfig = asyncHandler(async (req, res) => {
  const { organization_id, id } = req.params;

  const config = await ConversionConfig.findOne({ id, organization_id });

  if (!config) {
    throw new HttpError('Conversion config not found').NotFound();
  }

  // Update the config
  Object.assign(config, req.body);
  await config.save();

  res.status(200).json({ config });
}, 'Failed to update conversion config');

// Delete conversion config
exports.deleteConversionConfig = asyncHandler(async (req, res) => {
  const { organization_id, id } = req.params;

  const config = await ConversionConfig.findOne({ id, organization_id });

  if (!config) {
    throw new HttpError('Conversion config not found').NotFound();
  }

  await ConversionConfig.deleteOne({ id, organization_id });

  res.status(200).json({ message: 'Conversion config deleted successfully' });
}, 'Failed to delete conversion config');

// Verify conversion config (mark as verified)
exports.verifyConversionConfig = asyncHandler(async (req, res) => {
  const { organization_id, id } = req.params;

  const config = await ConversionConfig.findOne({ id, organization_id });

  if (!config) {
    throw new HttpError('Conversion config not found').NotFound();
  }

  config.verified = true;
  await config.save();

  res.status(200).json({ config });
}, 'Failed to verify conversion config');

// Report validation failure (element selector not found on page)
exports.reportValidationFailure = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { page_url, selector, error_message, timestamp } = req.body;

  // Find the active conversion config
  const config = await ConversionConfig.findOne({
    organization_id,
    status: 'active',
  });

  if (!config) {
    // If no config exists, return success but do nothing
    return res.status(200).json({
      message: 'No active config found, validation failure logged',
    });
  }

  // Store validation failure in the config's metadata
  // We'll track last 10 validation failures
  if (!config.validation_failures) {
    config.validation_failures = [];
  }

  config.validation_failures.push({
    page_url,
    selector: selector || config.element_selector,
    error_message,
    timestamp: timestamp || new Date(),
  });

  // Keep only last 10 failures
  if (config.validation_failures.length > 10) {
    config.validation_failures = config.validation_failures.slice(-10);
  }

  await config.save();

  res.status(200).json({
    message: 'Validation failure recorded',
    config,
  });
}, 'Failed to report validation failure');
