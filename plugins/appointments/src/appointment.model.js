// models/Appointment.js
const mongoose = require('mongoose');
const { Schema } = mongoose;
const { v4: uuidv4 } = require('uuid');
const HttpError = require('../../../packages/core/src/utils/HttpError');
const { APPOINTMENT_STATUS, APPOINTMENT_STATUS_ENUM } = require('./appointment.utils');

const appointmentSchema = new Schema(
  {
    id: {
      type: String,
      default: uuidv4,
      unique: true,
    },
    patient_id: {
      type: String,
      required: true,
    },
    organization_id: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: APPOINTMENT_STATUS,
      defaultValue: APPOINTMENT_STATUS_ENUM.REQUESTED,
    },
    last_notification_sent: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'appointments',
  },
);

appointmentSchema.index({ patient_id: 1, date: 1, organization_id: 1 }, { unique: true });

appointmentSchema.pre('save', async function (next) {
  const appointment = this;
  const patientExists = await mongoose.models.Patient.exists({ id: appointment.patient_id });
  if (!patientExists) {
    throw new HttpError('Patient not found').NotFound();
  }
  const organizationExists = await mongoose.models.Organization.exists({ id: appointment.organization_id });
  if (!organizationExists) {
    throw new HttpError('Organization not found').NotFound();
  }
  next();
});

appointmentSchema.pre('updateOne', async function (next) {
  const appointment = this.getUpdate();
  if (appointment.patient_id) {
    const patientExists = await mongoose.models.Patient.exists({ id: appointment.patient_id });
    if (!patientExists) {
      throw new HttpError('Patient not found').NotFound();
    }
  }
  if (appointment.organization_id) {
    const organizationExists = await mongoose.models.Organization.exists({ id: appointment.organization_id });
    if (!organizationExists) {
      throw new HttpError('Organization not found').NotFound();
    }
  }
  next();
});

module.exports = mongoose.model('Appointment', appointmentSchema);
