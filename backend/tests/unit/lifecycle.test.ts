import { describe, it, expect } from 'vitest';
import {
  isValidListingTransition,
  isValidRequestTransition,
  isValidAssignmentTransition,
} from '../../src/utils/lifecycle';

describe('Donation Lifecycle State Transitions', () => {
  describe('Listing Transitions', () => {
    it('allows valid progressive lifecycle transitions', () => {
      expect(isValidListingTransition('AVAILABLE', 'REQUESTED')).toBe(true);
      expect(isValidListingTransition('REQUESTED', 'ACCEPTED')).toBe(true);
      expect(isValidListingTransition('ACCEPTED', 'VOLUNTEER_ASSIGNED')).toBe(true);
      expect(isValidListingTransition('VOLUNTEER_ASSIGNED', 'PICKED_UP')).toBe(true);
      expect(isValidListingTransition('PICKED_UP', 'DELIVERED')).toBe(true);
      expect(isValidListingTransition('DELIVERED', 'COMPLETED')).toBe(true);
    });

    it('allows cancellation and expiration from appropriate states', () => {
      expect(isValidListingTransition('AVAILABLE', 'CANCELLED')).toBe(true);
      expect(isValidListingTransition('AVAILABLE', 'EXPIRED')).toBe(true);
      expect(isValidListingTransition('REQUESTED', 'CANCELLED')).toBe(true);
    });

    it('rejects arbitrary backwards transitions', () => {
      expect(isValidListingTransition('COMPLETED', 'AVAILABLE')).toBe(false);
      expect(isValidListingTransition('DELIVERED', 'REQUESTED')).toBe(false);
      expect(isValidListingTransition('PICKED_UP', 'AVAILABLE')).toBe(false);
      expect(isValidListingTransition('EXPIRED', 'AVAILABLE')).toBe(false);
    });
  });

  describe('Request Transitions', () => {
    it('allows PENDING to be ACCEPTED, REJECTED, or CANCELLED', () => {
      expect(isValidRequestTransition('PENDING', 'ACCEPTED')).toBe(true);
      expect(isValidRequestTransition('PENDING', 'REJECTED')).toBe(true);
      expect(isValidRequestTransition('PENDING', 'CANCELLED')).toBe(true);
    });

    it('disallows modifying terminal states', () => {
      expect(isValidRequestTransition('REJECTED', 'ACCEPTED')).toBe(false);
      expect(isValidRequestTransition('CANCELLED', 'ACCEPTED')).toBe(false);
      expect(isValidRequestTransition('COMPLETED', 'PENDING')).toBe(false);
    });
  });

  describe('Volunteer Assignment Transitions', () => {
    it('enforces sequential progression ASSIGNED -> PICKED_UP -> DELIVERED', () => {
      expect(isValidAssignmentTransition('ASSIGNED', 'PICKED_UP')).toBe(true);
      expect(isValidAssignmentTransition('PICKED_UP', 'DELIVERED')).toBe(true);
      expect(isValidAssignmentTransition('ASSIGNED', 'DELIVERED')).toBe(false); // cannot skip pickup
      expect(isValidAssignmentTransition('DELIVERED', 'ASSIGNED')).toBe(false);
    });
  });
});
