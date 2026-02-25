const express = require('express');
const { getTopBots } = require('./interworky_analytics.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');
const interworkyAnalyticsRouter = express.Router();

interworkyAnalyticsRouter.get('/top-bots', authenticateToken, getTopBots);
module.exports = interworkyAnalyticsRouter;
