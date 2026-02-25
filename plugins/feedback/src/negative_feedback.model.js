// models/NegativeFeedback.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const negativeFeedbackSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    post_visitation_id: {
      type: String,
      required: true,
    },
    patient_id: {
      type: String,
      required: true,
    },
    appt_id: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'negative_feedbacks',
  },
);

module.exports = mongoose.model('NegativeFeedback', negativeFeedbackSchema);
