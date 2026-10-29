import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { complaintApi, userApi } from '../../services/api.js';
import StatCard from '../../components/StatCard.jsx';
import StatusBadge from '../../components/StatusBadge.jsx';
import PriorityBadge from '../../components/PriorityBadge.jsx';
import EmptyState from '../../components/EmptyState.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export default function CitizenDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, active: 0, resolved: 0 });
  const [recentComplaints, setRecentComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        // Load stats from profile
        const profileRes = await userApi.getProfile();
        if (profileRes.data?.success) {
          setStats(profileRes.data.data.stats || { total: 0, active: 0, resolved: 0 });
        }

        // Load 5 recent complaints
        const complaintsRes = await complaintApi.getMyComplaints({ page: 1, limit: 5 });
        if (complaintsRes.data?.success) {
          setRecentComplaints(complaintsRes.data.data.complaints || []);
        }
      } catch (err) {
        console.error('Failed to load citizen dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  return (
    <div>
      {/* Welcome Bar */}
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4 p-3 bg-white border rounded">
        <div>
          <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
            Welcome, {user?.name}
          </h1>
          <div className="text-muted small d-flex align-items-center gap-1">
            <MapPin size={14} /> Registered Address: {user?.address || 'Municipal Zone'}
          </div>
        </div>
        <Link to="/complaints/new" className="btn-civic-accent">
          <PlusCircle size={16} /> Submit New Complaint
        </Link>
      </div>

      {/* Summary Stat Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-4">
          <StatCard
            title="Total Submitted"
            value={stats.total}
            icon={FileText}
            subtext="All grievances filed under this account"
          />
        </div>
        <div className="col-md-4">
          <StatCard
            title="Active / In-Progress"
            value={stats.active}
            icon={Clock}
            subtext="Currently undergoing review or field work"
          />
        </div>
        <div className="col-md-4">
          <StatCard
            title="Successfully Resolved"
            value={stats.resolved}
            icon={CheckCircle2}
            subtext="Work inspected and verified completed"
          />
        </div>
      </div>

      {/* Recent Submissions Card */}
      <div className="civic-card mb-4">
        <div className="civic-card-header">
          <h6 className="mb-0 fw-bold" style={{ color: '#19324D' }}>
            Recent Complaints & Progress
          </h6>
          <Link to="/complaints/my" className="small text-primary fw-medium">
            View All ({stats.total}) <ArrowRight size={14} />
          </Link>
        </div>

        <div className="civic-card-body p-0">
          {loading ? (
            <div className="p-3">
              <TableSkeleton rows={3} cols={5} />
            </div>
          ) : recentComplaints.length === 0 ? (
            <EmptyState
              title="No complaints filed yet"
              description="You have not submitted any municipal complaints. Report a civic issue in your locality to start tracking its resolution."
              actionLabel="Submit First Complaint"
              onAction={() => window.location.href = '/complaints/new'}
            />
          ) : (
            <div className="table-responsive">
              <table className="table-civic">
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Issue Title</th>
                    <th>Category</th>
                    <th>Priority</th>
                    <th>Status</th>
                    <th>Submitted</th>
                    <th className="text-end">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentComplaints.map((item) => (
                    <tr key={item.id}>
                      <td className="fw-semibold text-dark">
                        <Link to={`/complaints/${item.id}`} className="text-dark hover-underline">
                          {item.reference_number}
                        </Link>
                      </td>
                      <td>
                        <div className="fw-medium text-dark text-truncate" style={{ maxWidth: '240px' }}>
                          {item.title}
                        </div>
                        <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                          {item.location}
                        </div>
                      </td>
                      <td>{item.category}</td>
                      <td>
                        <PriorityBadge priority={item.priority} />
                      </td>
                      <td>
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="text-muted small">
                        {new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="text-end">
                        <Link
                          to={`/complaints/${item.id}`}
                          className="btn btn-sm btn-outline-secondary py-1 px-2 d-inline-flex align-items-center gap-1"
                          style={{ fontSize: '0.75rem' }}
                        >
                          Details <ExternalLink size={12} />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
