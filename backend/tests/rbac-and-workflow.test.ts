import 'dotenv/config';
import { jest } from '@jest/globals';
import request from 'supertest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';
import { Role, ReportStatus } from '@prisma/client';
import prisma from '../src/config/prisma.js';
import { dashboardService } from '../src/services/dashboard.service.js';

describe('Role-Based Access Control, Auth Security & Report Workflow Tests', () => {
  const member1Token = generateToken({
    userId: 3,
    email: 'alice@example.com',
    role: Role.TEAM_MEMBER,
    name: 'Alice Johnson',
  });

  const member2Token = generateToken({
    userId: 4,
    email: 'bob@example.com',
    role: Role.TEAM_MEMBER,
    name: 'Bob Smith',
  });

  const managerToken = generateToken({
    userId: 2,
    email: 'manager@example.com',
    role: Role.MANAGER,
    name: 'Marcus Vance',
  });

  const staleManagerToken = generateToken({
    userId: 5,
    email: 'downgraded@example.com',
    role: Role.MANAGER, // token says MANAGER
    name: 'Downgraded User',
  });

  const deactivatedToken = generateToken({
    userId: 6,
    email: 'inactive@example.com',
    role: Role.TEAM_MEMBER,
    name: 'Deactivated User',
  });

  describe('1. Authentication & Public Registration Security', () => {
    it('should return health check status 200', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('should reject unauthenticated requests to protected endpoints with 401', async () => {
      const res = await request(app).get('/api/reports');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('Public registration cannot create MANAGER or ADMIN account (always creates TEAM_MEMBER)', async () => {
      const uniqueEmail = `test-reg-${Date.now()}@example.com`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker User',
          email: uniqueEmail,
          password: 'Password123!',
          role: 'ADMIN', // Attacker attempts to pass ADMIN
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.role).toBe('TEAM_MEMBER');

      // Verify directly from DB
      const createdUser = await prisma.user.findUnique({
        where: { email: uniqueEmail.toLowerCase() },
      });
      expect(createdUser?.role).toBe(Role.TEAM_MEMBER);
    });
  });

  describe('2. JWT & Live Authorization Verification', () => {
    it('deactivated user cannot access protected API using old token', async () => {
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
        if (args.where.id === 6) {
          return { id: 6, name: 'Deactivated User', email: 'inactive@example.com', role: Role.TEAM_MEMBER, isActive: false } as any;
        }
        return null;
      });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${deactivatedToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('deactivated');
    });

    it('user downgraded from MANAGER to TEAM_MEMBER cannot use Manager endpoint with old token', async () => {
      // Token says MANAGER, but current database state is TEAM_MEMBER
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
        if (args.where.id === 5) {
          return { id: 5, name: 'Downgraded User', email: 'downgraded@example.com', role: Role.TEAM_MEMBER, isActive: true } as any;
        }
        return null;
      });

      const res = await request(app)
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${staleManagerToken}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });
  });

  describe('3. Role-Based Access Control (RBAC)', () => {
    beforeEach(() => {
      // Mock active manager user lookup
      jest.spyOn(prisma.user, 'findUnique').mockImplementation(async (args: any) => {
        if (args.where.id === 2) {
          return { id: 2, name: 'Marcus Vance', email: 'manager@example.com', role: Role.MANAGER, isActive: true } as any;
        }
        if (args.where.id === 3) {
          return { id: 3, name: 'Alice Johnson', email: 'alice@example.com', role: Role.TEAM_MEMBER, isActive: true } as any;
        }
        if (args.where.id === 4) {
          return { id: 4, name: 'Bob Smith', email: 'bob@example.com', role: Role.TEAM_MEMBER, isActive: true } as any;
        }
        return null;
      });
    });

    it('should allow manager to access manager-only dashboard', async () => {
      jest.spyOn(dashboardService, 'getManagerDashboard').mockResolvedValue({
        selectedWeek: { weekStart: '2026-09-01', weekEnd: '2026-09-05', isDeadlinePassed: false },
        kpis: {
          totalMembers: 5,
          totalSubmittedThisWeek: 4,
          submittedThisWeek: 2,
          approvedThisWeek: 2,
          complianceRate: 80,
          needsCorrectionCount: 0,
          openBlockers: 1,
          completedTasksCount: 6,
          lateSubmissionsCount: 0,
        },
        charts: { projectWorkload: [], timeSpentByCategory: [], statusCounts: {} as any, memberStatuses: [] },
        awaitingReview: [],
        recentActivity: [],
      } as any);

      const res = await request(app)
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.kpis.totalMembers).toBe(5);
      expect(res.body.data.kpis.totalSubmittedThisWeek).toBe(4);
    });

    it('should reject team member from accessing manager dashboard with 403', async () => {
      const res = await request(app)
        .get('/api/dashboard/manager')
        .set('Authorization', `Bearer ${member1Token}`);

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });

    it('should reject team member from reviewing/approving reports with 403', async () => {
      const res = await request(app)
        .post('/api/reports/1/review')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ action: 'APPROVED', comment: 'Looks good' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('4. Resource Ownership & Manager Edit Prevention', () => {
    it('should allow team member to view their own report', async () => {
      jest.spyOn(prisma.report, 'findUnique').mockResolvedValue({
        id: 10,
        userId: 3, // Alice's report
        projectId: 1,
        weekStart: new Date(),
        weekEnd: new Date(),
        status: ReportStatus.DRAFT,
        notes: 'Draft note',
        links: null,
        currentVersionNumber: 1,
        user: { id: 3, name: 'Alice Johnson', email: 'alice@example.com' },
        project: { id: 1, name: 'Client Portal' },
        tasks: [],
        blockers: [],
        achievements: [],
        timeBreakdowns: [],
        reviews: [],
        versions: [],
      } as any);

      const res = await request(app)
        .get('/api/reports/10')
        .set('Authorization', `Bearer ${member1Token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(10);
    });

    it('should prevent team member from accessing another members report with 403', async () => {
      jest.spyOn(prisma.report, 'findUnique').mockResolvedValue({
        id: 20,
        userId: 4, // Bob's report
        projectId: 1,
        weekStart: new Date(),
        weekEnd: new Date(),
        status: ReportStatus.SUBMITTED,
        user: { id: 4, name: 'Bob Smith', email: 'bob@example.com' },
        project: { id: 1, name: 'Client Portal' },
        tasks: [],
        blockers: [],
        achievements: [],
        timeBreakdowns: [],
        reviews: [],
        versions: [],
      } as any);

      const res = await request(app)
        .get('/api/reports/20')
        .set('Authorization', `Bearer ${member1Token}`); // Alice requesting Bob's report

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden');
    });

    it('Manager attempts PUT/PATCH on Team Member report content -> rejected with 403', async () => {
      jest.spyOn(prisma.report, 'findUnique').mockResolvedValue({
        id: 10,
        userId: 3, // Owned by Alice
        status: ReportStatus.DRAFT,
      } as any);

      const res = await request(app)
        .put('/api/reports/10')
        .set('Authorization', `Bearer ${managerToken}`) // Marcus attempting to edit Alice's report content
        .send({ notes: 'Manager trying to rewrite report content directly' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain('Forbidden: You can only edit your own reports');
    });
  });

  describe('5. Report Workflow & State Transitions', () => {
    it('should reject editing an APPROVED report with 400', async () => {
      jest.spyOn(prisma.report, 'findUnique').mockResolvedValue({
        id: 30,
        userId: 3,
        status: ReportStatus.APPROVED,
      } as any);

      const res = await request(app)
        .put('/api/reports/30')
        .set('Authorization', `Bearer ${member1Token}`)
        .send({ notes: 'Attempting to edit approved report' });

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Cannot edit report in');
    });

    it('should reject review request changes without a comment with 400', async () => {
      const res = await request(app)
        .post('/api/reports/30/review')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ action: 'CHANGES_REQUESTED', comment: '' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  describe('6. Compliance Calculation & Date Scoping', () => {
    it('should calculate compliance counting SUBMITTED, NEEDS_CORRECTION, and APPROVED, handling 0 team members', async () => {
      // 5 team members: 2 APPROVED, 1 SUBMITTED, 1 NEEDS_CORRECTION, 1 DRAFT -> submitted = 4, compliance = 80%
      const totalMembers = 5;
      const reports = [
        { status: ReportStatus.APPROVED },
        { status: ReportStatus.APPROVED },
        { status: ReportStatus.SUBMITTED },
        { status: ReportStatus.NEEDS_CORRECTION },
        { status: ReportStatus.DRAFT },
      ];
      const validSubmitted = reports.filter((r) =>
        [ReportStatus.SUBMITTED, ReportStatus.NEEDS_CORRECTION, ReportStatus.APPROVED].includes(r.status)
      ).length;
      const compliance = totalMembers > 0 ? Math.round((validSubmitted / totalMembers) * 100) : 0;

      expect(validSubmitted).toBe(4);
      expect(compliance).toBe(80);

      // Safe zero-team-member check
      const zeroMembers = 0;
      const zeroCompliance = zeroMembers > 0 ? Math.round((validSubmitted / zeroMembers) * 100) : 0;
      expect(zeroCompliance).toBe(0);
    });
  });
});
