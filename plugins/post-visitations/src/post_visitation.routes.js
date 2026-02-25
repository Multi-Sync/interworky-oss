// src/modules/post_visitation/post_visitation.routes.js
const express = require('express');
const postVisitationRouter = express.Router();
const postVisitation = require('./post_visitation.controllers');
const authenticateToken = require('../../../packages/core/src/middlewares/auth.middleware');
const {
  createPostVisitationValidator,
  getPostVisitationValidator,
  updatePostVisitationValidator,
  deletePostVisitationValidator,
  listPostVisitationsByOrganizationValidator,
} = require('./post_visitation.validators');

postVisitationRouter.post('/', authenticateToken, createPostVisitationValidator, postVisitation.createPostVisitation);

postVisitationRouter.get('/', authenticateToken, postVisitation.listPostVisitation);

postVisitationRouter.get('/:id', authenticateToken, getPostVisitationValidator, postVisitation.getPostVisitation);
postVisitationRouter.get(
  '/organization/:organization_id',
  authenticateToken,
  listPostVisitationsByOrganizationValidator,
  postVisitation.listPostVisitationsByOrganization,
);
postVisitationRouter.put('/:id', authenticateToken, updatePostVisitationValidator, postVisitation.updatePostVisitation);

postVisitationRouter.delete(
  '/:id',
  authenticateToken,
  deletePostVisitationValidator,
  postVisitation.deletePostVisitation,
);

module.exports = postVisitationRouter;
