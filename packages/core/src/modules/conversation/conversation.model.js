const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const MessageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['assistant', 'owner', 'user'],
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  reaction: {
    type: Number,
    default: null, // 0 => null (No reaction), 1 => Like, 2 => Dislike
  },
  metadata: {
    type: Object,
  },
  id: {
    type: String,
    required: true,
    default: uuidv4,
    index: true,
    unique: true,
  },
});

const ConversationSchema = new mongoose.Schema(
  {
    organizationId: {
      type: String,
      required: true,
    },
    patientId: {
      type: String,
      required: true,
      index: true,
    },
    id: {
      type: String,
      required: true,
      default: uuidv4,
      index: true,
      unique: true,
    },
    messages: [MessageSchema],
    isClosed: {
      type: Boolean,
      default: false,
    },
    sentToOwner: {
      type: Boolean,
      default: false,
    },
    dashboardConversation: {
      type: Boolean,
      default: false,
      index: true,
    },
    // New fields for multi-conversation support
    title: {
      type: String,
      default: 'New Conversation',
    },
    conversationType: {
      type: String,
      enum: ['visitor', 'dashboard-carla'],
      default: 'visitor',
    },
    metadata: {
      firstMessage: String,
      messageCount: Number,
      tags: [String],
      lastMessageRole: String,
    },
  },
  { timestamps: true },
);

// Add compound index for efficient conversation queries
ConversationSchema.index({
  organizationId: 1,
  patientId: 1,
  dashboardConversation: 1,
  isClosed: 1,
  updatedAt: -1,
});

const Conversation = mongoose.model('Conversation', ConversationSchema);

module.exports = Conversation;
