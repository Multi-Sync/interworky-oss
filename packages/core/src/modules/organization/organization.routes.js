const express = require('express');
const organizationRouter = express.Router();
const {
  createOrganization,
  getOrganization,
  updateOrganization,
  updateOrganizationWebsite,
  deleteOrganization,
  listOrganizations,
  getOrganizationByCreatorId,
  getOrganizationByUserId,
  storeFileInOrgBucket,
  getOrganizationByOrgName,
  getOrganizationUsage,
  listOrganizationUsers,
  addUsersToOrganization,
  updateOrganizationUserRole,
  removeOrganizationUser,
  inviteOrganizationUser,
} = require('./organization.controllers');
const authenticateToken = require('../../middlewares/auth.middleware');
const {
  createOrganizationValidator,
  updateOrganizationValidator,
  organizationIdValidator,
  organizationByCreatorIdValidator,
  listOrganizationsValidator,
  organizationNameValidator,
  organizationUsersListValidator,
  organizationUsersAddValidator,
  organizationUserRoleUpdateValidator,
  organizationUserRemoveValidator,
  organizationUserInviteValidator,
  updateOrganizationWebsiteValidator,
} = require('./organization.validators');
const { uploadFile, validateFileUpload } = require('../../config/multer');

organizationRouter.post('/', authenticateToken, createOrganizationValidator, createOrganization);
organizationRouter.get('/:id', authenticateToken, organizationIdValidator, getOrganization);
organizationRouter.get(
  '/organization_name/:organization_name',
  authenticateToken,
  organizationNameValidator,
  getOrganizationByOrgName,
);
organizationRouter.get(
  '/creator-id/:id',
  authenticateToken,
  organizationByCreatorIdValidator,
  getOrganizationByCreatorId,
);
organizationRouter.get('/user-id/:id', authenticateToken, organizationByCreatorIdValidator, getOrganizationByUserId);
organizationRouter.put('/:id', authenticateToken, updateOrganizationValidator, updateOrganization);
organizationRouter.put(
  '/:id/website',
  authenticateToken,
  updateOrganizationWebsiteValidator,
  updateOrganizationWebsite,
);
organizationRouter.delete('/:id', authenticateToken, deleteOrganization);
organizationRouter.get('/', authenticateToken, listOrganizationsValidator, listOrganizations);
organizationRouter.post('/upload', authenticateToken, uploadFile, validateFileUpload, storeFileInOrgBucket);
organizationRouter.get('/usage/:id', organizationIdValidator, getOrganizationUsage);

// Organization users management
organizationRouter.get('/:id/users', authenticateToken, organizationUsersListValidator, listOrganizationUsers);
organizationRouter.post('/:id/users', authenticateToken, organizationUsersAddValidator, addUsersToOrganization);
organizationRouter.patch(
  '/:id/users/:userId',
  authenticateToken,
  organizationUserRoleUpdateValidator,
  updateOrganizationUserRole,
);
organizationRouter.delete(
  '/:id/users/:userId',
  authenticateToken,
  organizationUserRemoveValidator,
  removeOrganizationUser,
);
organizationRouter.post(
  '/:id/users/invite',
  authenticateToken,
  organizationUserInviteValidator,
  inviteOrganizationUser,
);
module.exports = organizationRouter;
