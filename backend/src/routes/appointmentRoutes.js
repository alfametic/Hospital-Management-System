const express = require('express');
const router = express.Router();
const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  getBookedSlots
} = require('../controllers/appointmentController');
const { protect, authorize } = require('../middleware/auth');

// Public or Authenticated slot lookup
router.get('/booked-slots', getBookedSlots);

// Patient specific routes
router.post('/', protect, authorize('patient'), bookAppointment);
router.get('/my-appointments', protect, authorize('patient'), getMyAppointments);
router.put('/:id/cancel', protect, cancelAppointment);

module.exports = router;
