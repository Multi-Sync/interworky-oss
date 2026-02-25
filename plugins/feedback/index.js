const router = require('./src/negative_feedback.routes');
const NegativeFeedback = require('./src/negative_feedback.model');

module.exports = {
  name: 'negative-feedback',
  router,
  models: { NegativeFeedback },
};
