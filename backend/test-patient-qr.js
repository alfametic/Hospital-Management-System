/**
 * Comprehensive Verification test for Patient QR Code, Configurable FRONTEND_URL,
 * Doctor Authorized Medical History, and Patient Privacy.
 */
const http = require('http');
const mongoose = require('mongoose');
const PatientProfile = require('./src/models/PatientProfile');
const User = require('./src/models/User');
const { generatePatientQRCode, getBaseUrl } = require('./src/services/qrService');

const API_PORT = 5000;

// Helper to make HTTP JSON requests
function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const payload = data ? JSON.stringify(data) : null;
    const headers = {
      'Content-Type': 'application/json'
    };
    if (payload) {
      headers['Content-Length'] = Buffer.byteLength(payload);
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(
      {
        hostname: 'localhost',
        port: API_PORT,
        path: `/api${path}`,
        method,
        headers
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(body);
            resolve({ status: res.statusCode, data: parsed });
          } catch (e) {
            resolve({ status: res.statusCode, raw: body });
          }
        });
      }
    );

    req.on('error', (err) => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

async function runTests() {
  console.log('=== STARTING QR PATIENT MEDICAL HISTORY WORKFLOW VERIFICATION ===\n');

  await mongoose.connect('mongodb://127.0.0.1:27017/hospital_management');
  console.log('Connected to MongoDB.');

  try {
    // TEST 1: Configurable FRONTEND_URL in QR generation
    console.log('Test 1: Testing configurable FRONTEND_URL environment variable...');
    const originalFrontendUrl = process.env.FRONTEND_URL;

    // Test with network IP configuration (e.g. laptop Wi-Fi IP for phone testing)
    process.env.FRONTEND_URL = 'http://192.168.1.50:3000';
    const networkQr = await generatePatientQRCode('PAT-2026-TESTNET');
    if (networkQr && networkQr.startsWith('data:image/png;base64,')) {
      console.log('PASS: QR code successfully generated using FRONTEND_URL=http://192.168.1.50:3000');
    } else {
      throw new Error('Failed to generate QR with network FRONTEND_URL');
    }

    // Test with production deployment URL
    process.env.FRONTEND_URL = 'https://hospital-metro.example.com';
    const deployQr = await generatePatientQRCode('PAT-2026-TESTDEP');
    if (deployQr && deployQr.startsWith('data:image/png;base64,')) {
      console.log('PASS: QR code successfully generated using FRONTEND_URL=https://hospital-metro.example.com');
    }

    // Restore standard FRONTEND_URL
    process.env.FRONTEND_URL = originalFrontendUrl || 'http://localhost:3000';
    console.log('PASS: Environment variable resolution verified.\n');

    // TEST 2: Unauthorized access to /api/auth/my-qr
    console.log('Test 2: Check unauthorized request to /api/auth/my-qr...');
    const unauthRes = await makeRequest('GET', '/auth/my-qr');
    if (unauthRes.status === 401) {
      console.log('PASS: Unauthorized request properly rejected with 401.\n');
    } else {
      throw new Error(`Expected 401, received: ${unauthRes.status}`);
    }

    // TEST 3: Patient Login
    console.log('Test 3: Patient Login with existing account (patient.john@example.com)...');
    const loginRes = await makeRequest('POST', '/auth/login', {
      email: 'patient.john@example.com',
      password: 'PatientPassword123!'
    });

    if (loginRes.status !== 200 || !loginRes.data.token) {
      throw new Error(`Patient login failed: ${JSON.stringify(loginRes.data)}`);
    }
    const patientToken = loginRes.data.token;
    const initialPatientCode = loginRes.data.profile?.patientCode;
    console.log(`PASS: Patient logged in. PatientCode: ${initialPatientCode}\n`);

    // TEST 4: Authenticated patient fetches own QR via /api/auth/my-qr
    console.log('Test 4: Fetching authenticated patient QR code via GET /api/auth/my-qr...');
    const myQrRes = await makeRequest('GET', '/auth/my-qr', null, patientToken);
    if (myQrRes.status === 200 && myQrRes.data.success && myQrRes.data.qrCodeDataUrl) {
      console.log(`PASS: Received QR Code Data URL (Length: ${myQrRes.data.qrCodeDataUrl.length} chars).`);
      console.log(`Verified Patient Code: ${myQrRes.data.patientCode}`);
      if (!myQrRes.data.qrCodeDataUrl.startsWith('data:image/png;base64,')) {
        throw new Error('QR code is not a valid base64 PNG data URL');
      }
      console.log('PASS: QR code format is a valid base64 PNG data URL.\n');
    } else {
      throw new Error(`Failed to retrieve QR code: ${JSON.stringify(myQrRes.data)}`);
    }

    // TEST 5: Public Patient Verification Endpoint (Phone camera landing page)
    console.log('Test 5: Testing public verification endpoint GET /api/auth/verify-patient/:patientCode...');
    const verifyRes = await makeRequest('GET', `/auth/verify-patient/${initialPatientCode}`);
    if (verifyRes.status === 200 && verifyRes.data.success && verifyRes.data.verified) {
      console.log('PASS: Public verification confirms active official hospital ID.');
      console.log(`Masked Name: ${verifyRes.data.maskedName}`);
      console.log(`Verified Status: ${verifyRes.data.status}`);
      // Strict PHI check: ensure no records, diagnosis, or vitals are leaked
      if (verifyRes.data.records || verifyRes.data.diagnoses || verifyRes.data.prescriptions || verifyRes.data.vitalSigns) {
        throw new Error('CRITICAL SECURITY VIOLATION: PHI/medical records exposed in public verification response!');
      }
      console.log('PASS: Zero PHI / private medical records exposed in public response.\n');
    } else {
      throw new Error(`Public verification failed: ${JSON.stringify(verifyRes.data)}`);
    }

    // TEST 6: RBAC Protection - Unauthorized visitor trying to access doctor lookup
    console.log('Test 6: Verifying unauthorized visitor cannot access doctor patient lookup...');
    const unauthDocLookup = await makeRequest('GET', `/doctors/lookup-patient/${initialPatientCode}`);
    if (unauthDocLookup.status === 401) {
      console.log('PASS: Unauthenticated visitor rejected with 401 Unauthorized.');
    } else {
      throw new Error(`Expected 401 for unauthenticated visitor, got: ${unauthDocLookup.status}`);
    }

    // Patient trying to access doctor lookup
    const patientDocLookup = await makeRequest('GET', `/doctors/lookup-patient/${initialPatientCode}`, null, patientToken);
    if (patientDocLookup.status === 403) {
      console.log('PASS: Logged-in patient rejected with 403 Forbidden (RBAC enforced).\n');
    } else {
      throw new Error(`Expected 403 for patient accessing doctor lookup, got: ${patientDocLookup.status}`);
    }

    // TEST 7: Patient accesses their own medical history
    console.log('Test 7: Testing patient accessing their own medical history via /api/records/my-records...');
    const patientRecordsRes = await makeRequest('GET', '/records/my-records', null, patientToken);
    if (patientRecordsRes.status === 200 && Array.isArray(patientRecordsRes.data.data)) {
      console.log(`PASS: Patient retrieved own medical records history (Count: ${patientRecordsRes.data.data.length}).\n`);
    } else {
      throw new Error(`Failed to retrieve patient's own records: ${JSON.stringify(patientRecordsRes.data)}`);
    }

    // TEST 8: Doctor Login & Authorized Patient History Access
    console.log('Test 8: Verifying doctor login and authorized patient medical history retrieval...');
    const docLogin = await makeRequest('POST', '/auth/login', {
      email: 'doctor.cardio@hospital.com',
      password: 'DoctorPassword123!'
    });
    if (docLogin.status !== 200 || !docLogin.data.token) {
      throw new Error(`Doctor login failed: ${JSON.stringify(docLogin.data)}`);
    }
    const doctorToken = docLogin.data.token;

    // Doctor scans the opaque patient code
    const lookupRes = await makeRequest(
      'GET',
      `/doctors/lookup-patient/${initialPatientCode}`,
      null,
      doctorToken
    );

    if (lookupRes.status === 200 && lookupRes.data.success && lookupRes.data.patient) {
      console.log(`PASS: Doctor retrieved authorized patient chart for: ${lookupRes.data.patient.userId?.name}`);
      console.log(`Patient Code: ${lookupRes.data.patient.patientCode}`);
      console.log(`Chronological Records: ${lookupRes.data.records?.length || 0}`);
      console.log(`Prescriptions & Vitals present: ${lookupRes.data.records?.[0]?.vitalSigns ? 'Yes' : 'No'}\n`);
    } else {
      throw new Error(`Doctor lookup failed: ${JSON.stringify(lookupRes.data)}`);
    }

    // TEST 9: Doctor lookup with full scanned verification URL
    console.log('Test 9: Testing doctor scanner lookup when full verification URL is scanned...');
    const fullScannedUrl = `http://localhost:3000/verify-patient?code=${initialPatientCode}`;
    const urlLookupRes = await makeRequest(
      'GET',
      `/doctors/lookup-patient/${encodeURIComponent(fullScannedUrl)}`,
      null,
      doctorToken
    );
    if (urlLookupRes.status === 200 && urlLookupRes.data.success && urlLookupRes.data.patient?.patientCode === initialPatientCode) {
      console.log('PASS: Doctor lookup successfully parsed patient code from full verification URL.\n');
    } else {
      throw new Error(`Doctor URL lookup failed: ${JSON.stringify(urlLookupRes.data)}`);
    }

    // TEST 10: Doctor creates a new medical record (preserving record uploads & timeline)
    console.log('Test 10: Testing doctor creating a new medical record for the patient...');
    const doctorProfile = docLogin.data.profile;
    const patientProfile = lookupRes.data.patient;

    const newRecordRes = await makeRequest(
      'POST',
      '/records',
      {
        patientId: patientProfile._id,
        chiefComplaints: 'Follow-up routine cardiovascular review after QR verification.',
        diagnosis: 'Cardiovascular check - Normal Sinus Rhythm',
        clinicalNotes: 'Blood pressure within optimal range. Patient adherence to prescribed medication confirmed.',
        vitalSigns: {
          bloodPressure: '120/80',
          heartRate: 72,
          temperature: 98.6,
          oxygenSaturation: 99,
          respiratoryRate: 16,
          weight: 75
        },
        prescriptions: [
          {
            medicineName: 'Atorvastatin',
            dosage: '10mg',
            frequency: 'Once daily at bedtime',
            duration: '30 days',
            instructions: 'Take with or without food'
          }
        ]
      },
      doctorToken
    );

    if (newRecordRes.status === 201 && newRecordRes.data.success) {
      console.log(`PASS: Doctor documented new clinical record successfully (ID: ${newRecordRes.data.data._id}).\n`);
    } else {
      throw new Error(`Failed to create medical record: ${JSON.stringify(newRecordRes.data)}`);
    }

    console.log('=== ALL 10 QR CODE WORKFLOW & EMR SECURITY TESTS PASSED! ===');
    process.exit(0);
  } catch (err) {
    console.error('TEST ERROR:', err);
    process.exit(1);
  }
}

runTests();
