// src/modules/appointment/appointment.routes.js
const express = require('express');
const appointmentRouter = express.Router();
const appointmentController = require('./appointment.controllers');
const authenticateToken = require('../../../packages/core/src/middlewares/auth.middleware');
const {
  createAppointmentValidator,
  getAppointmentValidator,
  updateAppointmentValidator,
  deleteAppointmentValidator,
  listAppointmentsByOrganizationValidator,
} = require('./appointment.validators');

appointmentRouter.post('/', authenticateToken, createAppointmentValidator, appointmentController.createAppointment);
appointmentRouter.get('/', authenticateToken, appointmentController.listAppointments);
appointmentRouter.get(
  '/organization/:organization_id',
  authenticateToken,
  listAppointmentsByOrganizationValidator,
  appointmentController.listAppointmentsByOrganization,
);
appointmentRouter.get('/:id', authenticateToken, getAppointmentValidator, appointmentController.getAppointment);
appointmentRouter.put('/:id', authenticateToken, updateAppointmentValidator, appointmentController.updateAppointment);
appointmentRouter.delete(
  '/:id',
  authenticateToken,
  deleteAppointmentValidator,
  appointmentController.deleteAppointment,
);

module.exports = appointmentRouter;
