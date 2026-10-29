import React, { useState, useEffect, useCallback } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  RotateCcw,
  Calendar,
  CheckCircle2,
  Clock,
  Layers,
  Building2
} from 'lucide-react';
import { adminApi } from '../../services/api.js';
import StatCard from '../../components/StatCard.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export default function AdminReportsPage() {
  const [reportData, setReportData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Report Filters
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [departmentId, setDepartmentId] = useState('all');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    adminApi.getDepartments()
      .then((res) => {
        if (res.data?.success) {
          setDepartments(res.data.data.departments || []);
        }
      })
      .catch((err) => console.warn('Could not load departments:', err.message));
  }, []);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      const params = {
        dateFrom,
        dateTo,
        departmentId,
        category,
        status
      };
      const res = await adminApi.getReports(params);
      if (res.data?.success) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, departmentId, category, status]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchReports();
  };

  const handleResetFilters = () => {
    setDateFrom('');
    setDateTo('');
    setDepartmentId('all');
    setCategory('all');
    setStatus('all');
  };

  const handleExportCsv = () => {
    const params = {
      ...(dateFrom && { dateFrom }),
      ...(dateTo && { dateTo }),
      ...(departmentId !== 'all' && { departmentId }),
      ...(category !== 'all' && { category }),
      ...(status !== 'all' && { status })
    };
    const exportUrl = adminApi.getExportUrl(params);
    window.open(exportUrl, '_blank');
  };

  const summary = reportData?.summary || {};
  const byCategory = reportData?.byCategory || [];
  const byDepartment = reportData?.byDepartment || [];

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
            Municipal Grievance Reports & Audit Exports
          </h1>
          <p className="text-muted small mb-0">
            Generate statutory service audit summaries and export sanitized CSV case registers.
          </p>
        </div>
        <button
          type="button"
          className="btn-civic-accent btn-sm d-flex align-items-center gap-1.5"
          onClick={handleExportCsv}
        >
          <Download size={16} /> Export Filtered CSV
        </button>
      </div>

      {/* Filter Parameters */}
      <div className="civic-card p-3 mb-4">
        <form onSubmit={handleFilterSubmit}>
          <div className="row g-2 mb-2">
            <div className="col-lg-3 col-md-4 col-6">
              <label className="form-label" htmlFor="repDateFrom" style={{ fontSize: '0.75rem' }}>From Date</label>
              <input
                id="repDateFrom"
                type="date"
                className="form-control form-control-sm"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>

            <div className="col-lg-3 col-md-4 col-6">
              <label className="form-label" htmlFor="repDateTo" style={{ fontSize: '0.75rem' }}>To Date</label>
              <input
                id="repDateTo"
                type="date"
                className="form-control form-control-sm"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>

            <div className="col-lg-2 col-md-4 col-6">
              <label className="form-label" htmlFor="repDept" style={{ fontSize: '0.75rem' }}>Department</label>
              <select
                id="repDept"
                className="form-select form-select-sm"
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
              >
                <option value="all">All Departments</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-6 col-6">
              <label className="form-label" htmlFor="repCategory" style={{ fontSize: '0.75rem' }}>Category</label>
              <select
                id="repCategory"
                className="form-select form-select-sm"
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

            <div className="col-lg-2 col-md-6 col-12">
              <label className="form-label" htmlFor="repStatus" style={{ fontSize: '0.75rem' }}>Status</label>
              <select
                id="repStatus"
                className="form-select form-select-sm"
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
          </div>

          <div className="d-flex justify-content-end gap-2 pt-2 border-top">
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
              Update Report View
            </button>
          </div>
        </form>
      </div>

      {loading ? (
        <div className="p-3">
          <TableSkeleton rows={5} cols={4} />
        </div>
      ) : (
        <>
          {/* Summary Stat Cards */}
          <div className="row g-3 mb-4">
            <div className="col-lg-3 col-sm-6">
              <StatCard
                title="Filtered Grievances"
                value={summary.total || 0}
                icon={FileSpreadsheet}
                subtext="Total matched in filter criteria"
              />
            </div>
            <div className="col-lg-3 col-sm-6">
              <StatCard
                title="Cases Resolved"
                value={summary.resolved || 0}
                icon={CheckCircle2}
                subtext={summary.total ? `${((summary.resolved / summary.total) * 100).toFixed(1)}% Resolution Rate` : '0%'}
              />
            </div>
            <div className="col-lg-3 col-sm-6">
              <StatCard
                title="Active Load"
                value={(summary.submitted || 0) + (summary.under_review || 0) + (summary.in_progress || 0) + (summary.reopened || 0)}
                icon={Clock}
                subtext="Submitted, review, in-progress"
              />
            </div>
            <div className="col-lg-3 col-sm-6">
              <StatCard
                title="Avg. Resolution (Hours)"
                value={summary.avg_resolution_hours ? `${summary.avg_resolution_hours} hrs` : 'N/A'}
                icon={Clock}
                subtext={summary.avg_resolution_hours ? `Approx ${(summary.avg_resolution_hours / 24).toFixed(1)} days` : 'No resolved cases'}
              />
            </div>
          </div>

          {/* Breakdown Tables */}
          <div className="row g-4">
            {/* By Category */}
            <div className="col-md-6">
              <div className="civic-card h-100">
                <div className="civic-card-header">
                  <h6 className="mb-0 fw-bold" style={{ color: '#19324D' }}>
                    <Layers size={16} className="me-1 inline" /> Breakdown by Civic Category
                  </h6>
                </div>
                <div className="civic-card-body p-0">
                  <table className="table-civic">
                    <thead>
                      <tr>
                        <th>Category</th>
                        <th className="text-end">Complaints</th>
                        <th className="text-end">Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCategory.length === 0 ? (
                        <tr><td colSpan={3} className="text-center text-muted py-3">No records</td></tr>
                      ) : (
                        byCategory.map((item, idx) => {
                          const pct = summary.total > 0 ? ((item.count / summary.total) * 100).toFixed(1) : 0;
                          return (
                            <tr key={idx}>
                              <td className="fw-medium text-dark">{item.category}</td>
                              <td className="text-end fw-semibold text-dark">{item.count}</td>
                              <td className="text-end text-muted small">{pct}%</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* By Department */}
            <div className="col-md-6">
              <div className="civic-card h-100">
                <div className="civic-card-header">
                  <h6 className="mb-0 fw-bold" style={{ color: '#19324D' }}>
                    <Building2 size={16} className="me-1 inline" /> Breakdown by Department
                  </h6>
                </div>
                <div className="civic-card-body p-0">
                  <table className="table-civic">
                    <thead>
                      <tr>
                        <th>Department</th>
                        <th className="text-end">Assigned Complaints</th>
                        <th className="text-end">Share (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byDepartment.length === 0 ? (
                        <tr><td colSpan={3} className="text-center text-muted py-3">No records</td></tr>
                      ) : (
                        byDepartment.map((item, idx) => {
                          const pct = summary.total > 0 ? ((item.count / summary.total) * 100).toFixed(1) : 0;
                          return (
                            <tr key={idx}>
                              <td className="fw-medium text-dark">{item.department_name || 'Unassigned'}</td>
                              <td className="text-end fw-semibold text-dark">{item.count}</td>
                              <td className="text-end text-muted small">{pct}%</td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
