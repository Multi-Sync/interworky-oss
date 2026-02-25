// routes/reviewRemindersRoutes.js
const express = require('express');
const socialMediaReminderRouter = express.Router();
const authenticateToken = require('../../../packages/core/src/middlewares/auth.middleware');

const {
  createReviewReminder,
  getReviewReminder,
  updateReviewReminder,
  deleteReviewReminder,
  listReviewReminders,
  getReviewReminderByOrganization,
} = require('./social_media_review_reminder.controllers');

const {
  createReviewReminderValidator,
  getReviewReminderValidator,
  deleteReviewReminderValidator,
  listReviewRemindersValidator,
  updateReviewReminderValidator,
  getReviewReminderByOrganizationValidator,
} = require('./social_media_review_reminder.validators');

socialMediaReminderRouter.post('/', authenticateToken, createReviewReminderValidator, createReviewReminder);

socialMediaReminderRouter.get('/:id', authenticateToken, getReviewReminderValidator, getReviewReminder);
socialMediaReminderRouter.get(
  '/organization/:organization_id',
  authenticateToken,
  getReviewReminderByOrganizationValidator,
  getReviewReminderByOrganization,
);
socialMediaReminderRouter.put('/:id', authenticateToken, updateReviewReminderValidator, updateReviewReminder);

socialMediaReminderRouter.delete('/:id', authenticateToken, deleteReviewReminderValidator, deleteReviewReminder);

socialMediaReminderRouter.get('/', authenticateToken, listReviewRemindersValidator, listReviewReminders);

module.exports = socialMediaReminderRouter;
