import React, { useState, useEffect, useCallback } from 'react';
import { Building2, Plus, Edit2, CheckCircle2, XCircle, Search } from 'lucide-react';
import { adminApi } from '../../services/api.js';
import { useToast } from '../../context/ToastContext.jsx';
import { TableSkeleton } from '../../components/LoadingSkeleton.jsx';

export default function AdminDepartmentsPage() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [formData, setFormData] = useState({ name: '', code: '', description: '' });
  const [modalLoading, setModalLoading] = useState(false);

  const { success, error: toastError } = useToast();

  const fetchDepartments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDepartments();
      if (res.data?.success) {
        setDepartments(res.data.data.departments || []);
      }
    } catch (err) {
      toastError('Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const openCreateModal = () => {
    setEditingDept(null);
    setFormData({ name: '', code: '', description: '' });
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setFormData({
      name: dept.name,
      code: dept.code,
      description: dept.description || ''
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalLoading(true);

    try {
      if (editingDept) {
        const res = await adminApi.updateDepartment(editingDept.id, {
          ...formData,
          is_active: editingDept.is_active
        });
        if (res.data?.success) {
          success(res.data.message);
          setModalOpen(false);
          await fetchDepartments();
        }
      } else {
        const res = await adminApi.createDepartment(formData);
        if (res.data?.success) {
          success(res.data.message);
          setModalOpen(false);
          await fetchDepartments();
        }
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleToggleStatus = async (dept) => {
    try {
      const res = await adminApi.toggleDepartmentStatus(dept.id);
      if (res.data?.success) {
        success(res.data.message);
        await fetchDepartments();
      }
    } catch (err) {
      toastError(err.response?.data?.message || 'Failed to update department status.');
    }
  };

  return (
    <div>
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 mb-4">
        <div>
          <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
            Municipal Departments Directory
          </h1>
          <p className="text-muted small mb-0">
            Manage functional municipal divisions, service codes, and active grievance workload.
          </p>
        </div>
        <button
          type="button"
          className="btn-civic-accent btn-sm d-flex align-items-center gap-1.5"
          onClick={openCreateModal}
        >
          <Plus size={16} /> Add Department
        </button>
      </div>

      <div className="civic-card">
        <div className="civic-card-header">
          <span className="small fw-semibold text-dark">
            Departments ({departments.length})
          </span>
        </div>

        <div className="civic-card-body p-0">
          {loading ? (
            <div className="p-3">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table-civic">
                <thead>
                  <tr>
                    <th>Department Name</th>
                    <th>Code</th>
                    <th>Description</th>
                    <th>Active Complaints</th>
                    <th>Status</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {departments.map((dept) => (
                    <tr key={dept.id}>
                      <td className="fw-semibold text-dark">
                        <div className="d-flex align-items-center gap-2">
                          <Building2 size={16} className="text-muted" />
                          <span>{dept.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark border">{dept.code}</span>
                      </td>
                      <td className="small text-muted" style={{ maxWidth: '300px' }}>
                        {dept.description || 'No description provided.'}
                      </td>
                      <td className="fw-bold text-primary">
                        {dept.active_complaints || 0}
                      </td>
                      <td>
                        {dept.is_active ? (
                          <span className="badge bg-success-subtle text-success border small">Active</span>
                        ) : (
                          <span className="badge bg-danger-subtle text-danger border small">Inactive</span>
                        )}
                      </td>
                      <td className="text-end">
                        <div className="d-inline-flex gap-1">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-1 px-2 small"
                            onClick={() => openEditModal(dept)}
                          >
                            <Edit2 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            className={`btn btn-sm py-1 px-2 small ${dept.is_active ? 'btn-outline-danger' : 'btn-outline-success'}`}
                            onClick={() => handleToggleStatus(dept)}
                          >
                            {dept.is_active ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Modal */}
      {modalOpen && (
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
                  {editingDept ? 'Edit Municipal Department' : 'Create New Department'}
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setModalOpen(false)}
                />
              </div>
              <form onSubmit={handleModalSubmit}>
                <div className="modal-body p-3">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="deptNameInput">Department Name</label>
                    <input
                      id="deptNameInput"
                      type="text"
                      className="form-control"
                      placeholder="e.g. Parks & Recreation"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label" htmlFor="deptCodeInput">Department Code (Uppercase)</label>
                    <input
                      id="deptCodeInput"
                      type="text"
                      className="form-control"
                      placeholder="e.g. PARKS"
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label" htmlFor="deptDescInput">Description / Scope of Work</label>
                    <textarea
                      id="deptDescInput"
                      rows={3}
                      className="form-control"
                      placeholder="Specify types of civic grievances handled by this department..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </div>
                <div className="modal-footer py-2 px-3 border-top bg-light">
                  <button
                    type="button"
                    className="btn-civic-secondary btn-sm"
                    onClick={() => setModalOpen(false)}
                    disabled={modalLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-civic-primary btn-sm"
                    disabled={modalLoading}
                  >
                    {modalLoading ? 'Saving...' : editingDept ? 'Save Changes' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
