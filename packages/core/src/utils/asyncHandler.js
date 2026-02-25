const HttpError = require('./HttpError');
// eslint-disable-next-line no-unused-vars
const { Request, Response, NextFunction } = require('express');

/**
 * A higher-order function that wraps an asynchronous function and handles errors.
 *
 * @param {Function} fn - The asynchronous function to wrap.
 * @param {string} [errorMessage] - The error message to use if an error occurs.
 * @returns {Function} - A function that takes Express req, res, and next parameters.
 */
exports.asyncHandler = (fn, errorMessage) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      if (err instanceof HttpError) {
        next(err);
      } else {
        next(new HttpError(errorMessage || 'Internal Server Error', err).InternalServerError());
      }
    }
  };
};
