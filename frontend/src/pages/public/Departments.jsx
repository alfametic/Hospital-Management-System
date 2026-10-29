import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { departmentAPI } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';

const Departments = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setLoading(true);
        const res = await departmentAPI.getAll();
        setDepartments(res.data.data || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
        setError('Could not connect to the hospital departments database.');
      } finally {
        setLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const filteredDepartments = departments.filter((dept) => {
    const matchesName = dept.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDesc = dept.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSymptoms = dept.commonSymptoms?.some(s =>
      s.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return matchesName || matchesDesc || matchesSymptoms;
  });

  return (
    <div className="py-5">
      <div className="container">
        {/* Title & Search bar */}
        <div className="row align-items-end mb-4">
          <div className="col-lg-8">
            <span className="text-teal text-uppercase fw-bold small" style={{ letterSpacing: '1px' }}>
              Specialized Divisions
            </span>
            <h1 className="fw-bold text-navy mb-2">Hospital Medical Departments</h1>
            <p className="text-muted mb-0">
              Explore our tertiary healthcare divisions, clinical disciplines, and associated diagnostic capabilities.
            </p>
          </div>
          <div className="col-lg-4 mt-3 mt-lg-0">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0">
                <i className="bi bi-search text-muted"></i>
              </span>
              <input
                type="text"
                className="form-control form-control-hospital border-start-0"
                placeholder="Search department or symptom..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <AlertMessage type="danger" message={error} />}

        {loading ? (
          <LoadingSpinner message="Loading hospital departments..." />
        ) : filteredDepartments.length === 0 ? (
          <div className="text-center py-5 bg-white rounded-4 border">
            <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
            <h5 className="text-navy fw-bold">No Departments Found</h5>
            <p className="text-muted small">No department matches your search term "{searchTerm}".</p>
            <button
              className="btn btn-sm btn-hospital-outline"
              onClick={() => setSearchTerm('')}
            >
              Clear Search Filter
            </button>
          </div>
        ) : (
          <div className="row g-4">
            {filteredDepartments.map((dept) => (
              <div key={dept._id} className="col-md-6 col-lg-4">
                <div className="card-healthcare p-4 h-100 d-flex flex-column">
                  <div className="d-flex align-items-center mb-3">
                    <div
                      className="rounded-3 bg-light-blue text-navy d-flex align-items-center justify-content-center me-3"
                      style={{ width: '56px', height: '56px' }}
                    >
                      <i className={`bi ${dept.icon || 'bi-hospital'} fs-3 text-teal`}></i>
                    </div>
                    <div>
                      <h5 className="fw-bold text-navy mb-0">{dept.name}</h5>
                      <span className="badge badge-dept small mt-1">Code: {dept.code}</span>
                    </div>
                  </div>

                  <p className="text-muted small flex-grow-1" style={{ lineHeight: 1.6 }}>
                    {dept.description}
                  </p>

                  {dept.headDoctorName && (
                    <div className="small mb-3 text-muted">
                      <strong>Head of Department:</strong> {dept.headDoctorName}
                    </div>
                  )}

                  {dept.commonSymptoms && dept.commonSymptoms.length > 0 && (
                    <div className="mb-3">
                      <small className="text-muted d-block mb-1 fw-semibold">Primary Symptoms Handled:</small>
                      <div>
                        {dept.commonSymptoms.map((sym, idx) => (
                          <span key={idx} className="badge-symptom">
                            {sym}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-top mt-auto d-flex justify-content-between align-items-center">
                    <span className="small text-muted">
                      <i className="bi bi-people-fill text-teal me-1"></i>
                      {dept.doctorCount || 1} Specialist(s)
                    </span>
                    <Link
                      to={`/doctors?departmentId=${dept._id}`}
                      className="btn btn-sm btn-hospital-primary"
                    >
                      Find Specialists <i className="bi bi-arrow-right ms-1"></i>
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

export default Departments;
