require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Department = require('../models/Department');
const DoctorProfile = require('../models/DoctorProfile');
const PatientProfile = require('../models/PatientProfile');
const Appointment = require('../models/Appointment');
const MedicalRecord = require('../models/MedicalRecord');
const { generatePatientQRCode } = require('../services/qrService');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/hospital_management';
    await mongoose.connect(mongoUri);
    console.log(`[Seed] Connected to MongoDB at ${mongoUri}`);

    // Clear existing data
    console.log('[Seed] Clearing existing collections...');
    await Promise.all([
      User.deleteMany({}),
      Department.deleteMany({}),
      DoctorProfile.deleteMany({}),
      PatientProfile.deleteMany({}),
      Appointment.deleteMany({}),
      MedicalRecord.deleteMany({})
    ]);

    // 1. Seed Admin User
    console.log('[Seed] Creating Administrator account...');
    const adminUser = await User.create({
      name: 'Dr. Arthur Pendelton (Chief Administrator)',
      email: 'admin@hospital.com',
      password: 'AdminPassword123!',
      role: 'admin',
      phone: '+1 (555) 019-2831'
    });

    // 2. Seed Departments
    console.log('[Seed] Seeding Medical Departments...');
    const departmentsData = [
      {
        name: 'Cardiology',
        code: 'CARDIO',
        description: 'Comprehensive diagnosis and cutting-edge clinical management of cardiovascular disorders, heart diseases, and hypertension.',
        icon: 'bi-heart-pulse-fill',
        headDoctorName: 'Dr. Sarah Jenkins',
        commonSymptoms: ['Chest pain', 'Palpitations', 'Shortness of breath', 'High blood pressure', 'Irregular heart rate', 'Dizziness']
      },
      {
        name: 'Dermatology',
        code: 'DERMA',
        description: 'Advanced clinical treatment for dermatological conditions, skin rashes, autoimmune manifestations, and surgical dermatology.',
        icon: 'bi-bandaid-fill',
        headDoctorName: 'Dr. Marcus Vance',
        commonSymptoms: ['Skin rash', 'Acne', 'Eczema', 'Psoriasis', 'Skin lesion', 'Itching', 'Fungal infection', 'Hives']
      },
      {
        name: 'Neurology',
        code: 'NEURO',
        description: 'Specialized diagnosis and treatment of complex disorders affecting the central, peripheral, and autonomic nervous systems.',
        icon: 'bi-activity',
        headDoctorName: 'Dr. Elena Rostova',
        commonSymptoms: ['Chronic migraine', 'Seizures', 'Tremors', 'Numbness', 'Memory loss', 'Facial weakness', 'Neuropathy']
      },
      {
        name: 'Orthopedics',
        code: 'ORTHO',
        description: 'State-of-the-art musculoskeletal care specializing in joint replacement, sports medicine, spinal health, and fracture trauma.',
        icon: 'bi-person-walking',
        headDoctorName: 'Dr. David Chen',
        commonSymptoms: ['Joint pain', 'Knee swelling', 'Bone fracture', 'Back pain', 'Sprain', 'Arthritis', 'Limited mobility']
      },
      {
        name: 'Pediatrics',
        code: 'PEDIA',
        description: 'Dedicated, compassionate pediatric and adolescent healthcare, newborn assessments, immunizations, and developmental medicine.',
        icon: 'bi-emoji-smile-fill',
        headDoctorName: 'Dr. Priya Patel',
        commonSymptoms: ['Childhood fever', 'Growth delay', 'Pediatric cough', 'Infant colic', 'Ear infection in child', 'Vaccination visit']
      },
      {
        name: 'General Medicine',
        code: 'GENMED',
        description: 'Holistic primary care, chronic illness management, metabolic disorders, preventive health checkups, and acute adult care.',
        icon: 'bi-capsule-pill',
        headDoctorName: 'Dr. Robert Miller',
        commonSymptoms: ['Persistent fever', 'General fatigue', 'Unexplained weight loss', 'Abdominal discomfort', 'Flu', 'Diabetes check']
      },
      {
        name: 'Ophthalmology',
        code: 'OPHTH',
        description: 'Expert eye examinations, surgical vision correction, treatment of cataracts, glaucoma, and acute corneal conditions.',
        icon: 'bi-eye-fill',
        headDoctorName: 'Dr. Clara Oswald',
        commonSymptoms: ['Blurred vision', 'Eye pain', 'Eye redness', 'Dry eye', 'Double vision', 'Visual floaters']
      },
      {
        name: 'ENT (Otolaryngology)',
        code: 'ENT',
        description: 'Comprehensive medical and surgical therapy for conditions affecting the ear, nose, throat, head, and neck structures.',
        icon: 'bi-ear-fill',
        headDoctorName: 'Dr. Julian Bashir',
        commonSymptoms: ['Earache', 'Hearing loss', 'Sinus pressure', 'Chronic sore throat', 'Tinnitus', 'Nasal obstruction']
      }
    ];

    const departments = await Department.insertMany(departmentsData);
    const deptMap = {};
    departments.forEach(d => { deptMap[d.code] = d._id; });

    // 3. Seed Doctors
    console.log('[Seed] Seeding Doctor accounts & profiles...');
    const doctorsSeedData = [
      {
        name: 'Dr. Sarah Jenkins',
        email: 'doctor.cardio@hospital.com',
        phone: '+1 (555) 201-4433',
        departmentId: deptMap['CARDIO'],
        specialization: 'Interventional Cardiology & Electrophysiology',
        qualification: 'MD, DM (Cardiology), FACC',
        experienceYears: 14,
        consultationFee: 75,
        roomNumber: 'Cardio Suite 301',
        bio: 'Dr. Jenkins has over a decade of clinical experience in non-invasive cardiac evaluation and coronary artery disease intervention.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableTimeSlots: ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00', '14:00 - 14:30', '14:30 - 15:00']
      },
      {
        name: 'Dr. Marcus Vance',
        email: 'doctor.derma@hospital.com',
        phone: '+1 (555) 302-5544',
        departmentId: deptMap['DERMA'],
        specialization: 'Medical & Pediatric Dermatology',
        qualification: 'MD (Dermatology), FAAD',
        experienceYears: 11,
        consultationFee: 60,
        roomNumber: 'Derm Care Room 204',
        bio: 'Specialist in clinical diagnostic dermatology, inflammatory skin disorders, eczema, and skin cancer surveillance.',
        availableDays: ['Monday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        availableTimeSlots: ['10:00 - 10:30', '10:30 - 11:00', '11:00 - 11:30', '15:00 - 15:30', '15:30 - 16:00']
      },
      {
        name: 'Dr. Elena Rostova',
        email: 'doctor.neuro@hospital.com',
        phone: '+1 (555) 403-6655',
        departmentId: deptMap['NEURO'],
        specialization: 'Cognitive Neurology & Movement Disorders',
        qualification: 'MD, PhD (Neuroscience)',
        experienceYears: 16,
        consultationFee: 85,
        roomNumber: 'Neuro Clinic 410',
        bio: 'Recognized specialist in complex headaches, neurological rehabilitation, and autoimmune neuropathy syndromes.',
        availableDays: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableTimeSlots: ['09:30 - 10:00', '10:00 - 10:30', '11:00 - 11:30', '14:00 - 14:30', '14:30 - 15:00']
      },
      {
        name: 'Dr. David Chen',
        email: 'doctor.ortho@hospital.com',
        phone: '+1 (555) 504-7766',
        departmentId: deptMap['ORTHO'],
        specialization: 'Orthopedic Surgery & Sports Rehabilitation',
        qualification: 'MS (Orthopedics), FRCS',
        experienceYears: 13,
        consultationFee: 70,
        roomNumber: 'Ortho Wing 105',
        bio: 'Expertise in arthroscopic joint procedures, knee and hip preservation, and trauma recovery protocols.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
        availableTimeSlots: ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '11:30 - 12:00', '16:00 - 16:30']
      },
      {
        name: 'Dr. Priya Patel',
        email: 'doctor.pediatric@hospital.com',
        phone: '+1 (555) 605-8877',
        departmentId: deptMap['PEDIA'],
        specialization: 'General Pediatrics & Neonatal Intensive Care',
        qualification: 'MD (Pediatrics), FAAP',
        experienceYears: 9,
        consultationFee: 50,
        roomNumber: 'Pediatrics Suite 112',
        bio: 'Devoted to friendly, stress-free healthcare for infants, young children, and adolescents.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
        availableTimeSlots: ['09:00 - 09:30', '09:30 - 10:00', '10:00 - 10:30', '10:30 - 11:00', '13:30 - 14:00']
      },
      {
        name: 'Dr. Robert Miller',
        email: 'doctor.genmed@hospital.com',
        phone: '+1 (555) 706-9988',
        departmentId: deptMap['GENMED'],
        specialization: 'Internal Medicine & Preventive Care',
        qualification: 'MD (Internal Medicine), FACP',
        experienceYears: 18,
        consultationFee: 50,
        roomNumber: 'OPD Main Floor 101',
        bio: 'Senior physician managing complex adult health conditions, hypertension, diabetes, and preventive longevity care.',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        availableTimeSlots: ['08:30 - 09:00', '09:00 - 09:30', '09:30 - 10:00', '10:30 - 11:00', '14:00 - 14:30', '15:00 - 15:30']
      }
    ];

    const doctorProfiles = [];
    for (const docData of doctorsSeedData) {
      const user = await User.create({
        name: docData.name,
        email: docData.email,
        password: 'DoctorPassword123!',
        role: 'doctor',
        phone: docData.phone
      });

      const profile = await DoctorProfile.create({
        userId: user._id,
        departmentId: docData.departmentId,
        specialization: docData.specialization,
        qualification: docData.qualification,
        experienceYears: docData.experienceYears,
        consultationFee: docData.consultationFee,
        roomNumber: docData.roomNumber,
        bio: docData.bio,
        availableDays: docData.availableDays,
        availableTimeSlots: docData.availableTimeSlots
      });
      doctorProfiles.push(profile);
    }

    // 4. Seed Patients with Opaque Safe QR Codes
    console.log('[Seed] Seeding Patient accounts & generating safe QR codes...');
    const patientUsersData = [
      {
        name: 'Johnathan Doe',
        email: 'patient.john@example.com',
        password: 'PatientPassword123!',
        phone: '+1 (555) 987-6543',
        patientCode: 'PAT-2026-A101',
        dateOfBirth: new Date('1988-06-15'),
        gender: 'male',
        bloodGroup: 'O+',
        allergies: ['Penicillin', 'Peanuts'],
        chronicConditions: ['Mild Hypertension'],
        address: {
          street: '742 Evergreen Terrace',
          city: 'Metro City',
          state: 'CA',
          postalCode: '90210',
          country: 'USA'
        },
        emergencyContact: {
          name: 'Mary Doe',
          phone: '+1 (555) 987-6544',
          relation: 'Spouse'
        }
      },
      {
        name: 'Emily Watson',
        email: 'patient.emily@example.com',
        password: 'PatientPassword123!',
        phone: '+1 (555) 876-5432',
        patientCode: 'PAT-2026-B202',
        dateOfBirth: new Date('1994-11-22'),
        gender: 'female',
        bloodGroup: 'A+',
        allergies: ['Sulfa drugs'],
        chronicConditions: ['Asthma'],
        address: {
          street: '12 Baker Street, Apt 4B',
          city: 'Metro City',
          state: 'CA',
          postalCode: '90212',
          country: 'USA'
        },
        emergencyContact: {
          name: 'James Watson',
          phone: '+1 (555) 876-5433',
          relation: 'Father'
        }
      }
    ];

    const patientProfiles = [];
    for (const patData of patientUsersData) {
      const user = await User.create({
        name: patData.name,
        email: patData.email,
        password: patData.password,
        role: 'patient',
        phone: patData.phone
      });

      // Generate secure QR code encoding ONLY the opaque patient code
      const qrCodeDataUrl = await generatePatientQRCode(patData.patientCode);

      const profile = await PatientProfile.create({
        userId: user._id,
        patientCode: patData.patientCode,
        dateOfBirth: patData.dateOfBirth,
        gender: patData.gender,
        bloodGroup: patData.bloodGroup,
        allergies: patData.allergies,
        chronicConditions: patData.chronicConditions,
        address: patData.address,
        emergencyContact: patData.emergencyContact,
        qrCodeDataUrl
      });
      patientProfiles.push(profile);
    }

    // 5. Seed Appointments
    console.log('[Seed] Seeding sample appointments...');
    const cardioDoctor = doctorProfiles.find(d => d.specialization.includes('Cardiology'));
    const dermaDoctor = doctorProfiles.find(d => d.specialization.includes('Dermatology'));
    const genmedDoctor = doctorProfiles.find(d => d.specialization.includes('Internal Medicine'));

    const today = new Date();
    const futureDate = new Date(today);
    futureDate.setDate(today.getDate() + 3);

    const appt1 = await Appointment.create({
      patientId: patientProfiles[0]._id, // Johnathan Doe
      doctorId: cardioDoctor._id,
      departmentId: deptMap['CARDIO'],
      appointmentDate: new Date('2026-08-10'),
      timeSlot: '10:00 - 10:30',
      status: 'completed',
      reason: 'Routine quarterly cardiac health evaluation and BP check.'
    });

    const appt2 = await Appointment.create({
      patientId: patientProfiles[0]._id, // Johnathan Doe
      doctorId: dermaDoctor._id,
      departmentId: deptMap['DERMA'],
      appointmentDate: new Date('2026-09-20'),
      timeSlot: '11:00 - 11:30',
      status: 'completed',
      reason: 'Contact dermatitis consultation and rash examination on right arm.'
    });

    const appt3 = await Appointment.create({
      patientId: patientProfiles[0]._id, // Johnathan Doe
      doctorId: genmedDoctor._id,
      departmentId: deptMap['GENMED'],
      appointmentDate: futureDate,
      timeSlot: '09:00 - 09:30',
      status: 'confirmed',
      reason: 'Seasonal wellness evaluation and fasting blood sugar follow-up.'
    });

    const appt4 = await Appointment.create({
      patientId: patientProfiles[1]._id, // Emily Watson
      doctorId: cardioDoctor._id,
      departmentId: deptMap['CARDIO'],
      appointmentDate: futureDate,
      timeSlot: '14:00 - 14:30',
      status: 'confirmed',
      reason: 'Occasional chest tightness during vigorous exercise.'
    });

    // 6. Seed Chronological Medical Records for Johnathan Doe
    console.log('[Seed] Seeding chronological Medical Records for patient PAT-2026-A101...');
    await MedicalRecord.create({
      patientId: patientProfiles[0]._id,
      doctorId: cardioDoctor._id,
      appointmentId: appt1._id,
      visitDate: new Date('2026-08-10T10:30:00Z'),
      chiefComplaints: 'Mild occasional fatigue and elevated home blood pressure readings (138/88).',
      diagnosis: 'Stage 1 Essential Hypertension, well-compensated.',
      clinicalNotes: 'Patient appears alert, oriented, in no acute distress. Heart sounds normal (S1, S2 audible, no murmurs). Advised low-sodium Mediterranean diet, daily 30-minute brisk walk, and continuous BP log.',
      vitalSigns: {
        bloodPressure: '136/86 mmHg',
        heartRate: 74,
        temperature: 98.4,
        respiratoryRate: 16,
        weight: 78.5,
        height: 178,
        oxygenSaturation: 99
      },
      prescriptions: [
        {
          medicineName: 'Amlodipine Besylate',
          dosage: '5 mg',
          frequency: 'Once daily (morning)',
          duration: '60 days',
          instructions: 'Take oral tablet with a full glass of water. Monitor morning pulse.'
        },
        {
          medicineName: 'Coenzyme Q10 Supplement',
          dosage: '100 mg',
          frequency: 'Once daily after breakfast',
          duration: '30 days',
          instructions: 'Nutritional cardiovascular support.'
        }
      ],
      labReports: [
        {
          testName: 'Lipid Profile Panel',
          category: 'Biochemistry',
          status: 'completed',
          resultSummary: 'Total Cholesterol: 192 mg/dL, HDL: 52 mg/dL, LDL: 114 mg/dL, Triglycerides: 130 mg/dL',
          referenceRange: 'Normal',
          resultDate: new Date('2026-08-11')
        },
        {
          testName: '12-Lead Electrocardiogram (ECG)',
          category: 'Cardiology Diagnostics',
          status: 'completed',
          resultSummary: 'Normal sinus rhythm, heart rate 72 bpm, no ST-elevation or ischemic changes.',
          referenceRange: 'Normal Sinus Rhythm',
          resultDate: new Date('2026-08-10')
        }
      ],
      followUpDate: new Date('2026-11-10')
    });

    await MedicalRecord.create({
      patientId: patientProfiles[0]._id,
      doctorId: dermaDoctor._id,
      appointmentId: appt2._id,
      visitDate: new Date('2026-09-20T11:45:00Z'),
      chiefComplaints: 'Erythematous itchy patch with mild scaling on the right anterior forearm for 6 days.',
      diagnosis: 'Localized Contact Dermatitis (allergic response to watch strap polymer).',
      clinicalNotes: 'Well-demarcated erythematous plaque without purulence or active vesicle weeping. Negative for fungal hyphae on inspection. Avoid offending metal/synthetic contact.',
      vitalSigns: {
        bloodPressure: '124/80 mmHg',
        heartRate: 68,
        temperature: 98.6,
        respiratoryRate: 15,
        weight: 78.0,
        height: 178,
        oxygenSaturation: 100
      },
      prescriptions: [
        {
          medicineName: 'Hydrocortisone Butyrate Cream 0.1%',
          dosage: 'Apply thin layer',
          frequency: 'Twice daily',
          duration: '7 days',
          instructions: 'Apply strictly to affected forearm region. Do not cover with occlusive dressing.'
        },
        {
          medicineName: 'Cetirizine Hydrochloride',
          dosage: '10 mg',
          frequency: 'Once daily at bedtime',
          duration: '5 days',
          instructions: 'Relieves pruritus and reduces night-time itch reflex.'
        }
      ],
      labReports: [],
      followUpDate: new Date('2026-10-05')
    });

    console.log('\n======================================================');
    console.log(' SEEDING COMPLETED SUCCESSFULLY! ');
    console.log('======================================================');
    console.log('Accounts Available for Testing:');
    console.log('1. Admin:    admin@hospital.com            / AdminPassword123!');
    console.log('2. Doctors:');
    console.log('   - Cardio: doctor.cardio@hospital.com    / DoctorPassword123!');
    console.log('   - Derma:  doctor.derma@hospital.com     / DoctorPassword123!');
    console.log('   - Neuro:  doctor.neuro@hospital.com     / DoctorPassword123!');
    console.log('   - Ortho:  doctor.ortho@hospital.com     / DoctorPassword123!');
    console.log('   - Pedia:  doctor.pediatric@hospital.com / DoctorPassword123!');
    console.log('   - GenMed: doctor.genmed@hospital.com    / DoctorPassword123!');
    console.log('3. Patients:');
    console.log('   - John:   patient.john@example.com      / PatientPassword123! (Code: PAT-2026-A101)');
    console.log('   - Emily:  patient.emily@example.com     / PatientPassword123! (Code: PAT-2026-B202)');
    console.log('======================================================\n');

    process.exit(0);
  } catch (error) {
    console.error('[Seed Error] Failed to seed database:', error);
    process.exit(1);
  }
};

seedDatabase();
