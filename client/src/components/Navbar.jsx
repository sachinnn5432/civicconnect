import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Bell,
  User,
  LogOut,
  PlusCircle,
  FileText,
  LayoutDashboard,
  Search,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';

export default function Navbar() {
  const { user, isAuthenticated, isAdmin, isCitizen, logout } = useAuth();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [showNotifs, setShowNotifs] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNotifClick = async (notif) => {
    if (!notif.is_read) {
      await markAsRead(notif.id);
    }
    setShowNotifs(false);
    if (notif.complaint_id) {
      navigate(`/complaints/${notif.complaint_id}`);
    }
  };

  return (
    <header>
      {/* Official Municipal Bar */}
      <div className="gov-top-bar">
        <div className="civic-container d-flex justify-content-between align-items-center">
          <span className="seal-text">
            Municipal Grievance Redressal Portal • Public Civic Services
          </span>
          <span className="d-none d-sm-inline">
            Helpline: <strong>1800-11-2026</strong> (Toll Free)
          </span>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="civic-navbar">
        <div className="civic-container d-flex align-items-center justify-content-between">
          <Link to="/" className="navbar-brand">
            <ShieldCheck size={26} className="text-white" />
            <div>
              <span>CivicConnect</span>
              <span className="brand-subtitle">Municipal Services Portal</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="d-none d-md-flex align-items-center gap-2">
            {!isAuthenticated && (
              <>
                <NavLink to="/" className="nav-link" end>Home</NavLink>
                <NavLink to="/track" className="nav-link">Track Complaint</NavLink>
                <Link to="/login" className="btn-civic-secondary btn-sm ms-2">
                  Sign In
                </Link>
                <Link to="/register" className="btn-civic-accent btn-sm">
                  Register
                </Link>
              </>
            )}

            {isAuthenticated && isCitizen && (
              <>
                <NavLink to="/dashboard" className="nav-link">
                  <LayoutDashboard size={15} className="me-1" />
                  Dashboard
                </NavLink>
                <NavLink to="/complaints/new" className="nav-link">
                  <PlusCircle size={15} className="me-1" />
                  Submit Complaint
                </NavLink>
                <NavLink to="/complaints/my" className="nav-link">
                  <FileText size={15} className="me-1" />
                  My Complaints
                </NavLink>
                <NavLink to="/track" className="nav-link">
                  <Search size={15} className="me-1" />
                  Track
                </NavLink>

                {/* Notifications Bell Dropdown */}
                <div className="position-relative ms-2">
                  <button
                    type="button"
                    className="btn btn-link text-white p-1 position-relative text-decoration-none"
                    onClick={() => setShowNotifs(!showNotifs)}
                    aria-label="Notifications"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.65rem' }}>
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {showNotifs && (
                    <div
                      className="position-absolute end-0 mt-2 p-0 shadow bg-white border rounded"
                      style={{ width: '320px', zIndex: 1050 }}
                    >
                      <div className="p-2.5 border-bottom bg-light d-flex justify-content-between align-items-center">
                        <span className="fw-semibold small text-dark">Notifications</span>
                        <Link
                          to="/notifications"
                          className="small text-primary"
                          onClick={() => setShowNotifs(false)}
                        >
                          View all
                        </Link>
                      </div>
                      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                        {notifications.length === 0 ? (
                          <div className="p-3 text-muted text-center small">No notifications yet.</div>
                        ) : (
                          notifications.slice(0, 5).map((notif) => (
                            <div
                              key={notif.id}
                              className={`p-2.5 border-bottom small cursor-pointer ${
                                !notif.is_read ? 'bg-light font-weight-medium' : ''
                              }`}
                              style={{ cursor: 'pointer' }}
                              onClick={() => handleNotifClick(notif)}
                            >
                              <div className="text-dark mb-1">{notif.message}</div>
                              <div className="text-muted" style={{ fontSize: '0.7rem' }}>
                                {new Date(notif.created_at).toLocaleDateString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Citizen User Dropdown */}
                <div className="dropdown ms-2">
                  <button
                    className="btn-civic-secondary btn-sm dropdown-toggle d-flex align-items-center gap-1.5"
                    type="button"
                    data-bs-toggle="dropdown"
                    id="userDropdown"
                  >
                    <User size={15} />
                    <span>{user?.name?.split(' ')[0] || 'Account'}</span>
                  </button>
                  <ul className="dropdown-menu dropdown-menu-end shadow-sm" aria-labelledby="userDropdown">
                    <li className="px-3 py-1.5 border-bottom">
                      <div className="fw-semibold small text-dark">{user?.name}</div>
                      <div className="text-muted small text-truncate" style={{ maxWidth: '180px' }}>
                        {user?.email}
                      </div>
                    </li>
                    <li>
                      <Link className="dropdown-item small" to="/profile">
                        <User size={14} className="me-2 text-muted" /> Profile Settings
                      </Link>
                    </li>
                    <li>
                      <Link className="dropdown-item small" to="/notifications">
                        <Bell size={14} className="me-2 text-muted" /> Notifications
                      </Link>
                    </li>
                    <li><hr className="dropdown-divider my-1" /></li>
                    <li>
                      <button className="dropdown-item small text-danger" onClick={handleLogout}>
                        <LogOut size={14} className="me-2 text-danger" /> Sign Out
                      </button>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {isAuthenticated && isAdmin && (
              <>
                <span className="badge bg-light text-dark px-2.5 py-1 small fw-semibold me-2">
                  Municipal Staff Mode
                </span>
                <NavLink to="/admin/dashboard" className="nav-link">
                  <LayoutDashboard size={15} className="me-1" />
                  Admin Console
                </NavLink>
                <button
                  type="button"
                  className="btn-civic-secondary btn-sm ms-2"
                  onClick={handleLogout}
                >
                  <LogOut size={14} className="me-1" /> Sign Out
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            className="btn btn-link text-white d-md-none p-1"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="d-md-none bg-navy border-top border-secondary p-3 mt-2">
            {!isAuthenticated ? (
              <div className="d-flex flex-column gap-2">
                <Link to="/" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Home</Link>
                <Link to="/track" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Track Complaint</Link>
                <Link to="/login" className="btn-civic-secondary btn-sm text-center" onClick={() => setMobileMenuOpen(false)}>Sign In</Link>
                <Link to="/register" className="btn-civic-accent btn-sm text-center" onClick={() => setMobileMenuOpen(false)}>Register Citizen Account</Link>
              </div>
            ) : isCitizen ? (
              <div className="d-flex flex-column gap-2">
                <div className="text-white small pb-2 border-bottom">Signed in as <strong>{user?.name}</strong></div>
                <Link to="/dashboard" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/complaints/new" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Submit Complaint</Link>
                <Link to="/complaints/my" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>My Complaints</Link>
                <Link to="/track" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Track Complaint</Link>
                <Link to="/notifications" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>
                  Notifications ({unreadCount})
                </Link>
                <Link to="/profile" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Profile Settings</Link>
                <button className="btn-civic-outline-danger btn-sm text-start mt-2" onClick={handleLogout}>Sign Out</button>
              </div>
            ) : (
              <div className="d-flex flex-column gap-2">
                <div className="text-white small pb-2 border-bottom">Admin: <strong>{user?.name}</strong></div>
                <Link to="/admin/dashboard" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Dashboard</Link>
                <Link to="/admin/complaints" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Complaints</Link>
                <Link to="/admin/departments" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Departments</Link>
                <Link to="/admin/users" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Users</Link>
                <Link to="/admin/reports" className="text-white text-decoration-none py-1" onClick={() => setMobileMenuOpen(false)}>Reports & Export</Link>
                <button className="btn-civic-outline-danger btn-sm text-start mt-2" onClick={handleLogout}>Sign Out</button>
              </div>
            )}
          </div>
        )}
      </nav>
    </header>
  );
}
