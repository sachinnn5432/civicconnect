import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  Building2,
  FileText,
  ArrowRight,
  Droplets,
  Zap,
  Trash2,
  HelpCircle,
  AlertTriangle,
  Lightbulb,
  Compass
} from 'lucide-react';
import { publicApi } from '../../services/api.js';

export default function HomePage() {
  const [stats, setStats] = useState({
    totalComplaints: 0,
    resolvedComplaints: 0,
    activeComplaints: 0,
    departmentsCount: 7,
    avgResolutionDays: '2.5',
    resolutionRate: 0
  });
  const [trackRef, setTrackRef] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    publicApi.getStats()
      .then((res) => {
        if (res.data?.success) {
          setStats(res.data.data);
        }
      })
      .catch((err) => console.warn('Could not load public stats:', err.message));
  }, []);

  const handleTrackSubmit = (e) => {
    e.preventDefault();
    if (trackRef.trim()) {
      navigate(`/track?ref=${encodeURIComponent(trackRef.trim())}`);
    }
  };

  const categories = [
    { title: 'Roads & Potholes', icon: Compass, dept: 'Roads & Infrastructure', desc: 'Potholes, broken footpaths, road signage' },
    { title: 'Water Supply', icon: Droplets, dept: 'Water Supply & Sewerage', desc: 'Pipeline leaks, low pressure, contamination' },
    { title: 'Electricity & Lighting', icon: Zap, dept: 'Electricity & Streetlighting', desc: 'Non-functional streetlights, pole hazards' },
    { title: 'Sanitation & Waste', icon: Trash2, dept: 'Sanitation & Solid Waste', desc: 'Garbage dumpsters, road sweeping, dumping' },
    { title: 'Storm Drainage', icon: AlertTriangle, dept: 'Storm Water & Drainage', desc: 'Monsoon waterlogging, open manholes' },
    { title: 'Public Safety', icon: ShieldCheck, dept: 'Public Safety & Health', desc: 'Stray animal control, structural hazards' }
  ];

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5" style={{ backgroundColor: '#122438', color: '#FFFFFF', borderBottom: '1px solid #1E3A5F' }}>
        <div className="civic-container py-4">
          <div className="row align-items-center g-4">
            <div className="col-lg-7">
              <span className="badge bg-success-subtle text-success border border-success-subtle px-2.5 py-1 mb-3 text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                Official Municipal Grievance Redressal
              </span>
              <h1 className="display-6 fw-bold mb-3 text-white" style={{ letterSpacing: '-0.02em', lineHeight: '1.2' }}>
                Transparent Civic Grievance Management for All Citizens
              </h1>
              <p className="lead text-light opacity-90 mb-4" style={{ fontSize: '1.05rem', maxWidth: '620px' }}>
                CivicConnect empowers residents to report municipal issues, monitor field action in real-time, and hold local departments accountable through verifiable service SLAs.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/complaints/new" className="btn-civic-accent px-4 py-2 text-white">
                  Register a Complaint <ArrowRight size={16} />
                </Link>
                <Link to="/track" className="btn-civic-secondary px-4 py-2">
                  Track Existing Case
                </Link>
              </div>
            </div>

            {/* Quick Track Box */}
            <div className="col-lg-5">
              <div className="civic-card p-4 shadow-sm border-0" style={{ backgroundColor: '#FFFFFF' }}>
                <h6 className="fw-bold mb-1" style={{ color: '#19324D' }}>
                  Track Your Complaint Status
                </h6>
                <p className="text-muted small mb-3">
                  Enter your 14-character complaint reference number (e.g., CC-2026-00101)
                </p>
                <form onSubmit={handleTrackSubmit}>
                  <div className="input-group mb-3">
                    <span className="input-group-text bg-light text-muted border-end-0">
                      <Search size={16} />
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="e.g. CC-2026-00101"
                      value={trackRef}
                      onChange={(e) => setTrackRef(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn-civic-primary w-100 justify-content-center">
                    Check Status
                  </button>
                </form>
                <div className="mt-3 pt-3 border-top small text-muted d-flex justify-content-between">
                  <span>Sample: <strong className="text-dark">CC-2026-00101</strong></span>
                  <Link to="/track" className="text-decoration-underline text-muted">Advanced Search</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Real Live Database Metrics Bar */}
      <section className="py-4 bg-white border-bottom">
        <div className="civic-container">
          <div className="row g-3 text-center">
            <div className="col-md-3 col-6">
              <div className="border-end-md py-2">
                <div className="fs-3 fw-bold text-dark">{stats.totalComplaints}</div>
                <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  Total Grievances Registered
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="border-end-md py-2">
                <div className="fs-3 fw-bold text-success">{stats.resolvedComplaints}</div>
                <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  Cases Resolved ({stats.resolutionRate}%)
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="border-end-md py-2">
                <div className="fs-3 fw-bold text-primary">{stats.avgResolutionDays} Days</div>
                <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  Avg. Resolution Time
                </div>
              </div>
            </div>
            <div className="col-md-3 col-6">
              <div className="py-2">
                <div className="fs-3 fw-bold" style={{ color: '#19324D' }}>{stats.departmentsCount}</div>
                <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.75rem' }}>
                  Integrated Departments
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="py-5">
        <div className="civic-container">
          <div className="text-center mb-4">
            <h2 className="fs-3 fw-bold mb-2">Municipal Service Categories</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '580px' }}>
              Complaints are routed straight to the respective zonal engineering desk and tracked against statutory service level agreements.
            </p>
          </div>

          <div className="row g-3">
            {categories.map((cat, idx) => {
              const IconComp = cat.icon;
              return (
                <div key={idx} className="col-lg-4 col-md-6">
                  <div className="civic-card h-100 p-3 hover-shadow transition">
                    <div className="d-flex align-items-start gap-3">
                      <div
                        className="rounded p-2 d-flex align-items-center justify-content-center"
                        style={{ backgroundColor: '#F1F5F9', color: '#19324D', minWidth: '42px', height: '42px' }}
                      >
                        <IconComp size={20} />
                      </div>
                      <div>
                        <h6 className="fw-semibold mb-1" style={{ color: '#19324D' }}>{cat.title}</h6>
                        <p className="text-muted small mb-2">{cat.desc}</p>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          Assigned to: <span className="fw-medium text-dark">{cat.dept}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-5 bg-white border-top border-bottom">
        <div className="civic-container">
          <div className="text-center mb-4">
            <h2 className="fs-3 fw-bold mb-2">How Municipal Resolution Works</h2>
            <p className="text-muted mx-auto" style={{ maxWidth: '580px' }}>
              A 4-step transparent case management lifecycle from registration to on-site closure.
            </p>
          </div>

          <div className="row g-4">
            <div className="col-md-3 col-sm-6">
              <div className="text-center p-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '48px', height: '48px', backgroundColor: '#E2E8F0', color: '#19324D', fontWeight: 'bold' }}
                >
                  1
                </div>
                <h6 className="fw-semibold mb-1">Citizen Submits</h6>
                <p className="text-muted small">
                  Fill the grievance form with location, photos, and contact info. Instant unique reference number generated.
                </p>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="text-center p-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '48px', height: '48px', backgroundColor: '#E2E8F0', color: '#19324D', fontWeight: 'bold' }}
                >
                  2
                </div>
                <h6 className="fw-semibold mb-1">Zonal Desk Review</h6>
                <p className="text-muted small">
                  Operations desk verifies jurisdiction and assigns task to the concerned nodal department officer.
                </p>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="text-center p-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '48px', height: '48px', backgroundColor: '#E2E8F0', color: '#19324D', fontWeight: 'bold' }}
                >
                  3
                </div>
                <h6 className="fw-semibold mb-1">Field Crew Deployed</h6>
                <p className="text-muted small">
                  Field engineers and sanitation workers inspect on-site and execute necessary repairs or clearing.
                </p>
              </div>
            </div>

            <div className="col-md-3 col-sm-6">
              <div className="text-center p-3">
                <div
                  className="rounded-circle d-inline-flex align-items-center justify-content-center mb-3"
                  style={{ width: '48px', height: '48px', backgroundColor: '#D1FAE5', color: '#065F46', fontWeight: 'bold' }}
                >
                  4
                </div>
                <h6 className="fw-semibold mb-1">Verified Resolution</h6>
                <p className="text-muted small">
                  Official remarks recorded. Citizen receives SMS/in-app alert and retains statutory right to reopen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section className="py-5">
        <div className="civic-container" style={{ maxWidth: '850px' }}>
          <div className="text-center mb-4">
            <h2 className="fs-3 fw-bold mb-2">Frequently Asked Questions</h2>
            <p className="text-muted">Standard procedures and timelines for municipal grievance redressal.</p>
          </div>

          <div className="accordion civic-card p-2 border-0 shadow-sm" id="faqAccordion">
            <div className="accordion-item border-0 border-bottom">
              <h2 className="accordion-header" id="faq1Heading">
                <button className="accordion-button collapsed fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faq1">
                  How can I track the progress of my complaint?
                </button>
              </h2>
              <div id="faq1" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body text-secondary small">
                  You can track your complaint anytime without logging in by visiting the <strong>Track Complaint</strong> page and entering your reference number (e.g., CC-2026-00101). If you are registered, all your submitted grievances appear in your personal Citizen Dashboard with real-time progress history.
                </div>
              </div>
            </div>

            <div className="accordion-item border-0 border-bottom">
              <h2 className="accordion-header" id="faq2Heading">
                <button className="accordion-button collapsed fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faq2">
                  What is the standard turnaround time for resolving complaints?
                </button>
              </h2>
              <div id="faq2" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body text-secondary small">
                  Turnaround times depend on the issue category and priority. Urgent issues like major water pipeline ruptures or open manholes are targeted for on-site action within 24 to 48 hours. Routine repairs such as streetlight cluster replacement or non-emergency road patching typically resolve within 3 to 7 working days.
                </div>
              </div>
            </div>

            <div className="accordion-item border-0 border-bottom">
              <h2 className="accordion-header" id="faq3Heading">
                <button className="accordion-button collapsed fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faq3">
                  What if a complaint is marked resolved but the work was incomplete?
                </button>
              </h2>
              <div id="faq3" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body text-secondary small">
                  Citizens have the statutory option to <strong>Reopen</strong> any resolved or rejected complaint directly from the Complaint Details screen by providing a brief reason. Reopening triggers an immediate notification to the zonal supervisor for review.
                </div>
              </div>
            </div>

            <div className="accordion-item border-0">
              <h2 className="accordion-header" id="faq4Heading">
                <button className="accordion-button collapsed fw-semibold text-dark" type="button" data-bs-toggle="collapse" data-bs-target="#faq4">
                  Can other citizens view my private contact details?
                </button>
              </h2>
              <div id="faq4" className="accordion-collapse collapse" data-bs-parent="#faqAccordion">
                <div className="accordion-body text-secondary small">
                  No. CivicConnect strictly safeguards citizen privacy. Public tracking views display only the complaint title, reference number, department, and timeline. Private personal contact numbers and residential addresses are visible solely to authorized municipal officials.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
