import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    department: 'General Inquiries',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="py-5">
      <div className="container">
        {/* Title */}
        <div className="text-center mb-5" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
            Hospital Contact & Location
          </span>
          <h1 className="fw-bold text-navy mt-1 mb-3">Get in Touch with St. Jude Medical</h1>
          <p className="text-muted lead" style={{ fontSize: '1.05rem' }}>
            Whether you need emergency guidance, general inquiries, or appointment assistance, our hospital administration is here to assist you.
          </p>
        </div>

        {/* Contact Info Cards */}
        <div className="row g-4 mb-5">
          <div className="col-md-4">
            <div className="card-healthcare p-4 text-center h-100">
              <div
                className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: '60px', height: '60px' }}
              >
                <i className="bi bi-geo-alt-fill fs-3 text-teal"></i>
              </div>
              <h5 className="fw-bold text-navy mb-2">Hospital Campus</h5>
              <p className="text-muted small mb-0">
                742 Healthcare Boulevard<br />
                Metro City, CA 90210<br />
                Building A & B (Main OPD & Inpatient Wings)
              </p>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-healthcare p-4 text-center h-100">
              <div
                className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: '60px', height: '60px' }}
              >
                <i className="bi bi-telephone-fill fs-3 text-teal"></i>
              </div>
              <h5 className="fw-bold text-navy mb-2">Phone Lines</h5>
              <div className="small text-muted mb-1">General Reception: +1 (555) 019-2830</div>
              <div className="small text-muted mb-1">Appointment Desk: +1 (555) 019-2831</div>
              <div className="small text-danger fw-bold">Emergency 24/7: +1 (800) 555-HOSP</div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card-healthcare p-4 text-center h-100">
              <div
                className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center mx-auto mb-3"
                style={{ width: '60px', height: '60px' }}
              >
                <i className="bi bi-clock-fill fs-3 text-teal"></i>
              </div>
              <h5 className="fw-bold text-navy mb-2">Visiting Hours</h5>
              <p className="text-muted small mb-0">
                OPD Clinics: Mon – Sat, 8:00 AM – 8:00 PM<br />
                Inpatient Visiting: 10:00 AM – 7:00 PM<br />
                Emergency Department: Open 24/7
              </p>
            </div>
          </div>
        </div>

        {/* Form and Map Details */}
        <div className="row g-4">
          <div className="col-lg-7">
            <div className="bg-white p-4 p-md-5 rounded-4 border shadow-sm">
              <h4 className="fw-bold text-navy mb-3">Send a Hospital Inquiry</h4>
              <p className="text-muted small mb-4">
                Please do not submit urgent emergency medical symptoms via this form. For acute emergencies, call 911 or visit our emergency department.
              </p>

              {submitted ? (
                <div className="alert alert-success d-flex align-items-center py-4 rounded-3 border-0">
                  <i className="bi bi-check-circle-fill fs-2 me-3 text-success"></i>
                  <div>
                    <h5 className="fw-bold mb-1">Inquiry Transmitted Successfully</h5>
                    <p className="mb-0 small">
                      Thank you for contacting St. Jude Metropolitan Hospital. Our administrative coordinator will reply to your registered email shortly.
                    </p>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">Full Name</label>
                      <input
                        type="text"
                        className="form-control form-control-hospital"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">Email Address</label>
                      <input
                        type="email"
                        className="form-control form-control-hospital"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="johndoe@example.com"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">Phone Number</label>
                      <input
                        type="tel"
                        className="form-control form-control-hospital"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+1 (555) 000-0000"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label small fw-semibold text-navy">Department</label>
                      <select
                        className="form-select form-select-hospital"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      >
                        <option>General Inquiries</option>
                        <option>Patient Records & Desk Check-in</option>
                        <option>Billing & Insurance Services</option>
                        <option>Clinical Appointments</option>
                        <option>Laboratory Reports</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-semibold text-navy">Your Message</label>
                      <textarea
                        className="form-control form-control-hospital"
                        rows="4"
                        required
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder="Describe your inquiry..."
                      ></textarea>
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-hospital-primary py-2 px-4">
                        <i className="bi bi-send-fill me-2"></i> Submit Inquiry
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          <div className="col-lg-5">
            <div className="card-healthcare p-4 h-100 bg-white">
              <h5 className="fw-bold text-navy mb-3">Directions & Campus Parking</h5>
              <p className="text-muted small mb-3">
                Ample 24/7 multilevel parking is available in <strong>Parking Structure A</strong> adjacent to the Main Clinical Tower.
              </p>
              <ul className="list-unstyled small text-muted d-flex flex-column gap-2 mb-4">
                <li>
                  <i className="bi bi-p-circle-fill text-teal me-2"></i> Free patient parking for first 2 hours with validated token.
                </li>
                <li>
                  <i className="bi bi-universal-access-circle text-teal me-2"></i> Full wheelchair accessibility at all building portals.
                </li>
                <li>
                  <i className="bi bi-bus-front-fill text-teal me-2"></i> Metro Bus Lines 42 & 108 stop directly in front of Main Entrance.
                </li>
              </ul>

              <div className="bg-light-blue p-4 rounded-3 border">
                <div className="d-flex align-items-center mb-2">
                  <i className="bi bi-shield-lock-fill text-navy fs-4 me-2"></i>
                  <h6 className="fw-bold text-navy mb-0">Patient Check-In Notice</h6>
                </div>
                <p className="small text-muted mb-0">
                  Patients registered on our portal can present their digital <strong>Patient Identification QR Code</strong> on their smartphone to the reception desk for instant contactless check-in.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
