const DoctorProfile = require('../models/DoctorProfile');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const PatientProfile = require('../models/PatientProfile');
const MedicalRecord = require('../models/MedicalRecord');

// @desc    Get all doctors (public with filters)
// @route   GET /api/doctors
// @access  Public
exports.getDoctors = async (req, res, next) => {
  try {
    const { departmentId, search } = req.query;
    let query = { isAcceptingAppointments: true };

    if (departmentId) {
      query.departmentId = departmentId;
    }

    let doctors = await DoctorProfile.find(query)
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name code icon');

    // Optional name/specialization search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter(doc =>
        (doc.userId && searchRegex.test(doc.userId.name)) ||
        searchRegex.test(doc.specialization) ||
        (doc.departmentId && searchRegex.test(doc.departmentId.name))
      );
    }

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor by ID (public)
// @route   GET /api/doctors/:id
// @access  Public
exports.getDoctorById = async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findById(req.params.id)
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name code icon description');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current doctor's profile
// @route   GET /api/doctors/me/profile
// @access  Private (Doctor)
exports.getMyDoctorProfile = async (req, res, next) => {
  try {
    const doctor = await DoctorProfile.findOne({ userId: req.user._id })
      .populate('userId', 'name email phone')
      .populate('departmentId', 'name code icon');

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor schedule & slots
// @route   PUT /api/doctors/me/schedule
// @access  Private (Doctor)
exports.updateMySchedule = async (req, res, next) => {
  try {
    const { availableDays, availableTimeSlots, maxPatientsPerDay, isAcceptingAppointments, roomNumber, consultationFee, bio } = req.body;

    const doctor = await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found'
      });
    }

    if (availableDays) doctor.availableDays = availableDays;
    if (availableTimeSlots) doctor.availableTimeSlots = availableTimeSlots;
    if (maxPatientsPerDay !== undefined) doctor.maxPatientsPerDay = maxPatientsPerDay;
    if (isAcceptingAppointments !== undefined) doctor.isAcceptingAppointments = isAcceptingAppointments;
    if (roomNumber !== undefined) doctor.roomNumber = roomNumber;
    if (consultationFee !== undefined) doctor.consultationFee = consultationFee;
    if (bio !== undefined) doctor.bio = bio;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: 'Schedule updated successfully',
      data: doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Admin: Create new doctor user and profile
// @route   POST /api/doctors
// @access  Private (Admin)
exports.createDoctorByAdmin = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      departmentId,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      roomNumber,
      bio,
      availableDays,
      availableTimeSlots
    } = req.body;

    if (!name || !email || !password || !departmentId || !specialization || !qualification) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, password, department, specialization, and qualification are required.'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists.'
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'doctor',
      phone: phone || ''
    });

    const doctorProfile = await DoctorProfile.create({
      userId: user._id,
      departmentId,
      specialization,
      qualification,
      experienceYears: experienceYears || 0,
      consultationFee: consultationFee || 50,
      roomNumber: roomNumber || 'OPD-101',
      bio: bio || '',
      availableDays: availableDays || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      availableTimeSlots: availableTimeSlots || [
        '09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00',
        '14:00 - 14:30', '14:30 - 15:00', '15:00 - 15:30'
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Doctor account and profile created successfully',
      data: {
        userId: user._id,
        name: user.name,
        email: user.email,
        doctorProfile
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in doctor's appointments
// @route   GET /api/doctors/me/appointments
// @access  Private (Doctor)
exports.getMyDoctorAppointments = async (req, res, next) => {
  try {
    const doctorProfile = req.doctorProfile || await DoctorProfile.findOne({ userId: req.user._id });
    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Doctor profile not found.'
      });
    }

    const { date, status } = req.query;
    let query = { doctorId: doctorProfile._id };

    if (status) {
      query.status = status;
    }

    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      query.appointmentDate = {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    const appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('departmentId', 'name code')
      .sort({ appointmentDate: 1, timeSlot: 1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Look up patient by opaque QR patientCode & return authorized medical history
// @route   GET /api/doctors/lookup-patient/:patientCode
// @access  Private (Doctor, Admin)
exports.lookupPatientByCode = async (req, res, next) => {
  try {
    const { patientCode } = req.params;

    if (!patientCode) {
      return res.status(400).json({
        success: false,
        message: 'Patient code is required.'
      });
    }

    let cleanCode = (patientCode || '').trim();
    const match = cleanCode.match(/(PAT-\d{4}-[A-Z0-9]+)/i);
    if (match) {
      cleanCode = match[1].toUpperCase();
    } else {
      cleanCode = cleanCode.toUpperCase();
    }

    const patient = await PatientProfile.findOne({ patientCode: cleanCode })
      .populate('userId', 'name email phone');

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: `No clinical record found for patient code: ${cleanCode}. Please verify the QR identifier.`
      });
    }

    // Chronological medical records
    const records = await MedicalRecord.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email' },
          { path: 'departmentId', select: 'name code' }
        ]
      })
      .sort({ visitDate: -1, createdAt: -1 });

    // Appointments history for this patient
    const appointments = await Appointment.find({ patientId: patient._id })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name' }
      })
      .populate('departmentId', 'name code')
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      patient,
      records,
      appointments
    });
  } catch (error) {
    next(error);
  }
};
