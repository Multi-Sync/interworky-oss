const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Organization Version Control Schema
 * Stores GitHub App installation data for organizations to enable automated PR creation
 * Uses GitHub Apps for secure, repository-scoped access
 */
const organizationVersionControlSchema = new Schema(
  {
    organization_id: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // GitHub App Installation Data
    github_app_installation_id: {
      type: String,
      required: true,
      index: true,
    },
    github_app_installation_account_id: {
      type: String,
      required: true,
    },
    github_app_installation_account_login: {
      type: String,
      required: true,
    },
    github_app_installation_target_type: {
      type: String,
      enum: ['User', 'Organization'],
      required: true,
    },
    // Repository Information
    github_repo_owner: {
      type: String,
      required: true,
    },
    github_repo_name: {
      type: String,
      required: true,
    },
    github_repo_id: {
      type: Number,
      required: true,
    },
    github_repo_full_name: {
      type: String,
      required: true,
    },
    // Permissions
    has_write_access: {
      type: Boolean,
      default: false,
    },
    permissions: {
      type: Map,
      of: String,
      default: {},
    },
    // Pull Request Information
    pr_url: {
      type: String,
      default: null,
    },
    pr_number: {
      type: Number,
      default: null,
    },
    pr_created_at: {
      type: Date,
      default: null,
    },
    // Repository Knowledge Base
    repository_knowledge: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      description: 'Pre-analyzed repository structure and patterns for error fixing',
    },
    repository_knowledge_analyzed_at: {
      type: Date,
      default: null,
      description: 'Timestamp when repository was last analyzed',
    },
    // Repository Snapshot (Repomix)
    repo_snapshot_url: {
      type: String,
      default: null,
      description: 'GCP URL to repository snapshot XML file',
    },
    repo_snapshot_status: {
      type: String,
      enum: ['pending', 'generating', 'ready', 'failed', 'outdated'],
      default: 'pending',
      description: 'Status of the repository snapshot',
    },
    repo_snapshot_generated_at: {
      type: Date,
      default: null,
      description: 'Timestamp when snapshot was last generated',
    },
    repo_snapshot_token_count: {
      type: Number,
      default: null,
      description: 'Estimated token count of the snapshot',
    },
    repo_snapshot_file_count: {
      type: Number,
      default: null,
      description: 'Number of files included in snapshot',
    },
    repo_snapshot_size_bytes: {
      type: Number,
      default: null,
      description: 'Size of snapshot file in bytes',
    },
    repo_snapshot_commit_sha: {
      type: String,
      default: null,
      description: 'Git commit SHA the snapshot was generated from',
    },
    repo_snapshot_branch: {
      type: String,
      default: null,
      description: 'Branch the snapshot was generated from',
    },
    repo_snapshot_error: {
      type: String,
      default: null,
      description: 'Error message if snapshot generation failed',
    },
    // Auto-Fix Configuration
    auto_fix_enabled: {
      type: Boolean,
      default: false,
      description: 'Enable automatic error fixing with AI (creates PRs/issues)',
    },
    // Timestamps
    connected_at: {
      type: Date,
      default: Date.now,
    },
    last_used_at: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'organization_version_control',
  },
);

// Method to update last used timestamp
organizationVersionControlSchema.methods.updateLastUsed = function () {
  this.last_used_at = new Date();
  return this.save();
};

// JSON serialization settings
organizationVersionControlSchema.set('toJSON', {
  virtuals: false,
  transform: function (doc, ret) {
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('OrganizationVersionControl', organizationVersionControlSchema);
