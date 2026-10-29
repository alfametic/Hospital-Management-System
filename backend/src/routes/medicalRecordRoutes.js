const express = require('express');
const router = express.Router();
const {
  getMyMedicalRecords,
  getRecordById,
  createMedicalRecord
} = require('../controllers/medicalRecordController');
const { protect, authorize } = require('../middleware/auth');

router.get('/my-records', protect, authorize('patient'), getMyMedicalRecords);
router.post('/', protect, authorize('doctor'), createMedicalRecord);
router.get('/:id', protect, getRecordById);

module.exports = router;
