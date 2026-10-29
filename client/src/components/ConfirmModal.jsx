import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title = 'Confirm Action',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary', // 'primary' | 'danger'
  onConfirm,
  onCancel,
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{ backgroundColor: 'rgba(15, 23, 42, 0.45)', backdropFilter: 'blur(2px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: '440px' }}>
        <div className="modal-content shadow border-0" style={{ borderRadius: '6px' }}>
          <div className="modal-header py-2.5 px-3 border-bottom">
            <h6 className="modal-title d-flex align-items-center gap-2 mb-0" style={{ color: '#19324D' }}>
              <AlertTriangle size={18} className={confirmVariant === 'danger' ? 'text-danger' : 'text-primary'} />
              {title}
            </h6>
            <button
              type="button"
              className="btn btn-sm p-0 text-muted border-0"
              onClick={onCancel}
              disabled={loading}
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
          <div className="modal-body py-3 px-3 text-secondary" style={{ fontSize: '0.875rem' }}>
            {message}
          </div>
          <div className="modal-footer py-2 px-3 border-top bg-light gap-2">
            <button
              type="button"
              className="btn-civic-secondary btn-sm"
              onClick={onCancel}
              disabled={loading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={confirmVariant === 'danger' ? 'btn btn-danger btn-sm' : 'btn-civic-primary btn-sm'}
              onClick={onConfirm}
              disabled={loading}
            >
              {loading ? 'Processing...' : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
