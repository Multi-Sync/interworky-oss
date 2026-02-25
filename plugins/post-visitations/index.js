const router = require('./src/post_visitation.routes');
const PostVisitation = require('./src/post_visitation.model');

module.exports = {
  name: 'post-visitations',
  router,
  models: { PostVisitation },
};
