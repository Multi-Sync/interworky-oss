const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const assistantDataSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    name: {
      type: String,
      required: true,
    },
    image_url: {
      type: String,
      required: true,
    },
    opening_statement: {
      type: String,
      required: true,
    },
    personality: {
      type: String,
      required: true,
    },
    type: {
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
    collection: 'assistant_data',
  },
);

module.exports = mongoose.model('AssistantData', assistantDataSchema);
