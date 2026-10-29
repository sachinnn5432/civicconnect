import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Mail, Phone, MapPin, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { register } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.password.length < 8) {
      setErrorMsg('Password must be at least 8 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const user = await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        password: formData.password
      });

      success(`Account created successfully! Welcome, ${user.name}`);
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="civic-container py-5" style={{ maxWidth: '520px' }}>
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
          style={{ width: '48px', height: '48px', backgroundColor: '#1F7A4C', color: '#FFFFFF' }}
        >
          <ShieldCheck size={26} />
        </div>
        <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>Citizen Portal Registration</h1>
        <p className="text-muted small">
          Create your verified citizen profile to submit grievances and track civic services
        </p>
      </div>

      <div className="civic-card p-4 shadow-sm mb-4">
        {errorMsg && (
          <div className="alert alert-danger py-2 px-3 small mb-3" role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label" htmlFor="regName">Full Legal Name</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted">
                <User size={16} />
              </span>
              <input
                id="regName"
                name="name"
                type="text"
                className="form-control"
                placeholder="e.g. Ramesh Kumar"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="regEmail">Email Address</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Mail size={16} />
                </span>
                <input
                  id="regEmail"
                  name="email"
                  type="email"
                  className="form-control"
                  placeholder="name@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="regPhone">Mobile Number</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Phone size={16} />
                </span>
                <input
                  id="regPhone"
                  name="phone"
                  type="tel"
                  className="form-control"
                  placeholder="+91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="regAddress">Residential Address / Ward Location</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted">
                <MapPin size={16} />
              </span>
              <input
                id="regAddress"
                name="address"
                type="text"
                className="form-control"
                placeholder="House/Flat No., Street, Sector/Ward"
                value={formData.address}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-text" style={{ fontSize: '0.75rem' }}>
              Used to associate your local municipal ward and zonal office.
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="regPassword">Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Lock size={16} />
                </span>
                <input
                  id="regPassword"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Min. 8 characters"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="regConfirmPassword">Confirm Password</label>
              <div className="input-group">
                <span className="input-group-text bg-white text-muted">
                  <Lock size={16} />
                </span>
                <input
                  id="regConfirmPassword"
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-check mb-3">
            <input
              className="form-check-input"
              type="checkbox"
              id="showPasswordCheck"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label className="form-check-label small text-muted" htmlFor="showPasswordCheck">
              Show password characters
            </label>
          </div>

          <button
            type="submit"
            className="btn-civic-accent w-100 justify-content-center py-2"
            disabled={loading}
          >
            {loading ? 'Creating Citizen Account...' : 'Complete Registration'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center mt-3 pt-3 border-top small text-muted">
          Already have an account?{' '}
          <Link to="/login" className="fw-semibold text-primary">
            Sign in here
          </Link>
        </div>
      </div>
    </div>
  );
}
