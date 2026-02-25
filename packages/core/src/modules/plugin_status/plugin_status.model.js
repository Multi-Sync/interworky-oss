const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const sendSlackMessage = require('../../utils/slackCVP');

const PluginStatusSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    organizationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },

    isInstalled: {
      type: Boolean,
      default: false,
    },

    installation: {
      websiteUrl: String,
      installationDate: Date,
      lastVerified: Date,
      version: String,
    },

    lastHeartbeat: Date,
    isResponding: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    collection: 'plugin_status',
  },
);

// Indexes for performance
PluginStatusSchema.index({ lastHeartbeat: -1 });
PluginStatusSchema.index({ isInstalled: 1 });

// Instance methods
PluginStatusSchema.methods.updateInstallationStatus = function (organizationWebsite, installationData = {}) {
  this.isInstalled = true;
  this.installation.websiteUrl = organizationWebsite;
  this.installation.installationDate = this.installation.installationDate || new Date();
  this.installation.lastVerified = new Date();
  this.installation.version = installationData.version || null;
  this.lastHeartbeat = new Date();
  this.isResponding = true;
};

PluginStatusSchema.methods.updateHeartbeat = function () {
  this.lastHeartbeat = new Date();
  this.isResponding = true;
  if (!this.isInstalled) {
    this.isInstalled = true;
  }
};

PluginStatusSchema.methods.markUnresponsive = function () {
  this.isResponding = false;
};

PluginStatusSchema.on('afterSave', async doc => {
  console.log(`PluginStatus document saved for organizationId: ${doc.organizationId}`);
  // website added interworky integration
  const msg = `💥 Plugin added on website: ${doc.installation.websiteUrl} 🚀`;
  await sendSlackMessage(msg);
});

module.exports = mongoose.model('PluginStatus', PluginStatusSchema);
