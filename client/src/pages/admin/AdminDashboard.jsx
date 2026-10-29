import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Percent,
  Timer,
  Building2,
  ArrowRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { adminApi } from '../../services/api.js';
import StatCard from '../../components/StatCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await adminApi.getDashboard();
        if (res.data?.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load admin dashboard analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="py-4">
        <div className="d-flex align-items-center gap-2 mb-4 text-muted small">
          <div className="spinner-border spinner-border-sm text-primary" role="status" />
          <span>Aggregating municipal database records...</span>
        </div>
        <TableSkeleton rows={6} cols={6} />
      </div>
    );
  }

  const metrics = data?.metrics || {};
  const dailyTrends = data?.dailyTrends || [];
  const categoryDist = data?.categoryDistribution || [];
  const deptWorkload = data?.departmentWorkload || [];
  const recentComplaints = data?.recentComplaints || [];

  const CATEGORY_COLORS = ['#19324D', '#1F7A4C', '#2563EB', '#D97706', '#DC2626', '#475569', '#7C3AED'];

  return (
    <div>
      {/* Page Header */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
            Municipal Operations Dashboard
          </h1>
          <p className="text-muted small mb-0">
            Real-time grievance analytics, service level compliance, and departmental workload distribution.
          </p>
        </div>
        <div className="d-flex gap-2">
          <Link to="/admin/reports" className="btn-civic-secondary btn-sm">
            Generate Reports
          </Link>
          <Link to="/admin/complaints" className="btn-civic-primary btn-sm">
            Complaints Registry
          </Link>
        </div>
      </div>

      {/* Primary Status Metric Cards */}
      <div className="row g-3 mb-4">
        <div className="col-lg-3 col-sm-6">
          <StatCard
            title="Total Complaints"
            value={metrics.totalComplaints}
            icon={FileText}
            subtext="Cumulative complaints in system"
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <StatCard
            title="Under Review"
            value={metrics.underReviewComplaints}
            icon={Clock}
            subtext="Awaiting zonal dispatch"
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <StatCard
            title="In Progress"
            value={metrics.inProgressComplaints}
            icon={Building2}
            subtext="Field engineering crews on site"
          />
        </div>
        <div className="col-lg-3 col-sm-6">
          <StatCard
            title="Resolved (Rate)"
            value={`${metrics.resolutionRate}%`}
            icon={Percent}
            subtext={`${metrics.resolvedComplaints} of ${metrics.totalComplaints} complaints resolved`}
          />
        </div>
      </div>

      {/* Secondary Metrics Bar */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <div className="civic-card p-3">
            <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>
              Average Resolution Turnaround
            </div>
            <div className="fs-3 fw-bold text-dark mt-1">
              {metrics.avgResolutionDays} <span className="fs-6 fw-normal text-muted">Days ({metrics.avgResolutionHours} hrs)</span>
            </div>
            <div className="text-muted small mt-1">Calculated from verified closed cases</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="civic-card p-3">
            <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>
              Reopened Cases
            </div>
            <div className="fs-3 fw-bold text-dark mt-1">
              {metrics.reopenedComplaints}
            </div>
            <div className="text-muted small mt-1">Citizen requested reinvestigation</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="civic-card p-3">
            <div className="text-muted small text-uppercase fw-semibold" style={{ fontSize: '0.7rem' }}>
              Rejected / Out of Jurisdiction
            </div>
            <div className="fs-3 fw-bold text-danger mt-1">
              {metrics.rejectedComplaints}
            </div>
            <div className="text-muted small mt-1">Disallowed with formal administrative remark</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-4">
        {/* Inflow Trend Chart */}
        <div className="col-lg-7">
          <div className="civic-card h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0" style={{ color: '#19324D' }}>
                14-Day Complaint Inflow Trend
              </h6>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>Daily Registrations</span>
            </div>
            <div style={{ height: '240px' }}>
              {dailyTrends.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                  No trend data available for recent window.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTrends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#19324D', color: '#FFFFFF', borderRadius: '4px', fontSize: '12px' }}
                      itemStyle={{ color: '#FFFFFF' }}
                    />
                    <Area
                      type="monotone"
                      dataKey="count"
                      name="Complaints"
                      stroke="#19324D"
                      strokeWidth={2}
                      fill="#EBF3FA"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Category Breakdown Chart */}
        <div className="col-lg-5">
          <div className="civic-card h-100 p-3">
            <div className="d-flex align-items-center justify-content-between mb-3">
              <h6 className="fw-bold mb-0" style={{ color: '#19324D' }}>
                Category Distribution
              </h6>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>By Category</span>
            </div>
            <div style={{ height: '240px' }}>
              {categoryDist.length === 0 ? (
                <div className="d-flex align-items-center justify-content-center h-100 text-muted small">
                  No category data available.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryDist} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis type="category" dataKey="category" width={110} tick={{ fontSize: 11, fill: '#334155' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#19324D', color: '#FFFFFF', borderRadius: '4px', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" name="Complaints" radius={[0, 4, 4, 0]}>
                      {categoryDist.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Department Workload Table */}
      <div className="civic-card mb-4">
        <div className="civic-card-header">
          <h6 className="mb-0 fw-bold" style={{ color: '#19324D' }}>
            Department Workload & Active Caseload
          </h6>
          <Link to="/admin/departments" className="small text-primary fw-medium">
            Manage Departments <ArrowRight size={14} />
          </Link>
        </div>
        <div className="civic-card-body p-0">
          <div className="table-responsive">
            <table className="table-civic">
              <thead>
                <tr>
                  <th>Department Name</th>
                  <th>Code</th>
                  <th>Active Complaints</th>
                  <th>Resolved Cases</th>
                  <th>Total Assigned</th>
                  <th>Current Load Status</th>
                </tr>
              </thead>
              <tbody>
                {deptWorkload.map((dept) => {
                  const active = dept.active_count || 0;
                  return (
                    <tr key={dept.id}>
                      <td className="fw-semibold text-dark">{dept.name}</td>
                      <td>
                        <span className="badge bg-light text-dark border small">{dept.code}</span>
                      </td>
                      <td className="fw-bold text-primary">{active}</td>
                      <td className="text-success">{dept.resolved_count || 0}</td>
                      <td>{dept.total_assigned || 0}</td>
                      <td>
                        {active > 5 ? (
                          <span className="badge bg-warning text-dark small">Heavy Load</span>
                        ) : active > 0 ? (
                          <span className="badge bg-info-subtle text-info border small">Normal Flow</span>
                        ) : (
                          <span className="badge bg-light text-muted border small">Idle / Cleared</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 5 Most Recent Complaints */}
      <div className="civic-card">
        <div className="civic-card-header">
          <h6 className="mb-0 fw-bold" style={{ color: '#19324D' }}>
            Latest Complaint Inflow
          </h6>
          <Link to="/admin/complaints" className="small text-primary fw-medium">
            View All Grievances <ArrowRight size={14} />
          </Link>
        </div>
        <div className="civic-card-body p-0">
          <div className="table-responsive">
            <table className="table-civic">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Citizen</th>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentComplaints.map((item) => (
                  <tr key={item.id}>
                    <td className="fw-semibold text-dark">{item.reference_number}</td>
                    <td className="small text-dark">{item.citizen_name}</td>
                    <td>
                      <div className="text-dark fw-medium text-truncate" style={{ maxWidth: '240px' }}>
                        {item.title}
                      </div>
                    </td>
                    <td>{item.category}</td>
                    <td>
                      <PriorityBadge priority={item.priority} />
                    </td>
                    <td>
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="small text-muted">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="text-end">
                      <Link
                        to={`/admin/complaints/${item.id}`}
                        className="btn btn-sm btn-outline-secondary py-1 px-2.5 small"
                      >
                        Review Case <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
