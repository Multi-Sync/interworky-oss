const { getAIProvider } = require('@interworky/providers');
const openai = getAIProvider().getClient();
const AssistantData = require('./assistant_data.model');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const { createAssistantDataUtil } = require('./assistant_data.utils');
const AssistantInfo = require('../assistant_info/assistant_info.model');

// Controller method createAssistantData
exports.createAssistantData = asyncHandler(async (req, res) => {
  const { name, image_url, opening_statement, personality, type } = req.body;

  const assistantData = await createAssistantDataUtil(name, image_url, opening_statement, personality, type);

  res.status(201).json({ assistantData });
}, 'Failed to create assistant data');

// Retrieve assistant data by ID
exports.getAssistantData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const assistantData = await AssistantData.findOne({ id });
  const assistantInfo = await AssistantInfo.findOne({ assistant_id: assistantData.assistant_id });
  if (!assistantData) {
    throw new HttpError('Assistant data not found').NotFound();
  }
  res.status(200).json({ assistantData, assistantInfo });
}, 'Failed to retrieve assistant data');

// Update assistant data
exports.updateAssistantData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, image_url, opening_statement, personality, type, assistant_id } = req.body;

  //TODO add organization info instructions
  let instructions = `You are a ${type} assistant, your personality is ${personality}`;

  await openai.beta.assistants.update(assistant_id, {
    instructions,
    name,
    model: 'gpt-4o',
  });

  // Update the assistant data in the database
  const assistantData = await AssistantData.findOneAndUpdate(
    { id },
    {
      name,
      image_url,
      opening_statement,
      personality,
      type,
    },
    { new: true, runValidators: true },
  );

  if (!assistantData) {
    throw new HttpError('Assistant data not found').NotFound();
  }

  res.status(200).json(assistantData);
}, 'Failed to update assistant data');

// Delete assistant data by ID
exports.deleteAssistantData = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Delete the assistant on OpenAI
  await openai.beta.assistants.del(id);

  const assistantData = await AssistantData.findOneAndDelete({ id });
  if (!assistantData) {
    throw new HttpError('Assistant data not found').NotFound();
  }
  res.status(204).send();
}, 'Failed to delete assistant data');

// List all assistant data with pagination
exports.listAssistantData = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
    return res.status(400).json({ error: 'Invalid pagination parameters' });
  }

  // Apply pagination using skip and limit
  const assistantDataList = await AssistantData.find();

  // Count total number of assistant data entries
  const totalAssistantData = await AssistantData.countDocuments();

  res.status(200).json({
    total: totalAssistantData,
    page: pageNumber,
    limit: limitNumber,
    assistantDataList,
  });
}, 'Failed to list assistant data');
