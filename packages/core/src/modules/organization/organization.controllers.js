const Organization = require('./organization.model');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const { createOrganizationUtil } = require('./organization.utils');
const { uploadFileToOrganizationBucket } = require('../../utils/gcp');
const sendSlackMessage = require('../../utils/slackCVP');
const { checkSubscriptionStatus } = require('../../middlewares/utils.middleware');
const { getEmailProvider } = require('@interworky/providers');
const { getConfig } = require('dotenv-handler');
const jwt = require('jsonwebtoken');

// Create a new organization
exports.createOrganization = asyncHandler(async (req, res) => {
  const { organization_name, organization_website, creator_user_id } = req.body;

  const { organization, assistantData, organizationAssistant } = await createOrganizationUtil({
    organization_name,
    organization_website,
    creator_user_id,
  });

  sendSlackMessage(
    `🎉 WohoOo 🎉\nNew Organization Created\norganization_name: ${organization_name}\norganization_website: ${organization_website}`,
  );
  res.status(201).json({ organization, assistantData, organizationAssistant });
}, 'Failed to create organization');

// Retrieve an organization by ID
exports.getOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organization = await Organization.findOne({ id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  res.status(200).json({ organization });
}, 'Failed to retrieve organization');

// Retrieve an organization by ID
exports.getOrganizationByOrgName = asyncHandler(async (req, res) => {
  const { organization_name } = req.params;
  const organization = await Organization.findOne({ organization_name });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  res.status(200).json({ organization });
}, 'Failed to retrieve organization');

// Retrieve an organization by ID
exports.getOrganizationByCreatorId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organization = await Organization.findOne({ creator_user_id: id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  res.status(200).json({ organization });
}, 'Failed to retrieve organization by creator id');

// Retrieve an organization by user ID
exports.getOrganizationByUserId = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organization = await Organization.findOne({
    $or: [{ creator_user_id: id }, { users: { $elemMatch: { id: id } } }],
  });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  res.status(200).json({ organization });
}, 'Failed to retrieve organization by user id');

// Update an organization's details
exports.updateOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organization = await Organization.findOneAndUpdate({ id }, req.body, { new: true, runValidators: true });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  res.status(200).json(organization);
}, 'Failed to update organization');

// Update organization website URL
exports.updateOrganizationWebsite = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { organization_website } = req.body;

  if (!organization_website) {
    throw new HttpError('organization_website is required').BadRequest();
  }

  const organization = await Organization.findOneAndUpdate(
    { id },
    { organization_website },
    { new: true, runValidators: true },
  );

  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }

  res.status(200).json({
    success: true,
    data: {
      organization_website: organization.organization_website,
    },
  });
}, 'Failed to update organization website');

// Delete an organization by ID
exports.deleteOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organization = await Organization.findOneAndDelete({ id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  res.status(204).send();
}, 'Failed to delete organization');

// List all organizations with pagination
exports.listOrganizations = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  // Apply pagination using skip and limit
  const organizations = await Organization.find();

  // Count total number of organizations
  const totalOrganizations = await Organization.countDocuments();

  res.status(200).json({
    total: totalOrganizations,
    page: pageNumber,
    limit: limitNumber,
    organizations,
  });
}, 'Failed to list organizations');

exports.storeFileInOrgBucket = asyncHandler(async (req, res) => {
  const { file } = req;
  const user = req.user;
  const organization = await Organization.findOne({ creator_user_id: user.userId });
  if (!organization) {
    throw new HttpError('User is not associated with any organization').NotFound();
  }
  const fileUrl = await uploadFileToOrganizationBucket(organization.id, file.buffer, file.originalname);
  res.status(200).json({ fileUrl });
}, 'Failed to upload file to organization bucket');

exports.getOrganizationUsage = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organization = await Organization.findOne({ id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  const hasSubscription = await checkSubscriptionStatus(id);

  res.status(200).json({
    hasSubscription,
    limit: process.env.MESSAGE_LIMIT,
    currentUsage: organization.message_count,
    remaining: Math.max(0, process.env.MESSAGE_LIMIT - organization.message_count),
    limitReached: !hasSubscription && organization.message_count >= process.env.MESSAGE_LIMIT,
  });
}, 'Failed to retrieve organization usage');

// Helpers
function ensureCanManageMembers(org, requesterId) {
  const isCreator = org.creator_user_id === requesterId;
  const isAdminMember = org.users?.some(u => u.userId === requesterId && u.role === 'admin');
  if (!isCreator && !isAdminMember) {
    throw new HttpError('Forbidden: admin or creator required').Forbidden();
  }
}

// List organization users (does not require admin)
exports.listOrganizationUsers = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const organization = await Organization.findOne({ id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  res.status(200).json({
    users: organization.users || [],
    creator_user_id: organization.creator_user_id,
  });
}, 'Failed to list organization users');

