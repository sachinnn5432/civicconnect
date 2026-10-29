import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  AlertCircle,
  MapPin,
  CheckCircle2,
  X,
  FileCheck,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { complaintApi } from '../../services/api.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

const CATEGORIES = [
  'Roads',
  'Water Supply',
  'Electricity',
  'Sanitation',
  'Garbage Collection',
  'Drainage',
  'Streetlights',
  'Public Safety',
  'Other'
];

export default function SubmitComplaintPage() {
  const { user } = useAuth();
  const { success } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: '',
    category: 'Roads',
    location: user?.address || '',
    priority: 'medium',
    description: ''
  });

  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate size (max 5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('Attachment exceeds the 5MB file size limit.');
      return;
    }

    // Validate format
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMsg('Invalid file format. Please upload JPG, PNG, WEBP, or PDF.');
      return;
    }

    setErrorMsg('');
    setFile(selectedFile);

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setFilePreview(reader.result);
      reader.readAsDataURL(selectedFile);
    } else {
      setFilePreview(null);
    }
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (formData.title.trim().length < 5) {
      setErrorMsg('Complaint title must be at least 5 characters long.');
      return;
    }

    if (formData.description.trim().length < 15) {
      setErrorMsg('Please provide a detailed description (at least 15 characters) so field officers can locate and diagnose the problem.');
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append('title', formData.title.trim());
      payload.append('category', formData.category);
      payload.append('location', formData.location.trim());
      payload.append('priority', formData.priority);
      payload.append('description', formData.description.trim());

      if (file) {
        payload.append('attachment', file);
      }

      const res = await complaintApi.create(payload);

      if (res.data?.success) {
        const newComplaint = res.data.data;
        success(`Grievance registered successfully with reference: ${newComplaint.referenceNumber}`);
        navigate(`/complaints/${newComplaint.id}`);
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to submit complaint. Please check your connection and inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-2" style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div className="mb-4">
        <h1 className="fs-4 fw-bold mb-1" style={{ color: '#19324D' }}>
          Register a Municipal Grievance
        </h1>
        <p className="text-muted small">
          Submit details of the civic issue. Your complaint will be assigned an official tracking reference and forwarded to the concerned municipal department.
        </p>
      </div>

      <div className="civic-card p-4 shadow-sm">
        {errorMsg && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
            <AlertCircle size={18} />
            <div>{errorMsg}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Reference Number notice */}
          <div className="p-2.5 rounded bg-light border mb-4 d-flex align-items-center justify-content-between">
            <span className="small text-muted">
              Reference Number format: <strong className="text-dark">CC-{new Date().getFullYear()}-XXXXX</strong> (Assigned automatically upon submission)
            </span>
            <span className="badge bg-secondary-subtle text-secondary border small">
              Official Grievance Form
            </span>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="complaintTitle">
              Complaint Subject / Title <span className="text-danger">*</span>
            </label>
            <input
              id="complaintTitle"
              name="title"
              type="text"
              className="form-control"
              placeholder="e.g. Major water pipeline leakage flooding residential road"
              value={formData.title}
              onChange={handleChange}
              required
            />
          </div>

          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" htmlFor="complaintCategory">
                Civic Category <span className="text-danger">*</span>
              </label>
              <select
                id="complaintCategory"
                name="category"
                className="form-select"
                value={formData.category}
                onChange={handleChange}
                required
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label" htmlFor="complaintPriority">
                Severity / Priority Level
              </label>
              <select
                id="complaintPriority"
                name="priority"
                className="form-select"
                value={formData.priority}
                onChange={handleChange}
              >
                <option value="low">Low — Routine maintenance or non-disruptive</option>
                <option value="medium">Medium — Standard civic issue affecting street</option>
                <option value="high">High — Significant public inconvenience or obstruction</option>
                <option value="urgent">Urgent — Immediate safety hazard, life risk, or flooding</option>
              </select>
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label" htmlFor="complaintLocation">
              Location / Landmark / Street Address <span className="text-danger">*</span>
            </label>
            <div className="input-group">
              <span className="input-group-text bg-white text-muted">
                <MapPin size={16} />
              </span>
              <input
                id="complaintLocation"
                name="location"
                type="text"
                className="form-control"
                placeholder="Specific street name, near landmark, building or ward number"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </div>
            <div className="form-text" style={{ fontSize: '0.75rem' }}>
              Be as specific as possible to assist field engineering crews.
            </div>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-1">
              <label className="form-label mb-0" htmlFor="complaintDesc">
                Detailed Issue Description <span className="text-danger">*</span>
              </label>
              <span className="text-muted small" style={{ fontSize: '0.75rem' }}>
                {formData.description.length} characters (min. 15)
              </span>
            </div>
            <textarea
              id="complaintDesc"
              name="description"
              rows={4}
              className="form-control"
              placeholder="Describe the problem, duration of issue, exact extent of damage, and any previous attempts made..."
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          {/* Optional Attachment Upload */}
          <div className="mb-4">
            <label className="form-label d-block">
              Attach Supporting Photo or Document (Optional)
            </label>
            {!file ? (
              <div
                className="p-3 border rounded text-center bg-light"
                style={{ borderStyle: 'dashed !important', cursor: 'pointer' }}
                onClick={() => document.getElementById('fileUploadInput').click()}
              >
                <Upload size={24} className="text-muted mb-2" />
                <div className="small fw-semibold text-dark">
                  Click to select photo or document
                </div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Supported formats: JPG, PNG, WEBP, PDF (Max 5MB)
                </div>
                <input
                  id="fileUploadInput"
                  type="file"
                  className="d-none"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="p-3 border rounded bg-white d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Attachment Preview"
                      style={{ width: '48px', height: '48px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                  ) : (
                    <div className="p-2 bg-light rounded text-muted">
                      <FileCheck size={24} />
                    </div>
                  )}
                  <div>
                    <div className="fw-semibold small text-dark text-truncate" style={{ maxWidth: '300px' }}>
                      {file.name}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger p-1"
                  onClick={removeFile}
                  aria-label="Remove attachment"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>

          {/* Citizen Prefilled Verification */}
          <div className="p-3 bg-light rounded border mb-4">
            <div className="d-flex align-items-center gap-2 mb-2">
              <ShieldCheck size={16} className="text-success" />
              <span className="small fw-semibold text-dark">Filing Citizen Profile Verification</span>
            </div>
            <div className="row g-2 small text-muted">
              <div className="col-sm-4">
                Name: <span className="text-dark fw-medium">{user?.name}</span>
              </div>
              <div className="col-sm-4">
                Phone: <span className="text-dark fw-medium">{user?.phone}</span>
              </div>
              <div className="col-sm-4">
                Email: <span className="text-dark fw-medium">{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="d-flex align-items-center justify-content-end gap-2">
            <Link to="/dashboard" className="btn-civic-secondary">
              Cancel
            </Link>
            <button
              type="submit"
              className="btn-civic-accent px-4"
              disabled={loading}
            >
              {loading ? 'Submitting Grievance...' : 'Submit Grievance'} <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
