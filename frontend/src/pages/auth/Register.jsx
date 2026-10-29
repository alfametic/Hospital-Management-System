import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertMessage from '../../components/common/AlertMessage';

const Register = () => {
  const { registerPatient } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: 'prefer_not_to_say',
    bloodGroup: 'Unknown',
    street: '',
    city: '',
    state: '',
    postalCode: '',
    emergencyName: '',
    emergencyPhone: '',
    emergencyRelation: '',
    allergies: '',
    chronicConditions: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [registeredCode, setRegisteredCode] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please verify.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        phone: formData.phone,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode
        },
        emergencyContact: {
          name: formData.emergencyName,
          phone: formData.emergencyPhone,
          relation: formData.emergencyRelation
        },
        allergies: formData.allergies
          ? formData.allergies.split(',').map((s) => s.trim())
          : [],
        chronicConditions: formData.chronicConditions
          ? formData.chronicConditions.split(',').map((s) => s.trim())
          : []
      };

      const res = await registerPatient(payload);
      setRegisteredCode(res.patientProfile?.patientCode || 'PAT-NEW');
    } catch (err) {
      console.error('Registration failed:', err);
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5 bg-light" style={{ minHeight: '85vh' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card-healthcare p-4 p-md-5 border-0 shadow-sm bg-white">
              {/* Header */}
              <div className="text-center mb-4">
                <div
                  className="rounded-circle bg-light-teal text-teal d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '56px', height: '56px' }}
                >
                  <i className="bi bi-person-badge-fill fs-3"></i>
                </div>
                <h3 className="fw-bold text-navy mb-1">New Patient Registration</h3>
                <p className="text-muted small">
                  Create your patient profile to receive your secure opaque identification QR code and schedule clinical visits.
                </p>
              </div>

              {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

              {registeredCode ? (
                <div className="text-center py-4">
                  <div
                    className="rounded-circle bg-success bg-opacity-10 text-success d-flex align-items-center justify-content-center mx-auto mb-3"
                    style={{ width: '64px', height: '64px' }}
                  >
                    <i className="bi bi-check-lg fs-2"></i>
                  </div>
                  <h4 className="fw-bold text-navy mb-2">Registration Completed!</h4>
                  <p className="text-muted small mb-4">
                    Your official patient account and opaque cryptographic QR code have been created.
                  </p>

                  <div className="bg-light-blue p-4 rounded-3 border mb-4 d-inline-block">
                    <div className="small text-muted mb-1">Assigned Patient Identifier:</div>
                    <div className="fs-3 fw-bold text-teal tracking-wide">{registeredCode}</div>
                    <small className="text-muted d-block mt-2">
                      <i className="bi bi-shield-check text-success me-1"></i>
                      Opaque identifier linked securely to your clinical chart.
                    </small>
                  </div>

                  <div className="d-flex justify-content-center gap-3">
                    <button
                      className="btn btn-hospital-primary px-4 py-2"
                      onClick={() => navigate('/patient')}
                    >
                      <i className="bi bi-speedometer2 me-2"></i> Go to Patient Dashboard
                    </button>
                    <Link to="/" className="btn btn-outline-secondary px-4 py-2">
                      Return to Home
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  {/* Account Information */}
                  <h6 className="fw-bold text-navy border-bottom pb-2 mb-3">
                    <i className="bi bi-person-circle text-teal me-2"></i> 1. Account Credentials
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">
                        Full Name <span className="text-danger">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        className="form-control form-control-hospital"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Sarah Connor"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">
                        Email Address <span className="text-danger">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        className="form-control form-control-hospital"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="sarah@example.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">
                        Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        name="password"
                        className="form-control form-control-hospital"
                        required
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="At least 6 characters"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">
                        Confirm Password <span className="text-danger">*</span>
                      </label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-control form-control-hospital"
                        required
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Repeat password"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">Phone Number</label>
                      <input
                        type="tel"
                        name="phone"
                        className="form-control form-control-hospital"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-navy">Date of Birth</label>
                      <input
                        type="date"
                        name="dateOfBirth"
                        className="form-control form-control-hospital"
                        value={formData.dateOfBirth}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-navy">Gender</label>
                      <select
                        name="gender"
                        className="form-select form-select-hospital"
                        value={formData.gender}
                        onChange={handleChange}
                      >
                        <option value="prefer_not_to_say">Select...</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* Clinical & Emergency Info */}
                  <h6 className="fw-bold text-navy border-bottom pb-2 mb-3">
                    <i className="bi bi-heart-pulse-fill text-teal me-2"></i> 2. Clinical Profile & Emergency Contact
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-navy">Blood Group</label>
                      <select
                        name="bloodGroup"
                        className="form-select form-select-hospital"
                        value={formData.bloodGroup}
                        onChange={handleChange}
                      >
                        <option value="Unknown">Unknown</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                      </select>
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-navy">Known Allergies</label>
                      <input
                        type="text"
                        name="allergies"
                        className="form-control form-control-hospital"
                        value={formData.allergies}
                        onChange={handleChange}
                        placeholder="e.g. Penicillin, Peanuts"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-navy">Chronic Conditions</label>
                      <input
                        type="text"
                        name="chronicConditions"
                        className="form-control form-control-hospital"
                        value={formData.chronicConditions}
                        onChange={handleChange}
                        placeholder="e.g. Asthma, Hypertension"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-navy">Emergency Contact Name</label>
                      <input
                        type="text"
                        name="emergencyName"
                        className="form-control form-control-hospital"
                        value={formData.emergencyName}
                        onChange={handleChange}
                        placeholder="Contact person name"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-navy">Relationship</label>
                      <input
                        type="text"
                        name="emergencyRelation"
                        className="form-control form-control-hospital"
                        value={formData.emergencyRelation}
                        onChange={handleChange}
                        placeholder="Spouse / Parent / Sibling"
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label small fw-semibold text-navy">Emergency Phone</label>
                      <input
                        type="tel"
                        name="emergencyPhone"
                        className="form-control form-control-hospital"
                        value={formData.emergencyPhone}
                        onChange={handleChange}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                  </div>

                  {/* Address */}
                  <h6 className="fw-bold text-navy border-bottom pb-2 mb-3">
                    <i className="bi bi-geo-alt-fill text-teal me-2"></i> 3. Residential Address (Optional)
                  </h6>
                  <div className="row g-3 mb-4">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">Street Address</label>
                      <input
                        type="text"
                        name="street"
                        className="form-control form-control-hospital"
                        value={formData.street}
                        onChange={handleChange}
                        placeholder="123 Health Ave"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-navy">City</label>
                      <input
                        type="text"
                        name="city"
                        className="form-control form-control-hospital"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Metro City"
                      />
                    </div>
                    <div className="col-md-3">
                      <label className="form-label small fw-semibold text-navy">State / ZIP</label>
                      <input
                        type="text"
                        name="state"
                        className="form-control form-control-hospital"
                        value={formData.state}
                        onChange={handleChange}
                        placeholder="CA 90210"
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      className="btn btn-hospital-teal w-100 py-3 fw-bold"
                      disabled={loading}
                    >
                      {loading ? (
                        <span>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Registering & Generating Secure QR Code...
                        </span>
                      ) : (
                        <span>
                          <i className="bi bi-qr-code me-2"></i> Register & Generate Patient QR Code
                        </span>
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="text-center mt-4 pt-3 border-top">
                <span className="small text-muted">Already registered as a patient or medical staff? </span>
                <Link to="/login" className="small fw-bold text-teal text-decoration-none">
                  Sign In Here
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
