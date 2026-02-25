// models/SocialMediaReviewReminder.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const socialMediaReviewReminderSchema = new Schema(
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
    collection: 'social_media_review_reminders',
  },
);

module.exports = mongoose.model('SocialMediaReviewReminder', socialMediaReviewReminderSchema);
