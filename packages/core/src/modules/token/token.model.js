// src/modules/token/token.model.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

/**
 * Token Transaction Model
 * Tracks all token movements for users and creators
 */
const tokenTransactionSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    // User who spent/received tokens
    user_id: {
      type: String,
      required: true,
      index: true,
    },
    // Transaction type
    type: {
      type: String,
      enum: [
        'signup_bonus',      // Initial 1M tokens on signup
        'flow_usage',        // Spent tokens on a flow
        'creator_earning',   // Earned tokens as flow creator
        'purchase',          // Bought tokens
        'refund',            // Refunded tokens
        'bonus',             // Promotional bonus
      ],
      required: true,
    },
    // Amount (positive for credit, negative for debit)
    amount: {
      type: Number,
      required: true,
    },
    // Balance after transaction
    balance_after: {
      type: Number,
      required: true,
    },
    // Related flow (for flow_usage and creator_earning)
    flow_id: {
      type: String,
      default: null,
      index: true,
    },
    // Flow session ID (for tracking specific usage)
    session_id: {
      type: String,
      default: null,
    },
    // Creator who earned (for flow_usage transactions)
    creator_id: {
      type: String,
      default: null,
      index: true,
    },
    // Additional metadata
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'token_transactions',
  }
);

// Indexes for efficient queries
tokenTransactionSchema.index({ user_id: 1, created_at: -1 });
tokenTransactionSchema.index({ creator_id: 1, created_at: -1 });
tokenTransactionSchema.index({ type: 1, created_at: -1 });

module.exports = mongoose.model('TokenTransaction', tokenTransactionSchema);
