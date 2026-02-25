const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const PluginStatus = require('../plugin_status/plugin_status.model');

// Define the user subdocument schema
const userSchema = new Schema(
  {
    userId: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['admin', 'member'],
      required: true,
    },
  },
  { _id: false },
);

const organizationSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    creator_user_id: {
      type: String,
      required: true,
    },
    organization_name: {
      type: String,
      required: true,
    },
    organization_website: {
      type: String,
      required: true,
    },
    message_count: {
      type: Number,
      default: 0,
    },
    onboarding_step: {
      type: String,
      enum: ['setup', 'plugin', 'complete'],
      default: 'setup',
    },
    users: [userSchema],
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'organizations',
  },
);

// Create an index for userId in the users subdocument.
organizationSchema.index({ 'users.userId': 1 });

// Function to sanitize organization_name
const sanitizeName = name => {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-'); // Replace non-alphanumeric characters with '-'
};

// Pre-save hook to ensure organization_name is unique
organizationSchema.pre('save', async function () {
  if (this.isModified('organization_name')) {
    let baseName = sanitizeName(this.organization_name);
    let newName = baseName;
    let count = 0;
    const Organization = this.constructor;

    while (await Organization.findOne({ organization_name: newName, _id: { $ne: this._id } })) {
      count++;
      newName = `${baseName}-${count}`;
    }

    this.organization_name = newName;
  }
});

// Pre-findOneAndUpdate hook to handle organization_name updates similarly.
organizationSchema.pre('findOneAndUpdate', async function () {
  const update = this.getUpdate();
  if (update.organization_name) {
    let baseName = sanitizeName(update.organization_name);
    let newName = baseName;
    let count = 0;
    const Organization = mongoose.model('Organization');

    while (await Organization.findOne({ organization_name: newName, _id: { $ne: this.getQuery()._id } })) {
      count++;
      newName = `${baseName}-${count}`;
    }

    update.organization_name = newName;
    this.setUpdate(update);
  }
});

// Post-save hook to reset plugin status when organization_website is modified
organizationSchema.post('save', async function (doc) {
  // Check if organization_website was modified
  if (this.isModified('organization_website')) {
    try {
      // Reset plugin status to not connected
      await PluginStatus.findOneAndUpdate(
        { organizationId: doc.id },
        {
          isInstalled: false,
          isResponding: false,
          installation: {
            websiteUrl: null,
            installationDate: null,
            lastVerified: null,
            version: null,
          },
          lastHeartbeat: null,
        },
        { new: true },
      );
      console.log(`Plugin status reset for organization ${doc.id} due to website update`);
    } catch (error) {
      console.error(`Failed to reset plugin status for organization ${doc.id}:`, error);
    }
  }
});

// Post-findOneAndUpdate hook to reset plugin status when organization_website is updated
organizationSchema.post('findOneAndUpdate', async function (doc) {
  if (!doc) return;

  const update = this.getUpdate();
  // Check if organization_website was updated
  if (update.organization_website || update.$set?.organization_website) {
    try {
      // Reset plugin status to not connected
      await PluginStatus.findOneAndUpdate(
        { organizationId: doc.id },
        {
          isInstalled: false,
          isResponding: false,
          installation: {
            websiteUrl: null,
            installationDate: null,
            lastVerified: null,
            version: null,
          },
          lastHeartbeat: null,
        },
        { new: true },
      );
      console.log(`Plugin status reset for organization ${doc.id} due to website update`);
    } catch (error) {
      console.error(`Failed to reset plugin status for organization ${doc.id}:`, error);
    }
  }
});

module.exports = mongoose.model('Organization', organizationSchema);
