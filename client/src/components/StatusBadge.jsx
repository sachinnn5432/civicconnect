import React from 'react';

const STATUS_CONFIG = {
  submitted: {
    label: 'Submitted',
    className: 'badge-status-submitted'
  },
  under_review: {
    label: 'Under Review',
    className: 'badge-status-under_review'
  },
  in_progress: {
    label: 'In Progress',
    className: 'badge-status-in_progress'
  },
  resolved: {
    label: 'Resolved',
    className: 'badge-status-resolved'
  },
  rejected: {
    label: 'Rejected',
    className: 'badge-status-rejected'
  },
  reopened: {
    label: 'Reopened',
    className: 'badge-status-reopened'
  }
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || {
    label: status ? status.replace('_', ' ') : 'Unknown',
    className: 'badge-status-submitted'
  };

  return (
    <span className={`badge-status ${config.className}`}>
      {config.label}
    </span>
  );
}
