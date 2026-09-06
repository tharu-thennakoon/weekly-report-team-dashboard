import 'dotenv/config';
import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';
import { Role } from '@prisma/client';
import prisma from '../src/config/prisma.js';

describe('AI Team Assistant Endpoint Tests (POST /api/ai/chat)', () => {
  const memberToken = generateToken({
    userId: 3,
    email: 'alice@example.com',
    role: Role.TEAM_MEMBER,
    name: 'Alice Johnson',
  });

  const managerToken = generateToken({
    userId: 2,
    email: 'manager@example.com',
    role: Role.MANAGER,
    name: 'Marcus Vance',
  });

  const adminToken = generateToken({
    userId: 1,
    email: 'admin@example.com',
    role: Role.ADMIN,
    name: 'Sarah Connor',
  });

  beforeEach(() => {
    jest.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
      if (args.where.id === 1) {
        return { id: 1, name: 'Sarah Connor', email: 'admin@example.com', role: Role.ADMIN, isActive: true } as any;
      }
      if (args.where.id === 2) {
        return { id: 2, name: 'Marcus Vance', email: 'manager@example.com', role: Role.MANAGER, isActive: true } as any;
      }
      if (args.where.id === 3) {
        return { id: 3, name: 'Alice Johnson', email: 'alice@example.com', role: Role.TEAM_MEMBER, isActive: true } as any;
      }
      return null;
    });
  });

  describe('1. Role-Based Access Control (RBAC)', () => {
    it('should reject TEAM_MEMBER with 403 Forbidden', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({ message: 'What are the main blockers this week?' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .send({ message: 'Summarize this week' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should allow MANAGER to query the AI assistant', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ message: 'What are the main blockers this week?' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('answer');
      expect(res.body.data).toHaveProperty('week');
    });

    it('should allow ADMIN to query the AI assistant', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ message: 'Give me a manager summary' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(typeof res.body.data.answer).toBe('string');
    });
  });

  describe('2. Input Validation (Zod Schema Validation)', () => {
    it('should reject empty message with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ message: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject whitespace-only message with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ message: '    ' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject invalid date format with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ message: 'Summarize status', weekStart: 'not-a-valid-date' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('should reject start date after end date with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          message: 'Summarize workload',
          weekStart: '2026-09-30',
          weekEnd: '2026-09-01',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Read-Only Safety & Non-Mutation Guarantee', () => {
    it('should not modify or alter any reports in the database when queried', async () => {
      const countBefore = await prisma.report.count();

      await request(app)
        .post('/api/ai/chat')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ message: 'Summarize all achievements and workloads' });

      const countAfter = await prisma.report.count();
      expect(countAfter).toBe(countBefore);
    });
  });
});
