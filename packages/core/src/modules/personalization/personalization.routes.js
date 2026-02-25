/**
 * Personalization Routes
 */
const express = require('express');
const router = express.Router();
const personalizationController = require('./personalization.controller');

// Public routes (called from assistant widget)
// These use organizationId from query/body instead of auth middleware

// Get cached personalization
// GET /api/personalization?visitorId=xxx&pageUrl=xxx&organizationId=xxx
router.get('/', personalizationController.getCachedPersonalization);

// Get pre-generated UTM variations (fast, for instant personalization)
// GET /api/personalization/variations?organizationId=xxx
router.get('/variations', personalizationController.getVariations);

// Register page schema
// POST /api/personalization/register
router.post('/register', personalizationController.registerPageSchema);

// Generate personalization
// POST /api/personalization/generate
router.post('/generate', personalizationController.generatePersonalization);

// Pre-generate variations for UTM campaigns
// POST /api/personalization/pre-generate
router.post('/pre-generate', personalizationController.preGenerateVariations);

// Store page schema for pre-generation
// POST /api/personalization/store-schema
router.post('/store-schema', personalizationController.storePageSchema);

// Get personalization by ID
// GET /api/personalization/:id
router.get('/:id', personalizationController.getPersonalizationById);

// Get analytics for organization
// GET /api/personalization/analytics/:organizationId
router.get('/analytics/:organizationId', personalizationController.getAnalytics);

// Delete personalization
// DELETE /api/personalization/:id
router.delete('/:id', personalizationController.deletePersonalization);

// Cleanup expired personalizations
// POST /api/personalization/cleanup
router.post('/cleanup', personalizationController.cleanupExpired);

module.exports = router;
