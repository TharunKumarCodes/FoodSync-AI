import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';

const app = createApp();

let adminToken: string;
let providerToken: string;
let provider2Token: string;
let verifiedRecipientToken: string;
let unverifiedRecipientToken: string;
let volunteerToken: string;

let availableListingId: string;
let provider1ListingId: string;

describe('FoodLoop AI End-to-End API Integration Tests', () => {
  beforeAll(async () => {
    // 1. Login as Admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@foodloop.org', password: 'Password123!' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // 2. Login as Provider 1
    const p1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bistro@foodloop.org', password: 'Password123!' });
    expect(p1Res.status).toBe(200);
    providerToken = p1Res.body.token;

    // 3. Login as Provider 2
    const p2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'bakery@foodloop.org', password: 'Password123!' });
    expect(p2Res.status).toBe(200);
    provider2Token = p2Res.body.token;

    // 4. Login as Verified Recipient
    const r1Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'shelter@foodloop.org', password: 'Password123!' });
    expect(r1Res.status).toBe(200);
    verifiedRecipientToken = r1Res.body.token;

    // 5. Login as Unverified Recipient
    const r2Res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'youth@foodloop.org', password: 'Password123!' });
    expect(r2Res.status).toBe(200);
    unverifiedRecipientToken = r2Res.body.token;

    // 6. Login as Volunteer
    const vRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'alex.volunteer@foodloop.org', password: 'Password123!' });
    expect(vRes.status).toBe(200);
    volunteerToken = vRes.body.token;

    // Fetch listings to get IDs
    const listingsRes = await request(app).get('/api/v1/listings');
    const available = listingsRes.body.data.find((l: any) => l.status === 'AVAILABLE');
    availableListingId = available?.id;
  });

  describe('Authentication and Authorization', () => {
    it('rejects login with invalid password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@foodloop.org', password: 'WrongPassword!' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects access to protected admin route without admin role', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${volunteerToken}`);
      expect(res.status).toBe(403);
    });

    it('allows admin to view overview', async () => {
      const res = await request(app)
        .get('/api/v1/admin/overview')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.users.total).toBeGreaterThan(0);
    });
  });

  describe('Listing Creation and Ownership Protection', () => {
    it('allows provider to create a valid surplus food listing', async () => {
      const now = Date.now();
      const res = await request(app)
        .post('/api/v1/listings')
        .set('Authorization', `Bearer ${providerToken}`)
        .send({
          title: 'Fresh Organic Apple Crates',
          description: 'Surplus organic honeycrisp apples from breakfast catering event.',
          category: 'PRODUCE',
          quantity: 10,
          unit: 'crates',
          pickupStartAt: new Date(now + 3600 * 1000).toISOString(),
          pickupEndAt: new Date(now + 12 * 3600 * 1000).toISOString(),
          expiresAt: new Date(now + 24 * 3600 * 1000).toISOString(),
          address: '100 Market St, San Francisco, CA',
          latitude: 37.7938,
          longitude: -122.3956,
          safetyConfirmation: true,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.remainingQuantity).toBe(10);
      provider1ListingId = res.body.data.id;
    });

    it('prevents another provider from editing a listing they do not own', async () => {
      const res = await request(app)
        .patch(`/api/v1/listings/${provider1ListingId}`)
        .set('Authorization', `Bearer ${provider2Token}`)
        .send({ title: 'Unauthorized Modification' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('You can only update your own listings');
    });
  });

  describe('Recipient Eligibility and Request Validation', () => {
    it('blocks unverified recipient organizations from requesting food', async () => {
      const res = await request(app)
        .post(`/api/v1/requests/listings/${provider1ListingId}/requests`)
        .set('Authorization', `Bearer ${unverifiedRecipientToken}`)
        .send({ requestedQuantity: 5 });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('verification is required');
    });

    it('rejects requested quantity exceeding remaining quantity', async () => {
      const res = await request(app)
        .post(`/api/v1/requests/listings/${provider1ListingId}/requests`)
        .set('Authorization', `Bearer ${verifiedRecipientToken}`)
        .send({ requestedQuantity: 999 });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('exceeds remaining quantity');
    });

    it('allows verified recipient to submit valid quantity request', async () => {
      const res = await request(app)
        .post(`/api/v1/requests/listings/${provider1ListingId}/requests`)
        .set('Authorization', `Bearer ${verifiedRecipientToken}`)
        .send({ requestedQuantity: 6 });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('PENDING');
    });
  });

  describe('Audit Trail and Health Check', () => {
    it('confirms health endpoint returns ok and database is connected', async () => {
      const res = await request(app).get('/api/v1/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.database).toBe('connected');
    });

    it('returns audit log entries recording critical system actions', async () => {
      const res = await request(app)
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});
