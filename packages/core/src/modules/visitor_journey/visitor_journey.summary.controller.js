// src/modules/visitor_journey/visitor_journey.summary.controller.js
const VisitorJourney = require('./visitor_journey.model');
const { asyncHandler } = require('../../utils/asyncHandler');

/**
 * Get unified analytics summary for dashboard
 * Returns pre-computed hero metrics, traffic sources, trends, and critical errors
 * Designed for business-focused analytics dashboard
 */
exports.getAnalyticsSummary = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { period = '7d' } = req.query;

  console.log('[Analytics Summary] Request received for org:', organization_id, 'period:', period);

  // Calculate date ranges based on period
  const periodDays = parseInt(period.replace('d', ''));
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Debug: Check if any journeys exist for this organization
  const totalCount = await VisitorJourney.countDocuments({ organization_id });

  // Debug: Get sample journey to check data structure
  const sampleJourney = await VisitorJourney.findOne({ organization_id }).lean();

  // DEBUG: Log location data
  console.log('[Analytics Summary] Sample journey location:', JSON.stringify(sampleJourney?.location, null, 2));
  console.log('[Analytics Summary] Has country?', !!sampleJourney?.location?.country);
  console.log('[Analytics Summary] Has country_code?', !!sampleJourney?.location?.country_code);

  // Previous period for comparison
  const previousStartDate = new Date(startDate);
  previousStartDate.setDate(previousStartDate.getDate() - periodDays);
  const previousEndDate = new Date(startDate);

  // Current period query
  // Use created_at if session.start_time is not populated
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

  // Previous period query
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

  let currentMetrics, previousMetrics, trafficSources, dailyTrends, topCountries;
  try {
    [currentMetrics, previousMetrics, trafficSources, dailyTrends, topCountries] = await Promise.all([
      // Current period hero metrics
      VisitorJourney.aggregate([
        { $match: currentQuery },
        {
          $addFields: {
            // Calculate duration on-the-fly from timestamps instead of relying on stored value
            calculated_duration: {
              $divide: [
                {
                  $subtract: [{ $ifNull: ['$session.end_time', new Date()] }, '$session.start_time'],
                },
                1000, // Convert milliseconds to seconds
              ],
            },
          },
        },
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
            total_session_duration: { $sum: '$calculated_duration' },
            avg_session_duration: { $avg: '$calculated_duration' },
            total_page_views: { $sum: '$journey.page_views' },
            avg_pages_per_session: { $avg: '$journey.page_views' },
            avg_engagement_score: { $avg: '$engagement.engagement_score' },
          },
        },
        {
          $project: {
            _id: 0,
            total_visitors: 1,
            unique_visitors: { $size: '$unique_visitors' },
            new_visitors: 1,
            returning_visitors: 1,
            new_visitor_percentage: {
              $cond: [
                { $gt: ['$total_visitors', 0] },
                { $round: [{ $multiply: [{ $divide: ['$new_visitors', '$total_visitors'] }, 100] }, 1] },
                0,
              ],
            },
            avg_session_duration: { $round: ['$avg_session_duration', 0] },
            total_page_views: 1,
            avg_pages_per_session: { $round: ['$avg_pages_per_session', 1] },
            avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
          },
        },
      ]),

      // Previous period metrics for comparison
      VisitorJourney.aggregate([
        { $match: previousQuery },
        {
          $addFields: {
            // Calculate duration on-the-fly from timestamps instead of relying on stored value
            calculated_duration: {
              $divide: [
                {
                  $subtract: [{ $ifNull: ['$session.end_time', new Date()] }, '$session.start_time'],
                },
                1000, // Convert milliseconds to seconds
              ],
            },
          },
        },
        {
          $group: {
            _id: null,
            total_visitors: { $sum: 1 },
            new_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', false] }, 1, 0] },
            },
            avg_session_duration: { $avg: '$calculated_duration' },
            avg_pages_per_session: { $avg: '$journey.page_views' },
          },
        },
      ]),

      // Traffic sources breakdown
      VisitorJourney.aggregate([
        { $match: currentQuery },
        {
          $group: {
            _id: {
              type: '$traffic_source.type',
              source: '$traffic_source.source',
            },
            visitors: { $sum: 1 },
            new_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', false] }, 1, 0] },
            },
            avg_engagement_score: { $avg: '$engagement.engagement_score' },
            avg_session_duration: { $avg: '$session.duration' },
          },
        },
        {
          $project: {
            _id: 0,
            source_type: '$_id.type',
            source_name: { $ifNull: ['$_id.source', '$_id.type'] },
            visitors: 1,
            new_visitors: 1,
            avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
            avg_session_duration: { $round: ['$avg_session_duration', 0] },
          },
        },
        { $sort: { visitors: -1 } },
        { $limit: 10 }, // Top 10 sources
      ]),

      // Daily trends
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
            total_visitors: { $sum: 1 },
            new_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', false] }, 1, 0] },
            },
            returning_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', true] }, 1, 0] },
            },
            avg_session_duration: { $avg: '$session.duration' },
            avg_engagement_score: { $avg: '$engagement.engagement_score' },
          },
        },
        {
          $project: {
            _id: 0,
            date: '$_id',
            total_visitors: 1,
            new_visitors: 1,
            returning_visitors: 1,
            avg_session_duration: { $round: ['$avg_session_duration', 0] },
            avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
          },
        },
        { $sort: { date: 1 } },
      ]),

      // Top visitor countries
      VisitorJourney.aggregate([
        { $match: currentQuery },
        {
          $match: {
            $or: [
              { 'location.country': { $ne: null, $exists: true } },
              { 'location.country_code': { $ne: null, $exists: true } },
            ],
          },
        },
        {
          $group: {
            _id: {
              country: '$location.country',
              country_code: '$location.country_code',
            },
            visitors: { $sum: 1 },
            new_visitors: {
              $sum: { $cond: [{ $eq: ['$engagement.is_returning', false] }, 1, 0] },
            },
            avg_engagement_score: { $avg: '$engagement.engagement_score' },
            avg_session_duration: { $avg: '$session.duration' },
          },
        },
        {
          $project: {
            _id: 0,
            country: '$_id.country',
            country_code: '$_id.country_code',
            visitors: 1,
            new_visitors: 1,
            avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
            avg_session_duration: { $round: ['$avg_session_duration', 0] },
          },
        },
        { $sort: { visitors: -1 } },
        { $limit: 10 },
      ]),
    ]);
  } catch (error) {
    console.error('[Analytics Summary] Error during aggregations:', error);
    throw error;
  }

  // Extract results with defaults
  const current = currentMetrics[0] || {
    total_visitors: 0,
    unique_visitors: 0,
    new_visitors: 0,
    returning_visitors: 0,
    new_visitor_percentage: 0,
    avg_session_duration: 0,
    total_page_views: 0,
    avg_pages_per_session: 0,
    avg_engagement_score: 0,
  };

  const previous = previousMetrics[0] || {
    total_visitors: 0,
    new_visitors: 0,
    avg_session_duration: 0,
    avg_pages_per_session: 0,
  };

  // Calculate period-over-period changes
  const calculateChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  // Calculate total visitors for traffic source percentages
  const totalVisitors = current.total_visitors;
  const trafficSourcesWithPercentage = trafficSources.map(source => ({
    ...source,
    percentage: totalVisitors > 0 ? Math.round((source.visitors / totalVisitors) * 100 * 10) / 10 : 0,
  }));

  // Calculate total visitors for country percentages
  const totalVisitorsWithLocation = topCountries.reduce((sum, c) => sum + c.visitors, 0);
  const topCountriesWithPercentage = topCountries.map(country => ({
    ...country,
    percentage:
      totalVisitorsWithLocation > 0 ? Math.round((country.visitors / totalVisitorsWithLocation) * 100 * 10) / 10 : 0,
  }));

  // DEBUG: Log top countries data
  console.log('[Analytics Summary] topCountries raw:', JSON.stringify(topCountries, null, 2));
  console.log('[Analytics Summary] topCountries count:', topCountries.length);
  console.log('[Analytics Summary] topCountriesWithPercentage:', JSON.stringify(topCountriesWithPercentage, null, 2));

  // Prepare response
  const summary = {
    // Hero metrics with period-over-period comparison
    hero_metrics: {
      total_visitors: {
        value: current.total_visitors,
        change: calculateChange(current.total_visitors, previous.total_visitors),
      },
      new_visitors: {
        count: current.new_visitors,
        percentage: current.new_visitor_percentage,
        change: calculateChange(current.new_visitors, previous.new_visitors),
      },
      avg_pages_per_session: {
        value: current.avg_pages_per_session,
        change: calculateChange(current.avg_pages_per_session, previous.avg_pages_per_session),
      },
    },

    // Additional context metrics
    summary_stats: {
      unique_visitors: current.unique_visitors,
      returning_visitors: current.returning_visitors,
      total_page_views: current.total_page_views,
      avg_engagement_score: current.avg_engagement_score,
    },

    // Traffic sources breakdown
    traffic_sources: trafficSourcesWithPercentage,

    // Daily trends for graph
    trends: dailyTrends,

    // Top visitor countries
    top_countries: topCountriesWithPercentage,

    // Metadata
    period: {
      days: periodDays,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    },
  };

  res.status(200).json({ summary });
}, 'Failed to get analytics summary');
