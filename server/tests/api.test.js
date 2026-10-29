import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import pool from '../src/config/db.js';

describe('CivicConnect Backend API Integration Tests', () => {
  let citizenToken = '';
  let adminToken = '';
  let otherCitizenToken = '';
  let createdComplaintId = null;
  let createdComplaintRef = '';

  beforeAll(async () => {
    // Authenticate test administrator
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@civicconnect.gov',
        password: 'Admin@Civic2026!'
      });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.data.accessToken;

    // Authenticate test citizen 1 (Rajesh Sharma)
    const citizenRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'rajesh.sharma@example.com',
        password: 'Citizen@123!'
      });
    expect(citizenRes.status).toBe(200);
    citizenToken = citizenRes.body.data.accessToken;

    // Authenticate test citizen 2 (Priya Patel)
    const otherCitizenRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'priya.patel@example.com',
        password: 'Citizen@123!'
      });
    expect(otherCitizenRes.status).toBe(200);
    otherCitizenToken = otherCitizenRes.body.data.accessToken;
  });

  afterAll(async () => {
    await pool.end();
  });

  describe('1. Health Check & Public Endpoints', () => {
    it('GET /api/health should return UP status and database connected', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('UP');
      expect(res.body.database).toBe('connected');
    });

    it('GET /api/public/stats should return real database metrics', async () => {
      const res = await request(app).get('/api/public/stats');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.totalComplaints).toBeGreaterThanOrEqual(1);
      expect(res.body.data.departmentsCount).toBeGreaterThanOrEqual(1);
    });
  });

  describe('2. Authentication & Authorization', () => {
    it('POST /api/auth/login should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@civicconnect.gov',
          password: 'WrongPassword999!'
        });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/auth/register should validate required fields and password length', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: '',
          email: 'invalid-email',
          password: '123'
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });

    it('POST /api/auth/register should create a new citizen account', async () => {
      const uniqueEmail = `citizen.test.${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test Citizen User',
          email: uniqueEmail,
          phone: '+91 9988776655',
          address: 'Building 12, Sector 4, Civic Nagar',
          password: 'SecurePassword123!'
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(uniqueEmail);
      expect(res.body.data.accessToken).toBeDefined();
    });

    it('GET /api/admin/dashboard should reject requests from normal citizens (RBAC)', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${citizenToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/admin/dashboard should allow requests from administrators', async () => {
      const res = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.metrics).toBeDefined();
    });
  });

  describe('3. Citizen Complaint Submission & Access Control', () => {
    it('POST /api/complaints should validate required fields', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Too short',
          description: 'Short',
          category: 'InvalidCategory'
        });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('POST /api/complaints should successfully create a complaint with reference number', async () => {
      const res = await request(app)
        .post('/api/complaints')
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          title: 'Damaged storm drainage grate causing hazardous hazard',
          description: 'Large metal storm drainage grate broken near junction 5 causing wheel traps and pedestrian risk.',
          category: 'Drainage',
          location: 'Junction 5, Sector 14, Main Avenue',
          priority: 'high'
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.referenceNumber).toMatch(/^CC-\d{4}-\d{5}$/);
      expect(res.body.data.status).toBe('submitted');

      createdComplaintId = res.body.data.id;
      createdComplaintRef = res.body.data.referenceNumber;
    });

    it('GET /api/complaints/:id should allow the author citizen to view their complaint', async () => {
      const res = await request(app)
        .get(`/api/complaints/${createdComplaintId}`)
        .set('Authorization', `Bearer ${citizenToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint.reference_number).toBe(createdComplaintRef);
    });

    it('GET /api/complaints/:id should FORBID another citizen from viewing private complaint (IDOR safeguard)', async () => {
      const res = await request(app)
        .get(`/api/complaints/${createdComplaintId}`)
        .set('Authorization', `Bearer ${otherCitizenToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('GET /api/complaints/:id should allow an administrator to view any complaint', async () => {
      const res = await request(app)
        .get(`/api/complaints/${createdComplaintId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.complaint.reference_number).toBe(createdComplaintRef);
    });
  });

  describe('4. Administrative Status Transitions & Audit History', () => {
    it('PATCH /api/admin/complaints/:id/status should REJECT invalid status transitions', async () => {
      // Cannot jump directly from 'submitted' to 'resolved' without under_review or in_progress
      const res = await request(app)
        .patch(`/api/admin/complaints/${createdComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          remarks: 'Trying to resolve without review'
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Invalid status transition');
    });

    it('PATCH /api/admin/complaints/:id/status should permit valid transition: submitted -> under_review', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${createdComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'under_review',
          remarks: 'Complaint verified and acknowledged by civic zonal desk.',
          visibility: 'citizen'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newStatus).toBe('under_review');
    });

    it('PATCH /api/admin/complaints/:id/status should permit valid transition: under_review -> in_progress', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${createdComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'in_progress',
          remarks: 'Field team dispatched to junction 5 with replacement ductile iron grate.',
          visibility: 'citizen'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newStatus).toBe('in_progress');
    });

    it('PATCH /api/admin/complaints/:id/status should permit valid transition: in_progress -> resolved with remarks', async () => {
      const res = await request(app)
        .patch(`/api/admin/complaints/${createdComplaintId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'resolved',
          remarks: 'Drainage grate completely replaced and cemented in place.',
          visibility: 'citizen'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.newStatus).toBe('resolved');
    });

    it('POST /api/complaints/:id/reopen should allow citizen to reopen a resolved complaint', async () => {
      const res = await request(app)
        .post(`/api/complaints/${createdComplaintId}/reopen`)
        .set('Authorization', `Bearer ${citizenToken}`)
        .send({
          reason: 'Cement around new grate has cracked after heavy morning rain and loosened again.'
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('reopened');
    });
  });

  describe('5. Reports and CSV Export', () => {
    it('GET /api/admin/reports should return aggregated metrics', async () => {
      const res = await request(app)
        .get('/api/admin/reports')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.summary).toBeDefined();
    });

    it('GET /api/admin/reports/export should stream a downloadable CSV file', async () => {
      const res = await request(app)
        .get('/api/admin/reports/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('text/csv');
      expect(res.text).toContain('Reference Number');
      expect(res.text).toContain('Category');
    });
  });
});
