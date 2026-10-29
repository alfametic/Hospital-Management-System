import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  const { user, profile, isAuthenticated, role, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (role === 'admin') return '/admin';
    if (role === 'doctor') return '/doctor';
    return '/patient';
  };

  return (
    <header className="sticky-top">
      {/* 24/7 Clinical Emergency Header Strip */}
      <div className="emergency-strip text-center py-1">
        <div className="container d-flex flex-wrap justify-content-between align-items-center">
          <div className="d-flex align-items-center small">
            <span className="badge bg-light text-danger fw-bold me-2">24/7 EMERGENCY</span>
            <span>Trauma & Critical Care Dispatch: <strong>+1 (800) 555-HOSP</strong> (Ext. 911)</span>
          </div>
          <div className="small d-none d-md-block">
            <i className="bi bi-geo-alt-fill me-1"></i> 742 Healthcare Boulevard, Metro City
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="navbar navbar-expand-lg hospital-navbar py-2">
        <div className="container">
          {/* Brand Logo */}
          <Link className="navbar-brand d-flex align-items-center" to="/">
            <div
              className="bg-navy text-white rounded-3 d-flex align-items-center justify-content-center me-2"
              style={{ width: '42px', height: '42px' }}
            >
              <i className="bi bi-hospital-fill fs-4 text-teal"></i>
            </div>
            <div>
              <span className="fw-bold fs-5 text-navy d-block lh-1">St. Jude Medical</span>
              <small className="text-muted" style={{ fontSize: '0.75rem', letterSpacing: '0.5px' }}>
                METROPOLITAN HOSPITAL
              </small>
            </div>
          </Link>

          {/* Mobile Toggle */}
          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#hospitalNavbarContent"
            aria-controls="hospitalNavbarContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          {/* Links & Auth Actions */}
          <div className="collapse navbar-collapse" id="hospitalNavbarContent">
            <ul className="navbar-nav mx-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <NavLink className="nav-link" to="/" end>
                  Home
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/about">
                  About Us
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/departments">
                  Departments
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/doctors">
                  Doctors
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/services">
                  Services
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link" to="/contact">
                  Contact
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink className="nav-link text-teal fw-semibold" to="/ai-triage">
                  <i className="bi bi-robot me-1"></i> AI Triage
                </NavLink>
              </li>
            </ul>

            <div className="d-flex align-items-center gap-2">
              {isAuthenticated ? (
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to={getDashboardPath()}
                    className="btn btn-hospital-primary d-flex align-items-center gap-2 py-2 px-3"
                  >
                    <i className="bi bi-speedometer2"></i>
                    <span>
                      {role === 'admin'
                        ? 'Admin Portal'
                        : role === 'doctor'
                        ? 'Doctor Workspace'
                        : 'Patient Portal'}
                    </span>
                  </Link>

                  <div className="dropdown">
                    <button
                      className="btn btn-light rounded-pill border dropdown-toggle d-flex align-items-center gap-2 py-1 px-3"
                      type="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                    >
                      <i className="bi bi-person-circle fs-5 text-navy"></i>
                      <span className="small fw-semibold text-truncate" style={{ maxWidth: '120px' }}>
                        {user.name}
                      </span>
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end shadow border-0 mt-2">
                      <li className="px-3 py-2 border-bottom">
                        <small className="text-muted d-block">Signed in as</small>
                        <strong className="text-navy">{user.email}</strong>
                        <span className="badge bg-light text-navy border ms-2 text-capitalize">
                          {role}
                        </span>
                        {role === 'patient' && profile?.patientCode && (
                          <div className="mt-1 small text-teal fw-bold">
                            Code: {profile.patientCode}
                          </div>
                        )}
                      </li>
                      <li>
                        <Link className="dropdown-item py-2" to={getDashboardPath()}>
                          <i className="bi bi-grid-fill me-2 text-teal"></i> My Dashboard
                        </Link>
                      </li>
                      <li>
                        <hr className="dropdown-divider my-1" />
                      </li>
                      <li>
                        <button className="dropdown-item text-danger py-2" onClick={handleLogout}>
                          <i className="bi bi-box-arrow-right me-2"></i> Sign Out
                        </button>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <>
                  <Link to="/login" className="btn btn-hospital-outline py-2 px-3">
                    <i className="bi bi-box-arrow-in-right me-1"></i> Sign In
                  </Link>
                  <Link to="/register" className="btn btn-hospital-teal py-2 px-3">
                    <i className="bi bi-person-plus-fill me-1"></i> Register as Patient
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
