// src/modules/visitor_journey/visitor_journey.controllers.js
const VisitorJourney = require('./visitor_journey.model');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');

// Create a new visitor journey
exports.createVisitorJourney = asyncHandler(async (req, res) => {
  // DEBUG: Log received location data
  console.log('[Backend] Received location data:', JSON.stringify(req.body, null, 2));

  // Check for existing journeys with this visitor_id to verify returning visitor status
  const existingJourneysCount = await VisitorJourney.countDocuments({
    visitor_id: req.body.visitor_id,
    organization_id: req.body.organization_id,
  });

  // Get last visit timestamp if returning visitor
  let lastVisit = null;
  if (existingJourneysCount > 0) {
    const lastJourney = await VisitorJourney.findOne({
      visitor_id: req.body.visitor_id,
      organization_id: req.body.organization_id,
    })
      .sort({ created_at: -1 })
      .select('session.start_time created_at')
      .lean();
    lastVisit = lastJourney?.session?.start_time || lastJourney?.created_at;
  }

  // Override frontend values with backend truth
  req.body.engagement = req.body.engagement || {};
  req.body.engagement.is_returning = existingJourneysCount > 0;
  req.body.engagement.visit_count = existingJourneysCount + 1;
  req.body.engagement.last_visit = lastVisit;

  const visitorJourney = await VisitorJourney.create(req.body);
  res.status(201).json({ visitorJourney });
}, 'Failed to create visitor journey');

// Get a visitor journey by ID
exports.getVisitorJourney = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const visitorJourney = await VisitorJourney.findOne({ id });

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(200).json({ visitorJourney });
}, 'Failed to get visitor journey');

// Update a visitor journey
exports.updateVisitorJourney = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const visitorJourney = await VisitorJourney.findOneAndUpdate(
    { id },
    { $set: req.body },
    {
      new: true, // Return the updated document
      runValidators: true, // Run schema validators
    },
  );

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(200).json({ visitorJourney });
}, 'Failed to update visitor journey');

// Add a page to the journey
exports.addPageToJourney = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { url, title, timestamp, time_spent, scroll_depth, interactions } = req.body;

  const visitorJourney = await VisitorJourney.findOneAndUpdate(
    { id },
    {
      $push: {
        'journey.pages': {
          url,
          title,
          timestamp: timestamp || new Date(),
          time_spent,
          scroll_depth,
          interactions,
        },
      },
      $inc: {
        'journey.page_views': 1,
      },
      $set: {
        'journey.current_page': { url, title, timestamp: timestamp || new Date() },
        'session.last_activity': new Date(),
      },
    },
    { new: true },
  );

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(200).json({ visitorJourney });
}, 'Failed to add page to journey');

// Add a conversion event
exports.addConversionEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { event, value } = req.body;

  const visitorJourney = await VisitorJourney.findOneAndUpdate(
    { id },
    {
      $push: {
        'engagement.conversion_events': {
          event,
          timestamp: new Date(),
          value: value || 0,
        },
      },
      $set: {
        'session.last_activity': new Date(),
      },
    },
    { new: true },
  );

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(200).json({ visitorJourney });
}, 'Failed to add conversion event');

// Add a bounce event
exports.addBounceEvent = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { timestamp, bounce_type, page_url, page_title, session_duration, scroll_depth, device, exit_trigger } =
    req.body;

  const visitorJourney = await VisitorJourney.findOneAndUpdate(
    { id },
    {
      $push: {
        'engagement.bounce_events': {
          timestamp: timestamp || new Date(),
          bounce_type,
          page_url,
          page_title,
          session_duration,
          scroll_depth,
          device,
          exit_trigger,
        },
      },
      $set: {
        'session.last_activity': new Date(),
      },
    },
    { new: true },
  );

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(200).json({ visitorJourney });
}, 'Failed to add bounce event');

// Add a search query
exports.addSearchQuery = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { query } = req.body;

  const visitorJourney = await VisitorJourney.findOneAndUpdate(
    { id },
    {
      $push: {
        'intent.search_queries': query,
      },
      $set: {
        'session.last_activity': new Date(),
      },
    },
    { new: true },
  );

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(200).json({ visitorJourney });
}, 'Failed to add search query');

