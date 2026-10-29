const express = require('express');
const router = express.Router();
const {
  getHospitalMetrics,
  getAllDepartmentsAdmin,
  toggleDepartmentStatus,
  getAllDoctorsAdmin,
  updateDoctorAdmin,
  getAllAppointmentsAdmin,
  updateAppointmentStatusAdmin,
  getPatientsAdmin
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All routes here strictly require Admin role
router.use(protect, authorize('admin'));

router.get('/metrics', getHospitalMetrics);

// Department management
router.get('/departments', getAllDepartmentsAdmin);
router.patch('/departments/:id/toggle-status', toggleDepartmentStatus);

// Doctor management
router.get('/doctors', getAllDoctorsAdmin);
router.put('/doctors/:id', updateDoctorAdmin);

// Appointment management
router.get('/appointments', getAllAppointmentsAdmin);
router.patch('/appointments/:id/status', updateAppointmentStatusAdmin);

// Patient directory
router.get('/patients', getPatientsAdmin);

module.exports = router;
