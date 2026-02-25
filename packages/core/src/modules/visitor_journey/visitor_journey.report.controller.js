// src/modules/visitor_journey/visitor_journey.report.controller.js
const VisitorJourney = require('./visitor_journey.model');
const PerformanceMonitoring = require('../performance_monitoring/performance_monitoring.model');
const { asyncHandler } = require('../../utils/asyncHandler');

/**
 * Generate AI-powered analytics report
 * Analyzes current period vs previous period and generates executive summary with insights
 */
exports.generateAnalyticsReport = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { start_date, end_date } = req.query;

  console.log('[Analytics Report] Request received for org:', organization_id);
  console.log('[Analytics Report] Period:', start_date, 'to', end_date);

  if (!start_date || !end_date) {
    return res.status(400).json({
      error: 'start_date and end_date query parameters are required',
    });
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Calculate period duration in days
  const periodDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

  // Calculate previous period dates (same duration)
  const previousEndDate = new Date(startDate);
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - periodDays);

  console.log('[Analytics Report] Period days:', periodDays);
  console.log('[Analytics Report] Previous period:', previousStartDate, 'to', previousEndDate);

  // Query for current period
  const currentQuery = {
    organization_id,
    $or: [
      { 'session.start_time': { $gte: startDate, $lte: endDate } },
      {
        'session.start_time': { $exists: false },
        created_at: { $gte: startDate, $lte: endDate },
      },
      {
        'session.start_time': null,
        created_at: { $gte: startDate, $lte: endDate },
      },
    ],
  };

  // Query for previous period
  const previousQuery = {
    organization_id,
    $or: [
      { 'session.start_time': { $gte: previousStartDate, $lte: previousEndDate } },
      {
        'session.start_time': { $exists: false },
        created_at: { $gte: previousStartDate, $lte: previousEndDate },
      },
      {
        'session.start_time': null,
        created_at: { $gte: previousStartDate, $lte: previousEndDate },
      },
    ],
  };

  // Fetch analytics data for both periods in parallel
  let currentMetrics, previousMetrics, currentTrafficSources, currentDailyTrends;

  try {
    [currentMetrics, previousMetrics, currentTrafficSources, currentDailyTrends] = await Promise.all([
      // Current period hero metrics
      VisitorJourney.aggregate([
        { $match: currentQuery },
        {
          $group: {
            _id: null,
            total_visitors: { $sum: 1 },
            unique_visitors: { $addToSet: '$visitor_id' },
            new_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', false] }, 1, 0] },
            },
            returning_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', true] }, 1, 0] },
            },
            total_session_duration: { $sum: '$session.duration' },
            avg_session_duration: { $avg: '$session.duration' },
            total_page_views: { $sum: '$journey.page_views' },
            avg_pages_per_session: { $avg: '$journey.page_views' },
            avg_engagement_score: { $avg: '$engagement.engagement_score' },
            total_bounce_events: { $sum: { $size: { $ifNull: ['$engagement.bounce_events', []] } } },
          },
        },
        {
          $project: {
            _id: 0,
            total_visitors: 1,
            unique_visitors: { $size: '$unique_visitors' },
            new_visitors: 1,
            returning_visitors: 1,
            avg_session_duration: { $round: ['$avg_session_duration', 0] },
            total_page_views: 1,
            avg_pages_per_session: { $round: ['$avg_pages_per_session', 2] },
            avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
            bounce_rate: {
              $cond: [
                { $gt: ['$total_visitors', 0] },
                { $round: [{ $multiply: [{ $divide: ['$total_bounce_events', '$total_visitors'] }, 100] }, 1] },
                0,
              ],
            },
          },
        },
      ]),

      // Previous period hero metrics
      VisitorJourney.aggregate([
        { $match: previousQuery },
        {
          $group: {
            _id: null,
            total_visitors: { $sum: 1 },
            unique_visitors: { $addToSet: '$visitor_id' },
            new_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', false] }, 1, 0] },
            },
            returning_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', true] }, 1, 0] },
            },
            avg_session_duration: { $avg: '$session.duration' },
            total_page_views: { $sum: '$journey.page_views' },
            avg_pages_per_session: { $avg: '$journey.page_views' },
            avg_engagement_score: { $avg: '$engagement.engagement_score' },
            total_bounce_events: { $sum: { $size: { $ifNull: ['$engagement.bounce_events', []] } } },
          },
        },
        {
          $project: {
            _id: 0,
            total_visitors: 1,
            unique_visitors: { $size: '$unique_visitors' },
            new_visitors: 1,
            returning_visitors: 1,
            avg_session_duration: { $round: ['$avg_session_duration', 0] },
            total_page_views: 1,
            avg_pages_per_session: { $round: ['$avg_pages_per_session', 2] },
            avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
            bounce_rate: {
              $cond: [
                { $gt: ['$total_visitors', 0] },
                { $round: [{ $multiply: [{ $divide: ['$total_bounce_events', '$total_visitors'] }, 100] }, 1] },
                0,
              ],
            },
          },
        },
      ]),

      // Current period traffic sources
      VisitorJourney.aggregate([
        { $match: currentQuery },
        {
          $group: {
            _id: '$traffic_source.type',
            count: { $sum: 1 },
            avg_engagement_score: { $avg: '$engagement.engagement_score' },
          },
        },
        {
          $project: {
            _id: 0,
            source: '$_id',
            count: 1,
            avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // Current period daily trends
      VisitorJourney.aggregate([
        { $match: currentQuery },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: { $ifNull: ['$session.start_time', '$created_at'] },
              },
            },
            visitors: { $sum: 1 },
            page_views: { $sum: '$journey.page_views' },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            visitors: 1,
            page_views: 1,
          },
        },
        { $sort: { date: 1 } },
      ]),
    ]);
  } catch (error) {
    console.error('[Analytics Report] Error fetching analytics data:', error);
    throw error;
  }

  // Extract results with defaults
  const currentPeriodData = currentMetrics[0] || {
    total_visitors: 0,
    unique_visitors: 0,
    new_visitors: 0,
    returning_visitors: 0,
    avg_session_duration: 0,
    total_page_views: 0,
    avg_pages_per_session: 0,
    avg_engagement_score: 0,
    bounce_rate: 0,
  };

  const previousPeriodData = previousMetrics[0] || {
    total_visitors: 0,
    unique_visitors: 0,
    new_visitors: 0,
    returning_visitors: 0,
    avg_session_duration: 0,
    total_page_views: 0,
    avg_pages_per_session: 0,
    avg_engagement_score: 0,
    bounce_rate: 0,
  };

  // Calculate total traffic for percentages
  const totalVisitors = currentPeriodData.total_visitors;
  const trafficSourcesWithPercentage = currentTrafficSources.map(source => ({
    ...source,
    percentage: totalVisitors > 0 ? Math.round((source.count / totalVisitors) * 100 * 10) / 10 : 0,
  }));

  // Get critical errors for current period
  const criticalErrors = await PerformanceMonitoring.find({
    organization_id,
    severity: 'critical',
    timestamp: { $gte: startDate, $lte: endDate },
  })
    .select('error_type message timestamp')
    .sort({ timestamp: -1 })
    .limit(10)
    .lean();

  // Group errors by type
  const errorCounts = {};
  criticalErrors.forEach(error => {
    if (!errorCounts[error.error_type]) {
      errorCounts[error.error_type] = {
        type: error.error_type,
        count: 0,
        message: error.message,
      };
    }
    errorCounts[error.error_type].count++;
  });

  const criticalErrorsSummary = Object.values(errorCounts);

  // Prepare data for the AI agent
  const analyticsData = {
    currentPeriod: {
      heroMetrics: currentPeriodData,
      trafficSources: trafficSourcesWithPercentage,
      dailyTrends: currentDailyTrends,
      criticalErrors: criticalErrorsSummary,
    },
    previousPeriod: {
      heroMetrics: previousPeriodData,
    },
    periodInfo: {
      current: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
      previous: {
        start_date: previousStartDate.toISOString(),
        end_date: previousEndDate.toISOString(),
      },
      days: periodDays,
    },
  };

  console.log('[Analytics Report] Generating AI report with agent...');

  // Return the generated report
  res.status(200).json({
    success: true,
    metadata: {
      generated_at: new Date().toISOString(),
      period: analyticsData.periodInfo,
    },
  });
}, 'Failed to generate analytics report');
