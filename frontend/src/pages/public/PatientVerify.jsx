import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authAPI, doctorAPI, medicalRecordAPI } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';
import AddMedicalRecordModal from '../doctor/AddMedicalRecordModal';

const PatientVerify = () => {
  const [searchParams] = useSearchParams();
  const { patientCode: paramCode } = useParams();
  const navigate = useNavigate();
  const { user, profile, isAuthenticated } = useAuth();

  const codeFromQuery = searchParams.get('code');
  const initialCode = (paramCode || codeFromQuery || '').trim().toUpperCase();

  const [inputCode, setInputCode] = useState(initialCode);
  const [activeCode, setActiveCode] = useState(initialCode);
  const [loading, setLoading] = useState(!!initialCode);
  const [publicVerification, setPublicVerification] = useState(null);
  const [doctorPatientData, setDoctorPatientData] = useState(null);
  const [patientRecords, setPatientRecords] = useState([]);
  const [patientAppointments, setPatientAppointments] = useState([]);
  const [isDocumenting, setIsDocumenting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Load patient data based on authentication & role
  useEffect(() => {
    if (!activeCode) {
      setLoading(false);
      return;
    }

    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 1. Always verify the code exists in the official hospital registry
        const verifyRes = await authAPI.verifyPatient(activeCode);
        if (!verifyRes.data?.success || !verifyRes.data?.verified) {
          setError(verifyRes.data?.message || 'Patient identifier could not be verified.');
          setPublicVerification(null);
          setDoctorPatientData(null);
          setLoading(false);
          return;
        }
        setPublicVerification(verifyRes.data);

        // 2. If user is an authenticated DOCTOR: fetch authorized clinical EMR chart & history
        if (isAuthenticated && user?.role === 'doctor') {
          const docRes = await doctorAPI.lookupPatientByCode(activeCode);
          if (docRes.data?.success) {
            setDoctorPatientData(docRes.data.patient);
            setPatientRecords(docRes.data.records || []);
            setPatientAppointments(docRes.data.appointments || []);
          }
        }
        // 3. If user is an authenticated PATIENT: allow access only if viewing their own chart
        else if (isAuthenticated && user?.role === 'patient') {
          if (profile?.patientCode === activeCode) {
            const recRes = await medicalRecordAPI.getMyRecords();
            setPatientRecords(recRes.data?.data || []);
          }
        }
      } catch (err) {
        console.error('Patient verification / lookup error:', err);
        setError(err.message || 'Unable to load clinical records. Please verify authorization.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [activeCode, isAuthenticated, user?.role, profile?.patientCode]);

  const handleManualSearch = (e) => {
    e.preventDefault();
    if (inputCode.trim()) {
      setActiveCode(inputCode.trim().toUpperCase());
    }
  };

  const handleRecordCreated = (newRecord) => {
    setPatientRecords((prev) => [newRecord, ...prev]);
    setIsDocumenting(false);
    setSuccess('New clinical record and prescription documented successfully.');
  };

  const isDoctor = isAuthenticated && user?.role === 'doctor';
  const isOwnPatient = isAuthenticated && user?.role === 'patient' && profile?.patientCode === activeCode;
  const isOtherPatient = isAuthenticated && user?.role === 'patient' && profile?.patientCode !== activeCode;

  const loginRedirectUrl = `/login?redirect=${encodeURIComponent(`/verify-patient?code=${activeCode}`)}`;

  return (
    <div className="py-4 bg-light" style={{ minHeight: '85vh' }}>
      <div className="container">
        {/* Top Header Badge */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4">
          <div className="d-flex align-items-center gap-3">
            <div
              className="bg-navy text-white rounded-3 d-flex align-items-center justify-content-center shadow-sm"
              style={{ width: '48px', height: '48px' }}
            >
              <i className="bi bi-shield-check fs-3 text-teal"></i>
            </div>
            <div>
              <h4 className="fw-bold text-navy mb-0">Patient Verification & Clinical Chart</h4>
              <small className="text-muted">
                St. Jude Metropolitan Hospital Official Patient Identification System
              </small>
            </div>
          </div>

          <div className="d-flex gap-2 mt-2 mt-sm-0">
            {isDoctor && (
              <Link to="/doctor" className="btn btn-sm btn-outline-navy">
                <i className="bi bi-speedometer2 me-1"></i> Doctor Workspace
              </Link>
            )}
            {isOwnPatient && (
              <Link to="/patient" className="btn btn-sm btn-outline-navy">
                <i className="bi bi-speedometer2 me-1"></i> Patient Portal
              </Link>
            )}
            <Link to="/" className="btn btn-sm btn-outline-secondary">
              <i className="bi bi-house-door me-1"></i> Home
            </Link>
          </div>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}

        {loading ? (
          <div className="bg-white p-5 rounded-4 border shadow-sm text-center">
            <LoadingSpinner message="Verifying patient identifier and loading authorized medical history..." />
          </div>
        ) : !activeCode || !publicVerification ? (
          /* NO CODE OR CODE NOT FOUND */
          <div className="card-healthcare p-5 bg-white border shadow-sm text-center" style={{ maxWidth: '600px', margin: '0 auto' }}>
            <div className="text-muted mb-3">
              <i className="bi bi-qr-code-scan fs-1 text-teal"></i>
            </div>
            <h5 className="fw-bold text-navy mb-2">Scan or Enter Patient Identification Code</h5>
            <p className="text-muted small mb-4">
              Enter an official patient identifier to verify hospital registration and access authorized medical history.
            </p>
            <form onSubmit={handleManualSearch} className="input-group mb-3">
              <input
                type="text"
                className="form-control form-control-hospital"
                placeholder="e.g., PAT-2026-A101"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
              />
              <button type="submit" className="btn btn-hospital-teal px-4">
                Verify
              </button>
            </form>
          </div>
        ) : (
          <div>
            {/* ========================================================== */}
            {/* CASE 1: AUTHORIZED DOCTOR VIEW - FULL CLINICAL EMR CHART  */}
            {/* ========================================================== */}
            {isDoctor && doctorPatientData ? (
              <div>
                {/* Doctor Authorization Banner */}
                <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
                  <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fw-bold">
                        <i className="bi bi-patch-check-fill me-1"></i> VERIFIED OFFICIAL ID
                      </span>
                      <span className="badge bg-navy text-white px-3 py-2 fw-bold">
                        <i className="bi bi-person-badge-fill me-1"></i> ATTENDING PHYSICIAN ACCESS
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-hospital-teal fw-semibold"
                      onClick={() => setIsDocumenting(true)}
                    >
                      <i className="bi bi-plus-circle me-1"></i> Add Clinical Medical Record
                    </button>
                  </div>

                  {/* Patient Demographic Profile */}
                  <div className="row g-4 align-items-center">
                    <div className="col-md-8">
                      <div className="d-flex align-items-baseline gap-2 mb-1">
                        <h2 className="fw-bold text-navy mb-0">
                          {doctorPatientData.userId?.name || 'Patient'}
                        </h2>
                        <span className="badge bg-light text-navy border fw-bold">
                          {doctorPatientData.patientCode}
                        </span>
                      </div>

                      <div className="text-muted small d-flex flex-wrap gap-3 mt-2">
                        <span>
                          <i className="bi bi-envelope text-teal me-1"></i> {doctorPatientData.userId?.email || 'N/A'}
                        </span>
                        <span>
                          <i className="bi bi-telephone text-teal me-1"></i> {doctorPatientData.userId?.phone || 'No phone recorded'}
                        </span>
                        <span>
                          <i className="bi bi-droplet-fill text-danger me-1"></i> Blood Group: <strong>{doctorPatientData.bloodGroup || 'Unknown'}</strong>
                        </span>
                        <span>
                          <i className="bi bi-gender-ambiguous text-teal me-1"></i> Gender: <strong className="text-capitalize">{doctorPatientData.gender || 'N/A'}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="col-md-4 text-md-end">
                      <div className="p-3 bg-light rounded-3 text-start small border">
                        <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>EMERGENCY CONTACT</span>
                        <strong className="text-navy d-block">
                          {doctorPatientData.emergencyContact?.name
                            ? `${doctorPatientData.emergencyContact.name} (${doctorPatientData.emergencyContact.relation || 'Contact'})`
                            : 'Not Specified'}
                        </strong>
                        {doctorPatientData.emergencyContact?.phone && (
                          <span className="text-muted">{doctorPatientData.emergencyContact.phone}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clinical Summary Bar (Allergies & Chronic Conditions) */}
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="bg-white p-3 rounded-3 border shadow-sm h-100">
                      <h6 className="fw-bold text-navy mb-2">
                        <i className="bi bi-exclamation-diamond-fill text-danger me-2"></i>
                        Recorded Allergies:
                      </h6>
                      {doctorPatientData.allergies?.length > 0 ? (
                        <div>
                          {doctorPatientData.allergies.map((allergy, aIdx) => (
                            <span key={aIdx} className="badge bg-danger bg-opacity-10 text-danger border border-danger border-opacity-25 px-2 py-1 me-2 mb-1">
                              {allergy}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted small">No known drug or food allergies on record.</span>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <div className="bg-white p-3 rounded-3 border shadow-sm h-100">
                      <h6 className="fw-bold text-navy mb-2">
                        <i className="bi bi-heart-pulse-fill text-warning me-2"></i>
                        Chronic Conditions:
                      </h6>
                      {doctorPatientData.chronicConditions?.length > 0 ? (
                        <div>
                          {doctorPatientData.chronicConditions.map((cond, cIdx) => (
                            <span key={cIdx} className="badge bg-warning bg-opacity-10 text-dark border border-warning border-opacity-25 px-2 py-1 me-2 mb-1">
                              {cond}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted small">No chronic conditions recorded.</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Chronological Medical Records Section */}
                <div className="bg-white p-4 rounded-4 border shadow-sm mb-4">
                  <div className="d-flex justify-content-between align-items-center border-bottom pb-3 mb-4">
                    <div>
                      <h5 className="fw-bold text-navy mb-1">
                        <i className="bi bi-journal-medical text-teal me-2"></i>
                        Chronological Medical Record History ({patientRecords.length})
                      </h5>
                      <small className="text-muted">
                        Official clinical diagnoses, vitals, prescriptions, and laboratory reports documented by attending physicians.
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-hospital-teal"
                      onClick={() => setIsDocumenting(true)}
                    >
                      <i className="bi bi-plus-lg me-1"></i> Add Record
                    </button>
                  </div>

                  {patientRecords.length === 0 ? (
                    <div className="p-5 text-center text-muted">
                      <i className="bi bi-journal-x fs-1 mb-2 d-block text-secondary"></i>
                      <h6 className="fw-bold text-navy">No Clinical Records Documented Yet</h6>
                      <p className="small mb-3">
                        This patient has not had any documented visits. Click below to document their first clinical consultation.
                      </p>
                      <button
                        type="button"
                        className="btn btn-sm btn-hospital-teal px-4"
                        onClick={() => setIsDocumenting(true)}
                      >
                        Document Initial Visit
                      </button>
                    </div>
                  ) : (
                    <div className="timeline-container">
                      {patientRecords.map((record) => (
                        <div key={record._id} className="card-healthcare p-4 bg-white border mb-4 shadow-sm">
                          {/* Visit Header */}
                          <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-3">
                            <div className="d-flex align-items-center gap-3">
                              <div
                                className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center"
                                style={{ width: '44px', height: '44px' }}
                              >
                                <i className="bi bi-file-earmark-medical-fill fs-4 text-teal"></i>
                              </div>
                              <div>
                                <h5 className="fw-bold text-navy mb-0">{record.diagnosis}</h5>
                                <small className="text-muted">
                                  Consulted with <strong>{record.doctorId?.userId?.name || 'Attending Physician'}</strong> ({record.doctorId?.departmentId?.name || 'Specialist'})
                                </small>
                              </div>
                            </div>
                            <span className="badge bg-light text-navy border px-3 py-2 mt-2 mt-sm-0">
                              <i className="bi bi-calendar3 me-1 text-teal"></i>
                              {new Date(record.visitDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>

                          {/* Complaints and Assessment */}
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
                                    <div className="p-2 border rounded-2 bg-light">
                                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>BP</div>
                                      <strong className="text-navy">{record.vitalSigns.bloodPressure}</strong>
                                    </div>
                                  </div>
                                )}
                                {record.vitalSigns.heartRate && (
                                  <div className="col-4 col-md-2">
                                    <div className="p-2 border rounded-2 bg-light">
                                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Heart Rate</div>
                                      <strong className="text-teal">{record.vitalSigns.heartRate} bpm</strong>
                                    </div>
                                  </div>
                                )}
                                {record.vitalSigns.temperature && (
                                  <div className="col-4 col-md-2">
                                    <div className="p-2 border rounded-2 bg-light">
                                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Temp</div>
                                      <strong className="text-navy">{record.vitalSigns.temperature} °F</strong>
                                    </div>
                                  </div>
                                )}
                                {record.vitalSigns.oxygenSaturation && (
                                  <div className="col-4 col-md-2">
                                    <div className="p-2 border rounded-2 bg-light">
                                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>SpO2</div>
                                      <strong className="text-success">{record.vitalSigns.oxygenSaturation}%</strong>
                                    </div>
                                  </div>
                                )}
                                {record.vitalSigns.respiratoryRate && (
                                  <div className="col-4 col-md-2">
                                    <div className="p-2 border rounded-2 bg-light">
                                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Resp Rate</div>
                                      <strong className="text-navy">{record.vitalSigns.respiratoryRate} /min</strong>
                                    </div>
                                  </div>
                                )}
                                {record.vitalSigns.weight && (
                                  <div className="col-4 col-md-2">
                                    <div className="p-2 border rounded-2 bg-light">
                                      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Weight</div>
                                      <strong className="text-navy">{record.vitalSigns.weight} kg</strong>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Prescriptions */}
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

                          {/* Lab Reports */}
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

                {/* Add Medical Record Modal */}
                {isDocumenting && (
                  <AddMedicalRecordModal
                    patient={doctorPatientData}
                    appointmentId={null}
                    onRecordCreated={handleRecordCreated}
                    onCancel={() => setIsDocumenting(false)}
                  />
                )}
              </div>
            ) : isOwnPatient ? (
              /* ========================================================== */
              /* CASE 2: LOGGED-IN PATIENT VIEWING THEIR OWN MEDICAL RECORD */
              /* ========================================================== */
              <div className="card-healthcare p-4 p-md-5 bg-white border shadow-sm">
                <div className="d-flex flex-wrap justify-content-between align-items-center border-bottom pb-3 mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fw-bold">
                      <i className="bi bi-patch-check-fill me-1"></i> YOUR OFFICIAL RECORD
                    </span>
                    <span className="badge bg-navy text-white px-3 py-2 fw-bold">
                      {activeCode}
                    </span>
                  </div>
                  <Link to="/patient" className="btn btn-sm btn-hospital-teal">
                    <i className="bi bi-grid-fill me-1"></i> Open Patient Portal
                  </Link>
                </div>

                <h3 className="fw-bold text-navy mb-2">{user?.name}</h3>
                <p className="text-muted small mb-4">
                  Verified clinical medical records and consultation history for your hospital patient account.
                </p>

                {/* Patient Records Timeline */}
                {patientRecords.length === 0 ? (
                  <div className="p-5 text-center bg-light rounded-3 border">
                    <i className="bi bi-journal-x fs-1 text-muted mb-2 d-block"></i>
                    <h6 className="fw-bold text-navy">No Medical Records on File Yet</h6>
                    <p className="text-muted small mb-0">
                      When you attend a consultation, your attending physician will document your visit notes, vitals, and prescriptions here.
                    </p>
                  </div>
                ) : (
                  <div>
                    {patientRecords.map((record) => (
                      <div key={record._id} className="p-3 border rounded-3 mb-3 bg-light">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <h6 className="fw-bold text-navy mb-0">{record.diagnosis}</h6>
                          <span className="badge bg-white text-navy border">
                            {new Date(record.visitDate).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="small text-muted mb-2">{record.clinicalNotes || record.chiefComplaints}</p>
                        {record.prescriptions && record.prescriptions.length > 0 && (
                          <div className="small">
                            <strong>Prescriptions:</strong> {record.prescriptions.map((p) => p.medicineName).join(', ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : isOtherPatient ? (
              /* ========================================================== */
              /* CASE 3: PATIENT TRYING TO VIEW ANOTHER PATIENT'S RECORD    */
              /* ========================================================== */
              <div className="card-healthcare p-5 bg-white border shadow-sm text-center" style={{ maxWidth: '640px', margin: '0 auto' }}>
                <div className="text-warning mb-3">
                  <i className="bi bi-shield-lock-fill fs-1"></i>
                </div>
                <h4 className="fw-bold text-navy mb-2">Private Health Records Restricted</h4>
                <p className="text-muted small mb-4">
                  You are currently logged in as patient <strong>{profile?.patientCode}</strong>. Under hospital privacy policy and health data protection laws, patients may only view their own clinical health records.
                </p>
                <Link to="/patient" className="btn btn-hospital-primary px-4">
                  <i className="bi bi-person-fill me-1"></i> View My Own Health Records
                </Link>
              </div>
            ) : (
              /* ========================================================== */
              /* CASE 4: UNAUTHENTICATED VISITOR / DOCTOR NOT LOGGED IN    */
              /* ========================================================== */
              <div className="card-healthcare p-4 p-md-5 bg-white border shadow-sm" style={{ maxWidth: '680px', margin: '0 auto' }}>
                {/* Official Verification Seal Header */}
                <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-4">
                  <div className="d-flex align-items-center gap-2">
                    <span className="badge bg-success bg-opacity-10 text-success border border-success border-opacity-25 px-3 py-2 fw-bold">
                      <i className="bi bi-patch-check-fill me-1"></i> VERIFIED OFFICIAL ID
                    </span>
                  </div>
                  <span className="text-muted small">
                    <i className="bi bi-clock-history me-1"></i> {new Date(publicVerification.verifiedAt).toLocaleDateString()}
                  </span>
                </div>

                {/* Patient Identifier & Masked Demographics */}
                <div className="text-center mb-4">
                  <span className="small text-muted d-block text-uppercase fw-semibold" style={{ letterSpacing: '1px' }}>
                    Opaque Patient Identifier
                  </span>
                  <h2 className="fw-bold text-teal my-2" style={{ letterSpacing: '1.5px' }}>
                    {publicVerification.patientCode}
                  </h2>
                  <div className="fs-6 text-navy fw-semibold">
                    {publicVerification.maskedName}
                  </div>
                  <div className="text-muted small">
                    {publicVerification.hospitalName}
                  </div>
                </div>

                {/* Verification Attributes */}
                <div className="bg-light p-3 rounded-3 border mb-4">
                  <div className="row g-2 small">
                    <div className="col-sm-6">
                      <span className="text-muted d-block">ID Status:</span>
                      <strong className="text-success">
                        <i className="bi bi-check2-circle me-1"></i> Active Official Hospital ID
                      </strong>
                    </div>
                    <div className="col-sm-6">
                      <span className="text-muted d-block">Issued Authority:</span>
                      <strong className="text-navy">St. Jude Metropolitan Hospital</strong>
                    </div>
                  </div>
                </div>

                {/* Security and Privacy Notice */}
                <div className="alert alert-info border-0 rounded-3 small mb-4">
                  <div className="d-flex align-items-start gap-2">
                    <i className="bi bi-shield-lock-fill fs-5 text-teal flex-shrink-0 mt-1"></i>
                    <div>
                      <strong className="d-block text-navy mb-1">Protected Health Information (PHI) Restricted:</strong>
                      <span>
                        Clinical consultation notes, diagnoses, vital signs, and prescriptions are confidential and protected by role-based hospital security. Only authenticated clinical staff or the verified patient may view private medical records.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Doctor Sign-in Action Box */}
                <div className="bg-light p-4 rounded-3 border text-center mb-4">
                  <h6 className="fw-bold text-navy mb-1">
                    <i className="bi bi-person-badge-fill text-teal me-1"></i>
                    Are you an attending physician or clinical staff?
                  </h6>
                  <p className="text-muted small mb-3">
                    Sign in with your doctor credentials to access this patient's authorized clinical EMR chart, review medical history, and document new consultation records.
                  </p>
                  <Link
                    to={loginRedirectUrl}
                    className="btn btn-hospital-teal py-2 px-4 fw-semibold shadow-sm"
                  >
                    <i className="bi bi-box-arrow-in-right me-2"></i> Doctor Sign In to View EMR Chart
                  </Link>
                </div>

                {/* Patient Sign-in Link */}
                <div className="text-center border-top pt-3 small text-muted">
                  <span>Are you this patient? </span>
                  <Link to={loginRedirectUrl} className="text-teal fw-semibold">
                    Sign in to view your medical history
                  </Link>
                  <span className="mx-2">|</span>
                  <Link to="/" className="text-secondary text-decoration-none">
                    Return to Homepage
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientVerify;
