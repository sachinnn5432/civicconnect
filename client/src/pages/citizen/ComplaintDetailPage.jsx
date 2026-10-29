import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  FileCheck,
  Download,
  Eye,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Paperclip
} from 'lucide-react';
import { complaintApi } from '../../services/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import ComplaintTimeline from '../../components/ComplaintTimeline.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

export default function ComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Reopen State
  const [reopenModalOpen, setReopenModalOpen] = useState(false);
  const [reopenReason, setReopenReason] = useState('');
  const [reopenLoading, setReopenLoading] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchComplaintDetails = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await complaintApi.getById(id);
      if (res.data?.success) {
        setComplaint(res.data.data.complaint);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaintDetails();
  }, [fetchComplaintDetails]);

  const handleReopenSubmit = async () => {
    if (!reopenReason.trim() || reopenReason.trim().length < 10) {
      toastError('Please provide a reason of at least 10 characters.');
      return;
    }

    try {
      setReopenLoading(true);
      const res = await complaintApi.reopen(complaint.id, { reason: reopenReason.trim() });
      if (res.data?.success) {
        success('Complaint has been reopened for municipal review.');
        setReopenModalOpen(false);
        setReopenReason('');
        await fetchComplaintDetails();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to reopen complaint.');
    } finally {
      setReopenLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading grievance file...</div>
      </div>
    );
  }

  if (errorMsg || !complaint) {
    return (
      <div className="py-4">
        <div className="alert alert-danger mb-3">{errorMsg || 'Complaint not found.'}</div>
        <Link to="/complaints/my" className="btn-civic-secondary">
          <ArrowLeft size={16} /> Back to My Complaints
        </Link>
      </div>
    );
  }

  const canReopen = complaint.status === 'resolved' || complaint.status === 'rejected';

  return (
    <div className="py-2" style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Navigation and Title */}
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Link to="/complaints/my" className="btn-civic-secondary btn-sm">
          <ArrowLeft size={15} /> Back to Complaints
        </Link>
        <span className="text-muted small">
          Official Case Record ID #{complaint.id}
        </span>
      </div>

      {/* Main Complaint Header Card */}
      <div className="civic-card mb-4">
        <div className="civic-card-header flex-wrap gap-2">
          <div>
            <span className="text-muted small text-uppercase fw-semibold d-block" style={{ fontSize: '0.75rem' }}>
              Reference Number
            </span>
            <span className="fs-5 fw-bold text-dark">{complaint.reference_number}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <PriorityBadge priority={complaint.priority} />
            <StatusBadge status={complaint.status} />
          </div>
        </div>

        <div className="civic-card-body">
          <h4 className="fw-semibold mb-3" style={{ color: '#19324D' }}>
            {complaint.title}
          </h4>

          <div className="p-3 bg-light rounded mb-4">
            <h6 className="fw-semibold mb-1" style={{ fontSize: '0.8125rem', color: '#19324D' }}>
              Citizen Description:
            </h6>
            <p className="mb-0 text-secondary small" style={{ whiteSpace: 'pre-line' }}>
              {complaint.description}
            </p>
          </div>

          <div className="row g-3 small text-muted mb-3">
            <div className="col-md-6">
              <div className="d-flex align-items-center gap-1.5 mb-1">
                <MapPin size={15} className="text-secondary" />
                <span>Location: <strong className="text-dark">{complaint.location}</strong></span>
              </div>
              <div className="d-flex align-items-center gap-1.5">
                <Building2 size={15} className="text-secondary" />
                <span>Department: <strong className="text-dark">{complaint.department_name || 'Allocation Pending'}</strong></span>
              </div>
            </div>

            <div className="col-md-6 border-start-md">
              <div className="d-flex align-items-center gap-1.5 mb-1">
                <Calendar size={15} className="text-secondary" />
                <span>Submitted: <strong className="text-dark">{new Date(complaint.created_at).toLocaleString()}</strong></span>
              </div>
              {complaint.resolved_at && (
                <div className="d-flex align-items-center gap-1.5 text-success">
                  <CheckCircle2 size={15} />
                  <span>Resolved: <strong>{new Date(complaint.resolved_at).toLocaleString()}</strong></span>
                </div>
              )}
            </div>
          </div>

          {/* Official Resolution Remarks if available */}
          {complaint.resolution_remarks && (
            <div className="p-3 rounded mb-4" style={{ backgroundColor: '#F0FDF4', border: '1px solid #DCFCE7' }}>
              <div className="d-flex align-items-center gap-2 mb-1 text-success fw-semibold small">
                <CheckCircle2 size={16} /> Official Resolution Remarks
              </div>
              <p className="mb-0 text-dark small" style={{ whiteSpace: 'pre-line' }}>
                {complaint.resolution_remarks}
              </p>
            </div>
          )}

          {/* Attachments Section */}
          {complaint.attachments && complaint.attachments.length > 0 && (
            <div className="mb-4 pt-3 border-top">
              <h6 className="fw-semibold mb-2" style={{ fontSize: '0.8125rem', color: '#19324D' }}>
                Attached Documentation ({complaint.attachments.length})
              </h6>
              <div className="row g-2">
                {complaint.attachments.map((att) => (
                  <div key={att.id} className="col-sm-6">
                    <div className="p-2 border rounded bg-white d-flex align-items-center justify-content-between">
                      <div className="d-flex align-items-center gap-2 text-truncate">
                        <Paperclip size={16} className="text-muted" />
                        <span className="small text-truncate" style={{ maxWidth: '200px' }}>
                          {att.filename}
                        </span>
                      </div>
                      <a
                        href={att.url}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm btn-outline-secondary py-0.5 px-2 small"
                      >
                        <Download size={13} /> View
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reopen Action Banner */}
          {canReopen && (
            <div className="p-3 bg-light rounded border mb-4 d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div>
                <span className="fw-semibold text-dark small d-block">
                  Is this issue still unresolved on-site?
                </span>
                <span className="text-muted small">
                  If the problem has resurfaced or work was incomplete, you may reopen this complaint.
                </span>
              </div>
              <button
                type="button"
                className="btn-civic-secondary btn-sm"
                onClick={() => setReopenModalOpen(true)}
              >
                <RefreshCw size={14} /> Reopen Grievance
              </button>
            </div>
          )}

          {/* Status Timeline */}
          <div className="border-top pt-4">
            <h6 className="fw-bold mb-3" style={{ color: '#19324D' }}>
              Action History & Audit Timeline
            </h6>
            <ComplaintTimeline timeline={complaint.timeline || []} />
          </div>
        </div>
      </div>

      {/* Reopen Modal */}
      {reopenModalOpen && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)' }}
          role="dialog"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content shadow border-0" style={{ borderRadius: '6px' }}>
              <div className="modal-header py-2.5 px-3 border-bottom">
                <h6 className="modal-title fw-bold text-dark mb-0">
                  Reopen Complaint #{complaint.reference_number}
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setReopenModalOpen(false)}
                />
              </div>
              <div className="modal-body p-3">
                <p className="text-muted small mb-2">
                  Please provide specific details explaining why this issue requires further municipal attention:
                </p>
                <textarea
                  className="form-control"
                  rows={4}
                  placeholder="Explain why the problem has recurred or what repairs remain incomplete on-site..."
                  value={reopenReason}
                  onChange={(e) => setReopenReason(e.target.value)}
                />
              </div>
              <div className="modal-footer py-2 px-3 border-top bg-light">
                <button
                  type="button"
                  className="btn-civic-secondary btn-sm"
                  onClick={() => setReopenModalOpen(false)}
                  disabled={reopenLoading}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-civic-primary btn-sm"
                  onClick={handleReopenSubmit}
                  disabled={reopenLoading}
                >
                  {reopenLoading ? 'Reopening...' : 'Confirm Reopen'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
