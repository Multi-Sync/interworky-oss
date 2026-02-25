const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const OrganizationMethod = require('./organization_methods.model');
const OrganizationAssistants = require('../organization_assistants/organization_assistants.model');
const { updateAssistantFunctions } = require('./organization_methods.utils');
const { generateCapability } = require('./capabilityGeneratorAgent');

// Create a new organization method
exports.createOrganizationMethod = asyncHandler(async (req, res) => {
  // Create a new organization method in the database
  try {
    // Check capability limit (50) before creating
    const capabilityLimit = 50;
    const existingCount = await OrganizationMethod.countDocuments({ organization_id: req.body.organization_id });

    if (existingCount >= capabilityLimit) {
      throw new HttpError(
        `Capability limit reached. You can have a maximum of ${capabilityLimit} custom capabilities. Having too many tools can confuse the AI agent about which one to use.`,
      ).BadRequest();
    }

    const method = await OrganizationMethod.create(req.body);

    //dont call this if its imported as a module
    if (process.env.NODE_ENV === 'test') {
      return res.status(201).json({ method });
    }

    const organizationMethods = await OrganizationMethod.find({ organization_id: method.organization_id });

    // Check if we're approaching OpenAI's 128 tool limit
    const toolsLimit = 128;
    const warning =
      organizationMethods.length > toolsLimit
        ? `Warning: You have ${organizationMethods.length} capabilities. OpenAI assistants support a maximum of ${toolsLimit} tools. Only the first ${toolsLimit} will be available to the assistant.`
        : null;

    // Only pass the first 128 methods to OpenAI (their limit)
    const methodsForOpenAI = organizationMethods.slice(0, toolsLimit);

    // Update the assistant functions with limited set
    try {
      const updateResult = await updateAssistantFunctions(req.body.assistant_id, methodsForOpenAI);

      if (!updateResult) {
        console.warn('Failed to update assistant functions, but capability was saved to database');
      }
    } catch (updateError) {
      console.error('Error updating assistant functions:', updateError.message);
      // Don't fail the whole operation - the capability is saved in DB
    }

    res.status(201).json({ method, warning });
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(`Method with name ${req.body.method_name} already exists`).Conflict();
    }
    throw error;
  }
}, 'Failed to create organization method');

exports.createBulkOrganizationMethod = asyncHandler(async (req, res) => {
  try {
    const { organization_id, methods } = req.body;

    // Validate that organization_id is provided
    if (!organization_id) {
      throw new HttpError('Organization ID is required').BadRequest();
    }

    // Check capability limit (50) before bulk creating
    const capabilityLimit = 50;
    const existingCount = await OrganizationMethod.countDocuments({ organization_id });

    if (existingCount + methods.length > capabilityLimit) {
      const remaining = capabilityLimit - existingCount;
      throw new HttpError(
        `Capability limit exceeded. You can add ${remaining} more capabilities (limit: ${capabilityLimit}). Having too many tools can confuse the AI agent about which one to use.`,
      ).BadRequest();
    }
    // Prepare methods for insertion
    const methodsToInsert = methods.map(method => ({
      ...method,
      organization_id,
      assistant_id: method.assistant_id || null, // Optional assistant_id
    }));

    // Use upsert logic to handle existing methods
    const upsertedMethods = [];
    for (const method of methodsToInsert) {
      try {
        // Try to find existing method by organization_id and method_name
        const existingMethod = await OrganizationMethod.findOne({
          organization_id: method.organization_id,
          method_name: method.method_name,
        });

        if (existingMethod) {
          // Update existing method
          const updatedMethod = await OrganizationMethod.findByIdAndUpdate(existingMethod._id, method, {
            new: true,
            runValidators: true,
          });
          upsertedMethods.push(updatedMethod);
        } else {
          // Create new method
          const newMethod = await OrganizationMethod.create(method);
          upsertedMethods.push(newMethod);
        }
      } catch (error) {
        console.error(`Error processing method ${method.method_name}:`, error.message);
        throw error;
      }
    }

    // For testing, return early.
    if (process.env.NODE_ENV === 'test') {
      return res.status(201).json({ methods: upsertedMethods });
    }

    // Retrieve all organization methods for this organization.
    const organizationMethods = await OrganizationMethod.find({
      organization_id,
    });

    // Check OpenAI's 128 tool limit
    const toolsLimit = 128;
    const warning =
      organizationMethods.length > toolsLimit
        ? `Warning: You have ${organizationMethods.length} capabilities. OpenAI assistants support a maximum of ${toolsLimit} tools. Only the first ${toolsLimit} will be available to the assistant.`
        : null;

    // Update assistant functions if assistant_id is provided in any method
    const assistantId = methods.find(m => m.assistant_id)?.assistant_id;
    if (assistantId) {
      try {
        // Only pass first 128 to OpenAI
        const methodsForOpenAI = organizationMethods.slice(0, toolsLimit);
        const updateResult = await updateAssistantFunctions(assistantId, methodsForOpenAI);
        if (!updateResult) {
          console.warn('Failed to update assistant functions, but keeping methods');
        }
      } catch (error) {
        console.warn('Error updating assistant functions:', error.message);
        // Don't fail the entire operation for assistant function update errors
      }
    }

    res.status(201).json({ methods: upsertedMethods, warning });
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(`Method with a mentioned name already exists`).Conflict();
    }
    throw error;
  }
}, 'Failed to create bulk organization method');

