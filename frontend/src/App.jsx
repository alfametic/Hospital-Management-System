import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Navbar from './components/common/Navbar';
import Footer from './components/common/Footer';
import Home from './pages/public/Home';
import About from './pages/public/About';
import Departments from './pages/public/Departments';
import Doctors from './pages/public/Doctors';
import Services from './pages/public/Services';
import Contact from './pages/public/Contact';
import AIDepartmentTriage from './pages/public/AIDepartmentTriage';
import PatientVerify from './pages/public/PatientVerify';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ProtectedRoute from './components/common/ProtectedRoute';
import PatientDashboard from './pages/patient/PatientDashboard';
import BookAppointment from './pages/patient/BookAppointment';
import DoctorDashboard from './pages/doctor/DoctorDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import { useAuth } from './context/AuthContext';

// Temporary Portal Preview component for Phase 2
const PortalPreview = ({ title, roleRequired, nextPhaseDescription }) => {
  const { user, profile } = useAuth();

  return (
    <div className="py-5" style={{ minHeight: '70vh' }}>
      <div className="container">
        <div className="bg-white p-5 rounded-4 border shadow-sm text-center" style={{ maxWidth: '700px', margin: '0 auto' }}>
          <div
            className="rounded-circle bg-light-blue text-navy d-flex align-items-center justify-content-center mx-auto mb-3"
            style={{ width: '64px', height: '64px' }}
          >
            <i className="bi bi-person-check-fill fs-2 text-teal"></i>
          </div>
          <h3 className="fw-bold text-navy mb-2">{title}</h3>
          <p className="text-muted small mb-3">
            Authenticated successfully as <strong>{user?.name}</strong> ({user?.role}).
          </p>

          {profile?.patientCode && (
            <div className="bg-light p-3 rounded-3 mb-4 d-inline-block border">
              <span className="small text-muted d-block">Patient Identification Code:</span>
              <span className="fs-4 fw-bold text-teal">{profile.patientCode}</span>
            </div>
          )}

          <div className="alert alert-info border-0 rounded-3 text-start small mb-4">
            <i className="bi bi-info-circle-fill me-2"></i>
            <strong>Phase 2 Implementation Active:</strong> {nextPhaseDescription}
          </div>

          <div className="d-flex justify-content-center gap-3">
            <Link to="/" className="btn btn-hospital-primary px-4 py-2">
              <i className="bi bi-house-door me-2"></i> Return to Homepage
            </Link>
            <Link to="/doctors" className="btn btn-hospital-outline px-4 py-2">
              Browse Doctors
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// 404 Not Found Page
const NotFound = () => (
  <div className="py-5 text-center" style={{ minHeight: '60vh' }}>
    <div className="container">
      <div className="fs-1 text-teal fw-bold mb-2">404</div>
      <h2 className="fw-bold text-navy mb-3">Page Not Found</h2>
      <p className="text-muted mb-4">
        The clinical route or resource you are looking for does not exist in the hospital portal.
      </p>
      <Link to="/" className="btn btn-hospital-primary">
        Return to Home Page
      </Link>
    </div>
  </div>
);

function App() {
  return (
    <div className="d-flex flex-column min-vh-100">
      <Navbar />
      <main className="flex-grow-1">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/departments" element={<Departments />} />
          <Route path="/doctors" element={<Doctors />} />
          <Route path="/services" element={<Services />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/ai-triage" element={<AIDepartmentTriage />} />
          <Route path="/verify-patient" element={<PatientVerify />} />
          <Route path="/verify-patient/:patientCode" element={<PatientVerify />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Patient Portal Routes (Phase 3) */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <PatientDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/patient/book"
            element={
              <ProtectedRoute allowedRoles={['patient']}>
                <BookAppointment />
              </ProtectedRoute>
            }
          />

          {/* Doctor Portal Routes (Phase 4) */}
          <Route
            path="/doctor"
            element={
              <ProtectedRoute allowedRoles={['doctor']}>
                <DoctorDashboard />
              </ProtectedRoute>
            }
          />

          {/* Admin Portal Routes (Phase 5) */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
