import { describe, it, expect } from 'vitest';
import { calculateMatchScore, ListingCandidate, RecipientProfile } from '../../src/modules/matching/matchingService';

describe('Explainable Rule-Based Matching Engine', () => {
  const baseNow = new Date('2026-10-29T12:00:00Z');

  const validListing: ListingCandidate = {
    id: 'list-1',
    title: 'Veggie Bowls',
    category: 'PREPARED_MEALS',
    quantity: 20,
    remainingQuantity: 20,
    unit: 'portions',
    expiresAt: new Date(baseNow.getTime() + 5 * 3600 * 1000), // in 5 hours
    pickupStartAt: new Date(baseNow.getTime() - 1 * 3600 * 1000),
    pickupEndAt: new Date(baseNow.getTime() + 4 * 3600 * 1000),
    status: 'AVAILABLE',
    latitude: 37.7749,
    longitude: -122.4194,
  };

  const verifiedRecipient: RecipientProfile = {
    id: 'recip-1',
    verificationStatus: 'VERIFIED',
    latitude: 37.7785,
    longitude: -122.4167,
    serviceRadiusKm: 15,
    preferredCategories: ['PREPARED_MEALS'],
  };

  it('calculates a high match score for close, verified, compatible listing', () => {
    const result = calculateMatchScore(validListing, verifiedRecipient, baseNow);
    expect(result.isEligible).toBe(true);
    expect(result.score).toBeGreaterThan(80);
    expect(result.reasons.length).toBeGreaterThan(0);
    expect(result.calculatedDistanceKm).toBeLessThan(2);
    expect(result.hasIncompleteLocationData).toBe(false);
  });

  it('disqualifies unverified organizations at the eligibility gate', () => {
    const unverifiedRecipient: RecipientProfile = {
      ...verifiedRecipient,
      verificationStatus: 'PENDING',
    };

    const result = calculateMatchScore(validListing, unverifiedRecipient, baseNow);
    expect(result.isEligible).toBe(false);
    expect(result.score).toBe(0);
    expect(result.ineligibilityReason).toContain('not verified');
  });

  it('disqualifies expired listings at the eligibility gate', () => {
    const expiredListing: ListingCandidate = {
      ...validListing,
      expiresAt: new Date(baseNow.getTime() - 3600 * 1000), // 1 hour in the past
    };

    const result = calculateMatchScore(expiredListing, verifiedRecipient, baseNow);
    expect(result.isEligible).toBe(false);
    expect(result.score).toBe(0);
    expect(result.ineligibilityReason).toContain('expired');
  });

  it('disqualifies listings with 0 remaining quantity', () => {
    const emptyListing: ListingCandidate = {
      ...validListing,
      remainingQuantity: 0,
    };

    const result = calculateMatchScore(emptyListing, verifiedRecipient, baseNow);
    expect(result.isEligible).toBe(false);
    expect(result.score).toBe(0);
    expect(result.ineligibilityReason).toContain('Remaining quantity is 0');
  });

  it('fairly renormalizes score when coordinates are missing and reports incomplete location data', () => {
    const noCoordsListing: ListingCandidate = {
      ...validListing,
      latitude: null,
      longitude: null,
    };

    const result = calculateMatchScore(noCoordsListing, verifiedRecipient, baseNow);
    expect(result.isEligible).toBe(true);
    expect(result.hasIncompleteLocationData).toBe(true);
    expect(result.calculatedDistanceKm).toBeNull();
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).toContain('Location coordinates missing; distance factor omitted fairly');
  });
});
