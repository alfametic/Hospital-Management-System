import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { doctorAPI, departmentAPI } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';

const Doctors = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const departmentParam = searchParams.get('departmentId') || '';

  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState(departmentParam);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Sync query param with state
    if (departmentParam) {
      setSelectedDept(departmentParam);
    }
  }, [departmentParam]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await departmentAPI.getAll();
        setDepartments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load departments list:', err);
      }
    };

    fetchDepartments();
  }, []);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const params = {};
        if (selectedDept) params.departmentId = selectedDept;
        if (searchTerm) params.search = searchTerm;

        const res = await doctorAPI.getAll(params);
        setDoctors(res.data.data || []);
      } catch (err) {
        console.error('Failed to load doctors:', err);
        setError('Could not retrieve doctors directory from the server.');
      } finally {
        setLoading(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      fetchDoctors();
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [selectedDept, searchTerm]);

  const handleDeptChange = (e) => {
    const val = e.target.value;
    setSelectedDept(val);
    if (val) {
      setSearchParams({ departmentId: val });
    } else {
      setSearchParams({});
    }
  };

  const handleClearFilters = () => {
    setSelectedDept('');
    setSearchTerm('');
    setSearchParams({});
  };

  return (
    <div className="py-5">
      <div className="container">
        {/* Title */}
        <div className="mb-4">
          <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
            Medical Staff & Specialists
          </span>
          <h1 className="fw-bold text-navy mb-2">Physicians & Consultants Directory</h1>
          <p className="text-muted mb-0">
            Select a medical department or search by physician name to view clinical credentials and schedule appointments.
          </p>
        </div>

        {/* Filter Bar */}
        <div className="bg-white p-3 p-md-4 rounded-4 border shadow-sm mb-4">
          <div className="row g-3 align-items-center">
            {/* Search Input */}
            <div className="col-md-6">
              <label className="form-label small fw-semibold text-navy mb-1">
                Search Doctor or Specialization:
              </label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control form-control-hospital border-start-0"
                  placeholder="e.g., Dr. Jenkins, Cardiology, Interventional..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="col-md-4">
              <label className="form-label small fw-semibold text-navy mb-1">
                Filter by Department:
              </label>
              <select
                className="form-select form-select-hospital"
                value={selectedDept}
                onChange={handleDeptChange}
              >
                <option value="">All Hospital Departments</option>
                {departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Button */}
            <div className="col-md-2 d-flex align-items-end">
              <button
                className="btn btn-outline-secondary w-100 py-2 mt-md-4"
                onClick={handleClearFilters}
                disabled={!selectedDept && !searchTerm}
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        {error && <AlertMessage type="danger" message={error} />}

        {loading ? (
          <LoadingSpinner message="Searching hospital specialists..." />
        ) : doctors.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 border">
            <i className="bi bi-person-x fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-navy fw-bold">No Specialists Found</h5>
            <p className="text-muted small">No doctors match the selected department or search criteria.</p>
            <button className="btn btn-hospital-outline" onClick={handleClearFilters}>
              View All Doctors
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {doctors.map((doctor) => (
              <div key={doctor._id} className="col-md-6 col-lg-4">
                <div className="card-healthcare p-4 h-100 d-flex flex-column">
                  <div className="d-flex align-items-start mb-3">
                    <div
                      className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                      style={{ width: '64px', height: '64px' }}
                    >
                      <i className="bi bi-person-fill text-navy" style={{ fontSize: '2rem' }}></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-navy mb-1">
                        {doctor.userId?.name || 'Physician'}
                      </h5>
                      <span className="badge badge-dept mb-1">
                        {doctor.departmentId?.name || 'Specialist'}
                      </span>
                      <div className="small text-muted" style={{ fontSize: '0.82rem' }}>
                        {doctor.qualification}
                      </div>
                    </div>
                  </div>

                  <div className="mb-3">
                    <div className="small fw-semibold text-navy mb-1">Specialization:</div>
                    <div className="small text-muted">{doctor.specialization}</div>
                  </div>

                  {doctor.bio && (
                    <p className="small text-muted mb-3 flex-grow-1" style={{ lineHeight: 1.5 }}>
                      {doctor.bio}
                    </p>
                  )}

                  {/* Consultation Details Box */}
                  <div className="bg-light p-3 rounded-3 mb-3 small">
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Clinical Experience:</span>
                      <strong className="text-navy">{doctor.experienceYears} Years</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">Consultation Fee:</span>
                      <strong className="text-teal">${doctor.consultationFee}</strong>
                    </div>
                    <div className="d-flex justify-content-between mb-1">
                      <span className="text-muted">OPD Location:</span>
                      <strong className="text-navy">{doctor.roomNumber}</strong>
                    </div>
                    <div className="border-top pt-2 mt-2">
                      <span className="text-muted d-block mb-1">Available Days:</span>
                      <div className="d-flex flex-wrap gap-1">
                        {doctor.availableDays?.map((day, idx) => (
                          <span key={idx} className="badge bg-white text-navy border">
                            {day.slice(0, 3)}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Booking CTA */}
                  <div className="mt-auto pt-2">
                    <Link
                      to={`/login?redirect=book&doctorId=${doctor._id}`}
                      className="btn btn-hospital-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    >
                      <i className="bi bi-calendar-plus"></i> Book Consultation
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Doctors;
