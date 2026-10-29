import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { aiAPI } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import AlertMessage from '../../components/common/AlertMessage';

const AIDepartmentTriage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, role } = useAuth();

  const [symptoms, setSymptoms] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // File selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
        setError('Only image files (JPEG, PNG, WEBP) are supported for visual triage.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('The image file exceeds the 5MB size limit.');
        return;
      }
      setError(null);
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSampleClick = (sampleText) => {
    setSymptoms(sampleText);
    setError(null);
  };

  // Submit triage analysis
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!symptoms.trim() && !selectedFile) {
      setError('Please describe your symptoms or attach an image to receive a department suggestion.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      if (symptoms.trim()) {
        formData.append('symptoms', symptoms.trim());
      }
      if (selectedFile) {
        formData.append('image', selectedFile);
      }

      const res = await aiAPI.recommendDepartment(formData);
      if (res.data.success) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.error('Triage error:', err);
      setError(err.message || 'Could not complete department recommendation. Please browse departments manually.');
    } finally {
      setLoading(false);
    }
  };

  // Booking action: preserves selected department and doctor
  const handleBookAppointment = (doctorId = null) => {
    const deptId = result?.department?._id;
    if (!deptId) return;

    if (isAuthenticated && role === 'patient') {
      const params = new URLSearchParams();
      params.set('departmentId', deptId);
      if (doctorId) params.set('doctorId', doctorId);
      navigate(`/patient/book?${params.toString()}`);
    } else {
      // Redirect to login with return destination preserved
      const params = new URLSearchParams();
      params.set('redirect', 'book');
      params.set('departmentId', deptId);
      if (doctorId) params.set('doctorId', doctorId);
      navigate(`/login?${params.toString()}`);
    }
  };

  return (
    <div className="py-5 bg-light" style={{ minHeight: '85vh' }}>
      <div className="container">
        {/* Header Breadcrumbs & Title */}
        <div className="text-center mb-5" style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div className="d-inline-flex align-items-center bg-teal bg-opacity-10 text-teal border border-teal border-opacity-25 rounded-pill px-3 py-1 mb-2 small fw-bold">
            <i className="bi bi-robot me-2"></i> AI-POWERED CLINICAL TRIAGE
          </div>
          <h1 className="fw-bold text-navy mb-2">Find the Right Medical Department</h1>
          <p className="text-muted lead" style={{ fontSize: '1.05rem' }}>
            Describe what symptoms you are experiencing, or optionally upload a photo (e.g. skin lesion, eye redness, joint swelling). Our intelligent routing assistant will recommend the appropriate specialty department.
          </p>
        </div>

        {error && (
          <div className="row justify-content-center">
            <div className="col-lg-8">
              <AlertMessage type="danger" message={error} onClose={() => setError(null)} />
            </div>
          </div>
        )}

        <div className="row justify-content-center">
          <div className="col-lg-8">
            {/* Input Card */}
            <div className="card-healthcare p-4 p-md-5 bg-white border mb-4">
              <form onSubmit={handleSubmit}>
                {/* 1. Symptoms Textarea */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-navy">
                    Describe Your Symptoms:
                  </label>
                  <textarea
                    rows="4"
                    className="form-control form-control-hospital"
                    placeholder="Describe how you are feeling, where it hurts, how long symptoms have persisted, and any associated discomfort..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                  ></textarea>

                  {/* Sample Prompt Helpers */}
                  <div className="mt-2">
                    <small className="text-muted d-block mb-1">Quick examples:</small>
                    <div className="d-flex flex-wrap gap-1">
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2 small"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleSampleClick('Itchy, scaly red skin rash on my anterior forearm for 5 days with mild burning.')}
                      >
                        Skin Rash / Eczema
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2 small"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleSampleClick('Experiencing occasional heart palpitations, shortness of breath on stairs, and elevated BP.')}
                      >
                        Cardiac / Blood Pressure
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2 small"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleSampleClick('Throbbing unilateral headache with light sensitivity and nausea for 2 days.')}
                      >
                        Migraine / Neurological
                      </button>
                      <button
                        type="button"
                        className="btn btn-xs btn-outline-secondary py-1 px-2 small"
                        style={{ fontSize: '0.75rem' }}
                        onClick={() => handleSampleClick('Sharp knee pain and joint stiffness following a running injury.')}
                      >
                        Joint / Sports Injury
                      </button>
                    </div>
                  </div>
                </div>

                {/* 2. Optional Image Upload */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-navy d-flex justify-content-between">
                    <span>
                      Optional Clinical Photo <small className="text-muted fw-normal">(e.g., rash, swelling, eye redness)</small>
                    </span>
                    <span className="small text-muted">Max 5MB</span>
                  </label>

                  {!previewUrl ? (
                    <div className="border border-dashed rounded-3 p-4 text-center bg-light">
                      <i className="bi bi-camera fs-2 text-teal mb-2 d-block"></i>
                      <label htmlFor="triage-image-upload" className="btn btn-sm btn-hospital-outline mb-1">
                        Select Photo
                      </label>
                      <input
                        id="triage-image-upload"
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="d-none"
                        onChange={handleFileChange}
                      />
                      <div className="small text-muted">JPEG, PNG, or WEBP supported</div>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-3 border">
                      <img
                        src={previewUrl}
                        alt="Triage upload preview"
                        className="rounded border"
                        style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                      />
                      <div className="flex-grow-1 small">
                        <strong className="text-navy d-block text-truncate" style={{ maxWidth: '280px' }}>
                          {selectedFile?.name}
                        </strong>
                        <span className="text-muted">
                          {(selectedFile?.size / 1024).toFixed(1)} KB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-danger"
                        onClick={handleRemoveFile}
                      >
                        <i className="bi bi-trash me-1"></i> Remove
                      </button>
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="btn btn-hospital-teal w-100 py-3 fw-bold fs-6 shadow-sm"
                  disabled={loading || (!symptoms.trim() && !selectedFile)}
                >
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Evaluating Symptoms & Mapping Clinical Division...
                    </span>
                  ) : (
                    <span>
                      <i className="bi bi-compass me-2"></i> Suggest Appropriate Department
                    </span>
                  )}
                </button>
              </form>
            </div>

            {/* 3. Triage Result Card */}
            {result && (
              <div className="card-healthcare p-4 p-md-5 bg-white border shadow-lg mb-4">
                {/* Acute Emergency Alert (if flagged) */}
                {result.isEmergency && (
                  <div className="alert alert-danger p-4 rounded-3 mb-4 border-2 border-danger shadow-sm">
                    <div className="d-flex align-items-start gap-3">
                      <div className="fs-1 text-danger">
                        <i className="bi bi-exclamation-octagon-fill"></i>
                      </div>
                      <div>
                        <h4 className="fw-bold text-danger mb-1">URGENT MEDICAL NOTICE</h4>
                        <p className="mb-3 small fw-semibold" style={{ lineHeight: 1.6 }}>
                          {result.emergencyWarning ||
                            'Your reported symptoms may indicate an acute or life-threatening medical emergency. Seek immediate emergency medical care.'}
                        </p>
                        <a
                          href="tel:18005554677"
                          className="btn btn-danger py-2 px-3 fw-bold shadow-sm"
                        >
                          <i className="bi bi-telephone-fill me-2"></i> Call Trauma Dispatch: +1 (800) 555-HOSP
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Recommended Department Banner */}
                <div className="d-flex flex-wrap justify-content-between align-items-start border-bottom pb-4 mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div
                      className="rounded-3 bg-light-blue text-navy d-flex align-items-center justify-content-center"
                      style={{ width: '64px', height: '64px' }}
                    >
                      <i className={`bi ${result.department?.icon || 'bi-hospital'} fs-2 text-teal`}></i>
                    </div>
                    <div>
                      <span className="badge badge-dept mb-1">RECOMMENDED DEPARTMENT</span>
                      <h2 className="fw-bold text-navy mb-0">{result.department?.name}</h2>
                      <small className="text-muted">Department Code: {result.department?.code}</small>
                    </div>
                  </div>

                  <div className="mt-3 mt-sm-0">
                    <button
                      className="btn btn-hospital-primary py-2 px-4 fw-semibold shadow-sm"
                      onClick={() => handleBookAppointment()}
                    >
                      <i className="bi bi-calendar-check me-2"></i> Book Appointment
                    </button>
                  </div>
                </div>

                {/* Clinical Explanation */}
                <div className="bg-light-blue p-4 rounded-3 border mb-4">
                  <h6 className="fw-bold text-navy mb-2">
                    <i className="bi bi-info-circle-fill text-teal me-2"></i> Why this Department:
                  </h6>
                  <p className="text-navy small mb-0" style={{ lineHeight: 1.6 }}>
                    {result.explanation}
                  </p>
                </div>

                {/* Alternative Departments (if any) */}
                {result.alternativeDepartments && result.alternativeDepartments.length > 0 && (
                  <div className="mb-4">
                    <span className="small text-muted d-block mb-2 fw-semibold">
                      Other Potentially Relevant Disciplines:
                    </span>
                    <div className="d-flex flex-wrap gap-2">
                      {result.alternativeDepartments.map((deptName, idx) => (
                        <span key={idx} className="badge bg-light text-navy border px-3 py-2 small">
                          <i className="bi bi-arrow-right-short text-teal me-1"></i>
                          {deptName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Specialists in this Department */}
                {result.availableDoctors && result.availableDoctors.length > 0 && (
                  <div className="mb-4">
                    <h5 className="fw-bold text-navy mb-3">
                      Available Specialists in {result.department?.name}
                    </h5>
                    <div className="row g-3">
                      {result.availableDoctors.map((doc) => (
                        <div key={doc._id} className="col-md-6">
                          <div className="p-3 bg-light rounded-3 border h-100 d-flex flex-column justify-content-between">
                            <div>
                              <strong className="text-navy d-block">{doc.userId?.name}</strong>
                              <small className="text-teal fw-semibold d-block">{doc.specialization}</small>
                              <div className="small text-muted mt-1">
                                <div>Fee: ${doc.consultationFee} | OPD: {doc.roomNumber}</div>
                                <div>Days: {doc.availableDays?.join(', ')}</div>
                              </div>
                            </div>
                            <div className="mt-3 pt-2 border-top">
                              <button
                                className="btn btn-sm btn-hospital-teal w-100"
                                onClick={() => handleBookAppointment(doc._id)}
                              >
                                Book with {doc.userId?.name}
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mandatory Medical Safety Disclaimer */}
                <div className="alert alert-light border rounded-3 p-3 text-muted small mb-0">
                  <i className="bi bi-shield-exclamation text-warning me-2 fs-5 align-middle"></i>
                  <strong>Clinical Notice: </strong>
                  {result.disclaimer}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIDepartmentTriage;
