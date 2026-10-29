import { describe, it, expect } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../components/StatusBadge.jsx';
import PriorityBadge from '../components/PriorityBadge.jsx';
import StatCard from '../components/StatCard.jsx';
import EmptyState from '../components/EmptyState.jsx';

describe('CivicConnect UI Components Tests', () => {
  it('StatusBadge renders appropriate label for submitted', () => {
    render(<StatusBadge status="submitted" />);
    expect(screen.getByText('Submitted')).toBeInTheDocument();
  });

  it('StatusBadge renders appropriate label for in_progress', () => {
    render(<StatusBadge status="in_progress" />);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('StatusBadge renders appropriate label for resolved', () => {
    render(<StatusBadge status="resolved" />);
    expect(screen.getByText('Resolved')).toBeInTheDocument();
  });

  it('PriorityBadge renders correct priority text', () => {
    render(<PriorityBadge priority="urgent" />);
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('StatCard renders title, value, and subtext', () => {
    render(
      <StatCard
        title="Total Complaints"
        value={42}
        subtext="All grievances registered"
      />
    );
    expect(screen.getByText('Total Complaints')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('All grievances registered')).toBeInTheDocument();
  });

  it('EmptyState renders title, description, and action button', () => {
    render(
      <EmptyState
        title="No complaints found"
        description="Try adjusting your filter options"
        actionLabel="Clear Filters"
        onAction={() => {}}
      />
    );
    expect(screen.getByText('No complaints found')).toBeInTheDocument();
    expect(screen.getByText('Try adjusting your filter options')).toBeInTheDocument();
    expect(screen.getByText('Clear Filters')).toBeInTheDocument();
  });
});
