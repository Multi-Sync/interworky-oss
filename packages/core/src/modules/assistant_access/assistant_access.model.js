const mongoose = require('mongoose');
const { Schema } = mongoose;

const assistantAccessSchema = new Schema(
  {
    assistant_id: {
      type: String,
      required: true,
    },
    table_name: {
      type: String,
      required: true,
    },
    access_level: {
      type: Number,
      required: true,
      enum: [0, 1, 2], // 0: read, 1: write, 2: readwrite
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'assistant_access',
  },
);

module.exports = mongoose.model('AssistantAccess', assistantAccessSchema);
