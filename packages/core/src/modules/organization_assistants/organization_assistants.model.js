// src/modules/organization_assistants/organization_assistants.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const organizationAssistantsSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    organization_id: {
      type: String,
      required: true,
    },
    assistant_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'organization_assistants',
  },
);

organizationAssistantsSchema.index({ organization_id: 1, assistant_id: 1 }, { unique: true });

module.exports = mongoose.model('OrganizationAssistants', organizationAssistantsSchema);
