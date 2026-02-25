const router = require('./src/testimonial.routes');
const Testimonial = require('./src/testimonial.model');

module.exports = {
  name: 'testimonials',
  router,
  models: { Testimonial },
};