// Update session status (end session, mark inactive, etc.)
exports.updateSessionStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { is_active, end_time, duration, exit_page, exit_reason } = req.body;

  const updateFields = {
    'session.last_activity': new Date(),
  };

  if (is_active !== undefined) updateFields['session.is_active'] = is_active;
  if (end_time) updateFields['session.end_time'] = end_time;
  if (duration !== undefined) updateFields['session.duration'] = duration;
  if (exit_page) updateFields['exit.page'] = exit_page;
  if (exit_reason) updateFields['exit.reason'] = exit_reason;
  if (exit_page || exit_reason) updateFields['exit.timestamp'] = new Date();

  const visitorJourney = await VisitorJourney.findOneAndUpdate({ id }, { $set: updateFields }, { new: true });

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(200).json({ visitorJourney });
}, 'Failed to update session status');

// Sync critical data (for beacon API during page unload)
exports.syncCriticalData = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { session, journey, engagement, bounce_event } = req.body;

  const updateData = {
    $set: {
      'session.last_activity': new Date(),
    },
  };

  // Update session fields if provided
  if (session) {
    if (session.is_active !== undefined) updateData.$set['session.is_active'] = session.is_active;
    if (session.end_time) updateData.$set['session.end_time'] = session.end_time;
    if (session.duration !== undefined) updateData.$set['session.duration'] = session.duration;
    if (session.exit_page) updateData.$set['exit.page'] = session.exit_page;
    if (session.exit_reason) {
      updateData.$set['exit.reason'] = session.exit_reason;
      updateData.$set['exit.timestamp'] = new Date();
    }
  }

  // Update journey fields if provided
  if (journey) {
    if (journey.bounce_rate !== undefined) updateData.$set['journey.bounce_rate'] = journey.bounce_rate;
  }

  // Update engagement fields if provided
  if (engagement) {
    if (engagement.engagement_score !== undefined)
      updateData.$set['engagement.engagement_score'] = engagement.engagement_score;
  }

  // Add bounce event if present
  if (bounce_event) {
    updateData.$push = {
      'engagement.bounce_events': {
        timestamp: bounce_event.timestamp || new Date(),
        bounce_type: bounce_event.bounce_type,
        page_url: bounce_event.page_url,
        page_title: bounce_event.page_title,
        session_duration: bounce_event.session_duration,
        scroll_depth: bounce_event.scroll_depth,
        device: bounce_event.device,
        exit_trigger: bounce_event.exit_trigger,
      },
    };
  }

  const visitorJourney = await VisitorJourney.findOneAndUpdate({ id }, updateData, { new: true });

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(200).json({ success: true, visitorJourney });
}, 'Failed to sync critical data');

// Delete a visitor journey
exports.deleteVisitorJourney = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const visitorJourney = await VisitorJourney.findOneAndDelete({ id });

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found').NotFound();
  }

  res.status(204).send();
}, 'Failed to delete visitor journey');

// List visitor journeys with filters and pagination
exports.listVisitorJourneys = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, organization_id, session_id, visitor_id, is_active } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  // Build query
  const query = {};
  if (organization_id) query.organization_id = organization_id;
  if (session_id) query.session_id = session_id;
  if (visitor_id) query.visitor_id = visitor_id;
  if (is_active !== undefined) query['session.is_active'] = is_active === 'true';

  // Use aggregation with $facet to get data and count in a single query
  const [result] = await VisitorJourney.aggregate([
    { $match: query },
    {
      $facet: {
        data: [
          { $sort: { 'session.start_time': -1 } },
          { $skip: (pageNumber - 1) * limitNumber },
          { $limit: limitNumber },
        ],
        total: [{ $count: 'count' }],
      },
    },
  ]);

  const visitorJourneys = result.data || [];
  const total = result.total[0]?.count || 0;

  res.status(200).json({
    total,
    page: pageNumber,
    limit: limitNumber,
    visitorJourneys,
  });
}, 'Failed to list visitor journeys');

