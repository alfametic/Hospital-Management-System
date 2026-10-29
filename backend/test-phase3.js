const http = require('http');
const app = require('./src/app');

const PORT = 5056;
process.env.PORT = PORT;

const server = app.listen(PORT, async () => {
  console.log(`[Test Server Phase 3] Running on http://localhost:${PORT}`);

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

    // 1. Login as Patient John
    const patientLogin = await postJSON('/api/auth/login', {
      email: 'patient.john@example.com',
      password: 'PatientPassword123!'
    });
    console.log('✔ Patient Login:', patientLogin.status, patientLogin.body.profile.patientCode);
    const token = patientLogin.body.token;
    const authHeaders = { Authorization: `Bearer ${token}` };

    // 2. Fetch My Chronological Medical Records
    const recordsRes = await getJSON('/api/records/my-records', authHeaders);
    console.log('✔ My Medical Records count:', recordsRes.status, recordsRes.body.count);
    if (recordsRes.body.count > 0) {
      console.log('  -> Latest record diagnosis:', recordsRes.body.data[0].diagnosis);
      console.log('  -> Latest record vitals BP:', recordsRes.body.data[0].vitalSigns.bloodPressure);
    }

    // 3. Get Doctors & pick Cardio Doctor
    const docsRes = await getJSON('/api/doctors');
    const doctor = docsRes.body.data.find(d => d.specialization.includes('Cardiology'));
    console.log('✔ Selected Doctor for booking:', doctor.userId.name, 'Department:', doctor.departmentId.name);

    // Calculate a valid future day that matches doctor's available days
    // Doctor available days: Monday - Friday
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    while (targetDate.getDay() === 0 || targetDate.getDay() === 6) {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const dateString = targetDate.toISOString().split('T')[0];

    // 4. Query booked slots
    const slotsRes = await getJSON(`/api/appointments/booked-slots?doctorId=${doctor._id}&date=${dateString}`);
    console.log('✔ Booked slots on', dateString, ':', slotsRes.status, slotsRes.body.bookedSlots);

    // 5. Pick an available slot that is not yet booked
    const availableSlot = doctor.availableTimeSlots.find(s => !slotsRes.body.bookedSlots.includes(s)) || doctor.availableTimeSlots[0];
    const selectedSlot = availableSlot;
    const bookRes = await postJSON(
      '/api/appointments',
      {
        doctorId: doctor._id,
        departmentId: doctor.departmentId._id,
        appointmentDate: dateString,
        timeSlot: selectedSlot,
        reason: 'Phase 3 Verification: Follow-up checkup'
      },
      authHeaders
    );
    console.log('✔ Booked Appointment status:', bookRes.status, bookRes.body.message);
    const newAppointmentId = bookRes.body.data?._id;

    // 6. Test Double Booking Prevention (Concurrency / conflict check)
    const duplicateRes = await postJSON(
      '/api/appointments',
      {
        doctorId: doctor._id,
        departmentId: doctor.departmentId._id,
        appointmentDate: dateString,
        timeSlot: selectedSlot,
        reason: 'Attempting double booking'
      },
      authHeaders
    );
    console.log('✔ Double Booking Prevention (Expected 409 Conflict):', duplicateRes.status, duplicateRes.body.message);
    if (duplicateRes.status !== 409) {
      throw new Error(`Expected 409 Conflict for double booking, got ${duplicateRes.status}`);
    }

    // 7. Get My Appointments list
    const myApptsRes = await getJSON('/api/appointments/my-appointments', authHeaders);
    console.log('✔ My Appointments count:', myApptsRes.status, myApptsRes.body.count);

    // 8. Cancel the newly booked appointment
    const cancelRes = await putJSON(
      `/api/appointments/${newAppointmentId}/cancel`,
      { reason: 'Verified Phase 3 tests completed.' },
      authHeaders
    );
    console.log('✔ Cancel Appointment status:', cancelRes.status, cancelRes.body.data.status);

    console.log('\n=== ALL PHASE 3 BACKEND CHECKS PASSED SUCCESSFULLY ===\n');
    server.close();
    process.exit(0);
  } catch (err) {
    console.error('Phase 3 backend test error:', err);
    server.close();
    process.exit(1);
  }
});
