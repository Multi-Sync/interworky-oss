const mongoose = require('mongoose');
const { Schema } = mongoose;

const organizationConversationSchema = new Schema(
  {
    organization_id: {
      type: String,
      required: true,
    },
    thread_id: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model('OrganizationConversation', organizationConversationSchema);
