import React, { useState } from 'react';
import { User, Phone, MapPin, Mail, Lock, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { userApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';

export default function CitizenProfilePage() {
  const { user, updateUser } = useAuth();
  const { success, error: toastError } = useToast();

  // Profile Form State
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || ''
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Password Form State
  const [passData, setPassData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passLoading, setPassLoading] = useState(false);

  const handleProfileChange = (e) => {
    setProfileData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePassChange = (e) => {
    setPassData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    try {
      setProfileLoading(true);
      const res = await userApi.updateProfile(profileData);
      if (res.data?.success) {
        updateUser(res.data.data);
        success('Profile details updated successfully.');
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (passData.newPassword.length < 8) {
      toastError('New password must be at least 8 characters long.');
      return;
    }
    if (passData.newPassword !== passData.confirmPassword) {
      toastError('New passwords do not match.');
      return;
    }

    try {
      setPassLoading(true);
      const res = await userApi.changePassword({
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword
      });
      if (res.data?.success) {
        success('Password changed successfully.');
        setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="py-2" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="mb-4">
        <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
          Citizen Account Settings
        </h1>
        <p className="text-muted small">
          Manage your verified contact details and municipal portal credentials.
        </p>
      </div>

      <div className="row g-4">
        {/* Profile Card */}
        <div className="col-md-6">
          <div className="civic-card p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#19324D' }}>
              <User size={18} className="text-primary" /> Personal Information
            </h6>

            <form onSubmit={handleProfileSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="profName">Full Name</label>
                <input
                  id="profName"
                  name="name"
                  type="text"
                  className="form-control"
                  value={profileData.name}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="profEmail">Email Address</label>
                <input
                  id="profEmail"
                  type="email"
                  className="form-control bg-light"
                  value={user?.email || ''}
                  disabled
                />
                <span className="text-muted" style={{ fontSize: '0.7rem' }}>
                  Registered email identifier cannot be modified.
                </span>
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="profPhone">Mobile Phone</label>
                <input
                  id="profPhone"
                  name="phone"
                  type="tel"
                  className="form-control"
                  value={profileData.phone}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="profAddress">Residential Address / Ward</label>
                <textarea
                  id="profAddress"
                  name="address"
                  rows={2}
                  className="form-control"
                  value={profileData.address}
                  onChange={handleProfileChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-civic-primary w-100 justify-content-center"
                disabled={profileLoading}
              >
                {profileLoading ? 'Saving Changes...' : 'Save Profile Details'}
              </button>
            </form>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="col-md-6">
          <div className="civic-card p-4 h-100">
            <h6 className="fw-bold mb-3 d-flex align-items-center gap-2" style={{ color: '#19324D' }}>
              <Lock size={18} className="text-primary" /> Security & Password
            </h6>

            <form onSubmit={handlePasswordSubmit}>
              <div className="mb-3">
                <label className="form-label" htmlFor="currentPass">Current Password</label>
                <input
                  id="currentPass"
                  name="currentPassword"
                  type="password"
                  className="form-control"
                  placeholder="Enter current password"
                  value={passData.currentPassword}
                  onChange={handlePassChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label" htmlFor="newPass">New Password</label>
                <input
                  id="newPass"
                  name="newPassword"
                  type="password"
                  className="form-control"
                  placeholder="Min. 8 characters"
                  value={passData.newPassword}
                  onChange={handlePassChange}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label" htmlFor="confirmPass">Confirm New Password</label>
                <input
                  id="confirmPass"
                  name="confirmPassword"
                  type="password"
                  className="form-control"
                  placeholder="Confirm new password"
                  value={passData.confirmPassword}
                  onChange={handlePassChange}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn-civic-secondary w-100 justify-content-center"
                disabled={passLoading}
              >
                {passLoading ? 'Updating Password...' : 'Update Password'}
              </button>
            </form>

            <div className="mt-4 pt-3 border-top small text-muted">
              <div className="d-flex align-items-center gap-1.5 text-success mb-1">
                <ShieldCheck size={16} /> Verified Citizen Account
              </div>
              <div>Role: <strong className="text-dark">Citizen</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
