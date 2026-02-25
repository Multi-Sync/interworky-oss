const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const organizationMethodSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    assistant_id: {
      type: String,
      required: false,
      index: true,
    },
    method_name: {
      type: String,
      required: true,
      index: true,
    },
    method_description: {
      type: String,
      required: true,
    },
    method_instruction: {
      type: String,
      required: true,
    },
    capability_type: {
      type: String,
      enum: ['http', 'email'],
      default: 'http',
      required: true,
      index: true,
    },
    // HTTP-specific fields (required only if capability_type is 'http')
    method_verb: {
      type: String,
      required: function () {
        return this.capability_type === 'http';
      },
      enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    },
    method_endpoint: {
      type: String,
      required: function () {
        return this.capability_type === 'http';
      },
    },
    // Email-specific configuration (required only if capability_type is 'email')
    email_config: {
      type: {
        to: {
          type: String,
          required: function () {
            return this.capability_type === 'email';
          },
        },
        subject: {
          type: String,
          required: function () {
            return this.capability_type === 'email';
          },
        },
        from_name: {
          type: String,
          default: 'Interworky Assistant',
        },
        template_type: {
          type: String,
          enum: ['simple', 'detailed'],
          default: 'simple',
        },
      },
      required: function () {
        return this.capability_type === 'email';
      },
      default: undefined,
    },
    fixed_params: {
      type: Array,
      default: [],
    },
    dynamic_params: {
      type: Array,
      default: [],
    },
    auth: {
      type: String,
    },
    public: {
      type: Boolean,
      default: false,
    },
    return: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'organization_methods',
  },
);

organizationMethodSchema.index({ organization_id: 1, method_name: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationMethod', organizationMethodSchema);
