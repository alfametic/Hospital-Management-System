const Department = require('../models/Department');
const DoctorProfile = require('../models/DoctorProfile');
const { recommendDepartmentWithGemini } = require('../services/geminiService');

const MANDATORY_DISCLAIMER =
  'This tool provides general department guidance only. It does not provide a medical diagnosis or replace professional medical advice. For emergencies, seek immediate medical attention.';

// @desc    Recommend hospital department from symptoms description & optional image
// @route   POST /api/ai/recommend-department
// @access  Public (Visitors can use without logging in)
exports.recommendDepartment = async (req, res, next) => {
  try {
    const symptoms = req.body.symptoms || req.body.description || '';
    const file = req.file;

    if (!symptoms.trim() && !file) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a description of your symptoms or upload a clinical image to receive a department suggestion.'
      });
    }

    // 1. Fetch active registered hospital departments from MongoDB
    const activeDepartments = await Department.find({ isActive: true });
    if (!activeDepartments || activeDepartments.length === 0) {
      return res.status(500).json({
        success: false,
        message: 'No active hospital departments found in database registry.'
      });
    }

    // 2. Invoke Gemini AI Service with fallback mechanism
    const aiResult = await recommendDepartmentWithGemini({
      symptoms: symptoms.trim(),
      imageBuffer: file ? file.buffer : null,
      imageMimeType: file ? file.mimetype : null,
      departments: activeDepartments
    });

    // 3. Find the matched department in MongoDB
    let matchedDept = activeDepartments.find(
      (d) =>
        d.name.toLowerCase() === aiResult.recommendedDepartment.toLowerCase() ||
        d.code.toUpperCase() === aiResult.departmentCode.toUpperCase()
    );

    if (!matchedDept) {
      matchedDept = activeDepartments.find((d) => d.code === 'GENMED') || activeDepartments[0];
    }

    // 4. Fetch available specialists in this department
    const doctors = await DoctorProfile.find({
      departmentId: matchedDept._id,
      isAcceptingAppointments: true
    })
      .populate('userId', 'name email phone')
      .select('specialization qualification experienceYears consultationFee roomNumber availableDays availableTimeSlots');

    res.status(200).json({
      success: true,
      data: {
        department: {
          _id: matchedDept._id,
          name: matchedDept.name,
          code: matchedDept.code,
          icon: matchedDept.icon || 'bi-hospital',
          description: matchedDept.description
        },
        explanation: aiResult.explanation,
        alternativeDepartments: aiResult.alternativeDepartments || [],
        isEmergency: aiResult.isEmergency || false,
        emergencyWarning: aiResult.emergencyWarning || '',
        availableDoctors: doctors,
        disclaimer: MANDATORY_DISCLAIMER,
        source: aiResult.source || 'gemini-1.5-flash'
      }
    });
  } catch (error) {
    next(error);
  }
};
