const router = require('./src/patient.routes');
const Patient = require('./src/patient.model');

module.exports = {
  name: 'patients',
  router,
  models: { Patient },
};
