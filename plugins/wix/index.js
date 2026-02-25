const router = require('./src/wix.router');
const WixIntegration = require('./src/wix_integration.model');

module.exports = {
  name: 'wix',
  router,
  models: { WixIntegration },
};
