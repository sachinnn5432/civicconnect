import React from 'react';
import { ShieldCheck, Phone, Mail, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="civic-footer">
      <div className="civic-container">
        <div className="row g-4 mb-4">
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-2 text-white fw-bold fs-5">
              <ShieldCheck size={24} className="text-success" />
              <span>CivicConnect Portal</span>
            </div>
            <p className="text-secondary small mb-3">
              The official centralized grievance redressal and municipal complaint tracking system. Providing transparent, accountable, and time-bound public service resolution.
            </p>
            <div className="small text-secondary">
              <div className="d-flex align-items-center gap-2 mb-1">
                <MapPin size={15} /> Municipal Corporation HQ, Civic Center
              </div>
              <div className="d-flex align-items-center gap-2 mb-1">
                <Phone size={15} /> 1800-11-2026 (Toll Free 24x7)
              </div>
              <div className="d-flex align-items-center gap-2">
                <Mail size={15} /> support@civicconnect.gov
              </div>
            </div>
          </div>

          <div className="col-lg-2 col-md-3 col-6">
            <h6>Civic Services</h6>
            <ul className="list-unstyled small mb-0">
              <li className="mb-2"><Link to="/track">Track Status</Link></li>
              <li className="mb-2"><Link to="/complaints/new">Register Grievance</Link></li>
              <li className="mb-2"><Link to="/login">Citizen Login</Link></li>
              <li className="mb-2"><Link to="/register">New Registration</Link></li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-3 col-6">
            <h6>Municipal Departments</h6>
            <ul className="list-unstyled small mb-0 text-secondary">
              <li className="mb-1">Roads & Public Infrastructure</li>
              <li className="mb-1">Water Supply & Pipeline Works</li>
              <li className="mb-1">Electricity & Public Lighting</li>
              <li className="mb-1">Solid Waste & Sanitation</li>
              <li className="mb-1">Storm Water Drainage</li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-12">
            <h6>Citizen Service Charter</h6>
            <p className="small text-secondary mb-2">
              All grievances registered on CivicConnect are assigned a unique tracking number and routed directly to the designated nodal officer under statutory service level agreements (SLA).
            </p>
            <div className="p-2.5 rounded bg-dark border border-secondary text-secondary small">
              Emergency Escalation: Dial <strong>112</strong> for life safety or structural hazards.
            </div>
          </div>
        </div>

        <div className="pt-3 border-top border-secondary d-flex flex-column flex-sm-row justify-content-between align-items-center small text-secondary">
          <div>
            &copy; {new Date().getFullYear()} Municipal Corporation. All rights reserved.
          </div>
          <div className="mt-2 mt-sm-0">
            Civic Technology Initiative for Transparent Governance
          </div>
        </div>
      </div>
    </footer>
  );
}
