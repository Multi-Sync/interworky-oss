const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const invitationSchema = new Schema(
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
    invited_by_user_id: {
      type: String,
      required: true,
    },
    invitee_email: {
      type: String,
      required: false,
    },
    invitee_phone: {
      type: String,
      required: false,
    },
    invite_code: {
      type: String,
      unique: true,
      index: true,
      default: () => crypto.randomBytes(6).toString('hex'),
    },
    invite_link: {
      type: String,
    },
    channel: {
      type: String,
      enum: ['email', 'sms', 'link', 'contacts'],
      default: 'link',
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      default: 'member',
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'expired', 'cancelled'],
      default: 'pending',
    },
    accepted_by_user_id: {
      type: String,
    },
    expires_at: {
      type: Date,
      default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'invitations',
  },
);

module.exports = mongoose.model('Invitation', invitationSchema);
