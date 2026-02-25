const multer = require('multer');
const HttpError = require('../utils/HttpError');
// File validation middleware
const validateFileUpload = (req, res, next) => {
  // Check if file exists
  if (!req.file) {
    throw new HttpError('Please upload a file').BadRequest();
  }
  next();
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    // also allow text files
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'text/plain'];
    if (!allowedTypes.includes(file.mimetype)) {
      return cb(new HttpError('Invalid file type. Only JPG, PNG, GIF and WebP images are allowed').BadRequest(), false);
    }
    cb(null, true);
  },
});

module.exports = {
  uploadFile: upload.single('file'),
  validateFileUpload,
};
