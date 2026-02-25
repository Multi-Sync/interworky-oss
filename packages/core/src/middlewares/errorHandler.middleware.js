module.exports = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  if (statusCode >= 500) console.error(err);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    error: message,
    error_details: err.isValidationError ? err.error : undefined,
    ...(res.sentry ? { sentry: res.sentry } : {}),
  });
};
