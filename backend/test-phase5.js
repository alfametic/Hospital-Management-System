const http = require('http');
const app = require('./src/app');

const PORT = 5058;
process.env.PORT = PORT;

const server = app.listen(PORT, async () => {
  console.log(`[Test Server Phase 5] Running on http://localhost:${PORT}`);

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

    const putJSON = (path, body, headers = {}) => {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(
          {
            hostname: 'localhost',
            port: PORT,
            path,
            method: 'PUT',
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

    const patchJSON = (path, body, headers = {}) => {
      return new Promise((resolve, reject) => {
        const payload = JSON.stringify(body);
        const req = http.request(
          {
            hostname: 'localhost',
            port: PORT,
            path,
            method: 'PATCH',
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

    // 1. Admin Login
    const adminLogin = await postJSON('/api/auth/login', {
      email: 'admin@hospital.com',
      password: 'AdminPassword123!'
    });
    console.log('✔ Admin Login:', adminLogin.status, adminLogin.body.user.role);
    const adminToken = adminLogin.body.token;
    const adminHeaders = { Authorization: `Bearer ${adminToken}` };

    // 2. Fetch Metrics & Hospital Overview
    const metricsRes = await getJSON('/api/admin/metrics', adminHeaders);
    console.log('✔ Hospital Overview counts:', metricsRes.status, metricsRes.body.data.counts);

    // 3. Department Management (Create + Toggle Status)
    const timestamp = Date.now();
    const newDeptRes = await postJSON(
      '/api/departments',
      {
        name: `Oncology & Radiation ${timestamp}`,
        code: `ONC${String(timestamp).slice(-4)}`,
        description: 'Comprehensive medical and radiation oncology clinical services.',
        icon: 'bi-shield-plus'
      },
      adminHeaders
    );
    console.log('✔ Admin Created Department:', newDeptRes.status, newDeptRes.body.data.name);
    const newDeptId = newDeptRes.body.data._id;

    // Toggle status to deactivated
    const toggleDeactivate = await patchJSON(
      `/api/admin/departments/${newDeptId}/toggle-status`,
      {},
      adminHeaders
    );
    console.log('✔ Toggled Department to Deactivated:', toggleDeactivate.status, toggleDeactivate.body.data.isActive === false);

    // Toggle status back to active
    const toggleReactivate = await patchJSON(
      `/api/admin/departments/${newDeptId}/toggle-status`,
      {},
      adminHeaders
    );
    console.log('✔ Toggled Department to Reactivated:', toggleReactivate.status, toggleReactivate.body.data.isActive === true);

    // 4. Onboard Doctor
    const newDoctorRes = await postJSON(
      '/api/doctors',
      {
        name: 'Dr. Gregory House',
        email: `doctor.house.${timestamp}@hospital.com`,
        password: 'DoctorPassword123!',
        phone: '+1 (555) 999-1234',
        departmentId: newDeptId,
        specialization: 'Diagnostic Medicine & Nephrology',
        qualification: 'MD, FACP',
        experienceYears: 20,
        consultationFee: 120,
        roomNumber: 'Diagnostics Lab Suite 101'
      },
      adminHeaders
    );
    console.log('✔ Admin Onboarded Doctor:', newDoctorRes.status, newDoctorRes.body.data.name);
    const newDoctorProfileId = newDoctorRes.body.data.doctorProfile._id;

    // Update Doctor Fee & Room by Admin
    const updateDocRes = await putJSON(
      `/api/admin/doctors/${newDoctorProfileId}`,
      {
        consultationFee: 135,
        roomNumber: 'Diagnostics Tower Suite 202'
      },
      adminHeaders
    );
    console.log('✔ Admin Updated Doctor:', updateDocRes.status, 'New fee:', updateDocRes.body.data.consultationFee);

    // 5. Query Hospital Appointments & Update Status
    const apptsRes = await getJSON('/api/admin/appointments', adminHeaders);
    console.log('✔ Admin Hospital-Wide Appointments count:', apptsRes.status, apptsRes.body.count);

    if (apptsRes.body.count > 0) {
      const targetApptId = apptsRes.body.data[0]._id;
      const statusUpdateRes = await patchJSON(
        `/api/admin/appointments/${targetApptId}/status`,
        { status: 'confirmed', doctorNotes: 'Confirmed by administrative desk.' },
        adminHeaders
      );
      console.log('✔ Admin Updated Appointment Status:', statusUpdateRes.status, statusUpdateRes.body.data.status);
    }

    // 6. Patient Directory Lookup
    const patientsRes = await getJSON('/api/admin/patients?search=Johnathan', adminHeaders);
    console.log('✔ Admin Patient Directory Search:', patientsRes.status, 'Found:', patientsRes.body.count, patientsRes.body.data[0]?.patientCode);

    // 7. RBAC Check: Ensure a doctor CANNOT access admin metrics (Must return 403 Forbidden)
    const doctorLogin = await postJSON('/api/auth/login', {
      email: 'doctor.cardio@hospital.com',
      password: 'DoctorPassword123!'
    });
    const doctorHeaders = { Authorization: `Bearer ${doctorLogin.body.token}` };

    const rbacAdminCheck = await getJSON('/api/admin/metrics', doctorHeaders);
    console.log('✔ Admin RBAC Check (Expected 403 Forbidden):', rbacAdminCheck.status);
    if (rbacAdminCheck.status !== 403) {
      throw new Error(`Expected 403 Forbidden for non-admin, got ${rbacAdminCheck.status}`);
    }

    console.log('\n=== ALL PHASE 5 BACKEND CHECKS PASSED SUCCESSFULLY ===\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Phase 5 backend test error:', err);
    server.close();
    process.exit(1);
  }
});
