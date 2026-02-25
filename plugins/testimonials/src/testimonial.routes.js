// routes/testimonialRoutes.js
const express = require('express');
const testimonialRouter = express.Router();
const {
  createTestimonial,
  getTestimonial,
  updateTestimonial,
  deleteTestimonial,
  listTestimonials,
} = require('./testimonial.controllers');

const {
  createTestimonialValidator,
  getTestimonialValidator,
  updateTestimonialValidator,
  deleteTestimonialValidator,
  listTestimonialsValidator,
} = require('./testimonial.validators');

const authenticateToken = require('../../../packages/core/src/middlewares/auth.middleware');

testimonialRouter.post('/', authenticateToken, createTestimonialValidator, createTestimonial);
testimonialRouter.get('/:id', authenticateToken, getTestimonialValidator, getTestimonial);
testimonialRouter.put('/:id', authenticateToken, updateTestimonialValidator, updateTestimonial);
testimonialRouter.delete('/:id', authenticateToken, deleteTestimonialValidator, deleteTestimonial);
testimonialRouter.get('/', authenticateToken, listTestimonialsValidator, listTestimonials);

module.exports = testimonialRouter;
