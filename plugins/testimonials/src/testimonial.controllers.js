// controllers/TestimonialController.js
const Testimonial = require('./testimonial.model');
const { asyncHandler } = require('../../../packages/core/src/utils/asyncHandler');
const HttpError = require('../../../packages/core/src/utils/HttpError');

// Create a new testimonial
exports.createTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.create(req.body);
  res.status(201).send(testimonial);
});

// Retrieve a testimonial by ID
exports.getTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findById(req.params.id);
  if (!testimonial) {
    throw new HttpError('testimonial not found').NotFound();
  }
  res.status(200).send(testimonial);
});

// Update a testimonial's details
exports.updateTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!testimonial) {
    throw new HttpError('testimonial not found').NotFound();
  }
  res.status(200).send(testimonial);
});

// Delete a testimonial by ID
exports.deleteTestimonial = asyncHandler(async (req, res) => {
  const testimonial = await Testimonial.findByIdAndDelete(req.params.id);
  if (!testimonial) {
    throw new HttpError('testimonial not found').NotFound();
  }
  res.status(204).send();
});

// List all testimonials
exports.listTestimonials = asyncHandler(async (req, res) => {
  const testimonials = await Testimonial.find({});
  res.status(200).send(testimonials);
});