// Add multiple users to organization
exports.addUsersToOrganization = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { users = [] } = req.body;
  const requesterId = req.user?.userId;

  const organization = await Organization.findOne({ id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }

  ensureCanManageMembers(organization, requesterId);

  // Create a map for quick lookup and to avoid duplicates by userId
  const currentById = new Map((organization.users || []).map(u => [u.userId, u]));

  let modified = false;
  for (const incoming of users) {
    const { userId, role } = incoming;
    if (!userId || !role) continue;
    if (userId === organization.creator_user_id) {
      // Creator is implicitly an admin and should not be re-added as member; skip
      continue;
    }
    const existing = currentById.get(userId);
    if (!existing) {
      currentById.set(userId, { userId, role });
      modified = true;
    } else if (existing.role !== role) {
      existing.role = role; // update role on add if different
      modified = true;
    }
  }

  if (modified) {
    organization.users = Array.from(currentById.values());
    await organization.save();
  }

  res.status(200).json({ users: organization.users });
}, 'Failed to add users to organization');

// Update a single user's role in the organization
exports.updateOrganizationUserRole = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const { role } = req.body;
  const requesterId = req.user?.userId;

  const organization = await Organization.findOne({ id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  ensureCanManageMembers(organization, requesterId);

  if (userId === organization.creator_user_id) {
    throw new HttpError('Cannot change creator role').BadRequest();
  }

  const idx = (organization.users || []).findIndex(u => u.userId === userId);
  if (idx === -1) {
    throw new HttpError('User not found in organization').NotFound();
  }
  organization.users[idx].role = role;
  await organization.save();
  res.status(200).json({ users: organization.users });
}, 'Failed to update organization user role');

// Remove a user from the organization
exports.removeOrganizationUser = asyncHandler(async (req, res) => {
  const { id, userId } = req.params;
  const requesterId = req.user?.userId;

  const organization = await Organization.findOne({ id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  ensureCanManageMembers(organization, requesterId);

  if (userId === organization.creator_user_id) {
    throw new HttpError('Cannot remove the creator from organization').BadRequest();
  }

  const before = organization.users?.length || 0;
  organization.users = (organization.users || []).filter(u => u.userId !== userId);
  const after = organization.users.length;
  if (after === before) {
    throw new HttpError('User not found in organization').NotFound();
  }

  await organization.save();
  res.status(200).json({ users: organization.users });
}, 'Failed to remove organization user');

// Invite a single member to the organization by email
exports.inviteOrganizationUser = asyncHandler(async (req, res) => {
  const { id } = req.params; // organization id
  const { email, first_name, last_name, timezone, role = 'member' } = req.body;
  const requesterId = req.user?.userId;

  const organization = await Organization.findOne({ id });
  if (!organization) {
    throw new HttpError('Organization not found').NotFound();
  }
  ensureCanManageMembers(organization, requesterId);

  // Find or create user with invited status
  let user = await require('../user/user.model').findOne({ email });
  const bcrypt = require('bcryptjs');
  const { v4: uuidv4 } = require('uuid');

  if (!user) {
    const generatedPassword = require('crypto').randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);
    const User = require('../user/user.model');
    user = new User({
      id: uuidv4(),
      email,
      first_name: first_name || '',
      last_name: last_name || '',
      password: hashedPassword,
      status: 'invited',
      source: 'email',
      timezone: timezone || 'America/New_York',
    });
    await user.save();
  } else if (user.status !== 'active') {
    // keep as invited if not active
  }

  // Ensure membership
  if (!Array.isArray(organization.users)) organization.users = [];
  const exists = organization.users.some(u => u.userId === user.id);
  if (!exists) {
    organization.users.push({ userId: user.id, role });
    await organization.save();
  }

  // Build invite token
  const JWT_SECRET = getConfig('JWT_SECRET');
  const token = jwt.sign(
    {
      type: 'member-invite',
      orgId: organization.id,
      userId: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '5h' },
  );

  // Send invite email
  const emailProvider = getEmailProvider();
  const baseUrl = getConfig('DASHBOARD_URL');
  const templateId = process.env.MEMBER_INVITE_TEMPLATE_ID;
  const templateVars = {
    first_name: first_name || user.first_name || '',
    organization_name: organization.organization_name,
    invite_link: `${baseUrl}/setup-account?token=${token}`,
  };
  if (templateId) {
    await emailProvider.sendTemplate(email, templateId, templateVars, {
      from: process.env.SENDGRID_FROM_EMAIL,
    });
  } else {
    await emailProvider.send(
      email,
      'You have been invited to an organization',
      `<p>You have been invited to join ${organization.organization_name}.</p><p><a href="${templateVars.invite_link}">Setup your account</a></p>`,
      { from: process.env.SENDGRID_FROM_EMAIL },
    );
  }

  res.status(200).json({ success: true });
}, 'Failed to invite organization user');
