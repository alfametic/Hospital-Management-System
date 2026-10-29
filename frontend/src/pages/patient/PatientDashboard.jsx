import React, { useEffect, useState, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { appointmentAPI, medicalRecordAPI, authAPI } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import PatientQRCard from './PatientQRCard';
import { QRCodeSVG } from 'qrcode.react';

const PatientDashboard = () => {
  const { user, profile, updateStoredProfile } = useAuth();
  const location = useLocation();

  // Tab State: 'appointments' | 'qr' | 'records' | 'profile'
  const [activeTab, setActiveTab] = useState(
    location.state?.activeTab || 'appointments'
  );

  const [appointments, setAppointments] = useState([]);
  const [medicalRecords, setMedicalRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Authenticated QR Code State
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(profile?.qrCodeDataUrl || null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);

  // Appointment filter
  const [statusFilter, setStatusFilter] = useState('all');

  // Cancel modal state
  const [cancellingAppt, setCancellingAppt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);

  // Fetch Patient Appointments and Records
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [apptRes, recordRes] = await Promise.all([
        appointmentAPI.getMyAppointments(),
        medicalRecordAPI.getMyRecords()
      ]);
      setAppointments(apptRes.data.data || []);
      setMedicalRecords(recordRes.data.data || []);
    } catch (err) {
      console.error('Error fetching patient dashboard data:', err);
      setError('Could not load patient records. Please verify database connection.');
    } finally {
      setLoading(false);
    }
  };

  // Securely fetch or lazy-generate authenticated patient's QR code from backend
  const fetchQRCode = useCallback(async () => {
    try {
      setQrLoading(true);
      setQrError(null);
      const res = await authAPI.getMyQR();
      if (res.data?.success && res.data?.qrCodeDataUrl) {
        setQrCodeDataUrl(res.data.qrCodeDataUrl);
        if (profile && (!profile.qrCodeDataUrl || profile.qrCodeDataUrl !== res.data.qrCodeDataUrl)) {
          if (typeof updateStoredProfile === 'function') {
            updateStoredProfile({ ...profile, qrCodeDataUrl: res.data.qrCodeDataUrl });
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch patient QR code from backend:', err.message);
      setQrError('Unable to load server-generated QR code. Standard QR code will be displayed.');
    } finally {
      setQrLoading(false);
    }
  }, [profile, updateStoredProfile]);

  useEffect(() => {
    fetchData();
    fetchQRCode();
  }, []);

  const handleCancelAppointment = async () => {
    if (!cancellingAppt) return;
    setCancelLoading(true);
    try {
      await appointmentAPI.cancel(cancellingAppt._id, cancelReason || 'Cancelled by patient');
      setSuccess('Appointment successfully cancelled.');
      setCancellingAppt(null);
      setCancelReason('');
      fetchData();
    } catch (err) {
      setError(err.message || 'Failed to cancel appointment.');
    } finally {
      setCancelLoading(false);
    }
  };

  const patientCode = profile?.patientCode || 'PAT-PENDING';
  const currentQrCode = qrCodeDataUrl || profile?.qrCodeDataUrl;
  const baseUrl = (import.meta.env.VITE_FRONTEND_URL && import.meta.env.VITE_FRONTEND_URL.trim())
    ? import.meta.env.VITE_FRONTEND_URL.trim().replace(/\/$/, '')
    : (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const verificationUrl = `${baseUrl}/verify-patient?code=${encodeURIComponent(patientCode)}`;

  // Header QR Download Handler
  const handleDownloadHeaderQR = () => {
    if (currentQrCode && currentQrCode.startsWith('data:image/')) {
      const link = document.createElement('a');
      link.href = currentQrCode;
      link.download = `${patientCode}_Identification_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const svg = document.getElementById('patient-header-qr-svg');
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width || 320;
      canvas.height = img.height || 320;
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = `${patientCode}_Identification_QR.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const filteredAppointments = appointments.filter((appt) => {
    if (statusFilter === 'all') return true;
    return appt.status === statusFilter;
  });

  const upcomingCount = appointments.filter((a) => a.status === 'confirmed').length;

  return (
    <div className="py-4 bg-light" style={{ minHeight: '85vh' }}>
      <div className="container">
        {/* Header Section with Instant Patient QR Display */}
        <div className="bg-white p-4 p-md-4 rounded-4 border shadow-sm mb-4">
          <div className="row align-items-center g-4">
            {/* Left: Patient Profile Demographics */}
            <div className="col-lg-7">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-light-blue text-teal fw-bold px-3 py-1 border border-teal border-opacity-25">
                  <i className="bi bi-shield-check me-1"></i> VERIFIED PATIENT PORTAL
                </span>
                <span className="badge bg-navy text-white px-2 py-1">
                  ID: {patientCode}
                </span>
              </div>
              <h2 className="fw-bold text-navy mb-1">{user?.name}</h2>
              <div className="text-muted small d-flex flex-wrap gap-3 mb-3">
                <span>
                  <i className="bi bi-envelope text-teal me-1"></i> {user?.email}
                </span>
                <span>
                  <i className="bi bi-telephone text-teal me-1"></i> {user?.phone || 'No phone recorded'}
                </span>
                <span>
                  <i className="bi bi-droplet-fill text-danger me-1"></i> Blood Group: <strong>{profile?.bloodGroup || 'Unknown'}</strong>
                </span>
              </div>
              <div className="d-flex flex-wrap gap-2">
                <Link to="/patient/book" className="btn btn-sm btn-hospital-teal py-2 px-3 fw-semibold shadow-sm">
                  <i className="bi bi-calendar-plus me-1"></i> Book Consultation
                </Link>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-navy py-2 px-3 fw-semibold"
                  onClick={() => setActiveTab('qr')}
                >
                  <i className="bi bi-qr-code me-1"></i> View Full ID Card
                </button>
              </div>
            </div>

            {/* Right: Instant Patient Check-in QR Code Display */}
            <div className="col-lg-5">
              <div className="bg-light p-3 rounded-4 border d-flex align-items-center gap-3">
                <div
                  className="bg-white p-2 rounded-3 border shadow-sm flex-shrink-0 text-center"
                  style={{ width: '100px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  {qrLoading ? (
                    <div className="spinner-border spinner-border-sm text-teal" role="status">
                      <span className="visually-hidden">Loading QR...</span>
                    </div>
                  ) : currentQrCode ? (
                    <img
                      src={currentQrCode}
                      alt={`Patient QR: ${patientCode}`}
                      className="img-fluid rounded"
                      style={{ maxHeight: '84px', maxWidth: '84px' }}
                    />
                  ) : (
                    <QRCodeSVG
                      id="patient-header-qr-svg"
                      value={verificationUrl}
                      size={80}
                      level="H"
                      fgColor="#0a2540"
                      bgColor="#ffffff"
                    />
                  )}
                </div>

                <div className="flex-grow-1">
                  <div className="d-flex align-items-center justify-content-between mb-1">
                    <span className="badge bg-teal text-white small" style={{ fontSize: '0.7rem' }}>
                      <i className="bi bi-qr-code-scan me-1"></i> CHECK-IN QR
                    </span>
                  </div>
                  <div className="fw-bold text-navy" style={{ fontSize: '0.88rem' }}>
                    {patientCode}
                  </div>
                  <div className="text-muted small" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                    Present to doctor or reception desk for contactless check-in.
                  </div>
                  <div className="mt-2 d-flex gap-2">
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-teal text-decoration-none fw-semibold"
                      style={{ fontSize: '0.78rem' }}
                      onClick={handleDownloadHeaderQR}
                      disabled={qrLoading}
                    >
                      <i className="bi bi-download me-1"></i> Download QR
                    </button>
                    <span className="text-muted">|</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-link p-0 text-navy text-decoration-none fw-semibold"
                      style={{ fontSize: '0.78rem' }}
                      onClick={() => setActiveTab('qr')}
                    >
                      <i className="bi bi-printer me-1"></i> Print Card
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-navy">{upcomingCount}</div>
              <div className="text-muted small">Upcoming Consultations</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-teal">{appointments.length}</div>
              <div className="text-muted small">Total Appointments</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-navy">{medicalRecords.length}</div>
              <div className="text-muted small">Clinical Visit Records</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-danger">
                {profile?.allergies?.length || 0}
              </div>
              <div className="text-muted small">Known Allergies</div>
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
                <i className="bi bi-calendar-event me-2"></i> Appointments ({appointments.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'qr' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('qr')}
              >
                <i className="bi bi-qr-code me-2"></i> Digital QR Identification
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'records' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('records')}
              >
                <i className="bi bi-journal-medical me-2"></i> Medical Record History ({medicalRecords.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'profile' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="bi bi-person-lines-fill me-2"></i> Clinical Profile & Demographics
              </button>
            </li>
          </ul>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <LoadingSpinner message="Retrieving patient chart and appointments..." />
        ) : (
          <div>
            {/* TAB 1: APPOINTMENTS */}
            {activeTab === 'appointments' && (
              <div>
                {/* Filter and Action Header */}
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-3">
                  <div className="btn-group btn-group-sm mb-2 mb-sm-0">
                    <button
                      className={`btn ${statusFilter === 'all' ? 'btn-navy text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setStatusFilter('all')}
                    >
                      All ({appointments.length})
                    </button>
                    <button
                      className={`btn ${statusFilter === 'confirmed' ? 'btn-success text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setStatusFilter('confirmed')}
                    >
                      Confirmed ({appointments.filter(a => a.status === 'confirmed').length})
                    </button>
                    <button
                      className={`btn ${statusFilter === 'completed' ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setStatusFilter('completed')}
                    >
                      Completed ({appointments.filter(a => a.status === 'completed').length})
                    </button>
                    <button
                      className={`btn ${statusFilter === 'cancelled' ? 'btn-secondary text-white' : 'btn-outline-secondary'}`}
                      onClick={() => setStatusFilter('cancelled')}
                    >
                      Cancelled ({appointments.filter(a => a.status === 'cancelled').length})
                    </button>
                  </div>

                  <Link to="/patient/book" className="btn btn-sm btn-hospital-primary">
                    <i className="bi bi-plus-lg me-1"></i> Book New Appointment
                  </Link>
                </div>

                {filteredAppointments.length === 0 ? (
                  <div className="card-healthcare p-5 text-center bg-white border">
                    <i className="bi bi-calendar-x fs-1 text-muted mb-3 d-block"></i>
                    <h5 className="fw-bold text-navy">No Appointments Found</h5>
                    <p className="text-muted small mb-3">
                      You do not have any appointments under the "{statusFilter}" status filter.
                    </p>
                    <Link to="/patient/book" className="btn btn-hospital-teal px-4">
                      Book an Appointment Now
                    </Link>
                  </div>
                ) : (
                  <div className="row g-3">
                    {filteredAppointments.map((appt) => {
                      const apptDate = new Date(appt.appointmentDate);
                      const isUpcoming = appt.status === 'confirmed' && apptDate >= new Date().setHours(0,0,0,0);

                      return (
                        <div key={appt._id} className="col-lg-6">
                          <div className="card-healthcare p-4 bg-white border h-100 d-flex flex-column">
                            <div className="d-flex justify-content-between align-items-start mb-3">
                              <div>
                                <span className="badge badge-dept mb-1">
                                  {appt.departmentId?.name || 'Department'}
                                </span>
                                <h5 className="fw-bold text-navy mb-0">
                                  {appt.doctorId?.userId?.name || 'Attending Physician'}
                                </h5>
                                <small className="text-muted">
                                  {appt.doctorId?.specialization}
                                </small>
                              </div>

                              <span
                                className={`badge text-capitalize px-3 py-2 ${
                                  appt.status === 'confirmed'
                                    ? 'bg-success'
                                    : appt.status === 'completed'
                                    ? 'bg-primary'
                                    : 'bg-secondary'
                                }`}
                              >
                                {appt.status}
                              </span>
                            </div>

                            <div className="bg-light p-3 rounded-3 mb-3 small">
                              <div className="row g-2">
                                <div className="col-6">
                                  <span className="text-muted d-block">Date:</span>
                                  <strong className="text-navy">
                                    {new Date(appt.appointmentDate).toLocaleDateString('en-US', {
                                      weekday: 'short',
                                      year: 'numeric',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </strong>
                                </div>
                                <div className="col-6">
                                  <span className="text-muted d-block">Time Slot:</span>
                                  <strong className="text-teal">{appt.timeSlot}</strong>
                                </div>
                                <div className="col-6">
                                  <span className="text-muted d-block">OPD Room:</span>
                                  <span className="text-navy">{appt.doctorId?.roomNumber || 'Room 101'}</span>
                                </div>
                                <div className="col-6">
                                  <span className="text-muted d-block">Consultation Fee:</span>
                                  <span className="text-navy">${appt.doctorId?.consultationFee || 50}</span>
                                </div>
                              </div>
                            </div>

                            <div className="small mb-3 text-muted flex-grow-1">
                              <strong>Reason for Visit:</strong> {appt.reason || 'General checkup'}
                            </div>

                            {appt.status === 'cancelled' && appt.cancellationReason && (
                              <div className="alert alert-secondary py-1 px-2 small mb-3">
                                <strong>Cancelled:</strong> {appt.cancellationReason}
                              </div>
                            )}

                            {isUpcoming && (
                              <div className="pt-2 border-top mt-auto text-end">
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => setCancellingAppt(appt)}
                                >
                                  <i className="bi bi-x-circle me-1"></i> Cancel Appointment
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: DIGITAL QR CODE IDENTIFICATION CARD */}
            {activeTab === 'qr' && (
              <div className="py-2">
                <PatientQRCard
                  patient={profile}
                  profile={profile}
                  user={user}
                  qrCodeDataUrl={currentQrCode}
                  qrLoading={qrLoading}
                  qrError={qrError}
                  onRetry={fetchQRCode}
                />
              </div>
            )}

            {/* TAB 3: CHRONOLOGICAL MEDICAL RECORD HISTORY */}
            {activeTab === 'records' && (
              <div>
                <div className="mb-4">
                  <h4 className="fw-bold text-navy mb-1">Chronological Medical History</h4>
                  <p className="text-muted small">
                    Complete clinical records, diagnostic notes, vital signs, and official prescriptions from attending physicians.
                  </p>
                </div>

                {medicalRecords.length === 0 ? (
                  <div className="card-healthcare p-5 text-center bg-white border">
                    <i className="bi bi-journal-x fs-1 text-muted mb-3 d-block"></i>
                    <h5 className="fw-bold text-navy">No Medical Records on File</h5>
                    <p className="text-muted small mb-0">
                      You currently have no recorded clinical visits. Once you attend an appointment, your attending physician will record diagnoses, vitals, and prescriptions here.
                    </p>
                  </div>
                ) : (
                  <div className="timeline-container">
                    {medicalRecords.map((record) => (
                      <div key={record._id} className="card-healthcare p-4 bg-white border mb-4">
                        {/* Visit Header */}
                        <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3">
                          <div className="d-flex align-items-center gap-3">
                            <div
                              className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center"
                              style={{ width: '48px', height: '48px' }}
                            >
                              <i className="bi bi-file-earmark-medical-fill fs-4 text-teal"></i>
                            </div>
                            <div>
                              <h5 className="fw-bold text-navy mb-0">
                                {record.diagnosis}
                              </h5>
                              <small className="text-muted">
                                Consulted with <strong>{record.doctorId?.userId?.name || 'Attending Physician'}</strong> ({record.doctorId?.departmentId?.name || 'Specialist'})
                              </small>
                            </div>
                          </div>
                          <div className="text-end mt-2 mt-sm-0">
                            <span className="badge bg-light text-navy border px-3 py-2">
                              <i className="bi bi-calendar3 me-1 text-teal"></i>
                              {new Date(record.visitDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Chief Complaints & Clinical Notes */}
                        <div className="row g-3 mb-3">
                          <div className="col-md-6">
                            <div className="p-3 bg-light rounded-3 h-100 small">
                              <span className="fw-bold text-navy d-block mb-1">Chief Complaints:</span>
                              <p className="text-muted mb-0">{record.chiefComplaints}</p>
                            </div>
                          </div>
                          <div className="col-md-6">
                            <div className="p-3 bg-light rounded-3 h-100 small">
                              <span className="fw-bold text-navy d-block mb-1">Clinical Assessment:</span>
                              <p className="text-muted mb-0">{record.clinicalNotes || 'Patient stable on observation.'}</p>
                            </div>
                          </div>
                        </div>

                        {/* Vital Signs Grid */}
                        {record.vitalSigns && (
                          <div className="mb-3">
                            <span className="small fw-bold text-navy d-block mb-2">Recorded Vital Signs:</span>
                            <div className="row g-2 text-center small">
                              {record.vitalSigns.bloodPressure && (
                                <div className="col-4 col-md-2">
                                  <div className="p-2 border rounded-2 bg-white">
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>BP</div>
                                    <strong className="text-navy">{record.vitalSigns.bloodPressure}</strong>
                                  </div>
                                </div>
                              )}
                              {record.vitalSigns.heartRate && (
                                <div className="col-4 col-md-2">
                                  <div className="p-2 border rounded-2 bg-white">
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Heart Rate</div>
                                    <strong className="text-teal">{record.vitalSigns.heartRate} bpm</strong>
                                  </div>
                                </div>
                              )}
                              {record.vitalSigns.temperature && (
                                <div className="col-4 col-md-2">
                                  <div className="p-2 border rounded-2 bg-white">
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Temp</div>
                                    <strong className="text-navy">{record.vitalSigns.temperature} °F</strong>
                                  </div>
                                </div>
                              )}
                              {record.vitalSigns.oxygenSaturation && (
                                <div className="col-4 col-md-2">
                                  <div className="p-2 border rounded-2 bg-white">
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>SpO2</div>
                                    <strong className="text-success">{record.vitalSigns.oxygenSaturation}%</strong>
                                  </div>
                                </div>
                              )}
                              {record.vitalSigns.respiratoryRate && (
                                <div className="col-4 col-md-2">
                                  <div className="p-2 border rounded-2 bg-white">
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Resp Rate</div>
                                    <strong className="text-navy">{record.vitalSigns.respiratoryRate} /min</strong>
                                  </div>
                                </div>
                              )}
                              {record.vitalSigns.weight && (
                                <div className="col-4 col-md-2">
                                  <div className="p-2 border rounded-2 bg-white">
                                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Weight</div>
                                    <strong className="text-navy">{record.vitalSigns.weight} kg</strong>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Prescriptions Section */}
                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <div className="mb-3">
                            <span className="small fw-bold text-navy d-block mb-2">
                              <i className="bi bi-prescription2 text-teal me-1"></i> Prescribed Medications:
                            </span>
                            <div className="table-responsive">
                              <table className="table table-sm table-bordered bg-white small mb-0">
                                <thead className="table-light">
                                  <tr>
                                    <th>Medicine Name</th>
                                    <th>Dosage</th>
                                    <th>Frequency</th>
                                    <th>Duration</th>
                                    <th>Instructions</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {record.prescriptions.map((rx, rIdx) => (
                                    <tr key={rIdx}>
                                      <td className="fw-bold text-navy">{rx.medicineName}</td>
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

                        {/* Lab Reports Section */}
                        {record.labReports && record.labReports.length > 0 && (
                          <div>
                            <span className="small fw-bold text-navy d-block mb-2">
                              <i className="bi bi-radioactive text-teal me-1"></i> Diagnostic Lab Findings:
                            </span>
                            <div className="row g-2">
                              {record.labReports.map((lab, lIdx) => (
                                <div key={lIdx} className="col-md-6">
                                  <div className="p-2 border rounded-2 bg-light small">
                                    <div className="d-flex justify-content-between">
                                      <strong>{lab.testName}</strong>
                                      <span className="badge bg-success">{lab.status}</span>
                                    </div>
                                    <div className="text-muted mt-1">{lab.resultSummary}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: CLINICAL PROFILE & DEMOGRAPHICS (WITH EMBEDDED QR CODE) */}
            {activeTab === 'profile' && (
              <div className="card-healthcare p-4 p-md-5 bg-white border">
                <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 border-bottom pb-3">
                  <div>
                    <h4 className="fw-bold text-navy mb-1">Clinical Profile & Demographics</h4>
                    <p className="text-muted small mb-0">
                      Official patient chart information and unique digital identifier.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-hospital-teal"
                    onClick={() => setActiveTab('qr')}
                  >
                    <i className="bi bi-card-heading me-1"></i> Open Full Printable ID Card
                  </button>
                </div>

                {/* Patient QR Identification Panel */}
                <div className="bg-light p-4 rounded-4 border mb-4">
                  <div className="row align-items-center g-3">
                    <div className="col-sm-auto text-center">
                      <div
                        className="bg-white p-2 rounded-3 border shadow-sm d-inline-flex align-items-center justify-content-center"
                        style={{ width: '130px', height: '130px' }}
                      >
                        {qrLoading ? (
                          <div className="spinner-border text-teal" role="status">
                            <span className="visually-hidden">Loading QR...</span>
                          </div>
                        ) : currentQrCode ? (
                          <img
                            src={currentQrCode}
                            alt={`QR for ${patientCode}`}
                            className="img-fluid rounded"
                            style={{ maxHeight: '114px', maxWidth: '114px' }}
                          />
                        ) : (
                          <QRCodeSVG
                            value={verificationUrl}
                            size={110}
                            level="H"
                            fgColor="#0a2540"
                            bgColor="#ffffff"
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-sm">
                      <span className="badge bg-navy text-white px-2 py-1 mb-1">
                        DIGITAL PATIENT IDENTIFIER
                      </span>
                      <h4 className="fw-bold text-teal mb-1">{patientCode}</h4>
                      <p className="text-muted small mb-3" style={{ maxWidth: '600px' }}>
                        This opaque QR identifier is used to securely verify your identity and pull authorized medical records at doctor check-in. It never contains private medical details inside the code itself.
                      </p>
                      <div className="d-flex flex-wrap gap-2">
                        <button
                          type="button"
                          className="btn btn-sm btn-hospital-teal"
                          onClick={handleDownloadHeaderQR}
                          disabled={qrLoading}
                        >
                          <i className="bi bi-download me-1"></i> Download QR Image
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-navy"
                          onClick={() => setActiveTab('qr')}
                        >
                          <i className="bi bi-printer me-1"></i> Print ID Card
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3">
                      <span className="small text-muted d-block">Full Legal Name</span>
                      <strong className="fs-5 text-navy">{user?.name}</strong>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 bg-light rounded-3">
                      <span className="small text-muted d-block">Blood Group</span>
                      <strong className="fs-5 text-danger">{profile?.bloodGroup || 'Unknown'}</strong>
                    </div>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <h6 className="fw-bold text-navy mb-2">Recorded Allergies:</h6>
                    {profile?.allergies?.length > 0 ? (
                      <div>
                        {profile.allergies.map((allergy, aIdx) => (
                          <span key={aIdx} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 me-2 mb-2">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">No known drug/food allergies recorded.</span>
                    )}
                  </div>

                  <div className="col-md-6">
                    <h6 className="fw-bold text-navy mb-2">Chronic Conditions:</h6>
                    {profile?.chronicConditions?.length > 0 ? (
                      <div>
                        {profile.chronicConditions.map((cond, cIdx) => (
                          <span key={cIdx} className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-2 py-1 me-2 mb-2">
                            {cond}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted small">No chronic medical conditions recorded.</span>
                    )}
                  </div>
                </div>

                <div className="border-top pt-3">
                  <h6 className="fw-bold text-navy mb-2">Designated Emergency Contact:</h6>
                  <div className="small text-muted">
                    <div><strong>Name:</strong> {profile?.emergencyContact?.name || 'Not provided'}</div>
                    <div><strong>Relationship:</strong> {profile?.emergencyContact?.relation || 'N/A'}</div>
                    <div><strong>Phone:</strong> {profile?.emergencyContact?.phone || 'N/A'}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cancellation Confirmation Modal */}
        {cancellingAppt && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(10, 37, 64, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-navy">
                    <i className="bi bi-exclamation-triangle text-warning me-2"></i>
                    Cancel Consultation
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setCancellingAppt(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <p className="text-muted small">
                    Are you sure you wish to cancel your appointment with <strong>{cancellingAppt.doctorId?.userId?.name}</strong> on <strong>{new Date(cancellingAppt.appointmentDate).toDateString()}</strong> at <strong>{cancellingAppt.timeSlot}</strong>?
                  </p>
                  <label className="form-label small fw-semibold text-navy">Reason for Cancellation:</label>
                  <textarea
                    rows="2"
                    className="form-control form-control-hospital"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Schedule conflict, feeling better, etc."
                  ></textarea>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setCancellingAppt(null)}
                  >
                    Keep Appointment
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleCancelAppointment}
                    disabled={cancelLoading}
                  >
                    {cancelLoading ? 'Cancelling...' : 'Confirm Cancellation'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDashboard;
