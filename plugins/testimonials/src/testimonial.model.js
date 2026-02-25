const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const testimonialSchema = new Schema(
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
    collection: 'testimonials',
  },
);

module.exports = mongoose.model('Testimonial', testimonialSchema);
