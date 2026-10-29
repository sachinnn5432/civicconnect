import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="civic-container text-center py-5">
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
        style={{ width: '64px', height: '64px', backgroundColor: '#FEE2E2', color: '#DC2626' }}
      >
        <ShieldAlert size={32} />
      </div>
      <h1 className="fs-3 fw-bold mb-2" style={{ color: '#19324D' }}>404 — Page Not Found</h1>
      <p className="text-muted small mb-4 mx-auto" style={{ maxWidth: '420px' }}>
        The municipal portal page you requested does not exist or may have been relocated under portal restructuring.
      </p>
      <Link to="/" className="btn-civic-primary">
        <ArrowLeft size={16} /> Return to Homepage
      </Link>
    </div>
  );
}
