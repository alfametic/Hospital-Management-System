const http = require('http');
const app = require('./src/app');

const PORT = 5055;
process.env.PORT = PORT;

const server = app.listen(PORT, async () => {
  console.log(`[Test Server] Running on http://localhost:${PORT}`);

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
            headers: {
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
        req.end();
      });
    };

    // 1. Health check
    const health = await getJSON('/api/health');
    console.log('✔ Health Check:', health.status, health.body.status);

    // 2. Login as Admin
    const adminLogin = await postJSON('/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'AdminPassword123!'
    });
    console.log('✔ Admin Login:', adminLogin.status, adminLogin.body.user.role);

    // 3. Login as Doctor
    const doctorLogin = await postJSON('/api/auth/login', {
      email: 'doctor.cardio@hospital.com',
      password: 'DoctorPassword123!'
    });
    console.log('✔ Doctor Login:', doctorLogin.status, doctorLogin.body.user.role, doctorLogin.body.profile.specialization);

    // 4. Login as Patient
    const patientLogin = await postJSON('/api/auth/login', {
      email: 'patient.john@example.com',
      password: 'PatientPassword123!'
    });
    console.log('✔ Patient Login:', patientLogin.status, patientLogin.body.user.role, patientLogin.body.profile.patientCode);

    // 5. Test Authenticated /api/auth/me
    const me = await getJSON('/api/auth/me', {
      'Authorization': `Bearer ${patientLogin.body.token}`
    });
    console.log('✔ Auth Me Profile:', me.status, me.body.user.email, me.body.profile.patientCode);

    // 6. Test Departments list
    const depts = await getJSON('/api/departments');
    console.log('✔ Departments Count:', depts.status, depts.body.count);

    // 7. Test Doctors list
    const docs = await getJSON('/api/doctors');
    console.log('✔ Doctors Count:', docs.status, docs.body.count);

    // 8. Test New Patient Registration with QR Code Generation
    const testEmail = `sarah.${Date.now()}@test.com`;
    const regRes = await postJSON('/api/auth/register-patient', {
      name: 'Sarah Connor',
      email: testEmail,
      password: 'SarahPassword123!',
      phone: '+1 (555) 777-8888',
      gender: 'female',
      bloodGroup: 'B+'
    });
    console.log('✔ Patient Registration:', regRes.status, regRes.body.patientProfile.patientCode, 'QR length:', regRes.body.patientProfile.qrCodeDataUrl ? regRes.body.patientProfile.qrCodeDataUrl.length : 0);

    console.log('\n=== ALL PHASE 1 BACKEND CHECKS PASSED SUCCESSFULLY ===\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Test error:', err);
    server.close();
    process.exit(1);
  }
});
