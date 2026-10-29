import React from 'react';
import { Link } from 'react-router-dom';

const Services = () => {
  const hospitalServices = [
    {
      icon: 'bi-ambulance',
      title: '24/7 Emergency & Trauma Care',
      badge: 'Critical Care',
      desc: 'Immediate clinical resuscitation, level-1 trauma care, and dedicated cardiac catastrophe teams available 24/7 with zero admission delays.'
    },
    {
      icon: 'bi-calendar-check',
      title: 'Outpatient Consultations (OPD)',
      badge: 'Specialist OPD',
      desc: 'Multidisciplinary specialist clinics operating across 8 dedicated clinical departments with scheduled, non-overlapping appointments.'
    },
    {
      icon: 'bi-radioactive',
      title: 'Advanced Diagnostic Imaging & Pathology',
      badge: 'Accredited Lab',
      desc: 'Automated digital biochemistry, 12-lead ECG, ultrasound diagnostics, digital radiography, and comprehensive pathology panels.'
    },
    {
      icon: 'bi-qr-code',
      title: 'Secure Opaque Patient Identification',
      badge: 'Digital Health',
      desc: 'Instant desk check-in via cryptographic, opaque patient QR codes that protect personal medical histories from unauthenticated exposure.'
    },
    {
      icon: 'bi-prescription2',
      title: 'Digital E-Prescriptions & Clinical Notes',
      badge: 'Clinical Pharmacy',
      desc: 'Accredited e-prescriptions with automatic dosage instructions and chronological digital consultation archives accessible during patient visits.'
    },
    {
      icon: 'bi-hospital',
      title: 'Inpatient Hospitalization & Modern ICU',
      badge: '350+ Beds',
      desc: 'Private rooms, continuous telemetry observation, negative-pressure isolation suites, and post-operative intensive care units.'
    }
  ];

  return (
    <div className="py-5">
      <div className="container">
        {/* Title */}
        <div className="text-center mb-5" style={{ maxWidth: '750px', margin: '0 auto' }}>
          <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
            Comprehensive Healthcare
          </span>
          <h1 className="fw-bold text-navy mt-1 mb-3">Our Clinical Facilities & Hospital Services</h1>
          <p className="text-muted lead" style={{ fontSize: '1.05rem' }}>
            We provide an integrated spectrum of healthcare services designed for clinical safety, patient convenience, and swift diagnostic turnaround.
          </p>
        </div>

        {/* Services Grid */}
        <div className="row g-4 mb-5">
          {hospitalServices.map((service, idx) => (
            <div key={idx} className="col-md-6 col-lg-4">
              <div className="card-healthcare p-4 h-100 d-flex flex-column">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <div
                    className="rounded-3 bg-light-blue text-navy d-flex align-items-center justify-content-center"
                    style={{ width: '56px', height: '56px' }}
                  >
                    <i className={`bi ${service.icon} fs-3 text-teal`}></i>
                  </div>
                  <span className="badge badge-dept small">{service.badge}</span>
                </div>
                <h5 className="fw-bold text-navy mb-2">{service.title}</h5>
                <p className="text-muted small flex-grow-1" style={{ lineHeight: 1.6 }}>
                  {service.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Emergency Help Banner */}
        <div className="bg-navy text-white p-5 rounded-4 shadow-sm">
          <div className="row align-items-center g-4">
            <div className="col-lg-8">
              <div className="badge bg-danger text-white mb-2">24/7 RAPID DISPATCH</div>
              <h2 className="fw-bold text-white mb-2">Experiencing an Acute Medical Emergency?</h2>
              <p className="text-light mb-0" style={{ opacity: 0.85 }}>
                Our trauma coordinators and ambulance units are standing by. Call our direct emergency dispatch line immediately for priority clinical assistance.
              </p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <a
                href="tel:18005554677"
                className="btn btn-danger py-3 px-4 fs-5 fw-bold shadow"
              >
                <i className="bi bi-telephone-fill me-2"></i> +1 (800) 555-HOSP
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;
