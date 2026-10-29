const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const aiRateLimiter = require('../middleware/rateLimiter');
const { recommendDepartment } = require('../controllers/aiController');

// Public endpoint with upload middleware and rate limiting
router.post(
  '/recommend-department',
  aiRateLimiter({ windowMs: 15 * 60 * 1000, max: 30 }),
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          message: err.message || 'File upload error. Please ensure the image is under 5MB (JPEG, PNG, WEBP).'
        });
      }
      next();
    });
  },
  recommendDepartment
);

module.exports = router;