// Get visitor journey by session ID
exports.getVisitorJourneyBySession = asyncHandler(async (req, res) => {
  const { session_id } = req.params;

  const visitorJourney = await VisitorJourney.findOne({ session_id });

  if (!visitorJourney) {
    throw new HttpError('Visitor journey not found for this session').NotFound();
  }

  res.status(200).json({ visitorJourney });
}, 'Failed to get visitor journey by session');

// Get all visitor journeys for a specific visitor
exports.getVisitorJourneysByVisitor = asyncHandler(async (req, res) => {
  const { visitor_id } = req.params;
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const visitorJourneys = await VisitorJourney.find({ visitor_id })
    .sort({ 'session.start_time': -1 })
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const total = await VisitorJourney.countDocuments({ visitor_id });

  res.status(200).json({
    total,
    page: pageNumber,
    limit: limitNumber,
    visitorJourneys,
  });
}, 'Failed to get visitor journeys by visitor');

// Get analytics summary for an organization
exports.getOrganizationAnalytics = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { start_date, end_date } = req.query;

  // Require date range for performance (prevent unbounded queries)
  if (!start_date || !end_date) {
    throw new HttpError('start_date and end_date are required for analytics queries').BadRequest();
  }

  // Validate date range is not too large (max 90 days)
  const startDate = new Date(start_date);
  const endDate = new Date(end_date);
  const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24);

  if (daysDiff > 90) {
    throw new HttpError('Date range cannot exceed 90 days').BadRequest();
  }

  if (daysDiff < 0) {
    throw new HttpError('start_date must be before end_date').BadRequest();
  }

  const query = {
    organization_id,
    'session.start_time': {
      $gte: startDate,
      $lte: endDate,
    },
  };

  // Aggregate analytics data
  const analytics = await VisitorJourney.aggregate([
    { $match: query },
    {
      $group: {
        _id: null,
        total_sessions: { $sum: 1 },
        total_page_views: { $sum: '$journey.page_views' },
        avg_session_duration: { $avg: '$session.duration' },
        avg_engagement_score: { $avg: '$engagement.engagement_score' },
        total_conversions: { $sum: { $size: { $ifNull: ['$engagement.conversion_events', []] } } },
        // Sessions that had at least one conversion
        sessions_with_conversions: {
          $sum: {
            $cond: [{ $gt: [{ $size: { $ifNull: ['$engagement.conversion_events', []] } }, 0] }, 1, 0],
          },
        },
        unique_visitors: { $addToSet: '$visitor_id' },
        // New vs returning visitors
        new_visitors: {
          $sum: {
            $cond: [{ $eq: ['$engagement.is_returning', false] }, 1, 0],
          },
        },
        returning_visitors: {
          $sum: {
            $cond: [{ $eq: ['$engagement.is_returning', true] }, 1, 0],
          },
        },
        bounce_rate: {
          $avg: {
            $cond: [{ $eq: ['$journey.bounce_rate', true] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        total_sessions: 1,
        total_page_views: 1,
        avg_session_duration: 1,
        avg_engagement_score: 1,
        total_conversions: 1,
        sessions_with_conversions: 1,
        unique_visitors: { $size: '$unique_visitors' },
        new_visitors: 1,
        returning_visitors: 1,
        // Calculate new visitor percentage
        new_visitor_percentage: {
          $cond: [
            { $gt: ['$total_sessions', 0] },
            { $multiply: [{ $divide: ['$new_visitors', '$total_sessions'] }, 100] },
            0,
          ],
        },
        bounce_rate: { $multiply: ['$bounce_rate', 100] },
        // Calculate conversion rate as percentage
        conversion_rate: {
          $cond: [
            { $gt: ['$total_sessions', 0] },
            { $multiply: [{ $divide: ['$sessions_with_conversions', '$total_sessions'] }, 100] },
            0,
          ],
        },
      },
    },
  ]);

  const result =
    analytics.length > 0
      ? analytics[0]
      : {
          total_sessions: 0,
          total_page_views: 0,
          avg_session_duration: 0,
          avg_engagement_score: 0,
          total_conversions: 0,
          sessions_with_conversions: 0,
          unique_visitors: 0,
          new_visitors: 0,
          returning_visitors: 0,
          new_visitor_percentage: 0,
          bounce_rate: 0,
          conversion_rate: 0,
        };

  res.status(200).json({ analytics: result });
}, 'Failed to get organization analytics');

// Get traffic sources breakdown for an organization
exports.getTrafficSourcesBreakdown = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;

  const breakdown = await VisitorJourney.aggregate([
    { $match: { organization_id } },
    {
      $group: {
        _id: '$traffic_source.type',
        count: { $sum: 1 },
        avg_engagement_score: { $avg: '$engagement.engagement_score' },
        avg_session_duration: { $avg: '$session.duration' },
      },
    },
    {
      $project: {
        _id: 0,
        source_type: '$_id',
        count: 1,
        avg_engagement_score: 1,
        avg_session_duration: 1,
      },
    },
    { $sort: { count: -1 } },
  ]);

  res.status(200).json({ traffic_sources: breakdown });
}, 'Failed to get traffic sources breakdown');

