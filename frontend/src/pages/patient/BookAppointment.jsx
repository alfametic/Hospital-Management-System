import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { departmentAPI, doctorAPI, appointmentAPI } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';

const BookAppointment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDoctorId = searchParams.get('doctorId') || '';
  const preselectedDeptId = searchParams.get('departmentId') || '';

  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [filteredDoctors, setFilteredDoctors] = useState([]);

  // Form State
  const [selectedDeptId, setSelectedDeptId] = useState(preselectedDeptId);
  const [selectedDoctorId, setSelectedDoctorId] = useState(preselectedDoctorId);
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [reason, setReason] = useState('Routine Clinical Consultation');

  // Slot Availability State
  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // General Page State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Selected Doctor Object
  const selectedDoctor = doctors.find((d) => d._id === selectedDoctorId);

  // 1. Fetch Departments and Doctors on Mount
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const [deptRes, docRes] = await Promise.all([
          departmentAPI.getAll(),
          doctorAPI.getAll()
        ]);
        setDepartments(deptRes.data.data || []);
        const allDocs = docRes.data.data || [];
        setDoctors(allDocs);

        // If preselected department was passed in URL
        if (preselectedDeptId) {
          setSelectedDeptId(preselectedDeptId);
        }

        // If preselected doctor was passed in URL
        if (preselectedDoctorId) {
          const preDoc = allDocs.find((d) => d._id === preselectedDoctorId);
          if (preDoc) {
            setSelectedDeptId(preDoc.departmentId?._id || '');
            setSelectedDoctorId(preDoc._id);
          }
        }
      } catch (err) {
        console.error('Failed to load booking prerequisite data:', err);
        setError('Could not connect to hospital scheduling service.');
      } finally {
        setLoading(false);
      }
    };

    initData();
  }, [preselectedDoctorId]);

  // 2. Filter Doctors whenever Department changes
  useEffect(() => {
    if (selectedDeptId) {
      const docsInDept = doctors.filter(
        (doc) => String(doc.departmentId?._id) === String(selectedDeptId)
      );
      setFilteredDoctors(docsInDept);
      if (selectedDoctorId && !docsInDept.some((d) => d._id === selectedDoctorId)) {
        setSelectedDoctorId('');
        setTimeSlot('');
      }
    } else {
      setFilteredDoctors(doctors);
    }
  }, [selectedDeptId, doctors]);

  // 3. Fetch Booked Slots when Doctor and Date are selected
  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDoctorId || !appointmentDate) {
        setBookedSlots([]);
        return;
      }

      try {
        setLoadingSlots(true);
        setError(null);
        const res = await appointmentAPI.getBookedSlots(selectedDoctorId, appointmentDate);
        setBookedSlots(res.data.bookedSlots || []);
      } catch (err) {
        console.error('Error fetching booked slots:', err);
        setError('Could not verify slot availability for the selected date.');
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [selectedDoctorId, appointmentDate]);

  // Check if chosen date is a day the doctor works
  const isDoctorAvailableOnDate = (dateStr) => {
    if (!selectedDoctor || !dateStr) return true;
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const chosenDay = days[new Date(dateStr).getDay()];
    return selectedDoctor.availableDays?.includes(chosenDay);
  };

  // Min Date: Today
  const todayStr = new Date().toISOString().split('T')[0];

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!selectedDeptId || !selectedDoctorId || !appointmentDate || !timeSlot) {
      setError('Please complete all required fields (Department, Doctor, Date, and Time Slot).');
      return;
    }

    if (!isDoctorAvailableOnDate(appointmentDate)) {
      setError(`Selected doctor is not available on this day of the week. Available days: ${selectedDoctor.availableDays.join(', ')}`);
      return;
    }

    if (bookedSlots.includes(timeSlot)) {
      setError('This slot was just booked by another patient. Please choose an available time slot.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        departmentId: selectedDeptId,
        doctorId: selectedDoctorId,
        appointmentDate,
        timeSlot,
        reason
      };

      const res = await appointmentAPI.book(payload);
      if (res.data.success) {
        setSuccess('Appointment confirmed successfully!');
        setTimeout(() => {
          navigate('/patient', { state: { activeTab: 'appointments' } });
        }, 1500);
      }
    } catch (err) {
      console.error('Booking failed:', err);
      setError(err.message || 'Failed to book appointment. Please verify details and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading hospital scheduling system..." />;
  }

  return (
    <div className="py-5 bg-light" style={{ minHeight: '85vh' }}>
      <div className="container">
        {/* Header Breadcrumb */}
        <div className="mb-4">
          <Link to="/patient" className="text-teal text-decoration-none small fw-semibold">
            <i className="bi bi-arrow-left me-1"></i> Back to Patient Dashboard
          </Link>
          <h2 className="fw-bold text-navy mt-2 mb-1">Book Medical Consultation</h2>
          <p className="text-muted small">
            Select medical division, physician, and real-time available time slot.
          </p>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {success && <AlertMessage type="success" message={success} />}

        <div className="row g-4">
          {/* Main Booking Form */}
          <div className="col-lg-8">
            <div className="card-healthcare p-4 p-md-5 bg-white border-0 shadow-sm">
              <form onSubmit={handleBookingSubmit}>
                {/* Step 1: Department Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-navy small">
                    1. Select Medical Department <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-hospital"
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    required
                  >
                    <option value="">-- Choose Department --</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Doctor Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-navy small">
                    2. Select Consulting Physician <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select form-select-hospital"
                    value={selectedDoctorId}
                    onChange={(e) => {
                      setSelectedDoctorId(e.target.value);
                      setTimeSlot('');
                    }}
                    required
                    disabled={!selectedDeptId}
                  >
                    <option value="">
                      {!selectedDeptId
                        ? '-- Select a department first --'
                        : filteredDoctors.length === 0
                        ? '-- No doctors currently listed in this department --'
                        : '-- Choose Physician --'}
                    </option>
                    {filteredDoctors.map((doc) => (
                      <option key={doc._id} value={doc._id}>
                        {doc.userId?.name} — {doc.specialization} (${doc.consultationFee})
                      </option>
                    ))}
                  </select>

                  {/* Doctor Info Card Preview */}
                  {selectedDoctor && (
                    <div className="bg-light-blue p-3 rounded-3 mt-3 border small">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                        <strong className="text-navy">{selectedDoctor.userId?.name}</strong>
                        <span className="badge badge-dept">${selectedDoctor.consultationFee} Fee</span>
                      </div>
                      <div className="text-muted mb-2">
                        {selectedDoctor.qualification} | {selectedDoctor.experienceYears} Years Exp | Room: {selectedDoctor.roomNumber}
                      </div>
                      <div className="text-navy">
                        <strong>Available Days: </strong>
                        {selectedDoctor.availableDays?.join(', ')}
                      </div>
                    </div>
                  )}
                </div>

                {/* Step 3: Appointment Date Selection */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-navy small">
                    3. Select Consultation Date <span className="text-danger">*</span>
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    className="form-control form-control-hospital"
                    value={appointmentDate}
                    onChange={(e) => {
                      setAppointmentDate(e.target.value);
                      setTimeSlot('');
                    }}
                    required
                    disabled={!selectedDoctorId}
                  />

                  {appointmentDate && selectedDoctor && !isDoctorAvailableOnDate(appointmentDate) && (
                    <div className="text-danger small mt-2">
                      <i className="bi bi-exclamation-triangle-fill me-1"></i>
                      The physician is not scheduled on this day of the week. Please select one of: {selectedDoctor.availableDays?.join(', ')}.
                    </div>
                  )}
                </div>

                {/* Step 4: Time Slot Selection (Live concurrency verification) */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-bold text-navy small mb-0">
                      4. Select Available Time Slot <span className="text-danger">*</span>
                    </label>
                    {loadingSlots && (
                      <small className="text-teal">
                        <span className="spinner-border spinner-border-sm me-1" role="status"></span>
                        Checking availability...
                      </small>
                    )}
                  </div>

                  {!selectedDoctorId || !appointmentDate ? (
                    <div className="text-muted small p-3 bg-light rounded-3 text-center border">
                      Select physician and date above to load live time slots.
                    </div>
                  ) : (
                    <div className="row g-2">
                      {selectedDoctor?.availableTimeSlots?.map((slot, idx) => {
                        const isBooked = bookedSlots.includes(slot);
                        const isSelected = timeSlot === slot;

                        return (
                          <div key={idx} className="col-sm-6 col-md-4">
                            <button
                              type="button"
                              className={`btn w-100 py-2 text-center small rounded-3 border ${
                                isBooked
                                  ? 'btn-light text-muted border-secondary border-opacity-25'
                                  : isSelected
                                  ? 'btn-hospital-teal shadow-sm'
                                  : 'btn-outline-secondary'
                              }`}
                              disabled={isBooked}
                              onClick={() => setTimeSlot(slot)}
                            >
                              <div className="fw-semibold">{slot}</div>
                              {isBooked ? (
                                <span className="badge bg-secondary text-white" style={{ fontSize: '0.65rem' }}>
                                  Booked
                                </span>
                              ) : (
                                <span
                                  className={`badge ${isSelected ? 'bg-white text-teal' : 'bg-success text-white'}`}
                                  style={{ fontSize: '0.65rem' }}
                                >
                                  {isSelected ? 'Selected' : 'Available'}
                                </span>
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step 5: Reason for Consultation */}
                <div className="mb-4">
                  <label className="form-label fw-bold text-navy small">
                    5. Chief Symptoms / Reason for Visit
                  </label>
                  <textarea
                    rows="3"
                    className="form-control form-control-hospital"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe what you would like to consult the physician regarding..."
                  ></textarea>
                </div>

                {/* Submit Action */}
                <button
                  type="submit"
                  className="btn btn-hospital-primary w-100 py-3 fw-bold fs-6"
                  disabled={submitting || !selectedDoctorId || !timeSlot || !appointmentDate}
                >
                  {submitting ? (
                    <span>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Confirming Booking with Medical Desk...
                    </span>
                  ) : (
                    <span>
                      <i className="bi bi-calendar-check me-2"></i> Confirm Consultation Booking
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Booking Summary Sidebar */}
          <div className="col-lg-4">
            <div className="card-healthcare p-4 bg-white border-0 shadow-sm sticky-top" style={{ top: '100px' }}>
              <h5 className="fw-bold text-navy mb-3 pb-2 border-bottom">
                <i className="bi bi-clipboard-check text-teal me-2"></i> Booking Summary
              </h5>

              <div className="small mb-3">
                <span className="text-muted d-block">Department:</span>
                <strong className="text-navy">
                  {departments.find((d) => d._id === selectedDeptId)?.name || 'Not Selected'}
                </strong>
              </div>

              <div className="small mb-3">
                <span className="text-muted d-block">Doctor:</span>
                <strong className="text-navy">{selectedDoctor?.userId?.name || 'Not Selected'}</strong>
                {selectedDoctor && (
                  <div className="text-muted">{selectedDoctor.specialization}</div>
                )}
              </div>

              <div className="small mb-3">
                <span className="text-muted d-block">Consultation Date:</span>
                <strong className="text-navy">
                  {appointmentDate ? new Date(appointmentDate).toDateString() : 'Not Selected'}
                </strong>
              </div>

              <div className="small mb-3">
                <span className="text-muted d-block">Time Slot:</span>
                <strong className="text-teal">{timeSlot || 'Not Selected'}</strong>
              </div>

              <div className="small mb-4">
                <span className="text-muted d-block">OPD Room:</span>
                <strong className="text-navy">{selectedDoctor?.roomNumber || 'TBD'}</strong>
              </div>

              <div className="bg-light p-3 rounded-3 border mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <span className="text-muted small">Consultation Fee:</span>
                  <span className="fs-5 fw-bold text-teal">
                    ${selectedDoctor ? selectedDoctor.consultationFee : 0}
                  </span>
                </div>
                <small className="text-muted d-block mt-1" style={{ fontSize: '0.75rem' }}>
                  Payable at hospital front desk upon arrival.
                </small>
              </div>

              <div className="alert alert-light border small text-muted mb-0">
                <i className="bi bi-shield-check text-success me-1"></i>
                <strong>No Double Booking:</strong> Slot reservation is locked in the clinical database upon confirmation.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookAppointment;
