const express = require('express');
const router = express.Router();
const {
  reportError,
  reportBatch,
  getErrors,
  getErrorStats,
  resolveError,
  getErrorById,
  getRecentErrors,
  fixWithCarla,
  updateErrorStatus,
  deleteError,
  // getFixProgress,
  // Performance Metrics
  reportMetrics,
  getMetrics,
  getMetricsSummary,
  getMetricsById,
} = require('./performance_monitoring.controller');
const authenticateToken = require('../../middlewares/auth.middleware');

/**
 * Performance Monitoring Routes
 *
 * Provides RESTful API endpoints for performance monitoring operations.
 * All routes follow the existing interworky-core patterns and conventions.
 */

// Error reporting endpoints
router.post('/errors', authenticateToken, reportError);
router.post('/errors/batch', authenticateToken, reportBatch);

// Error retrieval endpoints
router.get('/errors', authenticateToken, getErrors);
router.get('/errors/:id', authenticateToken, getErrorById);
router.get('/recent', authenticateToken, getRecentErrors);

// Statistics and analytics
router.get('/stats', authenticateToken, getErrorStats);

// Error management
router.put('/errors/:id/resolve', authenticateToken, resolveError);
router.put('/errors/:id/status', authenticateToken, updateErrorStatus);
router.post('/errors/:id/fix-with-carla', authenticateToken, fixWithCarla);
router.delete('/errors/:id', authenticateToken, deleteError);
// router.get('/errors/:id/fix-progress', authenticateToken, getFixProgress);

// Performance Metrics endpoints
router.post('/metrics', authenticateToken, reportMetrics);
router.get('/metrics', authenticateToken, getMetrics);
router.get('/metrics/summary', authenticateToken, getMetricsSummary);
router.get('/metrics/:id', authenticateToken, getMetricsById);

module.exports = router;
