import React from 'react';
import { Inbox } from 'lucide-react';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  description = 'There are currently no items matching your criteria.',
  actionLabel,
  onAction
}) {
  return (
    <div className="text-center py-5 px-3">
      <div
        className="d-inline-flex align-items-center justify-content-center rounded-circle mb-3"
        style={{ width: '48px', height: '48px', backgroundColor: '#F1F5F9', color: '#68717C' }}
      >
        <Icon size={24} />
      </div>
      <h6 className="mb-1" style={{ color: '#19324D' }}>{title}</h6>
      <p className="text-muted small mb-3 mx-auto" style={{ maxWidth: '400px' }}>
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          className="btn-civic-primary btn-sm"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
