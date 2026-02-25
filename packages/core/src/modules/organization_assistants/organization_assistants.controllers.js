// src/modules/organization_assistants/organization_assistants.controllers.js
const OrganizationAssistants = require('./organization_assistants.model');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');

// Create a new organization-assistant link
exports.createOrganizationAssistant = asyncHandler(async (req, res) => {
  const { organization_id, assistant_id } = req.body;

  const organizationAssistant = await OrganizationAssistants.create({ organization_id, assistant_id });
  res.status(201).json({ organizationAssistant });
}, 'Failed to create organization-assistant link');

// List all organization-assistant links
exports.listOrganizationsAssistants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const organizationAssistants = await OrganizationAssistants.find();

  const totalOrganizationAssistants = await OrganizationAssistants.countDocuments();

  res.status(200).json({
    total: totalOrganizationAssistants,
    page: pageNumber,
    limit: limitNumber,
    organizationAssistants,
  });
}, 'Failed to list organization-assistant links');

// Delete an organization-assistant link by ID
exports.deleteOrganizationAssistant = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const organizationAssistant = await OrganizationAssistants.findOneAndDelete({ id });

  if (!organizationAssistant) {
    throw new HttpError('Organization-assistant link not found').NotFound();
  }

  res.status(204).send();
}, 'Failed to delete organization-assistant link');

exports.listOrganizationAssistants = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const query = {};
  if (organization_id) {
    query.organization_id = organization_id;
  }

  const organizationAssistants = await OrganizationAssistants.find(query);

  const totalOrganizationAssistants = await OrganizationAssistants.countDocuments(query);

  res.status(200).json({
    total: totalOrganizationAssistants,
    organizationAssistants,
  });
}, 'Failed to list organization-assistant links');
