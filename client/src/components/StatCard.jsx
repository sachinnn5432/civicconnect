import React from 'react';

export default function StatCard({ title, value, icon: Icon, subtext, trend }) {
  return (
    <div className="stat-card h-100">
      <div className="d-flex align-items-center justify-content-between mb-1">
        <span className="stat-card-title">{title}</span>
        {Icon && (
          <div className="p-1.5 rounded" style={{ backgroundColor: '#F1F5F9', color: '#19324D' }}>
            <Icon size={18} />
          </div>
        )}
      </div>
      <div className="stat-card-value">{value}</div>
      {subtext && <div className="stat-card-subtext">{subtext}</div>}
      {trend && <div className="mt-2 text-xs font-semibold text-success">{trend}</div>}
    </div>
  );
}
