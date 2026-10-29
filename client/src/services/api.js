import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Attach JWT access token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civic_access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Automatic token refresh on 401
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (originalRequest.url.includes('/auth/login') || originalRequest.url.includes('/auth/refresh')) {
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('civic_refresh_token');
      if (!refreshToken) {
        isRefreshing = false;
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken });
        const newAccessToken = data.accessToken;
        localStorage.setItem('civic_access_token', newAccessToken);

        processQueue(null, newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem('civic_access_token');
        localStorage.removeItem('civic_refresh_token');
        localStorage.removeItem('civic_user');
        window.location.href = '/login?session=expired';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Auth Endpoints
export const authApi = {
  register: (payload) => api.post('/auth/register', payload),
  login: (payload) => api.post('/auth/login', payload),
  logout: () => {
    const refreshToken = localStorage.getItem('civic_refresh_token');
    return api.post('/auth/logout', { refreshToken }).finally(() => {
      localStorage.removeItem('civic_access_token');
      localStorage.removeItem('civic_refresh_token');
      localStorage.removeItem('civic_user');
    });
  },
  getMe: () => api.get('/auth/me')
};

// User Profile Endpoints
export const userApi = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (payload) => api.patch('/users/profile', payload),
  changePassword: (payload) => api.patch('/users/change-password', payload)
};

// Complaint Endpoints
export const complaintApi = {
  create: (formData) => api.post('/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getMyComplaints: (params) => api.get('/complaints/my', { params }),
  getById: (id) => api.get(`/complaints/${id}`),
  reopen: (id, payload) => api.post(`/complaints/${id}/reopen`, payload),
  trackPublic: (ref) => api.get(`/complaints/track/${encodeURIComponent(ref)}`)
};

// Notification Endpoints
export const notificationApi = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

// Admin Endpoints
export const adminApi = {
  getDashboard: () => api.get('/admin/dashboard'),
  getComplaints: (params) => api.get('/admin/complaints', { params }),
  getComplaintById: (id) => api.get(`/admin/complaints/${id}`),
  updateStatus: (id, payload) => api.patch(`/admin/complaints/${id}/status`, payload),
  assignDepartment: (id, payload) => api.patch(`/admin/complaints/${id}/assign`, payload),
  updatePriority: (id, payload) => api.patch(`/admin/complaints/${id}/priority`, payload),
  addRemarks: (id, payload) => api.post(`/admin/complaints/${id}/remarks`, payload),
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, payload) => api.patch(`/admin/users/${id}/status`, payload),
  getDepartments: () => api.get('/admin/departments'),
  createDepartment: (payload) => api.post('/admin/departments', payload),
  updateDepartment: (id, payload) => api.put(`/admin/departments/${id}`, payload),
  toggleDepartmentStatus: (id) => api.patch(`/admin/departments/${id}/status`),
  getReports: (params) => api.get('/admin/reports', { params }),
  getExportUrl: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return `/api/admin/reports/export${query ? `?${query}` : ''}`;
  }
};

// Public Stats Endpoint
export const publicApi = {
  getStats: () => api.get('/public/stats')
};

export default api;
