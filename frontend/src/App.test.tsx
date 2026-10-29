import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { StatusBadge } from './components/StatusBadge';
import { LifecycleTimeline } from './components/LifecycleTimeline';
import { MatchScoreCard } from './components/MatchScoreCard';
import { MatchScoreResult } from './types';

describe('Frontend UI Components', () => {
  it('renders status badge with appropriate styling and labels', () => {
    const { container } = render(<StatusBadge status="AVAILABLE" />);
    expect(container.textContent).toContain('Available');

    const { container: transitContainer } = render(<StatusBadge status="PICKED_UP" />);
    expect(transitContainer.textContent).toContain('In Transit');
  });

  it('renders lifecycle timeline steps properly', () => {
    const { container } = render(<LifecycleTimeline currentStatus="ACCEPTED" />);
    expect(container.textContent).toContain('Surplus Listed');
    expect(container.textContent).toContain('Accepted');
    expect(container.textContent).toContain('Delivered');
  });

  it('renders transparent rule-based match score card breakdown', () => {
    const dummyMatch: MatchScoreResult = {
      isEligible: true,
      score: 92,
      breakdown: {
        distance: { score: 95, weightedScore: 33.25, weight: 0.35, reason: 'Close by (1.2 km)' },
        pickupTime: { score: 100, weightedScore: 25, weight: 0.25, reason: 'Ample window' },
        quantityFit: { score: 85, weightedScore: 17, weight: 0.2, reason: 'Good quantity' },
        categoryPref: { score: 100, weightedScore: 10, weight: 0.1, reason: 'Matches category' },
        urgency: { score: 80, weightedScore: 8, weight: 0.1, reason: 'Moderate urgency' },
      },
      reasons: ['Close by (1.2 km)', 'Ample window', 'Matches category'],
      calculatedDistanceKm: 1.2,
      hasIncompleteLocationData: false,
    };

    const { container } = render(<MatchScoreCard recommendation={dummyMatch} />);
    expect(container.textContent).toContain('Explainable Match Score');
    expect(container.textContent).toContain('92 / 100');
    expect(container.textContent).toContain('Distance Suitability (35%)');
    expect(container.textContent).toContain('Pickup Window (25%)');
    expect(container.textContent).toContain('Close by (1.2 km)');
  });
});
