const { asyncHandler } = require('../../../packages/core/src/utils/asyncHandler');
const HttpError = require('../../../packages/core/src/utils/HttpError');
const SocialMediaReviewReminder = require('./social_media_review_reminder.model.js');
const { models: { Appointment } } = require('@interworky/plugin-appointments');

exports.createReviewReminder = asyncHandler(async (req, res) => {
  const reminder = await SocialMediaReviewReminder.create(req.body);
  res.status(201).json(reminder);
}, 'Failed to create Review Reminder');

exports.getReviewReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reminder = await SocialMediaReviewReminder.findById(id);
  if (!reminder) {
    throw new HttpError('Review reminder not found').NotFound();
  }
  res.status(200).json(reminder);
}, 'Failed to get Review by ID');

exports.updateReviewReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const reminder = await SocialMediaReviewReminder.findByIdAndUpdate(id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!reminder) {
    throw new HttpError('Review reminder not found').NotFound();
  }
  res.status(200).json(reminder);
}, 'Failed to update Review');

exports.deleteReviewReminder = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const reminder = await SocialMediaReviewReminder.findByIdAndDelete(id);
  if (!reminder) {
    throw new HttpError('Review reminder not found').NotFound();
  }
  res.status(204).send();
}, 'Failed to delete Review');

exports.listReviewReminders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const reminders = await SocialMediaReviewReminder.find()
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);

  const totalReminders = await SocialMediaReviewReminder.countDocuments();

  res.status(200).json({
    total: totalReminders,
    page: pageNumber,
    limit: limitNumber,
    reminders,
  });
}, 'Failed to get list Review');

exports.getReviewReminderByOrganization = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const appointments = await Appointment.find({ organization_id }).lean();
  const ids = appointments.map(appointment => appointment.id);
  const reminders = await SocialMediaReviewReminder.find({ appt_id: { $in: ids } });
  res.status(200).json(reminders);
}, 'Failed to get Review by Organization');