// Get retention cohorts for an organization
exports.getRetentionCohorts = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { start_date, end_date } = req.query;

  // Require date range
  if (!start_date || !end_date) {
    throw new HttpError('start_date and end_date are required').BadRequest();
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Get all sessions for unique visitors with their timestamps
  // Query with fallback to created_at if session.start_time is null/missing
  const sessions = await VisitorJourney.find({
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
  })
    .select('visitor_id session.start_time created_at')
    .sort({ 'session.start_time': 1 })
    .lean();

  // Group by visitor to find first visit (cohort week) and all subsequent visits
  const visitorMap = new Map();

  sessions.forEach(session => {
    const visitorId = session.visitor_id;
    // Use session.start_time if available, otherwise fall back to created_at
    const sessionDate = new Date(session.session?.start_time || session.created_at);

    if (!visitorMap.has(visitorId)) {
      visitorMap.set(visitorId, {
        firstVisit: sessionDate,
        visits: [sessionDate],
      });
    } else {
      visitorMap.get(visitorId).visits.push(sessionDate);
    }
  });

  // Helper to get week number from date
  const getWeekKey = date => {
    const weekStart = new Date(date);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    return weekStart.toISOString().split('T')[0];
  };

  // Helper to calculate week difference
  const getWeekDiff = (cohortWeek, visitWeek) => {
    const cohortDate = new Date(cohortWeek);
    const visitDate = new Date(visitWeek);
    const diffTime = visitDate - cohortDate;
    const diffWeeks = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 7));
    return diffWeeks;
  };

  // Build cohort data structure
  const cohorts = new Map();

  visitorMap.forEach(visitorData => {
    const cohortWeek = getWeekKey(visitorData.firstVisit);

    if (!cohorts.has(cohortWeek)) {
      cohorts.set(cohortWeek, {
        cohort_week: cohortWeek,
        total_visitors: 0,
        retention: {}, // { week_0: count, week_1: count, ... }
      });
    }

    const cohortData = cohorts.get(cohortWeek);
    cohortData.total_visitors += 1;

    // Track which weeks this visitor returned
    const visitedWeeks = new Set();
    visitorData.visits.forEach(visitDate => {
      const visitWeek = getWeekKey(visitDate);
      const weekNum = getWeekDiff(cohortWeek, visitWeek);
      if (weekNum >= 0 && weekNum <= 12) {
        // Track up to 12 weeks
        visitedWeeks.add(weekNum);
      }
    });

    // Increment retention counts for each week visited
    visitedWeeks.forEach(weekNum => {
      const weekKey = `week_${weekNum}`;
      cohortData.retention[weekKey] = (cohortData.retention[weekKey] || 0) + 1;
    });
  });

  // Convert to array and calculate percentages
  const cohortArray = Array.from(cohorts.values())
    .map(cohort => {
      const retentionPercentages = {};
      for (let i = 0; i <= 12; i++) {
        const weekKey = `week_${i}`;
        const count = cohort.retention[weekKey] || 0;
        retentionPercentages[weekKey] = cohort.total_visitors > 0 ? (count / cohort.total_visitors) * 100 : 0;
      }

      return {
        cohort_week: cohort.cohort_week,
        total_visitors: cohort.total_visitors,
        retention_percentages: retentionPercentages,
        retention_counts: cohort.retention,
      };
    })
    .sort((a, b) => new Date(b.cohort_week) - new Date(a.cohort_week)) // Most recent first
    .slice(0, 12); // Return last 12 cohorts

  res.status(200).json({ cohorts: cohortArray });
}, 'Failed to get retention cohorts');

