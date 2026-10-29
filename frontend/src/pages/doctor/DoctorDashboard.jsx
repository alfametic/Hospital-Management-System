import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { doctorAPI } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import QRScanner from './QRScanner';
import AddMedicalRecordModal from './AddMedicalRecordModal';

const DoctorDashboard = () => {
  const { user } = useAuth();

  // Tab State: 'appointments' | 'scanner' | 'emr' | 'schedule'
  const [activeTab, setActiveTab] = useState('appointments');

  const [doctorProfile, setDoctorProfile] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Selected Patient for EMR View
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [lookupLoading, setLookupLoading] = useState(false);
  const [isDocumenting, setIsDocumenting] = useState(false);
  const [linkedAppointmentId, setLinkedAppointmentId] = useState(null);

  // Filter for appointments
  const [apptFilter, setApptFilter] = useState('all');

  // Schedule settings form state
  const [scheduleForm, setScheduleForm] = useState({
    roomNumber: '',
    consultationFee: 50,
    bio: '',
    isAcceptingAppointments: true,
    availableDays: []
  });
  const [updatingSchedule, setUpdatingSchedule] = useState(false);

  // Initial load
  const loadDoctorData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileRes, apptsRes] = await Promise.all([
        doctorAPI.getMyProfile(),
        doctorAPI.getMyAppointments()
      ]);

      const doc = profileRes.data.data;
      setDoctorProfile(doc);
      setAppointments(apptsRes.data.data || []);

      if (doc) {
        setScheduleForm({
          roomNumber: doc.roomNumber || '',
          consultationFee: doc.consultationFee || 50,
          bio: doc.bio || '',
          isAcceptingAppointments: doc.isAcceptingAppointments !== false,
          availableDays: doc.availableDays || []
        });
      }
    } catch (err) {
      console.error('Failed to load doctor dashboard:', err);
      setError('Could not load clinical workspace data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDoctorData();
  }, []);

  // Handle QR scan lookup
  const handlePatientLookup = async (inputCode) => {
    try {
      setLookupLoading(true);
      setError(null);
      setSuccess(null);

      const match = (inputCode || '').match(/(PAT-\d{4}-[A-Z0-9]+)/i);
      const patientCode = match ? match[1].toUpperCase() : (inputCode || '').trim().toUpperCase();

      const res = await doctorAPI.lookupPatientByCode(patientCode);
      if (res.data.success) {
        setSelectedPatient(res.data.patient);
        setPatientRecords(res.data.records || []);
        setActiveTab('emr');
        setIsDocumenting(false);
        setSuccess(`Patient chart retrieved for: ${res.data.patient?.userId?.name} (${patientCode})`);
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      setError(err.message || 'Patient not found or unauthorized.');
    } finally {
      setLookupLoading(false);
    }
  };

  // Open EMR from an appointment row
  const handleOpenFromAppointment = (appt) => {
    const code = appt.patientId?.patientCode;
    if (code) {
      setLinkedAppointmentId(appt._id);
      handlePatientLookup(code);
    }
  };

  // Callback when a new medical record is submitted
  const handleRecordCreated = (newRecord) => {
    setPatientRecords([newRecord, ...patientRecords]);
    setIsDocumenting(false);
    setLinkedAppointmentId(null);
    setSuccess('Consultation successfully documented to patient chronological EMR.');
    loadDoctorData(); // Refresh appointment status
  };

  // Save Schedule settings
  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdatingSchedule(true);
      setError(null);
      await doctorAPI.updateSchedule(scheduleForm);
      setSuccess('Doctor schedule & consultation preferences updated successfully.');
      loadDoctorData();
    } catch (err) {
      setError(err.message || 'Failed to update schedule settings.');
    } finally {
      setUpdatingSchedule(false);
    }
  };

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const toggleDay = (day) => {
    if (scheduleForm.availableDays.includes(day)) {
      setScheduleForm({
        ...scheduleForm,
        availableDays: scheduleForm.availableDays.filter((d) => d !== day)
      });
    } else {
      setScheduleForm({
        ...scheduleForm,
        availableDays: [...scheduleForm.availableDays, day]
      });
    }
  };

  const filteredAppointments = appointments.filter((a) => {
    if (apptFilter === 'all') return true;
    return a.status === apptFilter;
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const todayCount = appointments.filter((a) => {
    const d = new Date(a.appointmentDate).toISOString().split('T')[0];
    return d === todayStr;
  }).length;

  if (loading) {
    return <LoadingSpinner message="Loading doctor workspace and clinical registry..." />;
  }

  return (
    <div className="py-4 bg-light" style={{ minHeight: '85vh' }}>
      <div className="container">
        {/* Header Profile Banner */}
        <div className="bg-white p-4 p-md-5 rounded-4 border shadow-sm mb-4">
          <div className="row align-items-center g-4">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-navy text-white px-3 py-1">
                  <i className="bi bi-person-badge me-1"></i> ATTENDING PHYSICIAN
                </span>
                <span className="badge bg-light-blue text-teal border border-teal border-opacity-25 px-2 py-1">
                  {doctorProfile?.departmentId?.name || 'Department'}
                </span>
              </div>
              <h2 className="fw-bold text-navy mb-1">{user?.name}</h2>
              <div className="text-muted small d-flex flex-wrap gap-3">
                <span>
                  <i className="bi bi-award-fill text-teal me-1"></i> {doctorProfile?.qualification}
                </span>
                <span>
                  <i className="bi bi-door-open-fill text-teal me-1"></i> {doctorProfile?.roomNumber}
                </span>
                <span>
                  <i className="bi bi-cash-stack text-teal me-1"></i> Fee: <strong>${doctorProfile?.consultationFee}</strong>
                </span>
                <span>
                  <i className="bi bi-clock-history text-teal me-1"></i> Experience: {doctorProfile?.experienceYears} Years
                </span>
              </div>
            </div>

            <div className="col-md-4 text-md-end">
              <button
                className="btn btn-hospital-teal py-2 px-4 fw-semibold shadow-sm"
                onClick={() => setActiveTab('scanner')}
              >
                <i className="bi bi-qr-code-scan me-2"></i> Scan Patient QR Code
              </button>
            </div>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-navy">{appointments.length}</div>
              <div className="text-muted small">Total Consultations</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-teal">{todayCount}</div>
              <div className="text-muted small">Today's Schedule</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-success">
                {appointments.filter((a) => a.status === 'completed').length}
              </div>
              <div className="text-muted small">Completed Consults</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-navy">
                {doctorProfile?.availableDays?.length || 0}
              </div>
              <div className="text-muted small">Active Practice Days</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-3 border shadow-sm mb-4">
          <ul className="nav nav-pills nav-fill">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'appointments' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('appointments')}
              >
                <i className="bi bi-calendar-check me-2"></i> Patient Appointments ({appointments.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'scanner' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('scanner')}
              >
                <i className="bi bi-qr-code-scan me-2"></i> Scan Patient QR
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'emr' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('emr')}
              >
                <i className="bi bi-journal-medical me-2"></i> Patient EMR Chart {selectedPatient && `(${selectedPatient.patientCode})`}
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'schedule' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('schedule')}
              >
                <i className="bi bi-gear-fill me-2"></i> Practice Schedule
              </button>
            </li>
          </ul>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}

        {lookupLoading && <LoadingSpinner message="Looking up authorized patient clinical record..." />}

        {/* TAB 1: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="btn-group btn-group-sm">
                <button
                  className={`btn ${apptFilter === 'all' ? 'btn-navy text-white' : 'btn-outline-secondary'}`}
                  onClick={() => setApptFilter('all')}
                >
                  All ({appointments.length})
                </button>
                <button
                  className={`btn ${apptFilter === 'confirmed' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                  onClick={() => setApptFilter('confirmed')}
                >
                  Confirmed ({appointments.filter(a => a.status === 'confirmed').length})
                </button>
                <button
                  className={`btn ${apptFilter === 'completed' ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                  onClick={() => setApptFilter('completed')}
                >
                  Completed ({appointments.filter(a => a.status === 'completed').length})
                </button>
              </div>

              <button className="btn btn-sm btn-hospital-outline" onClick={loadDoctorData}>
                <i className="bi bi-arrow-clockwise me-1"></i> Refresh Schedule
              </button>
            </div>

            {filteredAppointments.length === 0 ? (
              <div className="card-healthcare p-5 text-center bg-white border">
                <i className="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
                <h5 className="fw-bold text-navy">No Appointments Scheduled</h5>
                <p className="text-muted small mb-0">
                  There are no appointments under the selected status filter.
                </p>
              </div>
            ) : (
              <div className="table-responsive bg-white rounded-3 border shadow-sm">
                <table className="table table-hover align-middle mb-0">
                  <thead className="table-light small">
                    <tr>
                      <th>Patient</th>
                      <th>Opaque ID</th>
                      <th>Date</th>
                      <th>Time Slot</th>
                      <th>Reason / Complaint</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="small">
                    {filteredAppointments.map((appt) => (
                      <tr key={appt._id}>
                        <td className="fw-bold text-navy">
                          {appt.patientId?.userId?.name || 'Patient'}
                        </td>
                        <td>
                          <span className="badge bg-light text-navy border">
                            {appt.patientId?.patientCode || 'N/A'}
                          </span>
                        </td>
                        <td>
                          {new Date(appt.appointmentDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="fw-semibold text-teal">{appt.timeSlot}</td>
                        <td className="text-muted text-truncate" style={{ maxWidth: '200px' }}>
                          {appt.reason}
                        </td>
                        <td>
                          <span
                            className={`badge text-capitalize ${
                              appt.status === 'confirmed'
                                ? 'bg-success'
                                : appt.status === 'completed'
                                ? 'bg-primary'
                                : 'bg-secondary'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            className="btn btn-sm btn-hospital-primary py-1 px-3"
                            onClick={() => handleOpenFromAppointment(appt)}
                          >
                            <i className="bi bi-folder2-open me-1"></i> Open EMR
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: QR SCANNER */}
        {activeTab === 'scanner' && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <QRScanner onScanSuccess={handlePatientLookup} />
            </div>
          </div>
        )}

        {/* TAB 3: PATIENT EMR & CHRONOLOGICAL HISTORY */}
        {activeTab === 'emr' && (
          <div>
            {!selectedPatient ? (
              <div className="card-healthcare p-5 text-center bg-white border">
                <i className="bi bi-qr-code fs-1 text-teal mb-3 d-block"></i>
                <h5 className="fw-bold text-navy">No Patient Chart Active</h5>
                <p className="text-muted small mb-4">
                  Scan a patient's QR card or select an appointment to load their clinical chart.
                </p>
                <button className="btn btn-hospital-teal px-4" onClick={() => setActiveTab('scanner')}>
                  <i className="bi bi-qr-code-scan me-2"></i> Scan Patient Identifier
                </button>
              </div>
            ) : isDocumenting ? (
              <AddMedicalRecordModal
                patient={selectedPatient}
                appointmentId={linkedAppointmentId}
                onRecordCreated={handleRecordCreated}
                onCancel={() => setIsDocumenting(false)}
              />
            ) : (
              <div>
                {/* Patient Summary Header Card */}
                <div className="card-healthcare p-4 bg-white border mb-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3">
                    <div>
                      <span className="badge bg-light text-navy border mb-1">
                        PATIENT IDENTIFIER: <strong>{selectedPatient.patientCode}</strong>
                      </span>
                      <h3 className="fw-bold text-navy mb-0">{selectedPatient.userId?.name}</h3>
                      <div className="small text-muted">
                        <i className="bi bi-envelope me-1"></i> {selectedPatient.userId?.email} |{' '}
                        <i className="bi bi-telephone me-1"></i> {selectedPatient.userId?.phone || 'No phone'}
                      </div>
                    </div>

                    <div className="d-flex gap-2 mt-2 mt-sm-0">
                      <button
                        className="btn btn-hospital-teal py-2 px-3 fw-bold"
                        onClick={() => setIsDocumenting(true)}
                      >
                        <i className="bi bi-plus-circle me-1"></i> Document Consultation
                      </button>
                      <button
                        className="btn btn-outline-secondary py-2"
                        onClick={() => setSelectedPatient(null)}
                      >
                        Close Chart
                      </button>
                    </div>
                  </div>

                  <div className="row g-3 small">
                    <div className="col-sm-3">
                      <span className="text-muted d-block">Blood Group:</span>
                      <strong className="text-danger fs-6">{selectedPatient.bloodGroup || 'Unknown'}</strong>
                    </div>
                    <div className="col-sm-3">
                      <span className="text-muted d-block">Gender:</span>
                      <strong className="text-navy text-capitalize">{selectedPatient.gender}</strong>
                    </div>
                    <div className="col-sm-3">
                      <span className="text-muted d-block">Allergies:</span>
                      <div>
                        {selectedPatient.allergies?.length > 0 ? (
                          selectedPatient.allergies.map((a, idx) => (
                            <span key={idx} className="badge bg-danger text-white me-1">
                              {a}
                            </span>
                          ))
                        ) : (
                          <span className="text-muted">None recorded</span>
                        )}
                      </div>
                    </div>
                    <div className="col-sm-3">
                      <span className="text-muted d-block">Emergency Contact:</span>
                      <strong>
                        {selectedPatient.emergencyContact?.name
                          ? `${selectedPatient.emergencyContact.name} (${selectedPatient.emergencyContact.phone || ''})`
                          : 'Not listed'}
                      </strong>
                    </div>
                  </div>
                </div>

                {/* Chronological Medical Records Timeline */}
                <h4 className="fw-bold text-navy mb-3">
                  <i className="bi bi-clock-history text-teal me-2"></i> Chronological Clinical History ({patientRecords.length})
                </h4>

                {patientRecords.length === 0 ? (
                  <div className="card-healthcare p-4 bg-white border text-center text-muted">
                    No clinical visit records documented for this patient yet. Click "Document Consultation" above to record notes.
                  </div>
                ) : (
                  patientRecords.map((record) => (
                    <div key={record._id} className="card-healthcare p-4 bg-white border mb-3">
                      <div className="d-flex justify-content-between align-items-center border-bottom pb-2 mb-3">
                        <div>
                          <h5 className="fw-bold text-navy mb-0">{record.diagnosis}</h5>
                          <small className="text-muted">
                            Recorded by <strong>{record.doctorId?.userId?.name || 'Physician'}</strong> ({record.doctorId?.departmentId?.name || 'Department'})
                          </small>
                        </div>
                        <span className="badge bg-light text-navy border px-3 py-2">
                          <i className="bi bi-calendar3 text-teal me-1"></i>
                          {new Date(record.visitDate).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      </div>

                      <div className="row g-3 mb-3 small">
                        <div className="col-md-6">
                          <div className="p-3 bg-light rounded-3 h-100">
                            <strong>Chief Complaints:</strong>
                            <p className="text-muted mb-0">{record.chiefComplaints}</p>
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="p-3 bg-light rounded-3 h-100">
                            <strong>Clinical Assessment:</strong>
                            <p className="text-muted mb-0">{record.clinicalNotes || 'No notes added.'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Vitals */}
                      {record.vitalSigns && (
                        <div className="mb-3">
                          <div className="small fw-semibold text-navy mb-1">Vital Signs:</div>
                          <div className="d-flex flex-wrap gap-2 small">
                            {record.vitalSigns.bloodPressure && (
                              <span className="badge bg-light text-navy border">
                                BP: {record.vitalSigns.bloodPressure}
                              </span>
                            )}
                            {record.vitalSigns.heartRate && (
                              <span className="badge bg-light text-navy border">
                                HR: {record.vitalSigns.heartRate} bpm
                              </span>
                            )}
                            {record.vitalSigns.temperature && (
                              <span className="badge bg-light text-navy border">
                                Temp: {record.vitalSigns.temperature} °F
                              </span>
                            )}
                            {record.vitalSigns.oxygenSaturation && (
                              <span className="badge bg-light text-navy border">
                                SpO2: {record.vitalSigns.oxygenSaturation}%
                              </span>
                            )}
                            {record.vitalSigns.weight && (
                              <span className="badge bg-light text-navy border">
                                Wt: {record.vitalSigns.weight} kg
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Prescriptions */}
                      {record.prescriptions?.length > 0 && (
                        <div className="mb-3">
                          <div className="small fw-semibold text-navy mb-1">Prescriptions:</div>
                          <div className="table-responsive">
                            <table className="table table-sm table-bordered bg-white small mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Medicine</th>
                                  <th>Dosage</th>
                                  <th>Frequency</th>
                                  <th>Duration</th>
                                  <th>Instructions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {record.prescriptions.map((rx, rIdx) => (
                                  <tr key={rIdx}>
                                    <td className="fw-bold">{rx.medicineName}</td>
                                    <td>{rx.dosage}</td>
                                    <td>{rx.frequency}</td>
                                    <td>{rx.duration}</td>
                                    <td className="text-muted">{rx.instructions}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Lab Reports */}
                      {record.labReports?.length > 0 && (
                        <div>
                          <div className="small fw-semibold text-navy mb-1">Diagnostic Labs:</div>
                          <div className="row g-2 small">
                            {record.labReports.map((l, lIdx) => (
                              <div key={lIdx} className="col-md-6">
                                <div className="p-2 border rounded-2 bg-light">
                                  <strong>{l.testName}</strong> ({l.category})
                                  <div className="text-muted">{l.resultSummary}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRACTICE SCHEDULE SETTINGS */}
        {activeTab === 'schedule' && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <div className="card-healthcare p-4 p-md-5 bg-white border">
                <h4 className="fw-bold text-navy mb-3">Practice Schedule & Consultation Settings</h4>
                <p className="text-muted small mb-4">
                  Configure your OPD consultation room, consultation fee, and available consultation days.
                </p>

                <form onSubmit={handleScheduleSubmit}>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">OPD Consultation Room</label>
                      <input
                        type="text"
                        className="form-control form-control-hospital"
                        value={scheduleForm.roomNumber}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, roomNumber: e.target.value })}
                        placeholder="e.g., Suite 301, 3rd Floor"
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">Consultation Fee ($ USD)</label>
                      <input
                        type="number"
                        min="0"
                        className="form-control form-control-hospital"
                        value={scheduleForm.consultationFee}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, consultationFee: Number(e.target.value) })}
                      />
                    </div>

                    <div className="col-12">
                      <label className="form-label small fw-semibold text-navy">Professional Bio</label>
                      <textarea
                        rows="3"
                        className="form-control form-control-hospital"
                        value={scheduleForm.bio}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, bio: e.target.value })}
                        placeholder="Summary of clinical specializations, board certifications, and experience..."
                      ></textarea>
                    </div>

                    {/* Available Days */}
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-navy d-block">
                        Available Consultation Days:
                      </label>
                      <div className="d-flex flex-wrap gap-2">
                        {allDays.map((day) => {
                          const isSelected = scheduleForm.availableDays.includes(day);
                          return (
                            <button
                              key={day}
                              type="button"
                              className={`btn btn-sm ${isSelected ? 'btn-hospital-teal' : 'btn-outline-secondary'}`}
                              onClick={() => toggleDay(day)}
                            >
                              <i className={`bi ${isSelected ? 'bi-check-lg' : 'bi-plus'} me-1`}></i>
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Accepting appointments switch */}
                    <div className="col-12 pt-2">
                      <div className="form-check form-switch">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          role="switch"
                          id="acceptingAppointmentsSwitch"
                          checked={scheduleForm.isAcceptingAppointments}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, isAcceptingAppointments: e.target.checked })}
                        />
                        <label className="form-check-label small fw-semibold text-navy" htmlFor="acceptingAppointmentsSwitch">
                          Accepting New Appointments from Patients
                        </label>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-hospital-primary px-4 py-2"
                    disabled={updatingSchedule}
                  >
                    {updatingSchedule ? 'Saving Settings...' : 'Save Practice Settings'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorDashboard;
