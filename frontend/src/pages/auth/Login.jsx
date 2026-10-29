import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AlertMessage from '../../components/common/AlertMessage';

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Quick fill fictional credentials for initial development testing
  const fillCredentials = (role) => {
    setError(null);
    if (role === 'admin') {
      setEmail('admin@hospital.com');
      setPassword('AdminPassword123!');
    } else if (role === 'doctor') {
      setEmail('doctor.cardio@hospital.com');
      setPassword('DoctorPassword123!');
    } else if (role === 'patient') {
      setEmail('patient.john@example.com');
      setPassword('PatientPassword123!');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const data = await login(email, password);
      const userRole = data.user.role;

      // Check query params if there was a redirect request
      const searchParams = new URLSearchParams(location.search);
      const redirectAction = searchParams.get('redirect');
      const doctorId = searchParams.get('doctorId');
      const departmentId = searchParams.get('departmentId');

      if (redirectAction === 'book' && userRole === 'patient') {
        const params = new URLSearchParams();
        if (departmentId) params.set('departmentId', departmentId);
        if (doctorId) params.set('doctorId', doctorId);
        navigate(`/patient/book?${params.toString()}`);
        return;
      }

      if (redirectAction && redirectAction.startsWith('/')) {
        navigate(redirectAction);
        return;
      }

      if (userRole === 'admin') {
        navigate('/admin');
      } else if (userRole === 'doctor') {
        navigate('/doctor');
      } else {
        navigate('/patient');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5 bg-light" style={{ minHeight: '80vh' }}>
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-5">
            <div className="card-healthcare p-4 p-md-5 border-0 shadow-sm bg-white">
              {/* Header */}
              <div className="text-center mb-4">
                <div
                  className="rounded-circle bg-navy text-white d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '56px', height: '56px' }}
                >
                  <i className="bi bi-shield-lock-fill fs-3 text-teal"></i>
                </div>
                <h3 className="fw-bold text-navy mb-1">Clinical Portal Sign In</h3>
                <p className="text-muted small">
                  Access patient records, doctor workspace, or admin dashboard.
                </p>
              </div>

              {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}

              {/* Fictional Dev Credentials Quick-Fill helper */}
              <div className="bg-light-blue p-3 rounded-3 mb-4 border">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <span className="small fw-bold text-navy">
                    <i className="bi bi-key-fill text-teal me-1"></i> Quick Test Roles:
                  </span>
                  <small className="text-muted">Click to auto-fill</small>
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-primary small py-1 px-2"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => fillCredentials('patient')}
                  >
                    Patient
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-success small py-1 px-2"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => fillCredentials('doctor')}
                  >
                    Doctor
                  </button>
                  <button
                    type="button"
                    className="btn btn-xs btn-outline-danger small py-1 px-2"
                    style={{ fontSize: '0.75rem' }}
                    onClick={() => fillCredentials('admin')}
                  >
                    Admin
                  </button>
                </div>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-navy">
                    Email Address
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-envelope text-muted"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control form-control-hospital border-start-0"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@hospital.com"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold text-navy">
                    Password
                  </label>
                  <div className="input-group">
                    <span className="input-group-text bg-white border-end-0">
                      <i className="bi bi-lock text-muted"></i>
                    </span>
                    <input
                      type="password"
                      className="form-control form-control-hospital border-start-0"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-hospital-primary w-100 py-2 fw-semibold"
                  disabled={loading}
                >
                  {loading ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Authenticating...
                    </span>
                  ) : (
                    <span>
                      <i className="bi bi-box-arrow-in-right me-2"></i> Sign In to Portal
                    </span>
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <span className="small text-muted">Don't have a patient account yet? </span>
                <Link to="/register" className="small fw-bold text-teal text-decoration-none">
                  Register as Patient
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
