const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const Department = require('../models/Department');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');

// @desc    Get hospital administrative metrics & overview
// @route   GET /api/admin/metrics
// @access  Private (Admin)
exports.getHospitalMetrics = async (req, res, next) => {
  try {
    const [
      totalPatients,
      totalDoctors,
      totalDepartments,
      totalAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      recentAppointments,
      recentPatients
    ] = await Promise.all([
      PatientProfile.countDocuments(),
      DoctorProfile.countDocuments(),
      Department.countDocuments(),
      Appointment.countDocuments(),
      Appointment.countDocuments({ status: 'confirmed' }),
      Appointment.countDocuments({ status: 'completed' }),
      Appointment.countDocuments({ status: 'cancelled' }),
      Appointment.find()
        .populate({
          path: 'patientId',
          populate: { path: 'userId', select: 'name' }
        })
        .populate({
          path: 'doctorId',
          populate: { path: 'userId', select: 'name' }
        })
        .populate('departmentId', 'name code')
        .sort({ createdAt: -1 })
        .limit(5),
      PatientProfile.find()
        .populate('userId', 'name email phone createdAt')
        .sort({ createdAt: -1 })
        .limit(5)
    ]);

    res.status(200).json({
      success: true,
      data: {
        counts: {
          patients: totalPatients,
          doctors: totalDoctors,
          departments: totalDepartments,
          appointments: totalAppointments,
          confirmed: confirmedAppointments,
          completed: completedAppointments,
          cancelled: cancelledAppointments
        },
        recentAppointments,
        recentPatients
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all departments for admin (including inactive)
// @route   GET /api/admin/departments
// @access  Private (Admin)
exports.getAllDepartmentsAdmin = async (req, res, next) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    const deptsWithDoctorCount = await Promise.all(
      departments.map(async (dept) => {
        const doctorCount = await DoctorProfile.countDocuments({ departmentId: dept._id });
        return {
          ...dept.toObject(),
          doctorCount
        };
      })
    );

    res.status(200).json({
      success: true,
      count: deptsWithDoctorCount.length,
      data: deptsWithDoctorCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle department active/inactive status
// @route   PATCH /api/admin/departments/:id/toggle-status
// @access  Private (Admin)
exports.toggleDepartmentStatus = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({ success: false, message: 'Department not found' });
    }

    department.isActive = !department.isActive;
    await department.save();

    res.status(200).json({
      success: true,
      message: `Department ${department.name} is now ${department.isActive ? 'Active' : 'Deactivated'}`,
      data: department
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all doctors for admin
// @route   GET /api/admin/doctors
// @access  Private (Admin)
exports.getAllDoctorsAdmin = async (req, res, next) => {
  try {
    const doctors = await DoctorProfile.find()
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name code')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: doctors.length,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update doctor details by Admin
// @route   PUT /api/admin/doctors/:id
// @access  Private (Admin)
exports.updateDoctorAdmin = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      departmentId,
      specialization,
      qualification,
      experienceYears,
      consultationFee,
      roomNumber,
      bio,
      availableDays,
      availableTimeSlots,
      isAcceptingAppointments
    } = req.body;

    const doctorProfile = await DoctorProfile.findById(req.params.id);
    if (!doctorProfile) {
      return res.status(404).json({ success: false, message: 'Doctor profile not found' });
    }

    // Update user info if name or phone changed
    if (name || phone !== undefined) {
      const user = await User.findById(doctorProfile.userId);
      if (user) {
        if (name) user.name = name;
        if (phone !== undefined) user.phone = phone;
        await user.save();
      }
    }

    if (departmentId) doctorProfile.departmentId = departmentId;
    if (specialization) doctorProfile.specialization = specialization;
    if (qualification) doctorProfile.qualification = qualification;
    if (experienceYears !== undefined) doctorProfile.experienceYears = experienceYears;
    if (consultationFee !== undefined) doctorProfile.consultationFee = consultationFee;
    if (roomNumber !== undefined) doctorProfile.roomNumber = roomNumber;
    if (bio !== undefined) doctorProfile.bio = bio;
    if (availableDays) doctorProfile.availableDays = availableDays;
    if (availableTimeSlots) doctorProfile.availableTimeSlots = availableTimeSlots;
    if (isAcceptingAppointments !== undefined) doctorProfile.isAcceptingAppointments = isAcceptingAppointments;

    await doctorProfile.save();

    const updated = await DoctorProfile.findById(doctorProfile._id)
      .populate('userId', 'name email phone isActive')
      .populate('departmentId', 'name code');

    res.status(200).json({
      success: true,
      message: 'Doctor profile updated successfully by administrator.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all hospital appointments for Admin
// @route   GET /api/admin/appointments
// @access  Private (Admin)
exports.getAllAppointmentsAdmin = async (req, res, next) => {
  try {
    const { status, doctorId, departmentId, date, search } = req.query;
    let query = {};

    if (status) query.status = status;
    if (doctorId) query.doctorId = doctorId;
    if (departmentId) query.departmentId = departmentId;
    if (date) {
      const queryDate = new Date(date);
      queryDate.setHours(0, 0, 0, 0);
      query.appointmentDate = {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
      };
    }

    let appointments = await Appointment.find(query)
      .populate({
        path: 'patientId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate({
        path: 'doctorId',
        populate: { path: 'userId', select: 'name email phone' }
      })
      .populate('departmentId', 'name code')
      .sort({ appointmentDate: -1, createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      appointments = appointments.filter(
        (a) =>
          a.patientId?.userId?.name?.toLowerCase().includes(s) ||
          a.patientId?.patientCode?.toLowerCase().includes(s) ||
          a.doctorId?.userId?.name?.toLowerCase().includes(s) ||
          a.departmentId?.name?.toLowerCase().includes(s)
      );
    }

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update appointment status by Admin
// @route   PATCH /api/admin/appointments/:id/status
// @access  Private (Admin)
exports.updateAppointmentStatusAdmin = async (req, res, next) => {
  try {
    const { status, doctorNotes, cancellationReason } = req.body;

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status) appointment.status = status;
    if (doctorNotes !== undefined) appointment.doctorNotes = doctorNotes;
    if (cancellationReason !== undefined) appointment.cancellationReason = cancellationReason;

    await appointment.save();

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${appointment.status}`,
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all patients with search for Admin directory
// @route   GET /api/admin/patients
// @access  Private (Admin)
exports.getPatientsAdmin = async (req, res, next) => {
  try {
    const { search } = req.query;

    let patients = await PatientProfile.find()
      .populate('userId', 'name email phone isActive createdAt')
      .sort({ createdAt: -1 });

    if (search) {
      const s = search.toLowerCase();
      patients = patients.filter(
        (p) =>
          p.patientCode?.toLowerCase().includes(s) ||
          p.userId?.name?.toLowerCase().includes(s) ||
          p.userId?.email?.toLowerCase().includes(s) ||
          p.userId?.phone?.includes(s) ||
          p.bloodGroup?.toLowerCase().includes(s)
      );
    }

    res.status(200).json({
      success: true,
      count: patients.length,
      data: patients
    });
  } catch (error) {
    next(error);
  }
};
