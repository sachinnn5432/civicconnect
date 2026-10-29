import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Building2,
  Calendar,
  User,
  Phone,
  Mail,
  ShieldAlert,
  Paperclip,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  Send
} from 'lucide-react';
import { adminApi } from '../../services/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import ComplaintTimeline from '../../components/ComplaintTimeline.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const PERMITTED_TRANSITIONS = {
  submitted: ['under_review', 'rejected'],
  under_review: ['in_progress', 'rejected'],
  in_progress: ['resolved', 'rejected'],
  resolved: ['reopened'],
  rejected: ['reopened'],
  reopened: ['under_review', 'in_progress']
};

export default function AdminComplaintDetailPage() {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Status Update Form State
  const [targetStatus, setTargetStatus] = useState('');
  const [statusRemarks, setStatusRemarks] = useState('');
  const [statusVisibility, setStatusVisibility] = useState('citizen');
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [statusSubmitting, setStatusSubmitting] = useState(false);

  // Department Assign Form State
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [deptRemarks, setDeptRemarks] = useState('');
  const [deptSubmitting, setDeptSubmitting] = useState(false);

  // Priority Update Form State
  const [selectedPriority, setSelectedPriority] = useState('');
  const [prioritySubmitting, setPrioritySubmitting] = useState(false);

  // Standalone Remarks State
  const [noteText, setNoteText] = useState('');
  const [noteVisibility, setNoteVisibility] = useState('internal');
  const [noteSubmitting, setNoteSubmitting] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchComplaintData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await adminApi.getComplaintById(id);
      if (res.data?.success) {
        const c = res.data.data.complaint;
        setComplaint(c);
        setSelectedDeptId(c.department_id ? String(c.department_id) : '');
        setSelectedPriority(c.priority || 'medium');

        // Reset target status to first permitted target
        const allowed = PERMITTED_TRANSITIONS[c.status] || [];
        setTargetStatus(allowed[0] || '');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchComplaintData();
    adminApi.getDepartments()
      .then((res) => {
        if (res.data?.success) {
          setDepartments(res.data.data.departments || []);
        }
      })
      .catch((err) => console.warn('Could not load departments:', err.message));
  }, [fetchComplaintData]);

  // Handle Status Update
  const handleStatusUpdate = async () => {
    if (!statusRemarks.trim() || statusRemarks.trim().length < 5) {
      toastError('Remarks are required (at least 5 characters) when updating case status.');
      return;
    }

    try {
      setStatusSubmitting(true);
      const res = await adminApi.updateStatus(complaint.id, {
        status: targetStatus,
        remarks: statusRemarks.trim(),
        visibility: statusVisibility
      });

      if (res.data?.success) {
        success(res.data.message);
        setStatusModalOpen(false);
        setStatusRemarks('');
        await fetchComplaintData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusSubmitting(false);
    }
  };

  // Handle Department Reassign
  const handleDeptReassign = async (e) => {
    e.preventDefault();
    if (!selectedDeptId) return;

    try {
      setDeptSubmitting(true);
      const res = await adminApi.assignDepartment(complaint.id, {
        departmentId: parseInt(selectedDeptId, 10),
        remarks: deptRemarks.trim()
      });

      if (res.data?.success) {
        success(res.data.message);
        setDeptRemarks('');
        await fetchComplaintData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to assign department.');
    } finally {
      setDeptSubmitting(false);
    }
  };

  // Handle Priority Update
  const handlePriorityUpdate = async (e) => {
    e.preventDefault();
    try {
      setPrioritySubmitting(true);
      const res = await adminApi.updatePriority(complaint.id, {
        priority: selectedPriority
      });
      if (res.data?.success) {
        success(res.data.message);
        await fetchComplaintData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update priority.');
    } finally {
      setPrioritySubmitting(false);
    }
  };

  // Handle Standalone Remarks Note
  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteText.trim()) return;

    try {
      setNoteSubmitting(true);
      const res = await adminApi.addRemarks(complaint.id, {
        remarks: noteText.trim(),
        visibility: noteVisibility
      });
      if (res.data?.success) {
        success(res.data.message);
        setNoteText('');
        await fetchComplaintData();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to add note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status" />
        <div className="text-muted small mt-2">Loading case record...</div>
      </div>
    );
  }

  if (errorMsg || !complaint) {
    return (
      <div className="py-4">
        <div className="alert alert-danger mb-3">{errorMsg || 'Complaint record not found.'}</div>
        <Link to="/admin/complaints" className="btn-civic-secondary">
          <ArrowLeft size={16} /> Back to Registry
        </Link>
      </div>
    );
  }

  const allowedTransitions = PERMITTED_TRANSITIONS[complaint.status] || [];

  return (
    <div className="py-2">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <Link to="/admin/complaints" className="btn-civic-secondary btn-sm">
          <ArrowLeft size={15} /> Back to Complaints Registry
        </Link>
        <span className="badge bg-secondary-subtle text-secondary border small">
          Official Municipal Case Record
        </span>
      </div>

      <div className="row g-4">
        {/* Left Column: Complaint Details & Timeline */}
        <div className="col-lg-7">
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
                  Issue Description:
                </h6>
                <p className="mb-0 text-secondary small" style={{ whiteSpace: 'pre-line' }}>
                  {complaint.description}
                </p>
              </div>

              {/* Citizen Details Card */}
              <div className="p-3 border rounded bg-white mb-4">
                <h6 className="fw-semibold mb-2 d-flex align-items-center gap-2" style={{ fontSize: '0.8125rem', color: '#19324D' }}>
                  <User size={15} className="text-primary" /> Citizen Contact Details
                </h6>
                <div className="row g-2 small text-muted">
                  <div className="col-sm-6">
                    Name: <strong className="text-dark">{complaint.citizen_name}</strong>
                  </div>
                  <div className="col-sm-6">
                    Phone: <strong className="text-dark">{complaint.citizen_phone}</strong>
                  </div>
                  <div className="col-sm-6">
                    Email: <span className="text-dark">{complaint.citizen_email}</span>
                  </div>
                  <div className="col-sm-6">
                    Registered Address: <span className="text-dark">{complaint.citizen_address}</span>
                  </div>
                </div>
              </div>

              <div className="row g-3 small text-muted mb-4">
                <div className="col-sm-6">
                  <div className="d-flex align-items-center gap-1.5 mb-1">
                    <MapPin size={15} /> Location: <strong className="text-dark">{complaint.location}</strong>
                  </div>
                  <div className="d-flex align-items-center gap-1.5">
                    <Building2 size={15} /> Department: <strong className="text-dark">{complaint.department_name || 'Unassigned'}</strong>
                  </div>
                </div>
                <div className="col-sm-6">
                  <div className="d-flex align-items-center gap-1.5 mb-1">
                    <Calendar size={15} /> Registered: <strong className="text-dark">{new Date(complaint.created_at).toLocaleString()}</strong>
                  </div>
                  {complaint.resolved_at && (
                    <div className="d-flex align-items-center gap-1.5 text-success">
                      <CheckCircle2 size={15} /> Resolved: <strong>{new Date(complaint.resolved_at).toLocaleString()}</strong>
                    </div>
                  )}
                </div>
              </div>

              {/* Attachments if any */}
              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="mb-4 pt-3 border-top">
                  <h6 className="fw-semibold mb-2" style={{ fontSize: '0.8125rem', color: '#19324D' }}>
                    Uploaded Documents / Evidence ({complaint.attachments.length})
                  </h6>
                  <div className="row g-2">
                    {complaint.attachments.map((att) => (
                      <div key={att.id} className="col-sm-6">
                        <div className="p-2 border rounded bg-light d-flex align-items-center justify-content-between">
                          <div className="d-flex align-items-center gap-2 text-truncate">
                            <Paperclip size={15} className="text-muted" />
                            <span className="small text-truncate" style={{ maxWidth: '180px' }}>
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

              {/* Audit Timeline */}
              <div className="border-top pt-4">
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="fw-bold mb-0" style={{ color: '#19324D' }}>
                    Complete Audit Trail & Case History
                  </h6>
                  <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                    Includes internal staff notes
                  </span>
                </div>
                <ComplaintTimeline timeline={complaint.timeline || []} />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Administrative Actions & Controls */}
        <div className="col-lg-5">
          {/* Action 1: Status Transition */}
          <div className="civic-card p-3 mb-4">
            <h6 className="fw-bold mb-2" style={{ color: '#19324D' }}>
              Update Lifecycle Status
            </h6>
            <p className="text-muted small mb-3" style={{ fontSize: '0.8125rem' }}>
              Enforces municipal procedural transitions with mandatory remarks.
            </p>

            {allowedTransitions.length === 0 ? (
              <div className="p-2.5 rounded bg-light border text-muted small">
                No further status transitions permitted from current status (<strong>{complaint.status}</strong>).
              </div>
            ) : (
              <div>
                <div className="mb-2">
                  <label className="form-label" htmlFor="targetStatusSelect">Target Status</label>
                  <select
                    id="targetStatusSelect"
                    className="form-select"
                    value={targetStatus}
                    onChange={(e) => setTargetStatus(e.target.value)}
                  >
                    {allowedTransitions.map((st) => (
                      <option key={st} value={st}>
                        {st.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-2">
                  <label className="form-label" htmlFor="statusRemarksInput">
                    Status Remarks / Justification <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="statusRemarksInput"
                    rows={3}
                    className="form-control"
                    placeholder="Enter formal justification, crew dispatch notice, or closure remarks..."
                    value={statusRemarks}
                    onChange={(e) => setStatusRemarks(e.target.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label d-block mb-1">Remarks Visibility</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="visibility"
                        id="visCitizen"
                        value="citizen"
                        checked={statusVisibility === 'citizen'}
                        onChange={() => setStatusVisibility('citizen')}
                      />
                      <label className="form-check-label small" htmlFor="visCitizen">
                        Citizen-Visible (Notifies user)
                      </label>
                    </div>
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="radio"
                        name="visibility"
                        id="visInternal"
                        value="internal"
                        checked={statusVisibility === 'internal'}
                        onChange={() => setStatusVisibility('internal')}
                      />
                      <label className="form-check-label small" htmlFor="visInternal">
                        Internal Staff Only
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  className="btn-civic-primary w-100 justify-content-center"
                  onClick={() => setStatusModalOpen(true)}
                  disabled={!statusRemarks.trim()}
                >
                  Apply Status Transition
                </button>
              </div>
            )}
          </div>

          {/* Action 2: Department Allocation */}
          <div className="civic-card p-3 mb-4">
            <h6 className="fw-bold mb-2" style={{ color: '#19324D' }}>
              Assign / Reassign Department
            </h6>
            <form onSubmit={handleDeptReassign}>
              <div className="mb-2">
                <select
                  className="form-select"
                  value={selectedDeptId}
                  onChange={(e) => setSelectedDeptId(e.target.value)}
                  required
                >
                  <option value="">Select Nodal Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                  ))}
                </select>
              </div>
              <div className="mb-2">
                <input
                  type="text"
                  className="form-control form-control-sm"
                  placeholder="Optional assignment note or instructions..."
                  value={deptRemarks}
                  onChange={(e) => setDeptRemarks(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="btn-civic-secondary btn-sm w-100 justify-content-center"
                disabled={deptSubmitting || !selectedDeptId}
              >
                {deptSubmitting ? 'Assigning...' : 'Reassign Department'}
              </button>
            </form>
          </div>

          {/* Action 3: Priority Adjustment */}
          <div className="civic-card p-3 mb-4">
            <h6 className="fw-bold mb-2" style={{ color: '#19324D' }}>
              Adjust Priority Level
            </h6>
            <form onSubmit={handlePriorityUpdate} className="d-flex gap-2">
              <select
                className="form-select form-select-sm"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
              >
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
              <button
                type="submit"
                className="btn-civic-secondary btn-sm text-nowrap"
                disabled={prioritySubmitting || selectedPriority === complaint.priority}
              >
                {prioritySubmitting ? 'Saving...' : 'Update'}
              </button>
            </form>
          </div>

          {/* Action 4: Add Intermediate Note */}
          <div className="civic-card p-3">
            <h6 className="fw-bold mb-2" style={{ color: '#19324D' }}>
              Add Progress Note / Internal Remark
            </h6>
            <p className="text-muted small mb-2" style={{ fontSize: '0.8125rem' }}>
              Add an observation without altering current status.
            </p>
            <form onSubmit={handleAddNote}>
              <div className="mb-2">
                <textarea
                  rows={2}
                  className="form-control"
                  placeholder="Enter notes, inspection details, or intermediate updates..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  required
                />
              </div>
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="noteVisCheck"
                    checked={noteVisibility === 'citizen'}
                    onChange={(e) => setNoteVisibility(e.target.checked ? 'citizen' : 'internal')}
                  />
                  <label className="form-check-label small text-muted" htmlFor="noteVisCheck">
                    Make visible to citizen
                  </label>
                </div>
                <button
                  type="submit"
                  className="btn-civic-secondary btn-sm"
                  disabled={noteSubmitting || !noteText.trim()}
                >
                  <Send size={13} /> Add Note
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={statusModalOpen}
        title="Confirm Status Transition"
        message={`Are you sure you want to transition complaint #${complaint.reference_number} from '${complaint.status}' to '${targetStatus}'? This action will be permanently recorded in the municipal audit history.`}
        confirmLabel="Confirm Transition"
        confirmVariant={targetStatus === 'rejected' ? 'danger' : 'primary'}
        onConfirm={handleStatusUpdate}
        onCancel={() => setStatusModalOpen(false)}
        loading={statusSubmitting}
      />
    </div>
  );
}
