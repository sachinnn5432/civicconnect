import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileCheck,
  Building2,
  Users,
  FileSpreadsheet,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AdminSidebar() {
  const { user } = useAuth();

  return (
    <aside className="admin-sidebar d-none d-md-block">
      <div className="mb-3 px-2">
        <span className="text-uppercase small text-muted fw-bold" style={{ letterSpacing: '0.05em', fontSize: '0.7rem' }}>
          Operations Console
        </span>
      </div>

      <nav className="nav flex-column">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
          end
        >
          <LayoutDashboard size={18} />
          <span>Dashboard Overview</span>
        </NavLink>

        <NavLink
          to="/admin/complaints"
          className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileCheck size={18} />
          <span>Complaints Registry</span>
        </NavLink>

        <NavLink
          to="/admin/departments"
          className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Building2 size={18} />
          <span>Departments</span>
        </NavLink>

        <NavLink
          to="/admin/users"
          className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
        >
          <Users size={18} />
          <span>Citizen Directory</span>
        </NavLink>

        <NavLink
          to="/admin/reports"
          className={({ isActive }) => `admin-sidebar-link ${isActive ? 'active' : ''}`}
        >
          <FileSpreadsheet size={18} />
          <span>Reports & Export</span>
        </NavLink>
      </nav>

      <div className="mt-5 pt-3 border-top px-2">
        <div className="d-flex align-items-center gap-2 mb-1">
          <ShieldAlert size={16} className="text-primary" />
          <span className="small fw-semibold text-dark">{user?.name}</span>
        </div>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
          {user?.email}
        </div>
        <div className="badge bg-secondary-subtle text-secondary border small mt-1">
          Administrator
        </div>
      </div>
    </aside>
  );
}
