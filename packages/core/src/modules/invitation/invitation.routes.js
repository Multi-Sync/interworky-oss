const express = require('express');
const authenticateToken = require('../../middlewares/auth.middleware');
const { asyncHandler } = require('../../utils/asyncHandler');
const invitationService = require('./invitation.service');

const invitationRouter = express.Router();

// Create invitation
invitationRouter.post('/', authenticateToken, asyncHandler(async (req, res) => {
  const { organizationId, email, phone, channel, role } = req.body;
  if (!organizationId) return res.status(400).json({ success: false, error: 'Missing organizationId' });

  const invitation = await invitationService.createInvitation(organizationId, req.userId, { email, phone, channel, role });
  res.json({ success: true, invitation });
}));

// Bulk invite (from contacts)
invitationRouter.post('/bulk', authenticateToken, asyncHandler(async (req, res) => {
  const { organizationId, invitees } = req.body;
  if (!organizationId || !invitees) return res.status(400).json({ success: false, error: 'Missing fields' });

  const results = await invitationService.createBulkInvitations(organizationId, req.userId, invitees);
  res.json({ success: true, results });
}));

// List org invitations
invitationRouter.get('/:orgId', authenticateToken, asyncHandler(async (req, res) => {
  const invitations = await invitationService.listInvitations(req.params.orgId);
  res.json({ success: true, invitations });
}));

// Accept invitation (public, uses auth if available)
invitationRouter.post('/accept/:code', authenticateToken, asyncHandler(async (req, res) => {
  const invitation = await invitationService.acceptInvitation(req.params.code, req.userId);
  res.json({ success: true, invitation });
}));

// Cancel invitation
invitationRouter.delete('/:id', authenticateToken, asyncHandler(async (req, res) => {
  const invitation = await invitationService.cancelInvitation(req.params.id);
  if (!invitation) return res.status(404).json({ success: false, error: 'Invitation not found' });
  res.json({ success: true, invitation });
}));

// Check invite code (public, no auth)
invitationRouter.get('/check/:code', asyncHandler(async (req, res) => {
  const result = await invitationService.checkInviteCode(req.params.code);
  if (!result) return res.status(404).json({ success: false, error: 'Invalid invite code' });
  res.json({ success: true, ...result });
}));

module.exports = invitationRouter;
