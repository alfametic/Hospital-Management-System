import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="hospital-footer">
      <div className="container">
        <div className="row g-4 mb-5">
          {/* Brand & Mission */}
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center mb-3">
              <div
                className="bg-teal text-white rounded-3 d-flex align-items-center justify-content-center me-2"
                style={{ width: '40px', height: '40px' }}
              >
                <i className="bi bi-hospital-fill fs-4"></i>
              </div>
              <div>
                <span className="fw-bold fs-5 text-white d-block lh-1">St. Jude Medical</span>
                <small className="text-light" style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                  METROPOLITAN HOSPITAL
                </small>
              </div>
            </div>
            <p className="text-light small mb-3" style={{ opacity: 0.85, lineHeight: 1.6 }}>
              Providing comprehensive, patient-centered clinical excellence, emergency trauma intervention, and multidisciplinary specialist care with highest ethical standards.
            </p>
            <div className="d-flex gap-2">
              <span className="badge bg-navy border border-light text-light p-2">
                <i className="bi bi-shield-check text-teal me-1"></i> JCI Accredited
              </span>
              <span className="badge bg-navy border border-light text-light p-2">
                <i className="bi bi-award text-teal me-1"></i> ISO 9001:2026
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-lg-2 col-md-6">
            <h6 className="text-white fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
              Quick Links
            </h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/">Hospital Home</Link>
              </li>
              <li>
                <Link to="/about">About Our Facility</Link>
              </li>
              <li>
                <Link to="/departments">Specialized Departments</Link>
              </li>
              <li>
                <Link to="/doctors">Find a Specialist</Link>
              </li>
              <li>
                <Link to="/services">Clinical Services</Link>
              </li>
              <li>
                <Link to="/contact">Contact & Location</Link>
              </li>
            </ul>
          </div>

          {/* Specialized Departments */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
              Key Departments
            </h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/departments">Cardiovascular Center</Link>
              </li>
              <li>
                <Link to="/departments">Dermatology & Skin Health</Link>
              </li>
              <li>
                <Link to="/departments">Neurology & Brain Sciences</Link>
              </li>
              <li>
                <Link to="/departments">Orthopedics & Joint Care</Link>
              </li>
              <li>
                <Link to="/departments">Pediatrics & Adolescent Care</Link>
              </li>
              <li>
                <Link to="/departments">Internal & Preventive Medicine</Link>
              </li>
            </ul>
          </div>

          {/* Emergency & Working Hours */}
          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-bold text-uppercase mb-3" style={{ letterSpacing: '0.5px' }}>
              Hospital Contact
            </h6>
            <div className="small text-light mb-2" style={{ opacity: 0.9 }}>
              <i className="bi bi-geo-alt-fill text-teal me-2"></i>
              742 Healthcare Boulevard, Metro City, CA 90210
            </div>
            <div className="small text-light mb-2" style={{ opacity: 0.9 }}>
              <i className="bi bi-telephone-fill text-teal me-2"></i>
              General: +1 (555) 019-2830
            </div>
            <div className="small text-danger fw-bold mb-3">
              <i className="bi bi-telephone-outbound-fill me-2"></i>
              24/7 Emergency: +1 (800) 555-HOSP
            </div>

            <div className="bg-navy p-3 rounded-3 border border-secondary border-opacity-25 small">
              <div className="fw-semibold text-white mb-1">
                <i className="bi bi-clock-fill text-teal me-2"></i> OPD Consultation Hours:
              </div>
              <div className="text-light" style={{ opacity: 0.8 }}>
                Monday – Saturday: 08:00 AM – 08:00 PM<br />
                Emergency & Inpatient: Open 24/7
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className="border-top border-secondary border-opacity-25 pt-3 d-flex flex-wrap justify-content-between align-items-center small text-light" style={{ opacity: 0.7 }}>
          <div>
            &copy; {new Date().getFullYear()} St. Jude Metropolitan Hospital Management System. All rights reserved.
          </div>
          <div className="d-flex gap-3">
            <span>HIPAA-Compliant Patient Privacy Architecture</span>
            <span>Secure Opaque Identification Protocol</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
