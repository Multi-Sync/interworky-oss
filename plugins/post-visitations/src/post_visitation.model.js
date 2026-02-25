// models/PostVisitation.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

const postVisitationSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    appointment_id: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 0,
      max: 5,
    },
    what_was_good: {
      type: String,
      default: '',
    },
    what_was_bad: {
      type: String,
      default: '',
    },
    would_you_recommend: {
      type: String,
      default: '',
    },
    can_we_add_you_as_a_happy_customer_on_our_social_website: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'post_visitations',
  },
);

module.exports = mongoose.model('PostVisitation', postVisitationSchema);
