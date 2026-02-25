// routers/email.router.js
const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const User = require('../modules/user/user.model');
const { createOrganizationUtil } = require('../modules/organization/organization.utils');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { getEmailProvider } = require('@interworky/providers');
const { getConfig } = require('dotenv-handler');
const { handleValidationErrors, strict, isValidTimezone } = require('../utils/base.validators');
const { asyncHandler } = require('../utils/asyncHandler');
const HttpError = require('../utils/HttpError');
const Organization = require('../modules/organization/organization.model');
const sendSlackMessage = require('../utils/slackCVP');

router.post(
  '/send-setup-account-email',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').optional().isString().withMessage('Last name must be a string'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('phone').isMobilePhone('any').optional(),
    body('clinicName').notEmpty().withMessage('Clinic name is required'),
    body('clinicWebsite').isURL().withMessage('Valid clinic website is required'),
    body('timezone').custom(isValidTimezone).withMessage("Must be a valid timezone like 'America/New_York'"),
    body('source').isIn(['test-website', 'email']).withMessage('Source must be "test-website" or "email"'),
    handleValidationErrors,
    strict,
  ],
  asyncHandler(async (req, res) => {
    const { firstName, lastName, email, phone, clinicName, clinicWebsite, clinicSocialMedia, timezone, source } =
      req.body;
    // Generate a random password
    const generatedPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(generatedPassword, 10);

    // Check if the user already exists by email or phone
    let user = await User.findOne({ $or: [{ email }] });
    if (user) {
      if (user.status != 'invited') {
        throw new HttpError('User with this email or phone already exists').Conflict();
      }
    } else {
      // Create the user if they do not exist
      user = new User({
        id: uuidv4(),
        first_name: firstName,
        last_name: lastName,
        email,
        phone,
        password: hashedPassword,
        status: 'invited', // Set the user status to invited
        source,
        timezone,
      });
      await user.save();
    }

    const createOrganizationData = await createOrganizationUtil({
      organization_name: clinicName,
      organization_website: clinicWebsite,
      creator_user_id: user.id,
    });

    sendSlackMessage(`${email} should receive a setup account email for ${clinicWebsite} - step 1`);
    // Generate a token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        password: generatedPassword,
      },
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
    );

    const mailService = getEmailProvider();
    // Determine base URL based on environment

    const baseUrl = getConfig('DASHBOARD_URL');
    // Send the email
    await mailService.sendTemplate(email, process.env.SETUPACCOUNT_EMAIL_TEMPLATE_ID, {
        first_name: firstName,
        last_name: lastName,
        clinic_name: clinicName,
        clinic_website: clinicWebsite,
        clinic_social_media: clinicSocialMedia,
        account_creation_link: `${baseUrl}/reset-password?token=${token}`,
      }, { from: process.env.SENDGRID_FROM_EMAIL });
    res.status(200).json({
      success: true,
      message: 'Email sent successfully',
      data: {
        orgId: createOrganizationData?.organization?.id,
        assistantId: createOrganizationData?.assistantData?.assistant_id,
        registrationToken: token,
      },
    });
  }),
);

const MAX_RESEND_ATTEMPTS = 5; // Set your desired maximum resend attempts
const RESEND_COOLDOWN_HOURS = 24; // Set your desired cooldown period in hours

router.post(
  '/resend-setup-account-email',
  [body('email').isEmail().withMessage('Valid email is required'), handleValidationErrors, strict],
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    const org = await Organization.findOne({ creator_user_id: user.id });
    // Check if the user and org already exists by email
    if (user && org) {
      // Check resend attempts and last resend time
      const now = new Date();
      if (!user.lastResendAttempt || (now - user.lastResendAttempt) / (1000 * 60 * 60) >= RESEND_COOLDOWN_HOURS) {
        user.resendAttempts = 0;
      }

      if (user.resendAttempts >= MAX_RESEND_ATTEMPTS) {
        throw new HttpError('Maximum resend attempts reached. Please try again later.').TooManyRequests();
      }

      // Update resend attempts and last resend time
      user.resendAttempts += 1;
      user.lastResendAttempt = now;
      await user.save();

      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
        },
        process.env.JWT_SECRET,
        { expiresIn: '5h' },
      );
      sendSlackMessage(`${email} should receive a setup account email - step 1`);
      const mailService = getEmailProvider();
      // Determine base URL based on environment

      const baseUrl = getConfig('DASHBOARD_URL');
      // Send the email
      await mailService.sendTemplate(email, process.env.SETUPACCOUNT_EMAIL_TEMPLATE_ID, {
          account_creation_link: `${baseUrl}/login?token=${token}`,
        }, { from: process.env.SENDGRID_FROM_EMAIL });
    } else {
      throw new HttpError('Failed to setup account').NotFound();
    }

    res.status(200).json({ success: true, message: 'Email sent successfully' });
  }),
);

router.post(
  '/send-reset-password-email',
  [body('email').isEmail().withMessage('Valid email is required')],
  asyncHandler(async (req, res) => {
    // Validate the request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { email } = req.body;

    try {
      // Check if the user exists by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(404).json({ success: false, message: 'User with this email does not exist' });
      }

      const { first_name } = user;

      // Generate a reset password token
      const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.RESET_PASSWORD_TOKEN_EXPIRATION,
      });

      // Determine the base URL based on the environment
      const baseUrl = getConfig('DASHBOARD_URL') || 'https://interworky.com';

      // Send the reset password email using SendGridMailService
      const mailService = getEmailProvider();
      await mailService.sendTemplate(email, process.env.FORGOTPASSWORD_EMAIL_TEMPLATE_ID, {
          firstName: first_name,
          reset_password_url: `${baseUrl}/reset-password?token=${token}`,
        }, { from: process.env.SENDGRID_FROM_EMAIL });

      // Log and send response
      sendSlackMessage(`${email} requested to reset their password`);
      res.status(200).json({ success: true, message: 'Reset password email sent successfully' });
    } catch (error) {
      console.error('Error occurred:', error);
      if (error instanceof mongoose.Error.ValidationError) {
        res.status(400).json({ success: false, message: `${error.message} (mongoose error)` });
      } else {
        res.status(500).json({ success: false, message: 'Internal server error' });
      }
    }
  }),
);

module.exports = router;
