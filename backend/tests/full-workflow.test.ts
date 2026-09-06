import 'dotenv/config';
import request from 'supertest';
import app from '../src/app.js';
import { generateToken } from '../src/utils/jwt.js';
import { Role, ReportStatus, TaskStatus, TaskPriority, ReviewAction } from '@prisma/client';
import prisma from '../src/config/prisma.js';

describe('End-to-End Report Workflow, Versioning & Manager Review Integration Test', () => {
  let testMemberToken: string;
  let testManagerToken: string;
  let memberUserId: number;
  let managerUserId: number;
  let projectId: number;
  let createdReportId: number;

  beforeAll(async () => {
    // 1. Ensure a project exists
    let project = await prisma.project.findFirst({ where: { isActive: true } });
    if (!project) {
      project = await prisma.project.create({
        data: { name: 'Workflow Test Project', description: 'Test project' },
      });
    }
    projectId = project.id;

    // 2. Ensure test team member exists
    let member = await prisma.user.findFirst({ where: { email: 'alice@example.com' } });
    if (!member) {
      member = await prisma.user.create({
        data: {
          name: 'Alice Johnson',
          email: 'alice@example.com',
          passwordHash: 'dummy',
          role: Role.TEAM_MEMBER,
          isActive: true,
        },
      });
    }
    memberUserId = member.id;
    testMemberToken = generateToken({
      userId: member.id,
      email: member.email,
      role: Role.TEAM_MEMBER,
      name: member.name,
    });

    // 3. Ensure test manager exists
    let manager = await prisma.user.findFirst({ where: { email: 'manager@example.com' } });
    if (!manager) {
      manager = await prisma.user.create({
        data: {
          name: 'Marcus Vance',
          email: 'manager@example.com',
          passwordHash: 'dummy',
          role: Role.MANAGER,
          isActive: true,
        },
      });
    }
    managerUserId = manager.id;
    testManagerToken = generateToken({
      userId: manager.id,
      email: manager.email,
      role: Role.MANAGER,
      name: manager.name,
    });
  });

  it('Step 1: Team Member creates a report -> status = DRAFT', async () => {
    const res = await request(app)
      .post('/api/reports')
      .set('Authorization', `Bearer ${testMemberToken}`)
      .send({
        projectId,
        weekStart: new Date('2026-09-01').toISOString(),
        weekEnd: new Date('2026-09-05').toISOString(),
        notes: 'Initial draft for sprint 36',
        tasks: [
          {
            name: 'API Schema Definition',
            priority: TaskPriority.HIGH,
            status: TaskStatus.IN_PROGRESS,
            plannedHours: 10,
            actualHours: 8,
            plannedPercent: 100,
            actualPercent: 80,
            deliverable: 'Swagger docs and zod schemas',
          },
        ],
        blockers: [
          { description: 'Awaiting third-party client credentials', isKeyBlocker: true },
        ],
        achievements: [
          { description: 'Completed JWT auth flow', isKeyAchievement: true },
        ],
        timeBreakdowns: [
          { category: 'DEVELOPMENT', hours: 8 },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(ReportStatus.DRAFT);
    expect(res.body.data.currentVersionNumber).toBe(1);

    createdReportId = res.body.data.id;
  });

  it('Step 2: Team Member edits the draft report', async () => {
    const res = await request(app)
      .put(`/api/reports/${createdReportId}`)
      .set('Authorization', `Bearer ${testMemberToken}`)
      .send({
        notes: 'Updated draft notes before final submission',
        tasks: [
          {
            name: 'API Schema Definition & Middleware',
            priority: TaskPriority.HIGH,
            status: TaskStatus.COMPLETED,
            plannedHours: 10,
            actualHours: 10,
            plannedPercent: 100,
            actualPercent: 100,
            deliverable: 'Complete middleware and schema',
          },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.notes).toBe('Updated draft notes before final submission');
    expect(res.body.data.status).toBe(ReportStatus.DRAFT);
  });

  it('Step 3: Team Member submits report -> status = SUBMITTED & Version 1 snapshot created', async () => {
    const res = await request(app)
      .post(`/api/reports/${createdReportId}/submit`)
      .set('Authorization', `Bearer ${testMemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(ReportStatus.SUBMITTED);
    expect(res.body.data.currentVersionNumber).toBe(1);

    // Verify Version 1 snapshot in DB
    const versions = await prisma.reportVersion.findMany({
      where: { reportId: createdReportId },
    });
    expect(versions.length).toBe(1);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[0].statusAtSubmission).toBe(ReportStatus.SUBMITTED);
  });

  it('Step 4: Manager requests changes with comment -> status = NEEDS_CORRECTION', async () => {
    const res = await request(app)
      .post(`/api/reports/${createdReportId}/review`)
      .set('Authorization', `Bearer ${testManagerToken}`)
      .send({
        action: ReviewAction.CHANGES_REQUESTED,
        comment: 'Please add documentation hours to the time breakdown and clarify deliverable.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(ReportStatus.NEEDS_CORRECTION);

    // Verify review record is associated
    const reviews = await prisma.review.findMany({
      where: { reportId: createdReportId },
    });
    expect(reviews.length).toBe(1);
    expect(reviews[0].action).toBe(ReviewAction.CHANGES_REQUESTED);
    expect(reviews[0].comment).toContain('Please add documentation hours');
  });

  it('Step 5: Team Member edits the corrected report', async () => {
    const res = await request(app)
      .put(`/api/reports/${createdReportId}`)
      .set('Authorization', `Bearer ${testMemberToken}`)
      .send({
        notes: 'Added documentation hours and updated deliverable per manager review.',
        timeBreakdowns: [
          { category: 'DEVELOPMENT', hours: 10 },
          { category: 'DOCUMENTATION', hours: 4 },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(ReportStatus.NEEDS_CORRECTION);
  });

  it('Step 6: Team Member resubmits report -> status = SUBMITTED & Version 2 snapshot created while Version 1 remains unchanged', async () => {
    const res = await request(app)
      .post(`/api/reports/${createdReportId}/submit`)
      .set('Authorization', `Bearer ${testMemberToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(ReportStatus.SUBMITTED);
    expect(res.body.data.currentVersionNumber).toBe(2);

    // Verify Version 1 and Version 2 exist immutably in DB
    const versions = await prisma.reportVersion.findMany({
      where: { reportId: createdReportId },
      orderBy: { versionNumber: 'asc' },
    });
    expect(versions.length).toBe(2);
    expect(versions[0].versionNumber).toBe(1);
    expect(versions[1].versionNumber).toBe(2);
    expect(versions[0].snapshotData).not.toBe(versions[1].snapshotData);
  });

  it('Step 7: Manager approves the resubmitted report -> status = APPROVED', async () => {
    const res = await request(app)
      .post(`/api/reports/${createdReportId}/review`)
      .set('Authorization', `Bearer ${testManagerToken}`)
      .send({
        action: ReviewAction.APPROVED,
        comment: 'Great work addressing feedback! Approved.',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe(ReportStatus.APPROVED);
  });

  it('Step 8: Team Member attempts to edit APPROVED report -> rejected with 400', async () => {
    const res = await request(app)
      .put(`/api/reports/${createdReportId}`)
      .set('Authorization', `Bearer ${testMemberToken}`)
      .send({
        notes: 'Attempting to change approved report notes',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Cannot edit report in');
  });

  it('Step 9: Manager attempts to modify report content directly -> rejected with 403', async () => {
    const res = await request(app)
      .put(`/api/reports/${createdReportId}`)
      .set('Authorization', `Bearer ${testManagerToken}`)
      .send({
        notes: 'Manager modifying member report directly',
      });

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toContain('Forbidden');
  });
});
