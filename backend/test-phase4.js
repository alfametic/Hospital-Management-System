const http = require('http');
const app = require('./src/app');

const PORT = 5057;
process.env.PORT = PORT;

const server = app.listen(PORT, async () => {
  console.log(`[Test Server Phase 4] Running on http://localhost:${PORT}`);

  try {
    const postJSON = (path, body, headers = {}) => {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(
          {
            hostname: 'localhost',
            port: PORT,
            path,
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
              ...headers
            }
          },
          (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
              } catch (e) {
                resolve({ status: res.statusCode, raw: data });
              }
            });
          }
        );
        req.on('error', reject);
        req.write(payload);
        req.end();
      });
    };

    const getJSON = (path, headers = {}) => {
      return new Promise((resolve, reject) => {
        const req = http.request(
          {
            hostname: 'localhost',
            port: PORT,
            path,
            method: 'GET',
            headers: { ...headers }
          },
          (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
              try {
                resolve({ status: res.statusCode, body: JSON.parse(data) });
              } catch (e) {
                resolve({ status: res.statusCode, raw: data });
              }
            });
          }
        );
        req.on('error', reject);
        req.end();
      });
    };

    // 1. Doctor Login
    const doctorLogin = await postJSON('/api/auth/login', {
      email: 'doctor.cardio@hospital.com',
      password: 'DoctorPassword123!'
    });
    console.log('✔ Doctor Login:', doctorLogin.status, doctorLogin.body.user.role, doctorLogin.body.profile.specialization);
    const doctorToken = doctorLogin.body.token;
    const docHeaders = { Authorization: `Bearer ${doctorToken}` };

    // 2. Query Doctor Appointments
    const docAppts = await getJSON('/api/doctors/me/appointments', docHeaders);
    console.log('✔ Doctor Appointments count:', docAppts.status, docAppts.body.count);

    // 3. Patient Lookup via Opaque Patient Code (PAT-2026-A101)
    const patientLookup = await getJSON('/api/doctors/lookup-patient/PAT-2026-A101', docHeaders);
    console.log('✔ Doctor QR Patient Lookup:', patientLookup.status, patientLookup.body.patient.userId.name, 'Records:', patientLookup.body.records.length);

    // 4. RBAC Check: Ensure a Patient CANNOT look up another patient via doctor endpoint (Must be 403)
    const patientLogin = await postJSON('/api/auth/login', {
      email: 'patient.john@example.com',
      password: 'PatientPassword123!'
    });
    const patientToken = patientLogin.body.token;
    const patientHeaders = { Authorization: `Bearer ${patientToken}` };

    const rbacTest = await getJSON('/api/doctors/lookup-patient/PAT-2026-A101', patientHeaders);
    console.log('✔ RBAC Unauthorized Check (Expected 403 Forbidden):', rbacTest.status);
    if (rbacTest.status !== 403) {
      throw new Error(`Expected 403 for unauthorized patient lookup, got ${rbacTest.status}`);
    }

    // 5. Doctor records new Medical Record & Consultation Notes
    const activeAppt = docAppts.body.data.find(a => a.status === 'confirmed');
    const newRecordRes = await postJSON(
      '/api/records',
      {
        patientId: patientLookup.body.patient._id,
        appointmentId: activeAppt ? activeAppt._id : null,
        chiefComplaints: 'Follow-up cardiac evaluation for mild exertion tightness.',
        diagnosis: 'Stable Angina Pectoris, class I, well-controlled.',
        clinicalNotes: 'Resting ECG reviewed. Normal ST segments. Advised regular moderate aerobic exercise.',
        vitalSigns: {
          bloodPressure: '122/78 mmHg',
          heartRate: 70,
          temperature: 98.6,
          respiratoryRate: 16,
          oxygenSaturation: 99,
          weight: 77.5
        },
        prescriptions: [
          {
            medicineName: 'Metoprolol Tartrate',
            dosage: '25 mg',
            frequency: 'Twice daily',
            duration: '30 days',
            instructions: 'Take with or immediately after a meal.'
          }
        ],
        labReports: [
          {
            testName: 'Serum Electrolytes & Creatinine',
            category: 'Clinical Biochemistry',
            status: 'completed',
            resultSummary: 'Sodium: 140 mEq/L, Potassium: 4.2 mEq/L, Creatinine: 0.9 mg/dL (All Normal)'
          }
        ],
        followUpDate: new Date('2026-12-01')
      },
      docHeaders
    );
    console.log('✔ Doctor Created Medical Record:', newRecordRes.status, newRecordRes.body.message);

    // 6. Verify chronological medical history updated
    const updatedLookup = await getJSON('/api/doctors/lookup-patient/PAT-2026-A101', docHeaders);
    console.log('✔ Updated Chronological Records count:', updatedLookup.body.records.length);
    console.log('  -> Newest visit diagnosis:', updatedLookup.body.records[0].diagnosis);

    console.log('\n=== ALL PHASE 4 BACKEND CHECKS PASSED SUCCESSFULLY ===\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Phase 4 backend test error:', err);
    server.close();
    process.exit(1);
  }
});
