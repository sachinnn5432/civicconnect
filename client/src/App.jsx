import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { NotificationProvider } from './context/NotificationContext.jsx';

// Layouts
import PublicLayout from './layouts/PublicLayout.jsx';
import CitizenLayout from './layouts/CitizenLayout.jsx';
import AdminLayout from './layouts/AdminLayout.jsx';

// Components
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public Pages
import HomePage from './pages/public/HomePage.jsx';
import TrackComplaintPage from './pages/public/TrackComplaintPage.jsx';
import LoginPage from './pages/public/LoginPage.jsx';
import RegisterPage from './pages/public/RegisterPage.jsx';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard.jsx';
import SubmitComplaintPage from './pages/citizen/SubmitComplaintPage.jsx';
import MyComplaintsPage from './pages/citizen/MyComplaintsPage.jsx';
import ComplaintDetailPage from './pages/citizen/ComplaintDetailPage.jsx';
import CitizenProfilePage from './pages/citizen/CitizenProfilePage.jsx';
import NotificationsPage from './pages/citizen/NotificationsPage.jsx';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminComplaintsPage from './pages/admin/AdminComplaintsPage.jsx';
import AdminComplaintDetailPage from './pages/admin/AdminComplaintDetailPage.jsx';
import AdminDepartmentsPage from './pages/admin/AdminDepartmentsPage.jsx';
import AdminUsersPage from './pages/admin/AdminUsersPage.jsx';
import AdminReportsPage from './pages/admin/AdminReportsPage.jsx';

import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <NotificationProvider>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/track" element={<TrackComplaintPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
              </Route>

              {/* Citizen Routes */}
              <Route
                element={
                  <ProtectedRoute role="citizen">
                    <CitizenLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<CitizenDashboard />} />
                <Route path="/complaints/new" element={<SubmitComplaintPage />} />
                <Route path="/complaints/my" element={<MyComplaintsPage />} />
                <Route path="/complaints/:id" element={<ComplaintDetailPage />} />
                <Route path="/profile" element={<CitizenProfilePage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
              </Route>

              {/* Administrator Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute role="admin">
                    <AdminLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="complaints" element={<AdminComplaintsPage />} />
                <Route path="complaints/:id" element={<AdminComplaintDetailPage />} />
                <Route path="departments" element={<AdminDepartmentsPage />} />
                <Route path="users" element={<AdminUsersPage />} />
                <Route path="reports" element={<AdminReportsPage />} />
              </Route>

              {/* 404 Catch-All */}
              <Route element={<PublicLayout />}>
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </NotificationProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}
