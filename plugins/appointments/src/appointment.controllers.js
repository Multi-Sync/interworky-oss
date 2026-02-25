const Appointment = require('./appointment.model');
const { asyncHandler } = require('../../../packages/core/src/utils/asyncHandler');
const HttpError = require('../../../packages/core/src/utils/HttpError');
const mongoose = require('mongoose');
// Lazy lookups — these models are registered by other plugins/core at boot time
const getPatient = () => mongoose.model('Patient');
const getOrganization = () => mongoose.model('Organization');
const getUser = () => mongoose.model('User');

const { NotificationDispatcher } = require('./appointment_notification/appointment_notification.service');
const { statusOrder, formatAppointmentData } = require('./appointment.utils');
const { sendUpdateAppointmentNotification } = require('./appointment.services');

// Create a new appointment
exports.createAppointment = asyncHandler(async (req, res) => {
  const { body } = req;
  const appointmentDate = new Date(body.date).toISOString();
  // Fetch related data
  const patient = await getPatient().findOne({ id: body.patient_id }).lean();
  const organization = await getOrganization().findOne({ id: body.organization_id }).lean();
  if (!patient || !organization) {
    throw new HttpError('Patient or Organization not found').NotFound();
  }

  // Retrieve the creator user (doctor) information
  const doctor = await getUser().findOne({ id: organization.creator_user_id }).lean();

  if (!doctor) {
    throw new HttpError('Doctor (creator user) not found').NotFound();
  }
  const appointment = await Appointment.create({ ...body, date: appointmentDate });
  const dispatcher = new NotificationDispatcher();
  const { data, recipients } = formatAppointmentData(appointment, patient, doctor, organization);
  dispatcher.dispatch(appointment.status, data, recipients);
  res.status(201).json({ appointment });
}, 'Failed to create appointment');

// List all appointments
exports.listAppointments = asyncHandler(async (req, res) => {
  const appointments = await Appointment.find().lean();
  if (!appointments || appointments.length === 0) {
    res.status(200).json([]);
  }
  const patientPromises = appointments.map(appointment =>
    getPatient().findOne({ id: appointment.patient_id })
      .lean()
      .then(patient => {
        appointment.patient = patient;
      }),
  );
  await Promise.all(patientPromises);

  res.status(200).json(appointments);
}, 'Failed to list appointments');

exports.listAppointmentsByOrganization = asyncHandler(async (req, res) => {
  let { skip = 0, limit = 10, status, search } = req.query;
  skip = parseInt(skip, 10);
  limit = parseInt(limit, 10);
  if (status && JSON.parse(status).length > 0) status = JSON.parse(status);
  else status = null;

  // Implement search functionality
  let patientQuery = {};

  if (search) {
    patientQuery.$or = [
      { first_name: { $regex: search, $options: 'i' } },
      { last_name: { $regex: search, $options: 'i' } },
    ];
  }
  const patients = await getPatient().find(patientQuery).lean();
  if (!patients || patients.length === 0) {
    res.status(200).json({ appointments: [], totalPages: 0 });
    return;
  }
  const patientIds = patients.map(patient => patient.id);

  const appointments = await Appointment.aggregate([
    {
      $match: {
        organization_id: req.params.organization_id,
        ...(status && { status: { $in: status } }),
        ...(search && { patient_id: { $in: patientIds } }),
      },
    },
    {
      $lookup: {
        from: 'patients',
        localField: 'patient_id',
        foreignField: 'id',
        as: 'patient',
      },
    },
    {
      $addFields: {
        statusOrder: {
          $indexOfArray: [statusOrder, '$status'],
        },
      },
    },
    {
      $sort: { statusOrder: 1 },
    },
    {
      $project: {
        statusOrder: 0,
      },
    },
    {
      $unwind: '$patient',
    },
    {
      $skip: skip,
    },
    {
      $limit: limit,
    },
  ]);

  if (!appointments || appointments.length === 0) {
    res.status(200).json({ appointments: [], totalPages: 0 });
    return;
  }

  const total = await Appointment.countDocuments({
    organization_id: req.params.organization_id,
    ...(status && { status: { $in: status } }),
    ...(search && { patient_id: { $in: patientIds } }),
  });

  res.status(200).json({ appointments, totalPages: Math.ceil(total / limit) });
}, 'Failed to list appointments by organization');

// Retrieve an appointment by ID
exports.getAppointment = asyncHandler(async (req, res) => {
  let appointment = await Appointment.findOne({ id: req.params.id }).lean();
  if (!appointment) {
    throw new HttpError('Appointment not found').NotFound();
  }
  appointment.patient = await getPatient().findOne({ id: appointment.patient_id }).lean();
  res.status(200).json(appointment);
}, 'Failed to get appointment by ID');

// Update an appointment's details
exports.updateAppointment = asyncHandler(async (req, res) => {
  const { body } = req;
  const appointmentId = req.params.id;
  if (body.date) {
    body.date = new Date(body.date).toISOString();
  }
  const oldAppointment = await Appointment.findOneAndUpdate({ id: appointmentId }, body, {
    runValidators: true,
  });
  if (!oldAppointment) {
    throw new HttpError('Appointment not found').NotFound();
  }
  const appointment = await Appointment.findOne({ id: appointmentId }).lean();
  const organization = await getOrganization().findOne({ id: appointment.organization_id }).lean();
  const [patient, creator] = await Promise.all([
    getPatient().findOne({ id: appointment.patient_id }).lean(),
    getUser().findOne({ id: organization.creator_user_id }).lean(),
  ]);
  await sendUpdateAppointmentNotification({
    appointment,
    oldAppointment,
    organization,
    patient,
    creator,
    NotificationDispatcher,
  });
  res.status(200).json(appointment);
}, 'Failed to update appointment');

// Delete an appointment by ID
exports.deleteAppointment = asyncHandler(async (req, res) => {
  await Appointment.findOneAndDelete({ id: req.params.id });
  res.status(204).json();
}, 'Failed to delete appointment');