// Get conversion funnel for an organization
exports.getConversionFunnel = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    throw new HttpError('start_date and end_date are required').BadRequest();
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Query with fallback to created_at if session.start_time is null/missing
  const query = {
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

  // Count visitors at each funnel stage
  const funnelData = await VisitorJourney.aggregate([
    { $match: query },
    {
      $facet: {
        // Stage 1: All visitors (landing)
        landing: [{ $count: 'count' }],

        // Stage 2: Engaged visitors (Carla chat OR 3+ pages OR deep scroll)
        engaged: [
          {
            $match: {
              $or: [
                { 'engagement.carla_interactions': { $gt: 0 } },
                { 'journey.page_views': { $gte: 3 } },
                { 'engagement.scroll_depth': { $gte: 75 } },
              ],
            },
          },
          { $count: 'count' },
        ],

        // Stage 3: Form submitted
        form_submitted: [
          {
            $match: {
              'engagement.form_submissions': { $gt: 0 },
            },
          },
          { $count: 'count' },
        ],

        // Stage 4: Converted
        converted: [
          {
            $match: {
              $expr: { $gt: [{ $size: { $ifNull: ['$engagement.conversion_events', []] } }, 0] },
            },
          },
          { $count: 'count' },
        ],
      },
    },
  ]);

  const data = funnelData[0];
  const landing = data.landing[0]?.count || 0;
  const engaged = data.engaged[0]?.count || 0;
  const formSubmitted = data.form_submitted[0]?.count || 0;
  const converted = data.converted[0]?.count || 0;

  // Calculate conversion rates
  const funnel = [
    {
      stage: 'landing',
      label: 'Landing Page',
      count: landing,
      percentage: 100,
      drop_off: 0,
    },
    {
      stage: 'engaged',
      label: 'Engaged',
      count: engaged,
      percentage: landing > 0 ? (engaged / landing) * 100 : 0,
      drop_off: landing - engaged,
    },
    {
      stage: 'form_submitted',
      label: 'Form Submitted',
      count: formSubmitted,
      percentage: landing > 0 ? (formSubmitted / landing) * 100 : 0,
      drop_off: engaged - formSubmitted,
    },
    {
      stage: 'converted',
      label: 'Converted',
      count: converted,
      percentage: landing > 0 ? (converted / landing) * 100 : 0,
      drop_off: formSubmitted - converted,
    },
  ];

  res.status(200).json({ funnel });
}, 'Failed to get conversion funnel');

