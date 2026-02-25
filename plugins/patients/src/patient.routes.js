const express = require('express');
const patientsRouter = express.Router();
const patientController = require('./patient.controllers');
const authenticateToken = require('../../../packages/core/src/middlewares/auth.middleware');
const {
  createPatientValidator,
  deletePatientValidator,
  getPatientValidator,
  updatePatientValidator,
  getPatientByEmailValidator,
  getPatientListValidator,
} = require('./patient.validators');

patientsRouter.post('/', authenticateToken, createPatientValidator, patientController.createPatient);
patientsRouter.get('/', authenticateToken, getPatientListValidator, patientController.listPatients);
patientsRouter.get('/organization/:organization_id', authenticateToken, patientController.listPatientsByOrganization);
patientsRouter.get('/email/:email', authenticateToken, getPatientByEmailValidator, patientController.getPatientByEmail);
patientsRouter.get('/:id', authenticateToken, getPatientValidator, patientController.getPatient);
patientsRouter.put('/:id', authenticateToken, updatePatientValidator, patientController.updatePatient);
patientsRouter.delete('/:id', authenticateToken, deletePatientValidator, patientController.deletePatient);

module.exports = patientsRouter;
