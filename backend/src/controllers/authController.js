const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const PatientProfile = require('../models/PatientProfile');
const DoctorProfile = require('../models/DoctorProfile');
const { generatePatientQRCode } = require('../services/qrService');

// Helper to sign JWT
const signToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'super_secret_hospital_management_jwt_key_2026_production_safe',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Generate opaque unique patient identifier
const generateUniquePatientCode = async () => {
  let isUnique = false;
  let code = '';
  while (!isUnique) {
    const randomHex = crypto.randomBytes(3).toString('hex').toUpperCase();
    code = `PAT-${new Date().getFullYear()}-${randomHex}`;
    const existing = await PatientProfile.findOne({ patientCode: code });
    if (!existing) isUnique = true;
  }
  return code;
};

// @desc    Register a new patient
// @route   POST /api/auth/register-patient
// @access  Public
exports.registerPatient = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      dateOfBirth,
      gender,
      bloodGroup,
      address,
      emergencyContact,
      allergies,
      chronicConditions
    } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required fields.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Create Base User
    const user = await User.create({
      name,
      email,
      password,
      role: 'patient',
      phone: phone || ''
    });

    // Generate Opaque Patient Identifier & Safe QR Code
    const patientCode = await generateUniquePatientCode();
    const qrCodeDataUrl = await generatePatientQRCode(patientCode);

    // Create Patient Profile
    const patientProfile = await PatientProfile.create({
      userId: user._id,
      patientCode,
      dateOfBirth: dateOfBirth || null,
      gender: gender || 'prefer_not_to_say',
      bloodGroup: bloodGroup || 'Unknown',
      address: address || {},
      emergencyContact: emergencyContact || {},
      allergies: Array.isArray(allergies) ? allergies : (allergies ? [allergies] : []),
      chronicConditions: Array.isArray(chronicConditions) ? chronicConditions : (chronicConditions ? [chronicConditions] : []),
      qrCodeDataUrl
    });

    const token = signToken(user._id, user.role);

    res.status(201).json({
      success: true,
      message: 'Patient account created successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      patientProfile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User login (Patient, Doctor, Admin)
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password.'
      });
    }

    // Include password field explicitly
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated. Please contact hospital administrator.'
      });
    }

    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
      if (profile && !profile.qrCodeDataUrl && profile.patientCode) {
        const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || req.headers.origin || 'http://localhost:3000';
        profile.qrCodeDataUrl = await generatePatientQRCode(profile.patientCode, baseUrl);
        await profile.save();
      }
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id }).populate('departmentId', 'name code icon');
    }

    const token = signToken(user._id, user.role);

    res.status(200).json({
      success: true,
      message: 'Signed in successfully.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get currently authenticated user details
// @route   GET /api/auth/me
// @access  Private (Authenticated)
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
      if (profile && !profile.qrCodeDataUrl && profile.patientCode) {
        const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || req.headers.origin || 'http://localhost:3000';
        profile.qrCodeDataUrl = await generatePatientQRCode(profile.patientCode, baseUrl);
        await profile.save();
      }
    } else if (user.role === 'doctor') {
      profile = await DoctorProfile.findOne({ userId: user._id }).populate('departmentId', 'name code icon');
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/update-profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address, emergencyContact, allergies, chronicConditions } = req.body;

    const user = await User.findById(req.user._id);
    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    await user.save();

    let profile = null;
    if (user.role === 'patient') {
      profile = await PatientProfile.findOne({ userId: user._id });
      if (profile) {
        if (address) profile.address = { ...profile.address.toObject(), ...address };
        if (emergencyContact) profile.emergencyContact = { ...profile.emergencyContact.toObject(), ...emergencyContact };
        if (allergies) profile.allergies = Array.isArray(allergies) ? allergies : [allergies];
        if (chronicConditions) profile.chronicConditions = Array.isArray(chronicConditions) ? chronicConditions : [chronicConditions];
        await profile.save();
      }
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully.',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      },
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get authenticated patient's QR code & identifier (or generate securely if missing)
// @route   GET /api/auth/my-qr
// @access  Private (Patient)
exports.getMyQRCode = async (req, res, next) => {
  try {
    const profile = await PatientProfile.findOne({ userId: req.user._id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found for this user account.'
      });
    }

    const baseUrl = process.env.FRONTEND_URL || process.env.CLIENT_URL || req.headers.origin || 'http://localhost:3000';

    // Generate/refresh QR code with the current application URL so phone cameras open the app
    if (profile.patientCode) {
      profile.qrCodeDataUrl = await generatePatientQRCode(profile.patientCode, baseUrl);
      await profile.save();
    }

    res.status(200).json({
      success: true,
      patientCode: profile.patientCode,
      qrCodeDataUrl: profile.qrCodeDataUrl,
      profile
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Public verification of a patient QR code (Strictly NO PHI or medical records exposed)
// @route   GET /api/auth/verify-patient/:patientCode
// @access  Public
exports.verifyPatientCode = async (req, res, next) => {
  try {
    const { patientCode } = req.params;
    if (!patientCode) {
      return res.status(400).json({
        success: false,
        message: 'Patient code is required.'
      });
    }

    const match = patientCode.trim().match(/(PAT-\d{4}-[A-Z0-9]+)/i);
    const cleanCode = match ? match[1].toUpperCase() : patientCode.trim().toUpperCase();

    const patient = await PatientProfile.findOne({ patientCode: cleanCode })
      .populate('userId', 'name');

    if (!patient) {
      return res.status(404).json({
        success: false,
        verified: false,
        message: `No active patient record matches code ${cleanCode}. Please verify the QR identifier.`
      });
    }

    // Mask patient name for privacy, e.g. "J*** D***"
    let maskedName = 'Verified Hospital Patient';
    if (patient.userId?.name) {
      const parts = patient.userId.name.trim().split(/\s+/);
      maskedName = parts.map(p => `${p.charAt(0)}${'*'.repeat(Math.max(1, p.length - 1))}`).join(' ');
    }

    res.status(200).json({
      success: true,
      verified: true,
      patientCode: patient.patientCode,
      maskedName,
      hospitalName: 'St. Jude Metropolitan Hospital',
      status: 'Active Verified Official Patient ID',
      securityNotice: 'Protected Health Information (PHI) and medical records are strictly protected under role-based authorization. Only authenticated clinical staff may access the patient chart.',
      verifiedAt: new Date().toISOString()
    });
  } catch (error) {
    next(error);
  }
};