// Get traffic source performance for an organization
exports.getTrafficPerformance = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { start_date, end_date } = req.query;

  if (!start_date || !end_date) {
    throw new HttpError('start_date and end_date are required').BadRequest();
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Query with fallback to created_at if session.start_time is null/missing
  const query = {
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

  // Aggregate performance metrics by traffic source
  const performance = await VisitorJourney.aggregate([
    { $match: query },
    {
      $group: {
        _id: {
          type: '$traffic_source.type',
          source: '$traffic_source.source',
        },
        total_visitors: { $sum: 1 },
        engaged_visitors: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $gt: ['$engagement.carla_interactions', 0] },
                  { $gte: ['$journey.page_views', 3] },
                  { $gte: ['$engagement.scroll_depth', 75] },
                ],
              },
              1,
              0,
            ],
          },
        },
        converted_visitors: {
          $sum: {
            $cond: [{ $gt: [{ $size: { $ifNull: ['$engagement.conversion_events', []] } }, 0] }, 1, 0],
          },
        },
        avg_session_duration: { $avg: '$session.duration' },
        avg_engagement_score: { $avg: '$engagement.engagement_score' },
        avg_page_views: { $avg: '$journey.page_views' },
        bounce_count: {
          $sum: {
            $cond: [{ $eq: ['$journey.bounce_rate', true] }, 1, 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        source_type: '$_id.type',
        source_name: '$_id.source',
        total_visitors: 1,
        engaged_visitors: 1,
        converted_visitors: 1,
        avg_session_duration: { $round: ['$avg_session_duration', 0] },
        avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
        avg_page_views: { $round: ['$avg_page_views', 1] },
        engagement_rate: {
          $cond: [
            { $gt: ['$total_visitors', 0] },
            { $round: [{ $multiply: [{ $divide: ['$engaged_visitors', '$total_visitors'] }, 100] }, 1] },
            0,
          ],
        },
        conversion_rate: {
          $cond: [
            { $gt: ['$total_visitors', 0] },
            { $round: [{ $multiply: [{ $divide: ['$converted_visitors', '$total_visitors'] }, 100] }, 1] },
            0,
          ],
        },
        bounce_rate: {
          $cond: [
            { $gt: ['$total_visitors', 0] },
            { $round: [{ $multiply: [{ $divide: ['$bounce_count', '$total_visitors'] }, 100] }, 1] },
            0,
          ],
        },
      },
    },
    { $sort: { total_visitors: -1 } },
    { $limit: 20 }, // Top 20 sources
  ]);

  res.status(200).json({ performance });
}, 'Failed to get traffic performance');

// Get analytics trends (time-series data) for an organization
exports.getAnalyticsTrends = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { start_date, end_date, interval = 'day' } = req.query;

  if (!start_date || !end_date) {
    throw new HttpError('start_date and end_date are required').BadRequest();
  }

  const startDate = new Date(start_date);
  const endDate = new Date(end_date);

  // Determine date grouping format based on interval
  // Use session.start_time if available, otherwise fall back to created_at
  const dateFormat =
    interval === 'hour'
      ? {
          $dateToString: {
            format: '%Y-%m-%d %H:00',
            date: { $ifNull: ['$session.start_time', '$created_at'] },
          },
        }
      : {
          $dateToString: {
            format: '%Y-%m-%d',
            date: { $ifNull: ['$session.start_time', '$created_at'] },
          },
        };

  // Query with fallback to created_at if session.start_time is null/missing
  const query = {
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

  // Aggregate metrics by time interval
  const trends = await VisitorJourney.aggregate([
    { $match: query },
    {
      $group: {
        _id: dateFormat,
        total_visitors: { $sum: 1 },
        unique_visitors: { $addToSet: '$visitor_id' },
        new_visitors: {
          $sum: {
            $cond: [{ $eq: ['$engagement.is_returning', false] }, 1, 0],
          },
        },
        returning_visitors: {
          $sum: {
            $cond: [{ $eq: ['$engagement.is_returning', true] }, 1, 0],
          },
        },
        engaged_visitors: {
          $sum: {
            $cond: [
              {
                $or: [
                  { $gt: ['$engagement.carla_interactions', 0] },
                  { $gte: ['$journey.page_views', 3] },
                  { $gte: ['$engagement.scroll_depth', 75] },
                ],
              },
              1,
              0,
            ],
          },
        },
        converted_visitors: {
          $sum: {
            $cond: [{ $gt: [{ $size: { $ifNull: ['$engagement.conversion_events', []] } }, 0] }, 1, 0],
          },
        },
        total_page_views: { $sum: '$journey.page_views' },
        avg_session_duration: { $avg: '$session.duration' },
        avg_engagement_score: { $avg: '$engagement.engagement_score' },
      },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        total_visitors: 1,
        unique_visitors: { $size: '$unique_visitors' },
        new_visitors: 1,
        returning_visitors: 1,
        engaged_visitors: 1,
        converted_visitors: 1,
        total_page_views: 1,
        avg_session_duration: { $round: ['$avg_session_duration', 0] },
        avg_engagement_score: { $round: ['$avg_engagement_score', 1] },
        engagement_rate: {
          $cond: [
            { $gt: ['$total_visitors', 0] },
            { $round: [{ $multiply: [{ $divide: ['$engaged_visitors', '$total_visitors'] }, 100] }, 1] },
            0,
          ],
        },
        conversion_rate: {
          $cond: [
            { $gt: ['$total_visitors', 0] },
            { $round: [{ $multiply: [{ $divide: ['$converted_visitors', '$total_visitors'] }, 100] }, 1] },
            0,
          ],
        },
      },
    },
    { $sort: { date: 1 } },
  ]);

  res.status(200).json({ trends, interval });
}, 'Failed to get analytics trends');

