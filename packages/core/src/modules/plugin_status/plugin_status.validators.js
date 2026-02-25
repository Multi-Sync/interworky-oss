const Joi = require('joi');

const installSchema = Joi.object({
  organizationId: Joi.string().required().messages({
    'string.empty': 'Organization ID is required',
    'any.required': 'Organization ID is required',
  }),
  installationData: Joi.object({
    version: Joi.string().max(50).optional().messages({
      'string.max': 'Version cannot exceed 50 characters',
    }),
  }).optional(),
});

const heartbeatSchema = Joi.object({
  organizationId: Joi.string().required().messages({
    'string.empty': 'Organization ID is required',
    'any.required': 'Organization ID is required',
  }),
});

const organizationIdParamSchema = Joi.object({
  organizationId: Joi.string().required().messages({
    'string.empty': 'Organization ID is required',
    'any.required': 'Organization ID is required',
  }),
});

module.exports = {
  installSchema,
  heartbeatSchema,
  organizationIdParamSchema,
};
