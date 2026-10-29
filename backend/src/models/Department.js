const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Department name is required'],
      unique: true,
      trim: true,
      maxlength: [100, 'Department name cannot exceed 100 characters']
    },
    code: {
      type: String,
      unique: true,
      uppercase: true,
      trim: true,
      required: [true, 'Department code is required (e.g., CARDIO, DERMA)']
    },
    description: {
      type: String,
      required: [true, 'Department description is required'],
      trim: true
    },
    icon: {
      type: String,
      default: 'bi-hospital' // Bootstrap icon class name
    },
    headDoctorName: {
      type: String,
      default: ''
    },
    commonSymptoms: {
      type: [String],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Department', departmentSchema);
