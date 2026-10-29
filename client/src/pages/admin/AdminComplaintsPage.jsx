import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  Filter,
  ExternalLink,
  MapPin,
  Building2,
  Calendar,
  Paperclip,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { adminApi } from '../../services/api.js';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 12, total: 0, totalPages: 1 });

  // Filter States
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [category, setCategory] = useState('all');
  const [priority, setPriority] = useState('all');
  const [departmentId, setDepartmentId] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');

  // Load departments for filter dropdown
  useEffect(() => {
    adminApi.getDepartments()
      .then((res) => {
        if (res.data?.success) {
          setDepartments(res.data.data.departments || []);
        }
      })
      .catch((err) => console.warn('Could not load departments:', err.message));
  }, []);

  const fetchComplaints = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 12,
        search: search.trim(),
        status,
        category,
        priority,
        departmentId,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder
      };

      const res = await adminApi.getComplaints(params);
      if (res.data?.success) {
        setComplaints(res.data.data.complaints || []);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch admin complaints:', err);
    } finally {
      setLoading(false);
    }
  }, [search, status, category, priority, departmentId, dateFrom, dateTo, sortBy, sortOrder]);

  useEffect(() => {
    fetchComplaints(1);
  }, [fetchComplaints]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComplaints(1);
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatus('all');
    setCategory('all');
    setPriority('all');
    setDepartmentId('all');
    setDateFrom('');
    setDateTo('');
    setSortBy('created_at');
    setSortOrder('desc');
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
            Municipal Grievance Registry
          </h1>
          <p className="text-muted small mb-0">
            Search, filter, allocate departments, and manage lifecycle status of citizen grievances.
          </p>
        </div>
        <Link to="/admin/reports" className="btn-civic-secondary btn-sm">
          <FileSpreadsheet size={15} /> Export Reports
        </Link>
      </div>

      {/* Advanced Filter Card */}
      <div className="civic-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit}>
          <div className="row g-2 mb-2">
            <div className="col-lg-4 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-muted">
                  <Search size={16} />
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search Reference, Citizen, Phone, Street..."
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

            <div className="col-lg-2 col-md-3 col-6">
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

            <div className="col-lg-2 col-md-3 col-6">
              <select
                className="form-select"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-3 col-6">
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
          </div>

          <div className="row g-2 align-items-center">
            <div className="col-lg-3 col-md-4 col-6">
              <div className="d-flex align-items-center gap-1 small text-muted">
                <span>From:</span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-3 col-md-4 col-6">
              <div className="d-flex align-items-center gap-1 small text-muted">
                <span>To:</span>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="col-lg-3 col-md-4 col-6">
              <select
                className="form-select form-select-sm"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [col, ord] = e.target.value.split('-');
                  setSortBy(col);
                  setSortOrder(ord);
                }}
              >
                <option value="created_at-desc">Sort: Newest First</option>
                <option value="created_at-asc">Sort: Oldest First</option>
                <option value="priority-desc">Sort: Highest Priority</option>
                <option value="status-asc">Sort: By Status</option>
              </select>
            </div>

            <div className="col-lg-3 col-md-12 col-6 d-flex gap-2 justify-content-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1"
                onClick={handleResetFilters}
              >
                <RotateCcw size={14} /> Reset
              </button>
              <button
                type="submit"
                className="btn-civic-primary btn-sm px-3"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Main Complaints Registry Table */}
      <div className="civic-card">
        <div className="civic-card-header">
          <span className="small fw-semibold text-dark">
            Matched Grievances ({pagination.total})
          </span>
          <span className="text-muted small">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
        </div>

        <div className="civic-card-body p-0">
          {loading ? (
            <div className="p-3">
              <TableSkeleton rows={8} cols={7} />
            </div>
          ) : complaints.length === 0 ? (
            <EmptyState
              title="No grievances match the search parameters"
              description="Try broadening your filter criteria, resetting date ranges, or removing search keywords."
              actionLabel="Reset All Filters"
              onAction={handleResetFilters}
            />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table-civic">
                  <thead>
                    <tr>
                      <th>Ref Number</th>
                      <th>Citizen Details</th>
                      <th>Subject / Location</th>
                      <th>Category</th>
                      <th>Department</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th className="text-end">Case File</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((item) => (
                      <tr key={item.id}>
                        <td className="fw-semibold text-dark">
                          <Link to={`/admin/complaints/${item.id}`} className="text-dark hover-underline">
                            {item.reference_number}
                          </Link>
                          {item.attachment_count > 0 && (
                            <span className="ms-1 text-muted" title={`${item.attachment_count} attachment`}>
                              <Paperclip size={12} />
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="fw-medium text-dark">{item.citizen_name}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {item.citizen_phone}
                          </div>
                        </td>
                        <td>
                          <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '220px' }}>
                            {item.title}
                          </div>
                          <div className="text-muted small text-truncate" style={{ maxWidth: '220px', fontSize: '0.75rem' }}>
                            <MapPin size={11} className="inline me-0.5" /> {item.location}
                          </div>
                        </td>
                        <td>{item.category}</td>
                        <td className="small">
                          {item.department_name ? (
                            <span className="badge bg-light text-dark border">{item.department_name}</span>
                          ) : (
                            <span className="badge bg-warning-subtle text-warning-emphasis border">Unassigned</span>
                          )}
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
                            day: 'numeric'
                          })}
                        </td>
                        <td className="text-end">
                          <Link
                            to={`/admin/complaints/${item.id}`}
                            className="btn btn-sm btn-outline-secondary py-1 px-2.5 small"
                          >
                            Review <ExternalLink size={12} />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
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
