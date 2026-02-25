const express = require('express');
const negativeFeedbackRouter = express.Router();

const authenticateToken = require('../../../packages/core/src/middlewares/auth.middleware');
const {
  getNegativeFeedbackValidator,
  updateNegativeFeedbackValidator,
  deleteNegativeFeedbackValidator,
  listNegativeFeedbackValidator,
  createNegativeFeedbackValidator,
} = require('./negative_feedback.validators');
const {
  createNegativeFeedback,
  getNegativeFeedback,
  updateNegativeFeedback,
  deleteNegativeFeedback,
  listNegativeFeedback,
} = require('./negative_feedback.controllers');

negativeFeedbackRouter.post('/', authenticateToken, createNegativeFeedbackValidator, createNegativeFeedback);

negativeFeedbackRouter.get('/:id', authenticateToken, getNegativeFeedbackValidator, getNegativeFeedback);

negativeFeedbackRouter.put('/:id', authenticateToken, updateNegativeFeedbackValidator, updateNegativeFeedback);

negativeFeedbackRouter.delete('/:id', authenticateToken, deleteNegativeFeedbackValidator, deleteNegativeFeedback);

negativeFeedbackRouter.get('/', authenticateToken, listNegativeFeedbackValidator, listNegativeFeedback);

module.exports = negativeFeedbackRouter;
