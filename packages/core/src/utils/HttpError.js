class HttpError extends Error {
  statusCode;
  isValidationError = false;
  error;

  setAsValidationError() {
    this.isValidationError = true;
  }

  constructor(message, err) {
    super(message);
    this.statusCode = 500; // Default status code
    this.error = err;
    Error.captureStackTrace(this, this.constructor);
  }

  ValidationError() {
    this.isValidationError = true;
    this.statusCode = 422;
    return this; // Enable method chaining
  }

  Conflict() {
    this.statusCode = 409;
    return this; // Enable method chaining
  }

  Unauthorized() {
    this.statusCode = 401;
    return this; // Enable method chaining
  }

  Forbidden() {
    this.statusCode = 403;
    return this; // Enable method chaining
  }

  BadRequest() {
    this.statusCode = 400;
    return this; // Enable method chaining
  }

  // Example: Additional methods for other status codes
  NotFound() {
    this.statusCode = 404;
    return this;
  }

  InternalServerError() {
    this.statusCode = 500;
    return this;
  }

  TooManyRequests() {
    this.statusCode = 429;
    return this;
  }

  NotImplemented() {
    this.statusCode = 501;
    return this;
  }

  log(errorLogStream) {
    errorLogStream.write(
      `Time: ${new Date().toLocaleString()} Error Message: ${this.message} Error: ${this.error} Error Stack:${
        this.stack
      }\n`,
    );
  }
}

module.exports = HttpError;
