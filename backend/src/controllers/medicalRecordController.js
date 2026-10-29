const MedicalRecord = require('../models/MedicalRecord');
const PatientProfile = require('../models/PatientProfile');
const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');

// @desc    Get patient's chronological medical records
// @route   GET /api/records/my-records
// @access  Private (Patient)
exports.getMyMedicalRecords = async (req, res, next) => {
  try {
    const patientProfile = req.patientProfile;
    if (!patientProfile) {
      return res.status(403).json({
        success: false,
        message: 'Patient profile not found.'
      });
    }

    const records = await MedicalRecord.find({ patientId: patientProfile._id })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'departmentId', select: 'name code icon' }
        ]
      })
      .sort({ visitDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single medical record by ID
// @route   GET /api/records/:id
// @access  Private (Patient owner, or Doctor/Admin)
exports.getRecordById = async (req, res, next) => {
  try {
    const record = await MedicalRecord.findById(req.params.id)
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'departmentId', select: 'name code icon' }
        ]
      })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'Medical record not found.'
      });
    }

    // Role check: If patient, must be the owner
    if (req.user.role === 'patient') {
      if (!req.patientProfile || String(record.patientId._id) !== String(req.patientProfile._id)) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: You can only access your own medical records.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new medical record / consultation notes (Doctor)
// @route   POST /api/records
// @access  Private (Doctor)
exports.createMedicalRecord = async (req, res, next) => {
  try {
    const doctorProfile = req.doctorProfile || await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(403).json({
        success: false,
        message: 'Doctor profile required to create medical records.'
      });
    }

    const {
      patientId,
      appointmentId,
      chiefComplaints,
      diagnosis,
      clinicalNotes,
      vitalSigns,
      prescriptions,
      labReports,
      followUpDate
    } = req.body;

    if (!patientId || !chiefComplaints || !diagnosis) {
      return res.status(400).json({
        success: false,
        message: 'Patient, chief complaints, and diagnosis are required.'
      });
    }

    // Verify patient profile exists
    const patient = await PatientProfile.findById(patientId);
    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient not found.'
      });
    }

    // Create Medical Record
    const record = await MedicalRecord.create({
      patientId,
      doctorId: doctorProfile._id,
      appointmentId: appointmentId || null,
      visitDate: new Date(),
      chiefComplaints,
      diagnosis,
      clinicalNotes: clinicalNotes || '',
      vitalSigns: vitalSigns || {},
      prescriptions: Array.isArray(prescriptions) ? prescriptions : [],
      labReports: Array.isArray(labReports) ? labReports : [],
      followUpDate: followUpDate || null
    });

    // If an appointment was linked, mark it as completed
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        status: 'completed',
        doctorNotes: `Consultation completed on ${new Date().toLocaleDateString()}. Diagnosis: ${diagnosis}`
      });
    }

    const populatedRecord = await MedicalRecord.findById(record._id)
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'departmentId', select: 'name code' }
        ]
      })
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' }
      });

    res.status(201).json({
      success: true,
      message: 'Clinical medical record documented successfully.',
      data: populatedRecord
    });
  } catch (error) {
    next(error);
  }
};
