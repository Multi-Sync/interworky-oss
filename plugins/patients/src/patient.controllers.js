const { asyncHandler } = require('../../../packages/core/src/utils/asyncHandler');
const HttpError = require('../../../packages/core/src/utils/HttpError');
const Patient = require('./patient.model');
const getOrganization = () => require('mongoose').model('Organization');

// Create a new patient
exports.createPatient = asyncHandler(async (req, res) => {
  const { id, organization_id } = req.body;
  const org = await getOrganization().findOne({ id: organization_id });
  if (!org) {
    throw new HttpError('Organization not found').NotFound();
  }

  // Check if patient with this id already exists
  if (id) {
    const existingPatientById = await Patient.findOne({ id });
    if (existingPatientById) {
      return res.status(200).json({ patient: existingPatientById }); // Return existing patient
    }
  }

  // Remove null/undefined email from request body to avoid index issues
  const patientData = { ...req.body };
  if (!patientData.email || patientData.email === null || patientData.email === 'null') {
    delete patientData.email;
  }

  const patient = await Patient.create(patientData);
  res.status(201).json({ patient });
}, 'Failed to create patient');

// Retrieve a patient by ID
exports.getPatient = asyncHandler(async (req, res) => {
  const patient = await Patient.findOne({ id: req.params.id });
  if (!patient) {
    throw new HttpError('Patient not found').NotFound();
  }
  res.status(200).json(patient);
}, 'Failed to get patient');

exports.getPatientByEmail = asyncHandler(async (req, res) => {
  const email = req.params.email.trim().toLowerCase();
  const patient = await Patient.findOne({ email });
  if (!patient) {
    throw new HttpError('Patient not found').NotFound();
  }
  res.status(200).json(patient);
}, 'Failed to get patient by email');

// Update a patient's details
exports.updatePatient = asyncHandler(async (req, res) => {
  const patientId = req.params.id;
  const patient = await Patient.findOne({ id: patientId });
  if (!patient) {
    throw new HttpError('Patient not found').NotFound();
  }

  // Update only provided fields
  const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'timezone'];
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      patient[field] = req.body[field];
    }
  });

  await patient.save();
  res.status(200).json(patient);
}, 'Failed to update patient');

// Delete a patient by ID
exports.deletePatient = asyncHandler(async (req, res) => {
  await Patient.findOneAndDelete({ id: req.params.id });
  res.status(204).json();
}, 'Failed to delete patient');

// List all patients
exports.listPatients = asyncHandler(async (req, res) => {
  const { limit = 10, page = 1 } = req.query;
  const patients = await Patient.find()
    .skip((parseInt(page, 10) - 1) * parseInt(limit, 10))
    .limit(parseInt(limit, 10));
  res.status(200).json(patients);
}, 'Failed to get patients');

exports.listPatientsByOrganization = asyncHandler(async (req, res) => {
  const { organization_id } = req.params;
  const { limit = 10, skip = 1, search } = req.query;
  const skipNumber = parseInt(skip, 10);
  const limitNumber = parseInt(limit, 10);

  // Build the query object for patients
  let patientQuery = { organization_id };

  // If search parameter is provided, add it to the query
  if (search) {
    patientQuery.$or = [
      { first_name: { $regex: search, $options: 'i' } },
      { last_name: { $regex: search, $options: 'i' } },
    ];
  }

  // Get total count first
  const totalCount = await Patient.countDocuments(patientQuery);

  // Find patients based on the query
  const patients = await Patient.find(patientQuery).skip(skipNumber).limit(limitNumber);

  res.status(200).json({
    patients,
    totalPages: Math.ceil(totalCount / limitNumber),
  });
}, 'Failed to get patients by organization');
