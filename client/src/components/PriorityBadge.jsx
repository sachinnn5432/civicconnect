import React from 'react';

const PRIORITY_CONFIG = {
  urgent: 'badge-priority-urgent',
  high: 'badge-priority-high',
  medium: 'badge-priority-medium',
  low: 'badge-priority-low'
};

export default function PriorityBadge({ priority = 'medium' }) {
  const p = priority.toLowerCase();
  const className = PRIORITY_CONFIG[p] || 'badge-priority-medium';

  return (
    <span className={`badge-priority ${className}`}>
      {p}
    </span>
  );
}
