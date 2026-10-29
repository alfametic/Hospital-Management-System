import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div className="py-5">
      <div className="container">
        {/* Header Breadcrumb & Title */}
        <div className="mb-5 text-center" style={{ maxWidth: '750px', margin: '0 auto' }}>
          <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
            About Our Medical Institution
          </span>
          <h1 className="fw-bold text-navy mt-1 mb-3">Excellence in Tertiary Healthcare Since 1994</h1>
          <p className="lead text-muted" style={{ fontSize: '1.05rem' }}>
            St. Jude Metropolitan Hospital is an internationally accredited multi-specialty medical center dedicated to pioneering clinical medicine, advanced surgical interventions, and compassionate outpatient care.
          </p>
        </div>

        {/* Mission, Vision & Core Values */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card-healthcare p-4 h-100">
              <div
                className="rounded-3 bg-light-blue text-navy d-flex align-items-center justify-content-center mb-3"
                style={{ width: '50px', height: '50px' }}
              >
                <i className="bi bi-compass-fill fs-3 text-teal"></i>
              </div>
              <h4 className="fw-bold text-navy mb-2">Our Mission</h4>
              <p className="text-muted small mb-0" style={{ lineHeight: 1.7 }}>
                To deliver superior patient outcomes through evidence-based medicine, innovative clinical research, state-of-the-art diagnostic technology, and respectful individualized care.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-healthcare p-4 h-100">
              <div
                className="rounded-3 bg-light-blue text-navy d-flex align-items-center justify-content-center mb-3"
                style={{ width: '50px', height: '50px' }}
              >
                <i className="bi bi-eye-fill fs-3 text-teal"></i>
              </div>
              <h4 className="fw-bold text-navy mb-2">Our Vision</h4>
              <p className="text-muted small mb-0" style={{ lineHeight: 1.7 }}>
                To be the region's preeminent healthcare institution, known for clinical breakthrough treatments, patient digital safety, and empathetic medical leadership.
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-healthcare p-4 h-100">
              <div
                className="rounded-3 bg-light-blue text-navy d-flex align-items-center justify-content-center mb-3"
                style={{ width: '50px', height: '50px' }}
              >
                <i className="bi bi-shield-heart-fill fs-3 text-teal"></i>
              </div>
              <h4 className="fw-bold text-navy mb-2">Patient Privacy First</h4>
              <p className="text-muted small mb-0" style={{ lineHeight: 1.7 }}>
                We uphold strict medical record confidentiality. Our opaque QR identification system ensures patient authentication without exposing sensitive clinical histories to unauthorized parties.
              </p>
            </div>
          </div>
        </div>

        {/* Accreditations & Clinical Certifications */}
        <div className="bg-white p-5 rounded-4 border shadow-sm mb-5">
          <div className="row align-items-center g-4">
            <div className="col-lg-6">
              <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
                Accreditations & Standards
              </span>
              <h2 className="fw-bold text-navy mb-3">Global Quality Certifications</h2>
              <p className="text-muted mb-4" style={{ lineHeight: 1.7 }}>
                Our hospital is certified under stringent international safety benchmarks. Clinical protocols, surgical theaters, hygiene standards, and pharmacy distribution follow verified Joint Commission guidelines.
              </p>
              <div className="d-flex flex-wrap gap-2">
                <span className="badge bg-light text-navy border p-2">
                  <i className="bi bi-check2-circle text-teal me-1"></i> Joint Commission International (JCI)
                </span>
                <span className="badge bg-light text-navy border p-2">
                  <i className="bi bi-check2-circle text-teal me-1"></i> ISO 15189 Medical Laboratories
                </span>
                <span className="badge bg-light text-navy border p-2">
                  <i className="bi bi-check2-circle text-teal me-1"></i> HIPAA Security Standards Compliance
                </span>
              </div>
            </div>

            <div className="col-lg-6">
              <div className="row g-3">
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <div className="fs-3 fw-bold text-navy">350+</div>
                    <div className="text-muted small">Inpatient Hospital Beds</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <div className="fs-3 fw-bold text-teal">12</div>
                    <div className="text-muted small">Advanced Modular OTs</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <div className="fs-3 fw-bold text-teal">24/7</div>
                    <div className="text-muted small">Level 1 Trauma Center</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="p-3 bg-light rounded-3 text-center border">
                    <div className="fs-3 fw-bold text-navy">15,000+</div>
                    <div className="text-muted small">Annual Patient Consults</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Call to action */}
        <div className="text-center py-4">
          <h3 className="fw-bold text-navy mb-3">Need Consultation with Our Specialists?</h3>
          <p className="text-muted mb-4">
            Our medical staff is available for scheduled appointments across all 8 specialized hospital departments.
          </p>
          <div className="d-flex justify-content-center gap-3">
            <Link to="/doctors" className="btn btn-hospital-teal px-4 py-2">
              Browse Doctors Directory
            </Link>
            <Link to="/contact" className="btn btn-hospital-outline px-4 py-2">
              Hospital Location & Directions
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
