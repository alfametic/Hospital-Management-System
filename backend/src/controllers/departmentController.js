const Department = require('../models/Department');
const DoctorProfile = require('../models/DoctorProfile');

// @desc    Get all departments (public)
// @route   GET /api/departments
// @access  Public
exports.getDepartments = async (req, res, next) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });

    // Attach doctor count to each department
    const departmentsWithDoctorCount = await Promise.all(
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
      count: departmentsWithDoctorCount.length,
      data: departmentsWithDoctorCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single department with its doctors
// @route   GET /api/departments/:id
// @access  Public
exports.getDepartmentById = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    const doctors = await DoctorProfile.find({ departmentId: department._id, isAcceptingAppointments: true })
      .populate('userId', 'name email phone');

    res.status(200).json({
      success: true,
      data: {
        ...department.toObject(),
        doctors
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new department (Admin)
// @route   POST /api/departments
// @access  Private (Admin)
exports.createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, icon, commonSymptoms } = req.body;

    const department = await Department.create({
      name,
      code,
      description,
      icon: icon || 'bi-hospital',
      commonSymptoms: Array.isArray(commonSymptoms) ? commonSymptoms : (commonSymptoms ? [commonSymptoms] : [])
    });

    res.status(201).json({
      success: true,
      message: 'Department created successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update department (Admin)
// @route   PUT /api/departments/:id
// @access  Private (Admin)
exports.updateDepartment = async (req, res, next) => {
  try {
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Department updated successfully',
      data: department
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete/Deactivate department (Admin)
// @route   DELETE /api/departments/:id
// @access  Private (Admin)
exports.deleteDepartment = async (req, res, next) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department) {
      return res.status(404).json({
        success: false,
        message: 'Department not found'
      });
    }

    // Soft delete to protect relational integrity
    department.isActive = false;
    await department.save();

    res.status(200).json({
      success: true,
      message: 'Department deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
};
