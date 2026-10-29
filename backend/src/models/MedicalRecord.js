const mongoose = require('mongoose');

const prescriptionItemSchema = new mongoose.Schema(
  {
    medicineName: {
      type: String,
      required: true,
      trim: true
    },
    dosage: {
      type: String,
      required: true,
      trim: true
    },
    frequency: {
      type: String,
      required: true,
      trim: true,
      default: 'Once daily'
    },
    duration: {
      type: String,
      required: true,
      trim: true,
      default: '5 days'
    },
    instructions: {
      type: String,
      default: 'Take with water after meals'
    }
  },
  { _id: true }
);

const labReportItemSchema = new mongoose.Schema(
  {
    testName: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      default: 'General Pathology'
    },
    status: {
      type: String,
      enum: ['ordered', 'in_progress', 'completed'],
      default: 'completed'
    },
    resultSummary: {
      type: String,
      default: ''
    },
    referenceRange: {
      type: String,
      default: 'Normal'
    },
    resultDate: {
      type: Date,
      default: Date.now
    }
  },
  { _id: true }
);

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: true,
      index: true
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: true,
      index: true
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment'
    },
    visitDate: {
      type: Date,
      default: Date.now,
      index: true
    },
    chiefComplaints: {
      type: String,
      required: [true, 'Chief complaints are required'],
      trim: true
    },
    diagnosis: {
      type: String,
      required: [true, 'Diagnosis is required'],
      trim: true
    },
    clinicalNotes: {
      type: String,
      default: ''
    },
    vitalSigns: {
      bloodPressure: { type: String, default: '' },
      heartRate: { type: Number, default: null },
      temperature: { type: Number, default: null },
      respiratoryRate: { type: Number, default: null },
      weight: { type: Number, default: null },
      height: { type: Number, default: null },
      oxygenSaturation: { type: Number, default: null }
    },
    prescriptions: [prescriptionItemSchema],
    labReports: [labReportItemSchema],
    followUpDate: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Chronological sorting index
medicalRecordSchema.index({ patientId: 1, visitDate: -1 });

module.exports = mongoose.model('MedicalRecord', medicalRecordSchema);