// Get custom conversion funnel for an organization based on configured conversion point
// Stages: Awareness (unique visitors) -> Consideration (duration >= 60s + returning) -> Conversion (element click)
exports.getCustomConversionFunnel = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { period = '7d' } = req.query;

  // Calculate date range based on period
  const periodDays = parseInt(period.replace('d', ''));
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - periodDays);

  // Query with fallback to created_at if session.start_time is null/missing
  // This ensures we capture all visitor journeys regardless of session.start_time population
  const query = {
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

  // Get funnel metrics using aggregation
  const funnelData = await VisitorJourney.aggregate([
    { $match: query },
    {
      $facet: {
        // Stage 1: Awareness - Count unique visitors
        awareness: [
          {
            $group: {
              _id: '$visitor_id',
            },
          },
          {
            $count: 'count',
          },
        ],

        // Stage 2: Consideration - Session duration >= 60s OR returning users
        // Changed from AND to OR logic to be more inclusive:
        // - Engaged new visitors (60+ seconds) qualify
        // - OR any returning visitor qualifies (already showed interest)
        // Uses the stored session.duration field (updated every 30s by frontend)
        consideration: [
          {
            $match: {
              $or: [{ 'session.duration': { $gte: 60 } }, { 'engagement.is_returning': true }],
            },
          },
          {
            $group: {
              _id: '$visitor_id',
            },
          },
          {
            $count: 'count',
          },
        ],

        // Stage 3: Conversion - Based on configured conversion event
        // We look for any conversion event in engagement.conversion_events array
        conversion: [
          {
            $match: {
              $expr: { $gt: [{ $size: { $ifNull: ['$engagement.conversion_events', []] } }, 0] },
            },
          },
          {
            $group: {
              _id: '$visitor_id',
            },
          },
          {
            $count: 'count',
          },
        ],
      },
    },
  ]);

  const data = funnelData[0];
  const awareness = data.awareness[0]?.count || 0;
  const consideration = data.consideration[0]?.count || 0;
  const conversion = data.conversion[0]?.count || 0;

  // Calculate conversion rates
  const considerationRate = awareness > 0 ? (consideration / awareness) * 100 : 0;
  const conversionRate = awareness > 0 ? (conversion / awareness) * 100 : 0;
  const considerationToConversionRate = consideration > 0 ? (conversion / consideration) * 100 : 0;

  const funnel = {
    stages: [
      {
        name: 'awareness',
        label: 'Awareness',
        description: 'Total unique visitors',
        count: awareness,
        percentage: 100,
        dropOff: 0,
      },
      {
        name: 'consideration',
        label: 'Consideration',
        description: 'Session duration ≥ 60s OR returning users',
        count: consideration,
        percentage: considerationRate,
        dropOff: awareness - consideration,
      },
      {
        name: 'conversion',
        label: 'Conversion',
        description: 'Completed conversion action',
        count: conversion,
        percentage: conversionRate,
        dropOff: consideration - conversion,
      },
    ],
    metrics: {
      totalVisitors: awareness,
      consideredVisitors: consideration,
      convertedVisitors: conversion,
      considerationRate: Math.round(considerationRate * 10) / 10,
      conversionRate: Math.round(conversionRate * 10) / 10,
      considerationToConversionRate: Math.round(considerationToConversionRate * 10) / 10,
    },
    period: {
      start: startDate,
      end: endDate,
      days: periodDays,
    },
  };

  res.status(200).json({ funnel });
}, 'Failed to get custom conversion funnel');
