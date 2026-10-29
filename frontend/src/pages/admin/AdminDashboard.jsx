import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../api/client';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import AlertMessage from '../../components/common/AlertMessage';

const AdminDashboard = () => {
  const { user } = useAuth();

  // Active Tab: 'overview' | 'departments' | 'doctors' | 'appointments' | 'patients'
  const [activeTab, setActiveTab] = useState('overview');

  const [metrics, setMetrics] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search & Filter states
  const [patientSearch, setPatientSearch] = useState('');
  const [appointmentSearch, setAppointmentSearch] = useState('');
  const [appointmentStatusFilter, setAppointmentStatusFilter] = useState('');

  // Department Modal State (Create or Edit)
  const [deptModalOpen, setDeptModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptForm, setDeptForm] = useState({
    name: '',
    code: '',
    description: '',
    icon: 'bi-hospital',
    headDoctorName: '',
    commonSymptoms: ''
  });

  // Doctor Modal State (Create or Edit)
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState(null);
  const [docForm, setDocForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    departmentId: '',
    specialization: '',
    qualification: '',
    experienceYears: 5,
    consultationFee: 60,
    roomNumber: 'OPD-101',
    bio: '',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    isAcceptingAppointments: true
  });

  // Load all admin data
  const loadAdminData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [metricsRes, deptsRes, docsRes, apptsRes, patientsRes] = await Promise.all([
        adminAPI.getMetrics(),
        adminAPI.getDepartments(),
        adminAPI.getDoctors(),
        adminAPI.getAppointments(),
        adminAPI.getPatients()
      ]);

      setMetrics(metricsRes.data.data);
      setDepartments(deptsRes.data.data || []);
      setDoctors(docsRes.data.data || []);
      setAppointments(apptsRes.data.data || []);
      setPatients(patientsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load admin management data:', err);
      setError('Could not connect to hospital administration registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  // ------------------ Department Actions ------------------
  const handleOpenDeptModal = (dept = null) => {
    if (dept) {
      setEditingDept(dept);
      setDeptForm({
        name: dept.name,
        code: dept.code,
        description: dept.description,
        icon: dept.icon || 'bi-hospital',
        headDoctorName: dept.headDoctorName || '',
        commonSymptoms: dept.commonSymptoms?.join(', ') || ''
      });
    } else {
      setEditingDept(null);
      setDeptForm({
        name: '',
        code: '',
        description: '',
        icon: 'bi-hospital',
        headDoctorName: '',
        commonSymptoms: ''
      });
    }
    setDeptModalOpen(true);
  };

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...deptForm,
        commonSymptoms: deptForm.commonSymptoms
          ? deptForm.commonSymptoms.split(',').map((s) => s.trim())
          : []
      };

      if (editingDept) {
        await adminAPI.updateDepartment(editingDept._id, payload);
        setSuccess(`Department ${deptForm.name} updated successfully.`);
      } else {
        await adminAPI.createDepartment(payload);
        setSuccess(`Department ${deptForm.name} created successfully.`);
      }

      setDeptModalOpen(false);
      loadAdminData();
    } catch (err) {
      setError(err.message || 'Failed to save department.');
    }
  };

  const handleToggleDeptStatus = async (deptId) => {
    try {
      const res = await adminAPI.toggleDepartmentStatus(deptId);
      setSuccess(res.data.message);
      loadAdminData();
    } catch (err) {
      setError(err.message || 'Failed to update department status.');
    }
  };

  // ------------------ Doctor Actions ------------------
  const handleOpenDocModal = (doctor = null) => {
    if (doctor) {
      setEditingDoctor(doctor);
      setDocForm({
        name: doctor.userId?.name || '',
        email: doctor.userId?.email || '',
        password: '',
        phone: doctor.userId?.phone || '',
        departmentId: doctor.departmentId?._id || '',
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        experienceYears: doctor.experienceYears,
        consultationFee: doctor.consultationFee,
        roomNumber: doctor.roomNumber,
        bio: doctor.bio || '',
        availableDays: doctor.availableDays || [],
        isAcceptingAppointments: doctor.isAcceptingAppointments !== false
      });
    } else {
      setEditingDoctor(null);
      setDocForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        departmentId: departments[0]?._id || '',
        specialization: '',
        qualification: '',
        experienceYears: 5,
        consultationFee: 60,
        roomNumber: 'OPD-101',
        bio: '',
        availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        isAcceptingAppointments: true
      });
    }
    setDocModalOpen(true);
  };

  const handleDocSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingDoctor) {
        await adminAPI.updateDoctor(editingDoctor._id, docForm);
        setSuccess(`Doctor ${docForm.name} profile updated successfully.`);
      } else {
        if (!docForm.password || docForm.password.length < 6) {
          setError('Password must be at least 6 characters for new doctor.');
          return;
        }
        await adminAPI.createDoctor(docForm);
        setSuccess(`New physician ${docForm.name} onboarded successfully.`);
      }

      setDocModalOpen(false);
      loadAdminData();
    } catch (err) {
      setError(err.message || 'Failed to save doctor.');
    }
  };

  // ------------------ Appointment Actions ------------------
  const handleUpdateApptStatus = async (appointmentId, newStatus) => {
    try {
      await adminAPI.updateAppointmentStatus(appointmentId, {
        status: newStatus,
        doctorNotes: `Status updated to ${newStatus} by Hospital Administration.`
      });
      setSuccess(`Appointment status successfully changed to ${newStatus}.`);
      loadAdminData();
    } catch (err) {
      setError(err.message || 'Failed to update appointment status.');
    }
  };

  // Filtered lists
  const filteredAppointments = appointments.filter((a) => {
    const matchesStatus = !appointmentStatusFilter || a.status === appointmentStatusFilter;
    const s = appointmentSearch.toLowerCase();
    const matchesSearch =
      !appointmentSearch ||
      a.patientId?.userId?.name?.toLowerCase().includes(s) ||
      a.patientId?.patientCode?.toLowerCase().includes(s) ||
      a.doctorId?.userId?.name?.toLowerCase().includes(s) ||
      a.departmentId?.name?.toLowerCase().includes(s);
    return matchesStatus && matchesSearch;
  });

  const filteredPatients = patients.filter((p) => {
    const s = patientSearch.toLowerCase();
    return (
      !patientSearch ||
      p.patientCode?.toLowerCase().includes(s) ||
      p.userId?.name?.toLowerCase().includes(s) ||
      p.userId?.email?.toLowerCase().includes(s) ||
      p.userId?.phone?.includes(s) ||
      p.bloodGroup?.toLowerCase().includes(s)
    );
  });

  if (loading) {
    return <LoadingSpinner message="Loading hospital administrative registry..." />;
  }

  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="py-4 bg-light" style={{ minHeight: '85vh' }}>
      <div className="container">
        {/* Header Profile Banner */}
        <div className="bg-white p-4 p-md-5 rounded-4 border shadow-sm mb-4">
          <div className="row align-items-center g-4">
            <div className="col-md-8">
              <div className="d-flex align-items-center gap-2 mb-2">
                <span className="badge bg-danger text-white px-3 py-1">
                  <i className="bi bi-shield-lock-fill me-1"></i> HOSPITAL CHIEF ADMINISTRATOR
                </span>
                <span className="badge bg-light-blue text-navy border px-2 py-1">
                  St. Jude Metropolitan Healthcare
                </span>
              </div>
              <h2 className="fw-bold text-navy mb-1">{user?.name}</h2>
              <div className="text-muted small d-flex flex-wrap gap-3">
                <span>
                  <i className="bi bi-envelope text-teal me-1"></i> {user?.email}
                </span>
                <span>
                  <i className="bi bi-geo-alt-fill text-teal me-1"></i> Main Executive Wing, 5th Floor
                </span>
                <span>
                  <i className="bi bi-database-check text-success me-1"></i> MongoDB Instance: Active
                </span>
              </div>
            </div>

            <div className="col-md-4 text-md-end d-flex flex-wrap gap-2 justify-content-md-end">
              <button
                className="btn btn-hospital-teal py-2 px-3 fw-semibold shadow-sm"
                onClick={() => handleOpenDocModal()}
              >
                <i className="bi bi-person-plus-fill me-1"></i> Onboard Doctor
              </button>
              <button
                className="btn btn-hospital-primary py-2 px-3 fw-semibold shadow-sm"
                onClick={() => handleOpenDeptModal()}
              >
                <i className="bi bi-plus-circle me-1"></i> Add Department
              </button>
            </div>
          </div>
        </div>

        {/* Executive Summary Metrics */}
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-navy">{metrics?.counts?.patients || 0}</div>
              <div className="text-muted small">Registered Patients</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-teal">{metrics?.counts?.doctors || 0}</div>
              <div className="text-muted small">Specialist Doctors</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-navy">{metrics?.counts?.departments || 0}</div>
              <div className="text-muted small">Clinical Departments</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="bg-white p-3 rounded-3 border text-center shadow-sm">
              <div className="fs-3 fw-bold text-success">
                {metrics?.counts?.appointments || 0}
              </div>
              <div className="text-muted small">Total Consultations</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white p-2 rounded-3 border shadow-sm mb-4">
          <ul className="nav nav-pills nav-fill">
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'overview' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('overview')}
              >
                <i className="bi bi-grid-fill me-2"></i> Overview
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'departments' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('departments')}
              >
                <i className="bi bi-hospital me-2"></i> Departments ({departments.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'doctors' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('doctors')}
              >
                <i className="bi bi-person-badge-fill me-2"></i> Doctors ({doctors.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'appointments' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('appointments')}
              >
                <i className="bi bi-calendar-event me-2"></i> Appointments ({appointments.length})
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link fw-semibold ${activeTab === 'patients' ? 'active bg-navy text-white' : 'text-navy'}`}
                onClick={() => setActiveTab('patients')}
              >
                <i className="bi bi-people-fill me-2"></i> Patient Directory ({patients.length})
              </button>
            </li>
          </ul>
        </div>

        {error && <AlertMessage type="danger" message={error} onClose={() => setError(null)} />}
        {success && <AlertMessage type="success" message={success} onClose={() => setSuccess(null)} />}

        {/* ------------------ TAB 1: OVERVIEW ------------------ */}
        {activeTab === 'overview' && (
          <div>
            <div className="row g-4 mb-4">
              {/* Consultation Status Breakdown */}
              <div className="col-lg-6">
                <div className="card-healthcare p-4 bg-white border h-100">
                  <h5 className="fw-bold text-navy mb-3">Consultation Status Breakdown</h5>
                  <div className="row g-3 text-center">
                    <div className="col-4">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="fs-4 fw-bold text-success">{metrics?.counts?.confirmed || 0}</div>
                        <div className="text-muted small">Confirmed</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="fs-4 fw-bold text-primary">{metrics?.counts?.completed || 0}</div>
                        <div className="text-muted small">Completed</div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div className="p-3 bg-light rounded-3 border">
                        <div className="fs-4 fw-bold text-secondary">{metrics?.counts?.cancelled || 0}</div>
                        <div className="text-muted small">Cancelled</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Patient Registrations */}
              <div className="col-lg-6">
                <div className="card-healthcare p-4 bg-white border h-100">
                  <h5 className="fw-bold text-navy mb-3">Recently Registered Patients</h5>
                  <div className="table-responsive">
                    <table className="table table-sm align-middle mb-0 small">
                      <thead className="table-light">
                        <tr>
                          <th>Patient Name</th>
                          <th>Opaque Identifier</th>
                          <th>Blood</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics?.recentPatients?.map((p) => (
                          <tr key={p._id}>
                            <td className="fw-bold text-navy">{p.userId?.name}</td>
                            <td>
                              <span className="badge bg-light text-navy border">{p.patientCode}</span>
                            </td>
                            <td>
                              <span className="text-danger fw-semibold">{p.bloodGroup}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Appointments */}
            <div className="card-healthcare p-4 bg-white border">
              <h5 className="fw-bold text-navy mb-3">Recent Hospital Appointments</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0 small">
                  <thead className="table-light">
                    <tr>
                      <th>Patient</th>
                      <th>Physician</th>
                      <th>Department</th>
                      <th>Date</th>
                      <th>Time</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {metrics?.recentAppointments?.map((a) => (
                      <tr key={a._id}>
                        <td className="fw-bold text-navy">{a.patientId?.userId?.name || 'Patient'}</td>
                        <td>{a.doctorId?.userId?.name || 'Physician'}</td>
                        <td>
                          <span className="badge badge-dept">{a.departmentId?.name}</span>
                        </td>
                        <td>{new Date(a.appointmentDate).toLocaleDateString()}</td>
                        <td className="text-teal fw-semibold">{a.timeSlot}</td>
                        <td>
                          <span
                            className={`badge text-capitalize ${
                              a.status === 'confirmed'
                                ? 'bg-success'
                                : a.status === 'completed'
                                ? 'bg-primary'
                                : 'bg-secondary'
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ------------------ TAB 2: DEPARTMENTS ------------------ */}
        {activeTab === 'departments' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-navy mb-0">Clinical Departments Registry</h5>
              <button className="btn btn-sm btn-hospital-primary" onClick={() => handleOpenDeptModal()}>
                <i className="bi bi-plus-lg me-1"></i> Add Department
              </button>
            </div>

            <div className="table-responsive bg-white rounded-3 border shadow-sm">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Department</th>
                    <th>Code</th>
                    <th>Head Physician</th>
                    <th>Specialists</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept._id}>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <i className={`bi ${dept.icon || 'bi-hospital'} text-teal fs-5`}></i>
                          <div>
                            <strong className="text-navy d-block">{dept.name}</strong>
                            <small className="text-muted text-truncate d-inline-block" style={{ maxWidth: '280px' }}>
                              {dept.description}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-navy border">{dept.code}</span>
                      </td>
                      <td>{dept.headDoctorName || 'Not Assigned'}</td>
                      <td>
                        <span className="badge bg-light text-teal border fw-bold">
                          {dept.doctorCount} Doctors
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${dept.isActive ? 'bg-success' : 'bg-danger'}`}>
                          {dept.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-xs btn-outline-primary py-1 px-2 me-1"
                          onClick={() => handleOpenDeptModal(dept)}
                        >
                          <i className="bi bi-pencil me-1"></i> Edit
                        </button>
                        <button
                          className={`btn btn-xs ${dept.isActive ? 'btn-outline-danger' : 'btn-outline-success'} py-1 px-2`}
                          onClick={() => handleToggleDeptStatus(dept._id)}
                        >
                          {dept.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------ TAB 3: DOCTORS ------------------ */}
        {activeTab === 'doctors' && (
          <div>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="fw-bold text-navy mb-0">Physicians & Consultants Directory</h5>
              <button className="btn btn-sm btn-hospital-teal" onClick={() => handleOpenDocModal()}>
                <i className="bi bi-person-plus-fill me-1"></i> Onboard New Doctor
              </button>
            </div>

            <div className="table-responsive bg-white rounded-3 border shadow-sm">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Doctor Name</th>
                    <th>Department</th>
                    <th>Specialization & Qualification</th>
                    <th>Fee</th>
                    <th>Room</th>
                    <th>Appointments Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {doctors.map((doc) => (
                    <tr key={doc._id}>
                      <td>
                        <div className="fw-bold text-navy">{doc.userId?.name}</div>
                        <small className="text-muted">{doc.userId?.email}</small>
                      </td>
                      <td>
                        <span className="badge badge-dept">{doc.departmentId?.name || 'Department'}</span>
                      </td>
                      <td>
                        <div>{doc.specialization}</div>
                        <small className="text-muted">{doc.qualification}</small>
                      </td>
                      <td className="fw-bold text-teal">${doc.consultationFee}</td>
                      <td>{doc.roomNumber}</td>
                      <td>
                        <span className={`badge ${doc.isAcceptingAppointments ? 'bg-success' : 'bg-secondary'}`}>
                          {doc.isAcceptingAppointments ? 'Accepting' : 'Paused'}
                        </span>
                      </td>
                      <td className="text-end">
                        <button
                          className="btn btn-xs btn-outline-primary py-1 px-3"
                          onClick={() => handleOpenDocModal(doc)}
                        >
                          <i className="bi bi-pencil me-1"></i> Edit Profile
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------ TAB 4: APPOINTMENTS ------------------ */}
        {activeTab === 'appointments' && (
          <div>
            {/* Filter Bar */}
            <div className="bg-white p-3 rounded-3 border shadow-sm mb-3">
              <div className="row g-2 align-items-center">
                <div className="col-md-6">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by patient name, code, doctor, or department..."
                      value={appointmentSearch}
                      onChange={(e) => setAppointmentSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <select
                    className="form-select form-select-sm"
                    value={appointmentStatusFilter}
                    onChange={(e) => setAppointmentStatusFilter(e.target.value)}
                  >
                    <option value="">All Statuses</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
                <div className="col-md-2 text-end">
                  <span className="small text-muted fw-semibold">
                    Count: {filteredAppointments.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="table-responsive bg-white rounded-3 border shadow-sm">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Patient</th>
                    <th>Physician</th>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Slot</th>
                    <th>Status</th>
                    <th className="text-end">Admin Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAppointments.map((appt) => (
                    <tr key={appt._id}>
                      <td>
                        <div className="fw-bold text-navy">{appt.patientId?.userId?.name || 'Patient'}</div>
                        <span className="badge bg-light text-navy border">
                          {appt.patientId?.patientCode || 'N/A'}
                        </span>
                      </td>
                      <td>{appt.doctorId?.userId?.name || 'Physician'}</td>
                      <td>
                        <span className="badge badge-dept">{appt.departmentId?.name}</span>
                      </td>
                      <td>{new Date(appt.appointmentDate).toLocaleDateString()}</td>
                      <td className="fw-semibold text-teal">{appt.timeSlot}</td>
                      <td>
                        <span
                          className={`badge text-capitalize ${
                            appt.status === 'confirmed'
                              ? 'bg-success'
                              : appt.status === 'completed'
                              ? 'bg-primary'
                              : 'bg-secondary'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </td>
                      <td className="text-end">
                        <div className="dropdown">
                          <button
                            className="btn btn-xs btn-outline-secondary dropdown-toggle"
                            type="button"
                            data-bs-toggle="dropdown"
                          >
                            Update
                          </button>
                          <ul className="dropdown-menu dropdown-menu-end small">
                            <li>
                              <button
                                className="dropdown-item text-success"
                                onClick={() => handleUpdateApptStatus(appt._id, 'confirmed')}
                              >
                                Mark Confirmed
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-primary"
                                onClick={() => handleUpdateApptStatus(appt._id, 'completed')}
                              >
                                Mark Completed
                              </button>
                            </li>
                            <li>
                              <button
                                className="dropdown-item text-danger"
                                onClick={() => handleUpdateApptStatus(appt._id, 'cancelled')}
                              >
                                Mark Cancelled
                              </button>
                            </li>
                          </ul>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------ TAB 5: PATIENTS ------------------ */}
        {activeTab === 'patients' && (
          <div>
            <div className="bg-white p-3 rounded-3 border shadow-sm mb-3">
              <div className="row g-2 align-items-center">
                <div className="col-md-6">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-white">
                      <i className="bi bi-search text-muted"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search patient by name, email, phone, or PAT-XXXX-XXXX..."
                      value={patientSearch}
                      onChange={(e) => setPatientSearch(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-md-6 text-end">
                  <span className="small text-muted fw-semibold">
                    Total Registered Patients: {filteredPatients.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="table-responsive bg-white rounded-3 border shadow-sm">
              <table className="table table-hover align-middle mb-0 small">
                <thead className="table-light">
                  <tr>
                    <th>Opaque Code</th>
                    <th>Patient Name</th>
                    <th>Email & Contact</th>
                    <th>Blood Group</th>
                    <th>Gender</th>
                    <th>Emergency Contact</th>
                    <th>Registration Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPatients.map((pat) => (
                    <tr key={pat._id}>
                      <td>
                        <span className="badge bg-navy text-white fw-bold">{pat.patientCode}</span>
                      </td>
                      <td className="fw-bold text-navy">{pat.userId?.name}</td>
                      <td>
                        <div>{pat.userId?.email}</div>
                        <small className="text-muted">{pat.userId?.phone || 'No phone'}</small>
                      </td>
                      <td>
                        <span className="text-danger fw-bold">{pat.bloodGroup || 'Unknown'}</span>
                      </td>
                      <td className="text-capitalize">{pat.gender}</td>
                      <td>
                        {pat.emergencyContact?.name ? (
                          <span>
                            {pat.emergencyContact.name} ({pat.emergencyContact.relation || 'Contact'})
                          </span>
                        ) : (
                          <span className="text-muted">None</span>
                        )}
                      </td>
                      <td>
                        {pat.createdAt
                          ? new Date(pat.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------ MODAL: CREATE / EDIT DEPARTMENT ------------------ */}
        {deptModalOpen && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(10, 37, 64, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-navy">
                    {editingDept ? 'Edit Clinical Department' : 'Create New Department'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setDeptModalOpen(false)}></button>
                </div>
                <form onSubmit={handleDeptSubmit}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-navy">Department Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        required
                        value={deptForm.name}
                        onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                        placeholder="e.g. Pulmonology"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-navy">Department Code (Uppercase)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm text-uppercase"
                        required
                        disabled={!!editingDept}
                        value={deptForm.code}
                        onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
                        placeholder="e.g. PULMO"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-navy">Bootstrap Icon Class</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={deptForm.icon}
                        onChange={(e) => setDeptForm({ ...deptForm, icon: e.target.value })}
                        placeholder="bi-lungs-fill or bi-hospital"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-navy">Head of Department</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={deptForm.headDoctorName}
                        onChange={(e) => setDeptForm({ ...deptForm, headDoctorName: e.target.value })}
                        placeholder="Dr. Full Name"
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-navy">Description</label>
                      <textarea
                        rows="3"
                        className="form-control form-control-sm"
                        required
                        value={deptForm.description}
                        onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                        placeholder="Scope of clinical care provided..."
                      ></textarea>
                    </div>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold text-navy">Common Symptoms (comma-separated)</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        value={deptForm.commonSymptoms}
                        onChange={(e) => setDeptForm({ ...deptForm, commonSymptoms: e.target.value })}
                        placeholder="Cough, Wheezing, Shortness of breath"
                      />
                    </div>
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDeptModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-sm btn-hospital-primary">
                      {editingDept ? 'Update Department' : 'Create Department'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* ------------------ MODAL: ONBOARD / EDIT DOCTOR ------------------ */}
        {docModalOpen && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(10, 37, 64, 0.5)' }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
              <div className="modal-content border-0 shadow-lg rounded-4">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold text-navy">
                    {editingDoctor ? `Edit Physician: ${editingDoctor.userId?.name}` : 'Onboard New Hospital Physician'}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setDocModalOpen(false)}></button>
                </div>
                <form onSubmit={handleDocSubmit}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-navy">Doctor Full Name</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          required
                          value={docForm.name}
                          onChange={(e) => setDocForm({ ...docForm, name: e.target.value })}
                          placeholder="Dr. Gregory House"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-navy">Email Address</label>
                        <input
                          type="email"
                          className="form-control form-control-sm"
                          required
                          disabled={!!editingDoctor}
                          value={docForm.email}
                          onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
                          placeholder="doctor@hospital.com"
                        />
                      </div>
                      {!editingDoctor && (
                        <div className="col-md-6">
                          <label className="form-label small fw-semibold text-navy">Initial Password</label>
                          <input
                            type="password"
                            className="form-control form-control-sm"
                            required
                            value={docForm.password}
                            onChange={(e) => setDocForm({ ...docForm, password: e.target.value })}
                            placeholder="At least 6 characters"
                          />
                        </div>
                      )}
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-navy">Phone Number</label>
                        <input
                          type="tel"
                          className="form-control form-control-sm"
                          value={docForm.phone}
                          onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })}
                          placeholder="+1 (555) 000-0000"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-navy">Assigned Department</label>
                        <select
                          className="form-select form-select-sm"
                          required
                          value={docForm.departmentId}
                          onChange={(e) => setDocForm({ ...docForm, departmentId: e.target.value })}
                        >
                          <option value="">-- Choose Department --</option>
                          {departments.map((dept) => (
                            <option key={dept._id} value={dept._id}>
                              {dept.name} ({dept.code})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-navy">Specialization</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          required
                          value={docForm.specialization}
                          onChange={(e) => setDocForm({ ...docForm, specialization: e.target.value })}
                          placeholder="Interventional Cardiology"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-navy">Academic Qualifications</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          required
                          value={docForm.qualification}
                          onChange={(e) => setDocForm({ ...docForm, qualification: e.target.value })}
                          placeholder="MD, DM, FACC"
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-navy">Experience (Years)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={docForm.experienceYears}
                          onChange={(e) => setDocForm({ ...docForm, experienceYears: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-md-3">
                        <label className="form-label small fw-semibold text-navy">Consultation Fee ($)</label>
                        <input
                          type="number"
                          min="0"
                          className="form-control form-control-sm"
                          value={docForm.consultationFee}
                          onChange={(e) => setDocForm({ ...docForm, consultationFee: Number(e.target.value) })}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-navy">OPD Consultation Room</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          value={docForm.roomNumber}
                          onChange={(e) => setDocForm({ ...docForm, roomNumber: e.target.value })}
                          placeholder="Room 302, 3rd Floor"
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label small fw-semibold text-navy d-block">Accepting Appointments?</label>
                        <div className="form-check form-switch mt-2">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={docForm.isAcceptingAppointments}
                            onChange={(e) => setDocForm({ ...docForm, isAcceptingAppointments: e.target.checked })}
                          />
                          <span className="small text-muted">
                            {docForm.isAcceptingAppointments ? 'Accepting Patients' : 'Paused'}
                          </span>
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-navy d-block">Available Practice Days:</label>
                        <div className="d-flex flex-wrap gap-2">
                          {allDays.map((day) => {
                            const isChecked = docForm.availableDays.includes(day);
                            return (
                              <button
                                key={day}
                                type="button"
                                className={`btn btn-xs ${isChecked ? 'btn-hospital-teal' : 'btn-outline-secondary'}`}
                                onClick={() => {
                                  const updated = isChecked
                                    ? docForm.availableDays.filter((d) => d !== day)
                                    : [...docForm.availableDays, day];
                                  setDocForm({ ...docForm, availableDays: updated });
                                }}
                              >
                                {day}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                      <div className="col-12">
                        <label className="form-label small fw-semibold text-navy">Physician Biography</label>
                        <textarea
                          rows="2"
                          className="form-control form-control-sm"
                          value={docForm.bio}
                          onChange={(e) => setDocForm({ ...docForm, bio: e.target.value })}
                          placeholder="Summary of professional background..."
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top">
                    <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setDocModalOpen(false)}>
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-sm btn-hospital-teal">
                      {editingDoctor ? 'Update Physician Profile' : 'Onboard Physician'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
