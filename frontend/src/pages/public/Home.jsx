import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { departmentAPI, doctorAPI } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';

const Home = () => {
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHospitalData = async () => {
      try {
        setLoading(true);
        const [deptRes, docRes] = await Promise.all([
          departmentAPI.getAll(),
          doctorAPI.getAll()
        ]);
        setDepartments(deptRes.data.data.slice(0, 6)); // Preview first 6
        setDoctors(docRes.data.data.slice(0, 4)); // Preview first 4
      } catch (err) {
        console.error('Error fetching homepage hospital data:', err);
        setError('Could not load department directory from the server. Please ensure the backend is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchHospitalData();
  }, []);

  return (
    <div>
      {/* 1. Hero Section */}
      <section className="hero-hospital">
        <div className="container position-relative" style={{ zIndex: 1 }}>
          <div className="row align-items-center g-5">
            <div className="col-lg-7">
              <div className="d-inline-flex align-items-center bg-teal bg-opacity-25 text-teal border border-teal border-opacity-50 rounded-pill px-3 py-1 mb-3 small fw-bold">
                <i className="bi bi-shield-check me-2"></i> World-Class Tertiary Medical Care
              </div>
              <h1 className="display-4 fw-bold text-white mb-3" style={{ lineHeight: 1.15 }}>
                Advanced Medicine, <br />
                <span className="text-teal">Compassionate Care.</span>
              </h1>
              <p className="lead text-light mb-4" style={{ opacity: 0.9, maxWidth: '580px' }}>
                St. Jude Metropolitan Hospital combines distinguished specialists, precision diagnostic laboratories, and digital patient access with secure, privacy-first patient records.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/ai-triage" className="btn btn-hospital-teal py-3 px-4 fs-6 fw-bold shadow">
                  <i className="bi bi-robot me-2"></i> Find the Right Department (AI)
                </Link>
                <Link to="/doctors" className="btn btn-outline-light py-3 px-4 fs-6 fw-semibold">
                  <i className="bi bi-calendar-check me-2"></i> Find a Specialist
                </Link>
                <Link to="/departments" className="btn btn-outline-light py-3 px-4 fs-6 fw-semibold">
                  <i className="bi bi-hospital me-2"></i> Explore Departments
                </Link>
              </div>

              {/* Patient safety disclaimer callout */}
              <div className="mt-4 pt-3 border-top border-white border-opacity-25 d-flex align-items-center gap-3">
                <div className="rounded-circle bg-teal bg-opacity-20 p-2 text-teal">
                  <i className="bi bi-qr-code fs-4"></i>
                </div>
                <div className="small text-light" style={{ opacity: 0.85 }}>
                  <strong>Digital Patient Identification:</strong> Every registered patient receives a safe, opaque QR code for instant medical desk check-in without exposing private records.
                </div>
              </div>
            </div>

            <div className="col-lg-5">
              <div className="card-healthcare p-4 border-0 shadow-lg text-dark bg-white">
                <div className="d-flex align-items-center justify-content-between mb-3 border-bottom pb-2">
                  <span className="badge bg-danger text-white px-2 py-1">EMERGENCY ADMISSION</span>
                  <span className="text-muted small">Open 24/7/365</span>
                </div>
                <h5 className="fw-bold text-navy mb-2">Immediate Critical Care</h5>
                <p className="text-muted small mb-3">
                  For acute cardiac symptoms, stroke symptoms, acute respiratory distress, or severe trauma, contact emergency response directly.
                </p>
                <div className="bg-light p-3 rounded-3 mb-3 border">
                  <div className="small text-muted mb-1">Trauma Dispatch Hotline</div>
                  <div className="fs-4 fw-bold text-danger">
                    <i className="bi bi-telephone-fill me-2"></i> +1 (800) 555-HOSP
                  </div>
                </div>

                <div className="d-grid gap-2">
                  <Link to="/register" className="btn btn-hospital-primary py-2">
                    <i className="bi bi-person-plus me-1"></i> Register as New Patient
                  </Link>
                  <Link to="/login" className="btn btn-outline-secondary py-2">
                    <i className="bi bi-box-arrow-in-right me-1"></i> Patient / Doctor Sign In
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Key Clinical Metrics */}
      <section className="py-4 bg-white border-bottom shadow-sm">
        <div className="container">
          <div className="row g-4 text-center">
            <div className="col-6 col-md-3">
              <div className="fs-2 fw-bold text-navy">8+</div>
              <div className="text-muted small fw-semibold">Specialized Departments</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fs-2 fw-bold text-teal">50+</div>
              <div className="text-muted small fw-semibold">Board Certified Specialists</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fs-2 fw-bold text-navy">24/7</div>
              <div className="text-muted small fw-semibold">Emergency & Trauma Care</div>
            </div>
            <div className="col-6 col-md-3">
              <div className="fs-2 fw-bold text-teal">100%</div>
              <div className="text-muted small fw-semibold">Secure Opaque Patient IDs</div>
            </div>
          </div>
        </div>
      </section>

      {/* 2.5 Prominent AI Department Recommendation Banner */}
      <section className="py-5 bg-light-blue border-bottom">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="d-inline-flex align-items-center bg-teal bg-opacity-10 text-teal border border-teal border-opacity-25 rounded-pill px-3 py-1 mb-2 small fw-bold">
                <i className="bi bi-robot me-2"></i> AI Department Recommendation
              </div>
              <h2 className="fw-bold text-navy mb-2">Unsure Which Specialist You Need to See?</h2>
              <p className="text-muted mb-3" style={{ maxWidth: '680px', lineHeight: 1.6 }}>
                Describe your symptoms or optionally upload a photo (e.g., skin rash, eye redness, joint swelling). Our intelligent clinical router analyzes your indications and suggests the appropriate hospital department.
              </p>
              <div className="d-flex flex-wrap gap-2 text-muted small">
                <span><i className="bi bi-shield-check text-success me-1"></i> No Account Required</span>
                <span className="ms-3"><i className="bi bi-shield-check text-success me-1"></i> Non-Diagnostic Guidance</span>
                <span className="ms-3"><i className="bi bi-shield-check text-success me-1"></i> Direct Appointment Booking</span>
              </div>
            </div>
            <div className="col-lg-4 text-lg-end">
              <Link to="/ai-triage" className="btn btn-hospital-teal py-3 px-4 fw-bold shadow">
                <i className="bi bi-compass me-2"></i> Find the Right Department
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Specialized Departments Preview */}
      <section className="py-5">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
            <div>
              <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
                Centers of Excellence
              </span>
              <h2 className="fw-bold text-navy mb-0">Specialized Medical Departments</h2>
            </div>
            <Link to="/departments" className="btn btn-hospital-outline mt-2 mt-sm-0">
              View All 8 Departments <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          {error && <AlertMessage type="warning" message={error} />}

          {loading ? (
            <LoadingSpinner message="Retrieving hospital departments..." />
          ) : (
            <div className="row g-4">
              {departments.map((dept) => (
                <div key={dept._id} className="col-md-6 col-lg-4">
                  <div className="card-healthcare p-4 h-100 d-flex flex-column">
                    <div className="d-flex align-items-center mb-3">
                      <div
                        className="rounded-3 bg-light-blue text-navy d-flex align-items-center justify-content-center me-3"
                        style={{ width: '50px', height: '50px' }}
                      >
                        <i className={`bi ${dept.icon || 'bi-hospital'} fs-3 text-teal`}></i>
                      </div>
                      <div>
                        <h5 className="fw-bold text-navy mb-0">{dept.name}</h5>
                        <small className="text-muted">Code: {dept.code}</small>
                      </div>
                    </div>
                    <p className="text-muted small flex-grow-1" style={{ lineHeight: 1.6 }}>
                      {dept.description}
                    </p>

                    {dept.commonSymptoms && dept.commonSymptoms.length > 0 && (
                      <div className="mb-3">
                        <small className="text-muted d-block mb-1 fw-semibold">Common Symptoms:</small>
                        <div>
                          {dept.commonSymptoms.slice(0, 3).map((sym, idx) => (
                            <span key={idx} className="badge-symptom">
                              {sym}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-2 border-top d-flex justify-content-between align-items-center">
                      <span className="small text-muted">
                        <i className="bi bi-person-badge text-teal me-1"></i>
                        {dept.doctorCount || 1} Specialist(s)
                      </span>
                      <Link
                        to={`/doctors?departmentId=${dept._id}`}
                        className="small fw-bold text-teal text-decoration-none"
                      >
                        Find Doctor <i className="bi bi-chevron-right"></i>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Featured Specialists */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="container">
          <div className="d-flex flex-wrap justify-content-between align-items-end mb-4">
            <div>
              <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
                Clinical Leadership
              </span>
              <h2 className="fw-bold text-navy mb-0">Our Expert Physicians & Specialists</h2>
            </div>
            <Link to="/doctors" className="btn btn-hospital-outline mt-2 mt-sm-0">
              Browse All Specialists <i className="bi bi-arrow-right ms-1"></i>
            </Link>
          </div>

          {loading ? (
            <LoadingSpinner message="Loading medical staff..." />
          ) : (
            <div className="row g-4">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="col-md-6 col-lg-3">
                  <div className="card-healthcare p-3 text-center h-100 d-flex flex-column">
                    <div
                      className="rounded-circle bg-light-blue mx-auto d-flex align-items-center justify-content-center mb-3 mt-2"
                      style={{ width: '80px', height: '80px' }}
                    >
                      <i className="bi bi-person-fill text-navy" style={{ fontSize: '2.5rem' }}></i>
                    </div>
                    <h6 className="fw-bold text-navy mb-1">{doctor.userId?.name || 'Physician'}</h6>
                    <div className="text-teal small fw-semibold mb-2">
                      {doctor.departmentId?.name || 'Specialist'}
                    </div>
                    <p className="small text-muted mb-3 flex-grow-1" style={{ fontSize: '0.82rem' }}>
                      {doctor.specialization}
                    </p>
                    <div className="bg-light p-2 rounded-2 small text-muted mb-3">
                      <div><strong>Exp:</strong> {doctor.experienceYears} Years</div>
                      <div><strong>Fee:</strong> ${doctor.consultationFee}</div>
                    </div>
                    <Link
                      to={`/login?redirect=book&doctorId=${doctor._id}`}
                      className="btn btn-sm btn-hospital-primary w-100"
                    >
                      Book Consultation
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 5. Why Choose St. Jude */}
      <section className="py-5">
        <div className="container">
          <div className="text-center mb-5" style={{ maxWidth: '650px', margin: '0 auto' }}>
            <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
              Patient Safety & Care Delivery
            </span>
            <h2 className="fw-bold text-navy mb-2">Why Patients Trust St. Jude</h2>
            <p className="text-muted">
              We operate an interconnected hospital management environment where patient privacy, clinical efficiency, and medical rigor intersect.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-4">
              <div className="card-healthcare p-4 h-100 text-center">
                <div
                  className="rounded-circle bg-light-teal text-teal d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '64px', height: '64px' }}
                >
                  <i className="bi bi-qr-code-scan fs-3"></i>
                </div>
                <h5 className="fw-bold text-navy mb-2">Secure Patient QR Codes</h5>
                <p className="text-muted small mb-0">
                  Patients receive an encrypted opaque QR identifier. Desk staff and doctors verify patient identity instantly without ever broadcasting private records over QR codes.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card-healthcare p-4 h-100 text-center">
                <div
                  className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '64px', height: '64px' }}
                >
                  <i className="bi bi-calendar-check-fill fs-3 text-teal"></i>
                </div>
                <h5 className="fw-bold text-navy mb-2">Real-Time Doctor Scheduling</h5>
                <p className="text-muted small mb-0">
                  Book appointments strictly against verified physician availability. Double booking is systematically prevented with automated time slot concurrency controls.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card-healthcare p-4 h-100 text-center">
                <div
                  className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center mx-auto mb-3"
                  style={{ width: '64px', height: '64px' }}
                >
                  <i className="bi bi-file-earmark-medical-fill fs-3 text-teal"></i>
                </div>
                <h5 className="fw-bold text-navy mb-2">Chronological EMR Records</h5>
                <p className="text-muted small mb-0">
                  Full chronological medical histories, vitals monitoring, digital prescription trails, and lab summaries accessible only to authorized attending physicians.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
