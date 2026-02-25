const router = require('./src/social_media_review_reminder.routes');
const SocialMediaReviewReminder = require('./src/social_media_review_reminder.model');

module.exports = {
  name: 'review-reminders',
  router,
  models: { SocialMediaReviewReminder },
};
