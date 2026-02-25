// controllers/userController.js
const User = require('./user.model');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
require('../../config')();
const { getConfig } = require('dotenv-handler');
const { asyncHandler } = require('../../utils/asyncHandler');
const HttpError = require('../../utils/HttpError');
const sendSlackMessage = require('../../utils/slackCVP');
const crypto = require('crypto');
const { getEmailProvider } = require('@interworky/providers');
const Organization = require('../organization/organization.model');
const { createOrganizationUtil } = require('../organization/organization.utils');

const JWT_SECRET = getConfig('JWT_SECRET');

// Create User
exports.createUser = asyncHandler(async (req, res) => {
  const { email, password, clinicName, clinicWebsite, ...rest } = req.body;

  const foundUser = await User.findOne({ email });

  if (foundUser) {
    throw new HttpError('User already exists').Conflict();
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({
    ...rest,
    id: uuidv4(),
    email,
    password: hashedPassword,
  });

  // Create organization for the new user (matches web registration flow)
  let organization = null;
  try {
    const orgName = clinicName || email.split('@')[0];
    const orgWebsite = clinicWebsite || 'example.com';
    const orgData = await createOrganizationUtil({
      organization_name: orgName,
      organization_website: orgWebsite,
      creator_user_id: user.id,
    });
    organization = orgData.organization;
  } catch (err) {
    console.error('[createUser] Failed to create organization:', err.message);
  }

  // Activate user since they set their own password (no email verification needed)
  user.status = 'active';
  await user.save();

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: '10h',
  });

  res.status(201).json({ user, token, organization });
}, 'Failed to create user');

// Authenticate User
exports.authenticateUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw new HttpError('User not found').NotFound();
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    throw new HttpError('Invalid password').Unauthorized();
  }
  if (user.status === 'invited') {
    sendSlackMessage(`${email} just activated their account - step 2`);
    await User.findOneAndUpdate({ email }, { status: 'active' });
  }
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: '10h',
  });

  // Fetch user's organization
  const organization = await Organization.findOne({
    $or: [{ creator_user_id: user.id }, { 'users.userId': user.id }],
  });

  sendSlackMessage(`${email} just logged in`);
  res.status(200).json({ user, token, organization });
}, 'Failed to authenticate user');

// Reset Password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.findOneAndUpdate({ id }, { password: hashedPassword }, { new: true });
  if (!user) {
    throw new HttpError('User not found').NotFound();
  }

  if (user.status === 'invited') {
    setImmediate(async () => {
      try {
        const emailProvider = getEmailProvider();
        await emailProvider.sendTemplate(user.email, process.env.WELCOMING_EMAIL_TEMPLATE_ID, {
            first_name: user.first_name,
          }, { from: process.env.SENDGRID_FROM_EMAIL });
      } catch (error) {
        console.error('Failed to send welcome email:', error);
      }
    });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: '10h',
  });

  res.status(200).json({ user, token });
}, 'Failed to reset password');

// Get Users
exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find();
  res.status(200).json(users);
}, 'Failed to get users');

// Get User by ID
exports.getUserById = asyncHandler(async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  if (!user) {
    throw new HttpError('User not found').NotFound();
  }
  res.status(200).json(user);
}, 'Failed to get user by ID');

// Update User
exports.updateUser = asyncHandler(async (req, res) => {
  const user = await User.findOne({ id: req.params.id });
  if (!user) {
    throw new HttpError('User not found').NotFound();
  }
  Object.assign(user, req.body);
  await user.save();
  res.status(200).json(user);
}, 'Failed to update user');

// Delete User
exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findOneAndDelete({ id: req.params.id });
  if (!user) {
    throw new HttpError('User not found').NotFound();
  }
  await user.deleteOne();
  res.status(204).json();
}, 'Failed to delete user');

exports.continueWithProvider = asyncHandler(async (req, res) => {
  const { email, name, timezone } = req.body;

  // First check if user already exists
  let user = await User.findOne({ email });

  if (user) {
    // If user exists, generate token and return user data
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '10h',
    });
    return res.status(200).json({
      token,
      id: user.id,
      hasOrg: true,
    });
  }

  // If user doesn't exist, create new user
  const [firstName, lastName] = name.split(' ');
  const generatedPassword = crypto.randomBytes(8).toString('hex');
  const hashedPassword = await bcrypt.hash(generatedPassword, 10);

  user = new User({
    id: uuidv4(),
    first_name: firstName,
    last_name: lastName || '', // Handle case where there's no last name
    email,
    password: hashedPassword,
    status: 'active', // Set as active since they're using OAuth
    source: 'google',
    timezone,
  });

  await user.save();

  // Generate token for new user
  const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: '10h',
  });
  setImmediate(async () => {
    try {
      const emailProvider = getEmailProvider();
      await emailProvider.sendTemplate(email, process.env.WELCOMING_EMAIL_TEMPLATE_ID, {
          first_name: firstName,
        }, { from: process.env.SENDGRID_FROM_EMAIL });
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
  });

  // Return the same structure for both new and existing users
  res.status(201).json({
    token,
    id: user.id,
    hasOrg: false,
  });
}, 'Failed to signin with provider');
