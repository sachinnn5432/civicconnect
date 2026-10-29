import React from 'react';
import { Check, Clock, AlertCircle, RefreshCw, FileText } from 'lucide-react';

export default function ComplaintTimeline({ timeline = [] }) {
  if (!timeline || timeline.length === 0) {
    return <div className="text-muted small">No progress records available.</div>;
  }

  const getNodeIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <Check size={12} className="text-white" />;
      case 'rejected':
        return <AlertCircle size={12} className="text-white" />;
      case 'reopened':
        return <RefreshCw size={12} className="text-white" />;
      case 'in_progress':
      case 'under_review':
        return <Clock size={12} className="text-white" />;
      default:
        return <FileText size={12} className="text-white" />;
    }
  };

  const getNodeClass = (status) => {
    if (status === 'resolved') return 'timeline-node resolved';
    if (status === 'rejected') return 'timeline-node' + ' bg-danger border-danger';
    if (status === 'reopened') return 'timeline-node' + ' bg-purple border-purple';
    return 'timeline-node active';
  };

  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="timeline-container py-2">
      {timeline.map((event, index) => {
        const isInternal = event.visibility === 'internal';

        return (
          <div key={event.id || index} className="timeline-item">
            <div className={getNodeClass(event.new_status)}>
              {getNodeIcon(event.new_status)}
            </div>
            <div>
              <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                <span className="fw-semibold text-capitalize" style={{ color: '#19324D' }}>
                  {event.new_status ? event.new_status.replace('_', ' ') : 'Status Update'}
                </span>
                {isInternal && (
                  <span className="badge bg-secondary-subtle text-secondary border small py-0.5">
                    Internal Note
                  </span>
                )}
                <span className="text-muted small">
                  • {formatDate(event.created_at)}
                </span>
              </div>

              <div
                className="p-2.5 rounded text-dark small"
                style={{
                  backgroundColor: isInternal ? '#FFFBEB' : '#F8FAFC',
                  border: isInternal ? '1px solid #FEF3C7' : '1px solid #E2E8F0'
                }}
              >
                <p className="mb-1 text-secondary" style={{ whiteSpace: 'pre-line' }}>
                  {event.remarks}
                </p>
                {event.updated_by_name && (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    Updated by: <span className="fw-medium text-dark">{event.updated_by_name}</span> ({event.updated_by_role || 'staff'})
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
