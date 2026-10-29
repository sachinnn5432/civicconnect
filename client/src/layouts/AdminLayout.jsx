import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import AdminSidebar from '../components/AdminSidebar.jsx';

export default function AdminLayout() {
  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <div className="d-flex flex-grow-1">
        <AdminSidebar />
        <main className="flex-grow-1 p-3 p-md-4 overflow-auto" style={{ maxWidth: 'calc(100vw - 250px)' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
