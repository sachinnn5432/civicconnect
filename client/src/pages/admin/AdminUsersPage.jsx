import React, { useState, useEffect, useCallback } from 'react';
import { Users, Search, Shield, UserCheck, UserX, AlertCircle } from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import ConfirmModal from '../../components/ConfirmModal.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export default function AdminUsersPage() {
  const { user: currentAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('all');
  const [status, setStatus] = useState('all');

  // Deactivation Modal State
  const [targetUser, setTargetUser] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchUsers = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const res = await adminApi.getUsers({
        page,
        limit: 15,
        search: search.trim(),
        role,
        status
      });
      if (res.data?.success) {
        setUsers(res.data.data.users || []);
        setPagination(res.data.data.pagination);
      }
    } catch (err) {
      toastError('Failed to fetch user directory.');
    } finally {
      setLoading(false);
    }
  }, [search, role, status, toastError]);

  useEffect(() => {
    fetchUsers(1);
  }, [fetchUsers]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(1);
  };

  const handleToggleStatusClick = (u) => {
    if (u.id === currentAdmin.id) {
      toastError('Security safeguard: You cannot deactivate your own administrative account.');
      return;
    }
    setTargetUser(u);
    setConfirmModalOpen(true);
  };

  const handleConfirmToggle = async () => {
    if (!targetUser) return;
    try {
      setActionLoading(true);
      const newStatus = targetUser.is_active ? 0 : 1;
      const res = await adminApi.updateUserStatus(targetUser.id, { isActive: newStatus });
      if (res.data?.success) {
        success(res.data.message);
        setConfirmModalOpen(false);
        setTargetUser(null);
        await fetchUsers(pagination.page);
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update user status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
            Registered Citizen & Staff Directory
          </h1>
          <p className="text-muted small mb-0">
            View registered user accounts, complaint histories, and manage access authorizations.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="civic-card p-3 mb-4">
        <form onSubmit={handleSearchSubmit} className="row g-2">
          <div className="col-lg-6 col-md-6">
            <div className="input-group">
              <span className="input-group-text bg-white border-end-0 text-muted">
                <Search size={16} />
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by citizen name, email, or phone..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="col-lg-2 col-md-3 col-6">
            <select
              className="form-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="citizen">Citizens</option>
              <option value="admin">Administrators</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-3 col-6">
            <select
              className="form-select"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">All Account States</option>
              <option value="active">Active Only</option>
              <option value="inactive">Deactivated Only</option>
            </select>
          </div>

          <div className="col-lg-2 col-md-12">
            <button type="submit" className="btn-civic-primary w-100 justify-content-center">
              Filter Users
            </button>
          </div>
        </form>
      </div>

      {/* Users Table */}
      <div className="civic-card">
        <div className="civic-card-header">
          <span className="small fw-semibold text-dark">
            User Accounts ({pagination.total})
          </span>
          <span className="text-muted small">
            Page {pagination.page} of {pagination.totalPages || 1}
          </span>
        </div>

        <div className="civic-card-body p-0">
          {loading ? (
            <div className="p-3">
              <TableSkeleton rows={6} cols={6} />
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="table-civic">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Email & Phone</th>
                      <th>Residential / Office Address</th>
                      <th>Role</th>
                      <th>Complaints Filed</th>
                      <th>Account Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => {
                      const isSelf = u.id === currentAdmin.id;
                      return (
                        <tr key={u.id}>
                          <td className="fw-semibold text-dark">
                            {u.name} {isSelf && <span className="badge bg-light text-primary border ms-1">You</span>}
                          </td>
                          <td>
                            <div className="small text-dark">{u.email}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.phone}</div>
                          </td>
                          <td className="small text-muted" style={{ maxWidth: '240px' }}>
                            {u.address}
                          </td>
                          <td>
                            {u.role === 'admin' ? (
                              <span className="badge bg-primary-subtle text-primary border small">Administrator</span>
                            ) : (
                              <span className="badge bg-secondary-subtle text-secondary border small">Citizen</span>
                            )}
                          </td>
                          <td className="fw-bold text-dark">{u.complaint_count}</td>
                          <td>
                            {u.is_active ? (
                              <span className="badge bg-success-subtle text-success border small">Active</span>
                            ) : (
                              <span className="badge bg-danger-subtle text-danger border small">Deactivated</span>
                            )}
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className={`btn btn-sm py-1 px-2.5 small ${u.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                              disabled={isSelf}
                              onClick={() => handleToggleStatusClick(u)}
                            >
                              {u.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {pagination.totalPages > 1 && (
                <div className="p-3 border-top d-flex justify-content-between align-items-center">
                  <button
                    className="btn-civic-secondary btn-sm"
                    disabled={pagination.page <= 1}
                    onClick={() => fetchUsers(pagination.page - 1)}
                  >
                    Previous
                  </button>
                  <span className="small text-muted">
                    Page {pagination.page} of {pagination.totalPages}
                  </span>
                  <button
                    className="btn-civic-secondary btn-sm"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() => fetchUsers(pagination.page + 1)}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {targetUser && (
        <ConfirmModal
          isOpen={confirmModalOpen}
          title={targetUser.is_active ? 'Deactivate User Account' : 'Activate User Account'}
          message={`Are you sure you want to ${targetUser.is_active ? 'deactivate' : 'activate'} the account for ${targetUser.name} (${targetUser.email})? ${targetUser.is_active ? 'The user will be immediately logged out and prevented from signing in.' : 'The user will regain portal access.'}`}
          confirmLabel={targetUser.is_active ? 'Confirm Deactivate' : 'Confirm Activate'}
          confirmVariant={targetUser.is_active ? 'danger' : 'primary'}
          onConfirm={handleConfirmToggle}
          onCancel={() => {
            setConfirmModalOpen(false);
            setTargetUser(null);
          }}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
