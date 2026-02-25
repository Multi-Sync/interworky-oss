const PostVisitationReminder = require('./post_visitation_reminder.model');
const { models: { Appointment } } = require('@interworky/plugin-appointments');
const { asyncHandler } = require('../../../packages/core/src/utils/asyncHandler');
const HttpError = require('../../../packages/core/src/utils/HttpError');

// Create a new post visitation reminder
exports.createPostVisitationReminder = asyncHandler(async (req, res) => {
  const postVisitationReminder = await PostVisitationReminder.create(req.body);
  res.status(201).json({ postVisitationReminder });
}, 'Failed to create post visitation reminder');

// List all post visitation reminders
exports.listPostVisitationReminders = asyncHandler(async (req, res) => {
  const postVisitationReminder = await PostVisitationReminder.find();
  res.status(200).json(postVisitationReminder);
}, 'Failed to list post visitation reminders');

// Retrieve a post visitation reminder by ID
exports.getPostVisitationReminder = asyncHandler(async (req, res) => {
  const postVisitationReminder = await PostVisitationReminder.findOne({ id: req.params.id });
  if (!postVisitationReminder) {
    throw new HttpError('Post visitation reminder not found').NotFound();
  }
  res.status(200).json(postVisitationReminder);
}, 'Failed to get post visitation reminder by ID');

exports.getPostVisitationReminderByOrganizationId = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find({ organization_id: req.params.organization_id }).lean();
  const postVisitationReminders = await PostVisitationReminder.find({
    appt_id: { $in: appointments.map(appointment => appointment.id) },
  }).lean();

  if (!postVisitationReminders || postVisitationReminders.length === 0) {
    throw new HttpError('Post visitation reminder not found').NotFound();
  }
  postVisitationReminders.forEach(async postVisitationReminder => {
    const appointment = appointments.find(appointment => appointment.id === postVisitationReminder.appt_id);
    postVisitationReminder.appointment = appointment;
  });
  res.status(200).json(postVisitationReminders);
}, 'Failed to get post visitation reminder by organization ID');

// Update an post visitation reminder's details
exports.updatePostVisitationReminder = asyncHandler(async (req, res) => {
  const postVisitationReminder = await PostVisitationReminder.findOneAndUpdate({ id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!postVisitationReminder) {
    throw new HttpError('Post visitation reminder not found').NotFound();
  }
  res.status(200).json(postVisitationReminder);
}, 'Failed to update post visitation reminder');

// Delete an post visitation reminder by ID
exports.deletePostVisitationReminder = asyncHandler(async (req, res) => {
  const postVisitationReminder = await PostVisitationReminder.findOneAndDelete({ id: req.params.id });
  if (!postVisitationReminder) {
    throw new HttpError('Post visitation reminder not found').NotFound();
  }
  res.status(204).json();
}, 'Failed to delete post visitation reminder');
