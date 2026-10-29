import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: inject JWT from localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hms_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: format error messages
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized token, clear saved token
      if (localStorage.getItem('hms_token')) {
        localStorage.removeItem('hms_token');
        localStorage.removeItem('hms_user');
        localStorage.removeItem('hms_profile');
      }
    }
    const message =
      (error.response && error.response.data && error.response.data.message) ||
      error.message ||
      'An unexpected network error occurred.';
    return Promise.reject(new Error(message));
  }
);

// Specific API Services
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  registerPatient: (patientData) => api.post('/auth/register-patient', patientData),
  getMe: () => api.get('/auth/me'),
  getMyQR: () => api.get('/auth/my-qr'),
  verifyPatient: (patientCode) => api.get(`/auth/verify-patient/${patientCode}`),
  updateProfile: (data) => api.put('/auth/update-profile', data)
};

export const departmentAPI = {
  getAll: () => api.get('/departments'),
  getById: (id) => api.get(`/departments/${id}`)
};

export const doctorAPI = {
  getAll: (params) => api.get('/doctors', { params }),
  getById: (id) => api.get(`/doctors/${id}`),
  getMyProfile: () => api.get('/doctors/me/profile'),
  getMyAppointments: (params) => api.get('/doctors/me/appointments', { params }),
  updateSchedule: (data) => api.put('/doctors/me/schedule', data),
  lookupPatientByCode: (patientCode) => api.get(`/doctors/lookup-patient/${patientCode}`)
};

export const appointmentAPI = {
  book: (data) => api.post('/appointments', data),
  getMyAppointments: () => api.get('/appointments/my-appointments'),
  cancel: (id, reason) => api.put(`/appointments/${id}/cancel`, { reason }),
  getBookedSlots: (doctorId, date) => api.get('/appointments/booked-slots', { params: { doctorId, date } })
};

export const medicalRecordAPI = {
  getMyRecords: () => api.get('/records/my-records'),
  getById: (id) => api.get(`/records/${id}`),
  createRecord: (data) => api.post('/records', data)
};

export const adminAPI = {
  getMetrics: () => api.get('/admin/metrics'),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  toggleDepartmentStatus: (id) => api.patch(`/admin/departments/${id}/toggle-status`),
  getDoctors: () => api.get('/admin/doctors'),
  createDoctor: (data) => api.post('/doctors', data),
  updateDoctor: (id, data) => api.put(`/admin/doctors/${id}`, data),
  getAppointments: (params) => api.get('/admin/appointments', { params }),
  updateAppointmentStatus: (id, data) => api.patch(`/admin/appointments/${id}/status`, data),
  getPatients: (params) => api.get('/admin/patients', { params })
};

export const aiAPI = {
  recommendDepartment: (formData) =>
    api.post('/ai/recommend-department', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
};

export default api;
