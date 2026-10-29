import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Eye, EyeOff, Lock, Mail, ArrowRight, UserCheck, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const { login } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTarget = location.state?.from?.pathname;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      const loggedInUser = await login(email, password);
      success(`Welcome back, ${loggedInUser.name}`);

      if (redirectTarget) {
        navigate(redirectTarget, { replace: true });
      } else if (loggedInUser.role === 'admin') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillCitizenDemo = () => {
    setEmail('rajesh.sharma@example.com');
    setPassword('Citizen@123!');
    setErrorMsg('');
  };

  const fillAdminDemo = () => {
    setEmail('admin@civicconnect.gov');
    setPassword('Admin@Civic2026!');
    setErrorMsg('');
  };

  return (
    <div className="civic-container py-5" style={{ maxWidth: '460px' }}>
      <div className="text-center mb-4">
        <div
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-2"
          style={{ width: '48px', height: '48px', backgroundColor: '#19324D', color: '#FFFFFF' }}
        >
          <ShieldCheck size={26} />
        </div>
        <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>Sign In to CivicConnect</h1>
        <p className="text-muted small">
          Access your citizen grievance dashboard or municipal staff console
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
            <label className="form-label" htmlFor="loginEmail">Email Address</label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted">
                <Mail size={16} />
              </span>
              <input
                id="loginEmail"
                type="email"
                className="form-control"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label mb-0" htmlFor="loginPassword">Password</label>
            </div>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted">
                <Lock size={16} />
              </span>
              <input
                id="loginPassword"
                type={showPassword ? 'text' : 'password'}
                className="form-control border-end-0"
                placeholder="Enter account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn btn-outline-secondary border-start-0 bg-white text-muted"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn-civic-primary w-100 justify-content-center py-2 mt-2"
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'} <ArrowRight size={16} />
          </button>
        </form>

        <div className="text-center mt-3 pt-3 border-top small text-muted">
          New citizen?{' '}
          <Link to="/register" className="fw-semibold text-primary">
            Register for a free account
          </Link>
        </div>
      </div>

      {/* 1-Click Evaluation Credentials Helper */}
      <div className="p-3 bg-white border rounded small">
        <span className="fw-semibold text-muted text-uppercase d-block mb-2" style={{ fontSize: '0.7rem', letterSpacing: '0.04em' }}>
          Demonstration / Evaluation Credentials
        </span>
        <div className="d-grid gap-2">
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-between text-start"
            onClick={fillCitizenDemo}
          >
            <span className="d-flex align-items-center gap-1.5 text-dark">
              <UserCheck size={14} className="text-success" />
              <span>Fill Citizen Demo</span>
            </span>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>rajesh.sharma@example.com</span>
          </button>

          <button
            type="button"
            className="btn btn-sm btn-outline-secondary d-flex align-items-center justify-content-between text-start"
            onClick={fillAdminDemo}
          >
            <span className="d-flex align-items-center gap-1.5 text-dark">
              <ShieldAlert size={14} className="text-primary" />
              <span>Fill Municipal Admin Demo</span>
            </span>
            <span className="text-muted" style={{ fontSize: '0.7rem' }}>admin@civicconnect.gov</span>
          </button>
        </div>
      </div>
    </div>
  );
}
