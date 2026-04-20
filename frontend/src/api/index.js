import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 15000,
});

// Attach JWT from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sp_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-logout on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('sp_token');
      localStorage.removeItem('sp_user');
      window.dispatchEvent(new Event('sp:logout'));
    }
    return Promise.reject(err);
  }
);

// ── Auth ──
export const authAPI = {
  register:   (data) => api.post('/auth/register', data),
  login:      (data) => api.post('/auth/login', data),
  googleAuth: (idToken) => api.post('/auth/google', { idToken }),
  getMe:      () => api.get('/auth/me'),
};

// ── Parking ──
export const parkingAPI = {
  getNearby: (params) => api.get('/parking', { params }),
  getOne:    (id) => api.get(`/parking/${id}`),
  getMine:   () => api.get('/parking/mine'),
  create:    (data) => api.post('/parking', data),
  update:    (id, data) => api.put(`/parking/${id}`, data),
  remove:    (id) => api.delete(`/parking/${id}`),
  verify:    (id) => api.patch(`/parking/${id}/verify`),
};

// ── Bookings ──
export const bookingAPI = {
  create:    (data) => api.post('/bookings', data),
  getMine:   () => api.get('/bookings/mine'),
  getOne:    (id) => api.get(`/bookings/${id}`),
  cancel:    (id) => api.patch(`/bookings/${id}/cancel`),
  getEarnings: () => api.get('/bookings/earnings'),
};

// ── Users ──
export const userAPI = {
  getProfile:     () => api.get('/users/profile'),
  updateProfile:  (data) => api.patch('/users/profile', data),
  changePassword: (data) => api.patch('/users/change-password', data),
};

export default api;
