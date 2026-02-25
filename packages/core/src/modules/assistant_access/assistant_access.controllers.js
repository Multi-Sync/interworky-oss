const AssistantAccess = require('./assistant_access.model');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');

// Create new assistant access
exports.createAssistantAccess = asyncHandler(async (req, res) => {
  const { assistant_id, table_name, access_level } = req.body;

  const assistantAccess = await AssistantAccess.create({
    assistant_id,
    table_name,
    access_level,
  });

  res.status(201).json({ assistantAccess });
}, 'Failed to create assistant access');

// Retrieve assistant access by ID
exports.getAssistantAccess = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assistantAccess = await AssistantAccess.findById(id);
  if (!assistantAccess) {
    throw new HttpError('Assistant access not found').NotFound();
  }
  res.status(200).json({ assistantAccess });
}, 'Failed to retrieve assistant access');

// Update assistant access
exports.updateAssistantAccess = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { assistant_id, table_name, access_level } = req.body;
  const assistantAccess = await AssistantAccess.findByIdAndUpdate(
    id,
    {
      assistant_id,
      table_name,
      access_level,
    },
    { new: true, runValidators: true },
  );

  if (!assistantAccess) {
    throw new HttpError('Assistant access not found').NotFound();
  }

  res.status(200).json(assistantAccess);
}, 'Failed to update assistant access');

// Delete assistant access by ID
exports.deleteAssistantAccess = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const assistantAccess = await AssistantAccess.findByIdAndDelete(id);
  if (!assistantAccess) {
    throw new HttpError('Assistant access not found').NotFound();
  }
  res.status(204).send();
}, 'Failed to delete assistant access');

// List all assistant access entries with pagination
exports.listAssistantAccess = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  const assistantAccessList = await AssistantAccess.find();

  const totalAssistantAccess = await AssistantAccess.countDocuments();

  res.status(200).json({
    total: totalAssistantAccess,
    page: pageNumber,
    limit: limitNumber,
    assistantAccessList,
  });
}, 'Failed to list assistant access entries');
