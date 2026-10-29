const express = require('express');
const router = express.Router();
const {
  registerPatient,
  login,
  getMe,
  updateProfile,
  getMyQRCode,
  verifyPatientCode
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register-patient', registerPatient);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/my-qr', protect, getMyQRCode);
router.get('/verify-patient/:patientCode', verifyPatientCode);
router.put('/update-profile', protect, updateProfile);

module.exports = router;
