const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');

/**
 * CVE Alert Model
 *
 * Stores security vulnerability alerts for organizations.
 * Created when a CVE is detected that affects an org's dependencies.
 * Updated by WS-Assistant when PR is created.
 */
const cveAlertSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },

    // CVE Information
    cve_id: {
      type: String,
      required: true,
      index: true,
    },
    ghsa_id: {
      type: String,
    },

    // Package Information
    package_name: {
      type: String,
      required: true,
    },
    installed_version: {
      type: String,
    },
    patched_version: {
      type: String,
    },

    // Severity & Description
    severity: {
      type: String,
      enum: ['critical', 'high', 'medium', 'low'],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 2000,
    },

    // Status tracking
    status: {
      type: String,
      enum: [
        'pending',      // Alert created, not yet processed
        'notified',     // Sent to WS-Assistant
        'fixing',       // WS-Assistant is working on it
        'resolved',     // PR created successfully
        'failed',       // Fix attempt failed
        'ignored',      // User chose to ignore
      ],
      default: 'pending',
      index: true,
    },

    // Timestamps
    notified_at: {
      type: Date,
    },
    resolved_at: {
      type: Date,
    },

    // WS-Assistant integration
    scan_triggered: {
      type: Boolean,
      default: false,
    },

    // PR Information (set by WS-Assistant callback)
    pr_created: {
      type: Boolean,
      default: false,
    },
    pr_url: {
      type: String,
    },
    pr_number: {
      type: Number,
    },

    // Error tracking (if fix failed)
    error_message: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'cve_alerts',
  },
);

// Compound indexes
cveAlertSchema.index({ organization_id: 1, cve_id: 1 }, { unique: true });
cveAlertSchema.index({ organization_id: 1, status: 1, created_at: -1 });
cveAlertSchema.index({ status: 1, created_at: -1 });

// TTL - keep alerts for 180 days
cveAlertSchema.index({ created_at: 1 }, { expireAfterSeconds: 180 * 24 * 60 * 60 });

/**
 * Security Scan Model (simplified)
 *
 * Optional: Stores scan results for historical tracking.
 * Not used in the main flow (CVE check → WS-Assistant).
 */
const securityScanSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
      index: true,
    },
    organization_id: {
      type: String,
      required: true,
      index: true,
    },
    github_repo_full_name: {
      type: String,
      required: true,
    },
    scan_type: {
      type: String,
      enum: ['scheduled', 'manual'],
      default: 'scheduled',
    },
    scan_status: {
      type: String,
      enum: ['completed', 'failed'],
      default: 'completed',
    },
    vulnerabilities_found: {
      type: Number,
      default: 0,
    },
    fixes_sent: {
      type: Number,
      default: 0,
    },
    error_message: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'security_scans',
  },
);

// TTL - keep scans for 90 days
securityScanSchema.index({ created_at: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

module.exports = {
  CVEAlert: mongoose.model('CVEAlert', cveAlertSchema),
  SecurityScan: mongoose.model('SecurityScan', securityScanSchema),
};
