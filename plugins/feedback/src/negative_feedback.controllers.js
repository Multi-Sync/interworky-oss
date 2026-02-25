const HttpError = require('../../../packages/core/src/utils/HttpError');
const NegativeFeedback = require('./negative_feedback.model');
const { asyncHandler } = require('../../../packages/core/src/utils/asyncHandler');

const createNegativeFeedback = asyncHandler(async (req, res) => {
  const feedback = await NegativeFeedback.create(req.body);
  res.status(201).json({ feedback });
}, 'Failed to create Negative Feedback');

const getNegativeFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feedback = await NegativeFeedback.findById(id);
  if (!feedback) {
    throw new HttpError('Negative feedback not found').NotFound();
  }
  res.status(200).json({ feedback });
}, 'Failed to retrieve Negative Feedback');

const updateNegativeFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feedback = await NegativeFeedback.findByIdAndUpdate(id, req.body, { new: true, runValidators: true });
  if (!feedback) {
    throw new HttpError('Negative feedback not found').NotFound();
  }
  res.status(200).json(feedback);
}, 'Failed to update Negative Feedback');

const deleteNegativeFeedback = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const feedback = await NegativeFeedback.findByIdAndDelete(id);
  if (!feedback) {
    throw new HttpError('Negative feedback not found').NotFound();
  }
  res.status(204).send();
}, 'Failed to delete Negative Feedback');

const listNegativeFeedback = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const feedbacks = await NegativeFeedback.find()
    .skip((pageNumber - 1) * limitNumber)
    .limit(limitNumber);
  const totalFeedbacks = await NegativeFeedback.countDocuments();

  res.status(200).json({
    total: totalFeedbacks,
    page: pageNumber,
    limit: limitNumber,
    feedbacks,
  });
}, 'Failed to list Negative Feedbacks');
module.exports = {
  createNegativeFeedback,
  getNegativeFeedback,
  updateNegativeFeedback,
  deleteNegativeFeedback,
  listNegativeFeedback,
};
