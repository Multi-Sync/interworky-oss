const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const OrganizationConversation = require('./organization_conversation.model');

// Create a new organization conversation
exports.createOrganizationConversation = asyncHandler(async (req, res) => {
  const organizationConversation = await OrganizationConversation.create(req.body);
  res.status(201).json({ organizationConversation });
}, 'Failed to create organization conversation');

exports.getOrganizationConversationById = asyncHandler(async (req, res) => {
  const organizationConversation = await OrganizationConversation.findById(req.params.id);
  if (!organizationConversation) {
    throw new HttpError('Organization conversation not found').NotFound();
  }
  res.status(200).json(organizationConversation);
}, 'Failed to get organization conversation');

exports.getOrganizationConversationByOrganizationIdAndEmail = asyncHandler(async (req, res) => {
  const { organization_id, email } = req.params;
  const organizationConversation = await OrganizationConversation.findOne({ organization_id, email });
  if (!organizationConversation) {
    throw new HttpError('Organization conversation not found').NotFound();
  }
  res.status(200).json(organizationConversation);
}, 'Failed to get organization conversation');

exports.getOrganizationConversationsByOrganizationId = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const organizationConversation = await OrganizationConversation.find({ organization_id });
  if (!organizationConversation) {
    throw new HttpError('Organization conversation not found').NotFound();
  }
  res.status(200).json(organizationConversation);
}, 'Failed to get organization conversation');

exports.updateOrganizationConversation = asyncHandler(async (req, res) => {
  const organizationConversation = await OrganizationConversation.findById(req.params.id);
  if (!organizationConversation) {
    throw new HttpError('Organization conversation not found').NotFound();
  }
  Object.assign(organizationConversation, req.body);
  await organizationConversation.save();
  res.status(200).json(organizationConversation);
}, 'Failed to update organization conversation');

exports.deleteOrganizationConversation = asyncHandler(async (req, res) => {
  const organizationConversation = await OrganizationConversation.findById(req.params.id);
  if (!organizationConversation) {
    throw new HttpError('Organization conversation not found').NotFound();
  }
  await OrganizationConversation.findByIdAndDelete(req.params.id);
  res.status(204).end();
}, 'Failed to delete organization conversation');
