import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  PlusCircle,
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  Paperclip
} from 'lucide-react';
import { complaintApi } from '../../services/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export default function MyComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');

  const fetchComplaints = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 10,
        search: search.trim(),
        status,
        category,
        priority
      };

      const res = await complaintApi.getMyComplaints(params);
      if (res.data?.success) {
        setComplaints(res.data.data.complaints || []);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [search, status, category, priority]);

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints(1);
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
            My Grievance Submissions
          </h1>
          <p className="text-muted small mb-0">
            Track status updates, administrative remarks, and resolution history for all your reported issues.
          </p>
        </div>
        <Link to="/complaints/new" className="btn-civic-accent">
          <PlusCircle size={16} /> Submit New Complaint
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="civic-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2">
          <div className="col-lg-4 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search reference, title, location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-2 col-md-3 col-6">
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="submitted">Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
              <option value="reopened">Reopened</option>
            </select>
          </div>

          <div className="col-lg-3 col-md-3 col-6">
            <select
              className="form-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Roads">Roads</option>
              <option value="Water Supply">Water Supply</option>
              <option value="Electricity">Electricity</option>
              <option value="Sanitation">Sanitation</option>
              <option value="Garbage Collection">Garbage Collection</option>
              <option value="Drainage">Drainage</option>
              <option value="Streetlights">Streetlights</option>
              <option value="Public Safety">Public Safety</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-6 col-6">
            <select
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="col-lg-1 col-md-6 col-6">
            <button type="submit" className="btn-civic-primary w-100 justify-content-center">
              Filter
            </button>
          </div>
        </form>
      </div>

      {/* Complaints List Container */}
      <div className="civic-card">
        <div className="civic-card-header">
          <span className="small fw-semibold text-dark">
            Registered Grievances ({pagination.total})
          </span>
          <span className="text-muted small">
            Showing Page {pagination.page} of {pagination.totalPages || 1}
          </span>
        </div>

        <div className="civic-card-body p-0">
          {loading ? (
            <div className="p-3">
              <TableSkeleton rows={5} cols={6} />
            </div>
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No matching grievances found"
              description="No complaints matched your active filter criteria. Try adjusting your search query or status filter."
              actionLabel="Clear Filters"
              onAction={() => {
                setSearch('');
                setStatus('all');
                setCategory('all');
                setPriority('all');
              }}
            />
          ) : (
            <>
              {/* Desktop View Table */}
              <div className="table-responsive d-none d-md-block">
                <table className="table-civic">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Title & Location</th>
                      <th>Category</th>
                      <th>Department</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th className="text-end">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-semibold">
                          <Link to={`/complaints/${item.id}`} className="text-dark hover-underline">
                            {item.reference_number}
                          </Link>
                          {item.attachment_count > 0 && (
                            <span className="ms-1 text-muted" title={`${item.attachment_count} attachment`}>
                              <Paperclip size={12} />
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '240px' }}>
                            {item.title}
                          </div>
                          <div className="text-muted small text-truncate" style={{ maxWidth: '240px', fontSize: '0.75rem' }}>
                            <MapPin size={11} className="me-0.5 inline" /> {item.location}
                          </div>
                        </td>
                        <td>{item.category}</td>
                        <td className="small text-muted">
                          {item.department_name || 'Pending Assignment'}
                        </td>
                        <td>
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td>
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="small text-muted">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="text-end">
                          <Link
                            to={`/complaints/${item.id}`}
                            className="btn btn-sm btn-outline-secondary py-1 px-2.5 d-inline-flex align-items-center gap-1"
                            style={{ fontSize: '0.8125rem' }}
                          >
                            View Case <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile View Cards */}
              <div className="d-md-none p-3 d-flex flex-column gap-3">
                {complaints.map((item) => (
                  <div key={item.id} className="p-3 border rounded bg-white shadow-xs">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="fw-bold text-dark">{item.reference_number}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <h6 className="fw-semibold mb-1 text-dark">{item.title}</h6>
                    <div className="small text-muted mb-2">
                      <MapPin size={12} /> {item.location}
                    </div>
                    <div className="d-flex justify-content-between align-items-center pt-2 border-top small">
                      <PriorityBadge priority={item.priority} />
                      <Link to={`/complaints/${item.id}`} className="text-primary fw-medium">
                        View Details →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination Bar */}
              {pagination.totalPages > 1 && (
                <div className="p-3 border-top d-flex justify-content-between align-items-center">
                  <button
                    className="btn-civic-secondary btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchComplaints(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span className="small text-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    className="btn-civic-secondary btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchComplaints(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
