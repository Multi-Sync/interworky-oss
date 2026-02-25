// src/modules/post_visitation_reminder/post_visitation_reminder.routes.js
const express = require('express');
const postVisitationReminderRouter = express.Router();
const postVisitationReminder = require('./post_visitation_reminder.controllers');
const authenticateToken = require('../../../packages/core/src/middlewares/auth.middleware');
const {
  createPostVisitationReminderValidator,
  getPostVisitationReminderValidator,
  updatePostVisitationReminderValidator,
  deletePostVisitationReminderValidator,
  getPostVisitationReminderValidatorByOrganizationId,
} = require('./post_visitation_reminder.validators');

postVisitationReminderRouter.post(
  '/',
  authenticateToken,
  createPostVisitationReminderValidator,
  postVisitationReminder.createPostVisitationReminder,
);

postVisitationReminderRouter.get('/', authenticateToken, postVisitationReminder.listPostVisitationReminders);

postVisitationReminderRouter.get(
  '/:id',
  authenticateToken,
  getPostVisitationReminderValidator,
  postVisitationReminder.getPostVisitationReminder,
);

postVisitationReminderRouter.get(
  '/organization/:organization_id',
  authenticateToken,
  getPostVisitationReminderValidatorByOrganizationId,
  postVisitationReminder.getPostVisitationReminderByOrganizationId,
);

postVisitationReminderRouter.put(
  '/:id',
  authenticateToken,
  updatePostVisitationReminderValidator,
  postVisitationReminder.updatePostVisitationReminder,
);

postVisitationReminderRouter.delete(
  '/:id',
  authenticateToken,
  deletePostVisitationReminderValidator,
  postVisitationReminder.deletePostVisitationReminder,
);

module.exports = postVisitationReminderRouter;
