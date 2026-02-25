// src/modules/flow_action/flow_action.routes.js
const express = require('express');
const flowActionRouter = express.Router();
const flowActionController = require('./flow_action.controller');
const { optionalAuth } = require('../../middlewares/auth.middleware');

// Process flow completion action (called by interworky-assistant)
// Uses optional auth - works for both authenticated and unauthenticated users
// Authenticated requests get user tracking and rate limiting benefits
flowActionRouter.post('/', optionalAuth, flowActionController.handleFlowAction);

module.exports = flowActionRouter;
