const Appointment = require('../models/Appointment');
const DoctorProfile = require('../models/DoctorProfile');
const Department = require('../models/Department');

// @desc    Book a new appointment (Patient)
// @route   POST /api/appointments
// @access  Private (Patient)
exports.bookAppointment = async (req, res, next) => {
  try {
    const patientProfile = req.patientProfile;
    if (!patientProfile) {
      return res.status(403).json({
        success: false,
        message: 'Patient profile not found. You must be a registered patient to book appointments.'
      });
    }

    const { doctorId, departmentId, appointmentDate, timeSlot, reason } = req.body;

    if (!doctorId || !departmentId || !appointmentDate || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: 'Doctor, department, appointment date, and time slot are required.'
      });
    }

    // Validate Doctor
    const doctor = await DoctorProfile.findById(doctorId).populate('userId', 'name');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Selected doctor profile was not found.'
      });
    }

    if (!doctor.isAcceptingAppointments) {
      return res.status(400).json({
        success: false,
        message: 'This doctor is currently not accepting new appointments.'
      });
    }

    // Normalize date to YYYY-MM-DD start of day
    const bookingDate = new Date(appointmentDate);
    bookingDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (bookingDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Appointments cannot be booked for past dates.'
      });
    }

    // Verify doctor works on this day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayOfWeek = days[bookingDate.getDay()];
    if (doctor.availableDays && doctor.availableDays.length > 0 && !doctor.availableDays.includes(dayOfWeek)) {
      return res.status(400).json({
        success: false,
        message: `Dr. ${doctor.userId?.name || 'Physician'} is not available on ${dayOfWeek}s. Available days: ${doctor.availableDays.join(', ')}`
      });
    }

    // Verify time slot is in doctor's valid slots
    if (doctor.availableTimeSlots && doctor.availableTimeSlots.length > 0 && !doctor.availableTimeSlots.includes(timeSlot)) {
      return res.status(400).json({
        success: false,
        message: `Selected slot (${timeSlot}) is not a valid consultation time for this doctor.`
      });
    }

    // Check for double booking conflict
    const existingConflict = await Appointment.findOne({
      doctorId: doctor._id,
      appointmentDate: {
        $gte: bookingDate,
        $lt: new Date(bookingDate.getTime() + 24 * 60 * 60 * 1000)
      },
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (existingConflict) {
      return res.status(409).json({
        success: false,
        message: `The slot (${timeSlot}) on ${bookingDate.toLocaleDateString()} has already been booked. Please choose another time slot.`
      });
    }

    // Create Appointment
    const appointment = await Appointment.create({
      patientId: patientProfile._id,
      doctorId: doctor._id,
      departmentId,
      appointmentDate: bookingDate,
      timeSlot,
      status: 'confirmed',
      reason: reason || 'Routine Clinical Consultation'
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'departmentId', select: 'name code icon' }
        ]
      })
      .populate('departmentId', 'name code icon');

    res.status(201).json({
      success: true,
      message: 'Appointment confirmed successfully.',
      data: populatedAppointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get patient's appointments (Patient)
// @route   GET /api/appointments/my-appointments
// @access  Private (Patient)
exports.getMyAppointments = async (req, res, next) => {
  try {
    const patientProfile = req.patientProfile;
    if (!patientProfile) {
      return res.status(403).json({
        success: false,
        message: 'Patient profile not found.'
      });
    }

    const appointments = await Appointment.find({ patientId: patientProfile._id })
      .populate({
        path: 'doctorId',
        populate: [
          { path: 'userId', select: 'name email phone' },
          { path: 'departmentId', select: 'name code icon' }
        ]
      })
      .populate('departmentId', 'name code icon')
      .sort({ appointmentDate: -1, createdAt: -1 });

    res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment (Patient or Doctor/Admin)
// @route   PUT /api/appointments/:id/cancel
// @access  Private
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { reason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    // Role check: If patient, must be the owner
    if (req.user.role === 'patient') {
      if (!req.patientProfile || String(appointment.patientId) !== String(req.patientProfile._id)) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to cancel this appointment.'
        });
      }
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        message: 'This appointment is already cancelled.'
      });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Completed appointments cannot be cancelled.'
      });
    }

    appointment.status = 'cancelled';
    appointment.cancellationReason = reason || 'Cancelled by patient';
    await appointment.save();

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully.',
      data: appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get booked slots for doctor on a specific date (Real-time availability check)
// @route   GET /api/appointments/booked-slots
// @access  Public or Authenticated
exports.getBookedSlots = async (req, res, next) => {
  try {
    const { doctorId, date } = req.query;

    if (!doctorId || !date) {
      return res.status(400).json({
        success: false,
        message: 'Doctor ID and date query parameters are required.'
      });
    }

    const queryDate = new Date(date);
    queryDate.setHours(0, 0, 0, 0);

    const bookedAppointments = await Appointment.find({
      doctorId,
      appointmentDate: {
        $gte: queryDate,
        $lt: new Date(queryDate.getTime() + 24 * 60 * 60 * 1000)
      },
      status: { $ne: 'cancelled' }
    }).select('timeSlot');

    const bookedSlots = bookedAppointments.map((a) => a.timeSlot);

    res.status(200).json({
      success: true,
      date: queryDate.toISOString().split('T')[0],
      bookedSlots
    });
  } catch (error) {
    next(error);
  }
};
