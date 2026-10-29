import { describe, it, expect } from 'vitest';
import { calculateHaversineDistance } from '../../src/utils/haversine';

describe('Haversine Distance Calculator', () => {
  it('correctly calculates distance between two known coordinates', () => {
    // San Francisco Civic Center (37.7785, -122.4167) to Ferry Building (37.7955, -122.3937)
    // Approximately 2.8 - 2.9 km
    const distance = calculateHaversineDistance(37.7785, -122.4167, 37.7955, -122.3937);
    expect(distance).not.toBeNull();
    expect(distance).toBeGreaterThan(2.5);
    expect(distance).toBeLessThan(3.2);
  });

  it('returns 0 for identical coordinates', () => {
    const distance = calculateHaversineDistance(40.7128, -74.006, 40.7128, -74.006);
    expect(distance).toBe(0);
  });

  it('handles missing or undefined coordinates gracefully', () => {
    expect(calculateHaversineDistance(undefined, -122.4, 37.7, -122.3)).toBeNull();
    expect(calculateHaversineDistance(37.7, null, 37.7, -122.3)).toBeNull();
    expect(calculateHaversineDistance(37.7, -122.4, null, null)).toBeNull();
  });

  it('handles invalid NaN coordinates safely', () => {
    expect(calculateHaversineDistance(NaN, -122.4, 37.7, -122.3)).toBeNull();
  });
});
