const router = require('./src/post_visitation_reminder.routes');
const PostVisitationReminder = require('./src/post_visitation_reminder.model');

module.exports = {
  name: 'reminders',
  router,
  models: { PostVisitationReminder },
};
