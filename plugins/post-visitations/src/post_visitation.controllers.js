const PostVisitation = require('./post_visitation.model');
const { asyncHandler } = require('../../../packages/core/src/utils/asyncHandler');
const HttpError = require('../../../packages/core/src/utils/HttpError');
const { models: { Appointment }, services: { sendUpdateAppointmentNotification, NotificationDispatcher }, utils: { APPOINTMENT_STATUS_ENUM } } = require('@interworky/plugin-appointments');
const { models: { Patient } } = require('@interworky/plugin-patients');
const getOrganization = () => require('mongoose').model('Organization');
const getUser = () => require('mongoose').model('User');
// Create a new post visitation
exports.createPostVisitation = asyncHandler(async (req, res) => {
  const appointment = await Appointment.findOne({ id: req.body.appointment_id }).lean();
  if (!appointment) {
    throw new HttpError('Appointment not found').NotFound();
  }
  const postVisitationExists = await PostVisitation.exists({ appointment_id: req.body.appointment_id });
  if (postVisitationExists) {
    throw new HttpError('Post visitation already exists').Conflict();
  }
  const patient = await Patient.findOne({ id: appointment.patient_id }).lean();
  const organization = await getOrganization().findOne({ id: appointment.organization_id }).lean();
  const creator = await getUser().findOne({ id: organization.creator_user_id }).lean();
  await Appointment.updateOne({ id: appointment.id }, { status: APPOINTMENT_STATUS_ENUM.FEEDBACK_COLLECTED });
  const postVisitation = await PostVisitation.create(req.body);
  res.status(201).json({ postVisitation });
  await sendUpdateAppointmentNotification({
    appointment: {
      ...appointment,
      status: APPOINTMENT_STATUS_ENUM.FEEDBACK_COLLECTED,
    },
    oldAppointment: appointment,
    organization,
    patient,
    creator,
    NotificationDispatcher,
  });
}, 'Failed to create post visitation');

// List all post visitation
exports.listPostVisitation = asyncHandler(async (req, res) => {
  const postVisitation = await PostVisitation.find();
  res.status(200).json(postVisitation);
}, 'Failed to list post visitation');

// Retrieve a post visitation by ID
exports.getPostVisitation = asyncHandler(async (req, res) => {
  const postVisitation = await PostVisitation.findOne({ id: req.params.id });
  if (!postVisitation) {
    throw new HttpError('Post visitation not found').NotFound();
  }
  res.status(200).json(postVisitation);
}, 'Failed to get post visitation by ID');

// Update an post visitation details
exports.updatePostVisitation = asyncHandler(async (req, res) => {
  const postVisitation = await PostVisitation.findOneAndUpdate({ id: req.params.id }, req.body, {
    new: true,
    runValidators: true,
  });
  if (!postVisitation) {
    throw new HttpError('Post visitation not found').NotFound();
  }
  res.status(200).json(postVisitation);
}, 'Failed to update post visitation');

// list post visitation by organization
exports.listPostVisitationsByOrganization = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { limit = 10, skip = 0 } = req.query;
  const skipNumber = parseInt(skip, 10);
  const limitNumber = parseInt(limit, 10);

  const appointments = await Appointment.find({ organization_id }).lean();
  const appointmentsIds = appointments.map(appointment => appointment.id);
  const patientsIds = appointments.map(appointment => appointment.patient_id);
  const totalCount = await PostVisitation.countDocuments({ appointment_id: { $in: appointmentsIds } });
  const totalPages = Math.ceil(totalCount / limitNumber);

  const postVisitations = await PostVisitation.find({ appointment_id: { $in: appointmentsIds } })
    .skip(skipNumber)
    .limit(limitNumber)
    .lean();

  const patients = await Patient.find({
    id: { $in: patientsIds },
  }).lean();
  const patientsMap = new Map(patients.map(patient => [patient.id, patient]));
  const appointmentsMap = new Map(appointments.map(appointment => [appointment.id, appointment]));
  const enrichedPostVisitations = postVisitations.map(postVisitation => ({
    ...postVisitation,
    patient: patientsMap.get(appointmentsMap.get(postVisitation.appointment_id).patient_id),
    appointment: appointmentsMap.get(postVisitation.appointment_id),
  }));
  res.status(200).json({
    postVisitations: enrichedPostVisitations,
    totalPages,
  });
}, 'Failed to list post visitations by organization');

// Delete an post visitation by ID
exports.deletePostVisitation = asyncHandler(async (req, res) => {
  const postVisitation = await PostVisitation.findOneAndDelete({ id: req.params.id });
  if (!postVisitation) {
    throw new HttpError('Post visitation not found').NotFound();
  }
  res.status(204).json();
}, 'Failed to delete post visitation');
