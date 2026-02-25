// src/modules/assistant_info/assistant_info.controllers.js
const AssistantInfo = require('./assistant_info.model');
const HttpError = require('../../utils/HttpError');
const { asyncHandler } = require('../../utils/asyncHandler');
const Organization = require('../organization/organization.model');
const {
  deleteFileFromOrganizationBucket,
  createOrUpdateAssistantInfoJson,
  uploadFileToOrganizationBucket,
} = require('../../utils/gcp');
const { updateAssistantInfoOnOpenAI } = require('./assistant_info.utils');

exports.createAssistantInfo = asyncHandler(async (req, res) => {
  const organizationId = req.body.organization_id;
  const organization = await Organization.findOne({ id: organizationId });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  const assistantInfo = await AssistantInfo.create(req.body);

  // Create or Update the assistant-info.json file on GCP Cloud Storage (to be accessed by non-interworky clients)
  try {
    await createOrUpdateAssistantInfoJson(organizationId, req.body);
  } catch (error) {
    console.error('Failed to update assistant-info.json:', error);
  }

  res.status(201).json(assistantInfo);
});

exports.getAssistantInfo = asyncHandler(async (req, res, next) => {
  const assistantInfo = await AssistantInfo.findOne({ organization_id: req.params.organization_id });
  if (!assistantInfo) {
    return next(new HttpError('Assistant info not found').NotFound());
  }
  res.status(200).json(assistantInfo);
});

exports.getAllAssistantInfo = asyncHandler(async (req, res, next) => {
  const assistantInfo = await AssistantInfo.find();
  if (!assistantInfo) {
    return next(new HttpError('Assistant info not found').NotFound());
  }
  res.status(200).json(assistantInfo);
});

exports.updateAssistantInfo = asyncHandler(async (req, res, next) => {
  const organizationId = req.params.organization_id;

  try {
    // Find the current assistant info
    const currentAssistantInfo = await AssistantInfo.findOne({ organization_id: organizationId });
    if (!currentAssistantInfo) {
      return next(new HttpError('Assistant info not found').NotFound());
    }

    // Update the assistant info in the database
    const assistantInfo = await AssistantInfo.findOneAndUpdate({ organization_id: organizationId }, req.body, {
      new: true,
      runValidators: true,
    });
    if (!assistantInfo) {
      return next(new HttpError('Failed to update assistant info').InternalServerError());
    }

    // Update the assistant-info.json file on GCP Cloud Storage
    try {
      await createOrUpdateAssistantInfoJson(organizationId, assistantInfo.toObject());
    } catch (error) {
      console.error('Failed to update assistant-info.json on GCP:', error);
    }

    // Check if `assistant_knowledge` has changed, and train assistant if necessary
    if (req.body.assistant_knowledge && req.body.assistant_knowledge !== currentAssistantInfo.assistant_knowledge) {
      try {
        const organization = await Organization.findOne({ id: organizationId });
        if (!organization) {
          console.warn(`Organization not found for ID: ${organizationId}`);
        } else {
          const trainData = {
            assistantId: assistantInfo.assistant_id,
            instructions: assistantInfo.assistant_knowledge,
            domain: organization.organization_website,
          };
          const token = req.header('Authorization')?.split(' ')[1];
        }
      } catch (error) {
        console.error('Error during assistant training:', error);
      }
    }

    // Send the updated assistant info in response
    res.status(200).json(assistantInfo);
  } catch (error) {
    console.error('Error during updateAssistantInfo:', error);
    next(new HttpError('Internal server error').InternalServerError());
  }
});

exports.updateAssistantInfoImage = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  // Check for the uploaded file
  const file = req.file;
  if (!file) {
    throw new HttpError('No file uploaded').BadRequest();
  }

  // Upload the new image to the GCP Cloud Storage bucket
  const newImageUrl = await uploadFileToOrganizationBucket(organization_id, file.buffer, file.originalname);

  res.status(200).json({
    success: true,
    message: newImageUrl,
  });
});

exports.deleteAssistantInfo = asyncHandler(async (req, res, next) => {
  const assistantInfo = await AssistantInfo.findOneAndDelete({ organization_id: req.params.organization_id });
  if (!assistantInfo) {
    return next(new HttpError('Assistant info not found', 404));
  }
  res.status(204).send();
});
