const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const ConversionConfigSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    conversion_name: {
      type: String,
      required: true,
    },
    element_selector: {
      type: String,
      required: true,
    },
    element_description: {
      type: String,
      required: false,
    },
    element_text: {
      type: String,
    },
    page_url: {
      type: String,
      required: false,
    },
    confidence_score: {
      type: Number,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    verified: {
      type: Boolean,
      default: false,
    },
    validation_failures: [
      {
        page_url: String,
        selector: String,
        error_message: String,
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'conversion_configs',
  },
);

// Index for faster queries
ConversionConfigSchema.index({ organization_id: 1, status: 1 });

module.exports = mongoose.model('ConversionConfig', ConversionConfigSchema);
