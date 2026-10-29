const express = require('express');
const router = express.Router();
const {
  getDoctors,
  getDoctorById,
  getMyDoctorProfile,
  updateMySchedule,
  createDoctorByAdmin,
  getMyDoctorAppointments,
  lookupPatientByCode
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', getDoctors);
router.get('/me/profile', protect, authorize('doctor'), getMyDoctorProfile);
router.get('/me/appointments', protect, authorize('doctor'), getMyDoctorAppointments);
router.put('/me/schedule', protect, authorize('doctor'), updateMySchedule);
router.get('/lookup-patient/:patientCode', protect, authorize('doctor', 'admin'), lookupPatientByCode);
router.get('/:id', getDoctorById);
router.post('/', protect, authorize('admin'), createDoctorByAdmin);

module.exports = router;