// Update an organization method
exports.updateOrganizationMethod = asyncHandler(async (req, res) => {
  try {
    const method = await OrganizationMethod.findOneAndUpdate({ id: req.params.id }, req.body, { new: true });
    if (!method) throw new HttpError('Method not found').NotFound();

    //dont call this if its imported as a module
    if (process.env.NODE_ENV === 'test') {
      return res.status(200).json(method);
    }

    const organizationMethods = await OrganizationMethod.find({ organization_id: method.organization_id });

    // Update the assistant functions with limit handling
    try {
      const toolsLimit = 128;
      const methodsForOpenAI = organizationMethods.slice(0, toolsLimit);
      const updateResult = await updateAssistantFunctions(method.assistant_id, methodsForOpenAI);

      if (!updateResult) {
        console.warn('Failed to update assistant functions');
      }
    } catch (updateError) {
      console.error('Error updating assistant functions:', updateError.message);
      // Don't fail the operation
    }

    res.status(200).json(method);
  } catch (error) {
    if (error.code === 11000) {
      throw new HttpError(`Method with name ${req.body.method_name} already exists`).Conflict();
    }
    throw error;
  }
}, 'Failed to update organization method');

// Delete an organization method
exports.deleteOrganizationMethod = asyncHandler(async (req, res) => {
  const method = await OrganizationMethod.findOneAndDelete({ id: req.params.id });
  if (!method) throw new HttpError('Method not found').NotFound();

  //dont call this if its imported as a module
  if (process.env.NODE_ENV === 'test') {
    return res.status(204).json();
  }

  const organizationMethods = await OrganizationMethod.find({ organization_id: method.organization_id });

  // Update the assistant functions with limit handling
  try {
    const toolsLimit = 128;
    const methodsForOpenAI = organizationMethods.slice(0, toolsLimit);
    const updateResult = await updateAssistantFunctions(method.assistant_id, methodsForOpenAI);

    if (!updateResult) {
      console.warn('Failed to update assistant functions');
    }
  } catch (updateError) {
    console.error('Error updating assistant functions:', updateError.message);
    // Don't fail the operation
  }

  res.status(204).json();
}, 'Failed to delete organization method');

// Get organization methods by organization ID
exports.getOrganizationMethods = asyncHandler(async (req, res) => {
  const methods = await OrganizationMethod.find({ organization_id: req.params.organization_id });
  res.status(200).json(methods);
}, 'Failed to get organization methods');

// Get public organization methods
exports.getPublicOrganizationMethods = asyncHandler(async (req, res) => {
  const methods = await OrganizationMethod.find({ public: true });
  res.status(200).json(methods);
}, 'Failed to get public organization methods');

// Generate capability from natural language description
exports.generateCapabilityFromDescription = asyncHandler(async (req, res) => {
  const { description, organization_email } = req.body;

  if (!description) {
    throw new HttpError('Description is required').BadRequest();
  }

  try {
    // Enhance the description with context if organization email is provided
    let enhancedDescription = description;
    if (organization_email) {
      enhancedDescription += `. If this is an email capability, use ${organization_email} as the recipient email.`;
    }

    // Generate capability using AI agent
    const generatedCapability = await generateCapability(enhancedDescription);

    // Ensure all required fields are present with defaults
    generatedCapability.return = generatedCapability.return || {};
    generatedCapability.fixed_params = generatedCapability.fixed_params || [];
    generatedCapability.dynamic_params = generatedCapability.dynamic_params || [];

    // Remove the reasoning field (internal to AI, not needed in response)
    delete generatedCapability.reasoning;

    res.status(200).json({
      success: true,
      capability: generatedCapability,
      message: 'Capability generated successfully',
    });
  } catch (error) {
    console.error('Error generating capability:', error);
    throw new HttpError(`Failed to generate capability: ${error.message}`).InternalServerError();
  }
}, 'Failed to generate capability from description');

// Execute capability (HTTP or Email)
exports.executeCapability = asyncHandler(async (req, res) => {
  const { method_id, params } = req.body;

  if (!method_id) {
    throw new HttpError('method_id is required').BadRequest();
  }

  if (!params || typeof params !== 'object') {
    throw new HttpError('params must be an object').BadRequest();
  }

  try {
    // Fetch the capability from database
    const capability = await OrganizationMethod.findOne({ id: method_id });

    if (!capability) {
      throw new HttpError('Capability not found').NotFound();
    }

    // Execute using CapabilityExecutor service
    const executor = require('./organization_methods.executor');
    const result = await executor.execute(capability, params);

    res.status(200).json(result);
  } catch (error) {
    console.error('Error executing capability:', error);
    throw new HttpError(`Failed to execute capability: ${error.message}`).InternalServerError();
  }
}, 'Failed to execute capability');
