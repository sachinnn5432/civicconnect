import React from 'react';

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div className="table-responsive">
      <table className="table-civic">
        <thead>
          <tr>
            {Array.from({ length: cols }).map((_, i) => (
              <th key={i}>
                <div className="skeleton-box" style={{ height: '14px', width: '80%' }} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, r) => (
            <tr key={r}>
              {Array.from({ length: cols }).map((_, c) => (
                <td key={c}>
                  <div className="skeleton-box" style={{ height: '14px', width: `${70 + (c % 3) * 10}%` }} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="civic-card p-3 mb-3">
      <div className="skeleton-box mb-2" style={{ height: '20px', width: '40%' }} />
      <div className="skeleton-box mb-3" style={{ height: '14px', width: '80%' }} />
      <div className="skeleton-box" style={{ height: '32px', width: '25%' }} />
    </div>
  );
}
