const { validationResult, matchedData } = require('express-validator');
const HttpError = require('./HttpError');
const moment = require('moment-timezone');

exports.isValidTimezone = timezone => {
  return moment.tz.zone(timezone) !== null;
};

exports.handleValidationErrors = (req, _res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new HttpError('Validation failed', errors.array()).ValidationError();
    return _res.status(400).json(error);
  }
  next();
};

exports.strict = (req, _res, next) => {
  req.body = matchedData(req, {
    locations: ['body'],
    onlyValidData: true,
    // includeOptionals: true,
  });

  req.params = matchedData(req, {
    locations: ['params'],
    onlyValidData: true,
    // includeOptionals: true,
  });

  req.query = matchedData(req, {
    locations: ['query'],
    onlyValidData: true,
    // includeOptionals: true,
  });
  next();
};

exports.createStrictValidator = schema => {
  return [schema, exports.handleValidationErrors, exports.strict];
};
