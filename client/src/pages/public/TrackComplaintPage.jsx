import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ShieldAlert, CheckCircle2, Clock, MapPin, Building2, AlertCircle } from 'lucide-react';
import { complaintApi } from '../../services/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import ComplaintTimeline from '../../components/ComplaintTimeline.jsx';

export default function TrackComplaintPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRef = searchParams.get('ref') || '';

  const [reference, setReference] = useState(initialRef);
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const performSearch = async (refNumber) => {
    if (!refNumber || !refNumber.trim()) return;
    setLoading(true);
    setError('');
    setComplaint(null);

    try {
      const res = await complaintApi.trackPublic(refNumber.trim());
      if (res.data?.success) {
        setComplaint(res.data.data.complaint);
      } else {
        setError(res.data?.message || 'Complaint not found.');
      }
    } catch (err) {
      setError(err.response?.data?.message || `No complaint found matching '${refNumber}'. Please verify your reference number.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialRef) {
      performSearch(initialRef);
    }
  }, [initialRef]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reference.trim()) {
      setSearchParams({ ref: reference.trim() });
      performSearch(reference.trim());
    }
  };

  return (
    <div className="civic-container py-5" style={{ maxWidth: '900px' }}>
      <div className="text-center mb-4">
        <h1 className="fs-3 fw-bold mb-2">Track Municipal Grievance</h1>
        <p className="text-muted">
          Check live case progress, departmental notes, and resolution status with your reference ID.
        </p>
      </div>

      {/* Search Input Box */}
      <div className="civic-card p-3 p-md-4 mb-4">
        <form onSubmit={handleSubmit} className="row g-2">
          <div className="col-md-9">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={18} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Enter complaint reference (e.g. CC-2026-00101)"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="col-md-3">
            <button
              type="submit"
              className="btn-civic-primary w-100 justify-content-center h-100"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Track Record'}
            </button>
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
          <AlertCircle size={18} />
          <div>{error}</div>
        </div>
      )}

      {/* Complaint Record Display */}
      {complaint && (
        <div className="civic-card mb-4">
          <div className="civic-card-header flex-wrap gap-2">
            <div>
              <span className="text-muted small text-uppercase fw-semibold d-block">
                Complaint Reference
              </span>
              <span className="fs-5 fw-bold text-dark">{complaint.reference_number}</span>
            </div>
            <div className="d-flex align-items-center gap-2">
              <PriorityBadge priority={complaint.priority} />
              <StatusBadge status={complaint.status} />
            </div>
          </div>

          <div className="civic-card-body">
            <div className="row g-3 mb-4">
              <div className="col-md-8">
                <h5 className="fw-semibold mb-2" style={{ color: '#19324D' }}>
                  {complaint.title}
                </h5>
                <p className="text-secondary small mb-3" style={{ whiteSpace: 'pre-line' }}>
                  {complaint.description}
                </p>

                <div className="d-flex flex-wrap gap-3 small text-muted">
                  <span className="d-flex align-items-center gap-1">
                    <MapPin size={15} /> {complaint.location}
                  </span>
                  <span className="d-flex align-items-center gap-1">
                    <Building2 size={15} /> {complaint.department_name || 'Department Allocation Pending'}
                  </span>
                </div>
              </div>

              <div className="col-md-4 border-start-md">
                <div className="bg-light p-3 rounded small">
                  <div className="mb-2">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Category</span>
                    <span className="fw-semibold text-dark">{complaint.category}</span>
                  </div>
                  <div className="mb-2">
                    <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Submitted On</span>
                    <span className="text-dark">
                      {new Date(complaint.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  {complaint.resolved_at && (
                    <div className="mb-2">
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Resolved On</span>
                      <span className="text-success fw-semibold">
                        {new Date(complaint.resolved_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {complaint.resolution_remarks && (
                    <div className="mt-2 pt-2 border-top">
                      <span className="text-muted d-block" style={{ fontSize: '0.75rem' }}>Official Remarks</span>
                      <span className="text-dark small">{complaint.resolution_remarks}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Public Progress Timeline */}
            <div className="border-top pt-4">
              <h6 className="fw-bold mb-3" style={{ color: '#19324D' }}>
                Case Progress & Action History
              </h6>
              <ComplaintTimeline timeline={complaint.timeline || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
