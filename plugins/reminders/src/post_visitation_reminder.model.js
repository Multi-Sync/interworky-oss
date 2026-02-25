// models/PostVisitationReminder.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const postVisitationReminderSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    patient_id: {
      type: String,
      required: true,
    },
    appointment_id: {
      type: String,
      required: true,
    },
    scheduled_at: {
      type: Date,
      required: true,
    },
    method: {
      type: String,
      required: true,
      enum: ['Email', 'SMS', 'Web'],
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'post_visitation_reminders',
  },
);

module.exports = mongoose.model('PostVisitationReminder', postVisitationReminderSchema);
