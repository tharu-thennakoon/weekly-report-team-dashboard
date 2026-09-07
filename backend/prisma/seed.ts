/// <reference types="node" />
import { PrismaClient, Role, ReportStatus, Priority, TaskStatus, TimeCategory, ReviewAction } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Clean existing records in reverse dependency order
  await prisma.review.deleteMany();
  await prisma.timeBreakdown.deleteMany();
  await prisma.achievement.deleteMany();
  await prisma.blocker.deleteMany();
  await prisma.task.deleteMany();
  await prisma.reportVersion.deleteMany();
  await prisma.report.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  // 2. Hash common passwords
  const passwordHash = await bcrypt.hash('password123', 10);
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const managerPasswordHash = await bcrypt.hash('manager123', 10);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'Sarah Connor (Admin)',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'Marcus Vance (Engineering Manager)',
      passwordHash: managerPasswordHash,
      role: Role.MANAGER,
      isActive: true,
    },
  });

  const member1 = await prisma.user.create({
    data: {
      email: 'alice@example.com',
      name: 'Alice Johnson',
      passwordHash,
      role: Role.TEAM_MEMBER,
      isActive: true,
    },
  });

  const member2 = await prisma.user.create({
    data: {
      email: 'bob@example.com',
      name: 'Bob Smith',
      passwordHash,
      role: Role.TEAM_MEMBER,
      isActive: true,
    },
  });

  const member3 = await prisma.user.create({
    data: {
      email: 'charlie@example.com',
      name: 'Charlie Davis',
      passwordHash,
      role: Role.TEAM_MEMBER,
      isActive: true,
    },
  });

  const member4 = await prisma.user.create({
    data: {
      email: 'diana@example.com',
      name: 'Diana Prince',
      passwordHash,
      role: Role.TEAM_MEMBER,
      isActive: true,
    },
  });

  const member5 = await prisma.user.create({
    data: {
      email: 'evan@example.com',
      name: 'Evan Wright',
      passwordHash,
      role: Role.TEAM_MEMBER,
      isActive: true,
    },
  });

  console.log('✅ Seeded users (1 Admin, 1 Manager, 5 Members)');

  // 4. Create Projects
  const proj1 = await prisma.project.create({
    data: {
      name: 'Client Alpha Portal',
      description: 'Customer facing web portal with self-service features and billing integration.',
      isActive: true,
    },
  });

  const proj2 = await prisma.project.create({
    data: {
      name: 'Internal Tooling & Core Dashboard',
      description: 'Internal operations dashboard, automated metric aggregation, and reporting engine.',
      isActive: true,
    },
  });

  const proj3 = await prisma.project.create({
    data: {
      name: 'Analytics & Data Pipeline',
      description: 'Real-time event streaming, ETL pipelines, and business intelligence views.',
      isActive: true,
    },
  });

  const proj4 = await prisma.project.create({
    data: {
      name: 'Mobile App Modernization',
      description: 'Cross-platform mobile redesign with offline sync and push notifications.',
      isActive: true,
    },
  });

  console.log('✅ Seeded 4 projects');

  // Helper date function for week ranges
  const getWeekRange = (weeksAgo: number) => {
    const now = new Date();
    // Monday of target week
    const day = now.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday - (weeksAgo * 7));
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    return { weekStart: monday, weekEnd: friday };
  };

  // 5. Seed Realistic Multi-Week Reports with full versions, tasks, blockers, achievements, hours, and reviews

  // Report 1: Alice - Current Week (SUBMITTED)
  const w0 = getWeekRange(0);
  const r1 = await prisma.report.create({
    data: {
      userId: member1.id,
      projectId: proj1.id,
      weekStart: w0.weekStart,
      weekEnd: w0.weekEnd,
      status: ReportStatus.SUBMITTED,
      notes: 'Ready for manager review. All frontend deliverables merged to staging.',
      links: 'https://github.com/org/client-alpha/pull/42',
      currentVersionNumber: 1,
      submittedAt: new Date(),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        reportId: r1.id,
        name: 'Implement OAuth2 login with Google and Microsoft',
        priority: Priority.HIGH,
        plannedPercent: 100,
        actualPercent: 100,
        status: TaskStatus.COMPLETED,
        plannedHours: 16,
        actualHours: 14.5,
        deliverable: 'PR #42 merged, passed security audit tests',
        isPlannedForNextWeek: false,
      },
      {
        reportId: r1.id,
        name: 'Design responsive settings navigation drawer',
        priority: Priority.MEDIUM,
        plannedPercent: 100,
        actualPercent: 90,
        status: TaskStatus.IN_PROGRESS,
        plannedHours: 10,
        actualHours: 11,
        deliverable: 'Component created in Storybook',
        isPlannedForNextWeek: false,
      },
      {
        reportId: r1.id,
        name: 'Integrate Stripe payment webhook handlers in UI',
        priority: Priority.HIGH,
        plannedPercent: 100,
        actualPercent: 0,
        status: TaskStatus.NOT_STARTED,
        plannedHours: 12,
        actualHours: 0,
        deliverable: 'Scheduled for next sprint',
        isPlannedForNextWeek: true,
      },
    ],
  });

  await prisma.blocker.create({
    data: {
      reportId: r1.id,
      description: 'Waiting for Stripe test credentials from the billing team.',
      isKeyBlocker: true,
    },
  });

  await prisma.achievement.create({
    data: {
      reportId: r1.id,
      description: 'Delivered OAuth2 login 1.5 days ahead of schedule with zero defect tickets.',
      isKeyAchievement: true,
    },
  });

  await prisma.timeBreakdown.createMany({
    data: [
      { reportId: r1.id, category: TimeCategory.DEVELOPMENT, hours: 25.5 },
      { reportId: r1.id, category: TimeCategory.TESTING, hours: 6.0 },
      { reportId: r1.id, category: TimeCategory.MEETINGS, hours: 4.5 },
      { reportId: r1.id, category: TimeCategory.DOCUMENTATION, hours: 2.0 },
    ],
  });

  // Version 1 snapshot for Alice
  await prisma.reportVersion.create({
    data: {
      reportId: r1.id,
      versionNumber: 1,
      statusAtSubmission: ReportStatus.SUBMITTED,
      notes: r1.notes,
      links: r1.links,
      submittedAt: new Date(),
      snapshotData: JSON.stringify({
        tasks: [
          { name: 'Implement OAuth2 login with Google and Microsoft', priority: 'HIGH', plannedPercent: 100, actualPercent: 100, status: 'COMPLETED', plannedHours: 16, actualHours: 14.5 },
          { name: 'Design responsive settings navigation drawer', priority: 'MEDIUM', plannedPercent: 100, actualPercent: 90, status: 'IN_PROGRESS', plannedHours: 10, actualHours: 11 },
        ],
        blockers: [{ description: 'Waiting for Stripe test credentials from billing team', isKeyBlocker: true }],
        achievements: [{ description: 'Delivered OAuth2 login ahead of schedule', isKeyAchievement: true }],
        hours: { DEVELOPMENT: 25.5, TESTING: 6.0, MEETINGS: 4.5, DOCUMENTATION: 2.0 },
      }),
    },
  });

  // Report 2: Bob - Current Week (NEEDS_CORRECTION - demonstrating the exact review cycle!)
  const r2 = await prisma.report.create({
    data: {
      userId: member2.id,
      projectId: proj2.id,
      weekStart: w0.weekStart,
      weekEnd: w0.weekEnd,
      status: ReportStatus.NEEDS_CORRECTION,
      notes: 'Initial submission of reporting engine microservice.',
      links: 'https://github.com/org/core-engine/tree/feat/export',
      currentVersionNumber: 1,
      submittedAt: new Date(Date.now() - 24 * 3600 * 1000),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        reportId: r2.id,
        name: 'Build PDF and CSV export background worker',
        priority: Priority.HIGH,
        plannedPercent: 100,
        actualPercent: 65,
        status: TaskStatus.IN_PROGRESS,
        plannedHours: 20,
        actualHours: 22,
        deliverable: 'Worker queue setup in BullMQ',
        isPlannedForNextWeek: false,
      },
      {
        reportId: r2.id,
        name: 'Add load testing metrics in Grafana',
        priority: Priority.MEDIUM,
        plannedPercent: 100,
        actualPercent: 40,
        status: TaskStatus.BLOCKED,
        plannedHours: 10,
        actualHours: 8,
        deliverable: 'Dashboard partially configured',
        isPlannedForNextWeek: false,
      },
      {
        reportId: r2.id,
        name: 'Optimize memory footprint of CSV streamer',
        priority: Priority.HIGH,
        plannedPercent: 100,
        actualPercent: 0,
        status: TaskStatus.NOT_STARTED,
        plannedHours: 8,
        actualHours: 0,
        deliverable: 'Planned next week',
        isPlannedForNextWeek: true,
      },
    ],
  });

  await prisma.blocker.create({
    data: {
      reportId: r2.id,
      description: 'Grafana agent memory leak in staging cluster.',
      isKeyBlocker: true,
    },
  });

  await prisma.achievement.create({
    data: {
      reportId: r2.id,
      description: 'BullMQ redis queue successfully processed 50,000 mock PDF generation jobs.',
      isKeyAchievement: true,
    },
  });

  await prisma.timeBreakdown.createMany({
    data: [
      { reportId: r2.id, category: TimeCategory.DEVELOPMENT, hours: 26.0 },
      { reportId: r2.id, category: TimeCategory.TESTING, hours: 8.0 },
      { reportId: r2.id, category: TimeCategory.MEETINGS, hours: 4.0 },
    ],
  });

  const r2v1 = await prisma.reportVersion.create({
    data: {
      reportId: r2.id,
      versionNumber: 1,
      statusAtSubmission: ReportStatus.SUBMITTED,
      notes: r2.notes,
      links: r2.links,
      submittedAt: new Date(Date.now() - 24 * 3600 * 1000),
      snapshotData: JSON.stringify({
        tasks: [
          { name: 'Build PDF and CSV export background worker', priority: 'HIGH', plannedPercent: 100, actualPercent: 65, status: 'IN_PROGRESS', plannedHours: 20, actualHours: 22 },
          { name: 'Add load testing metrics in Grafana', priority: 'MEDIUM', plannedPercent: 100, actualPercent: 40, status: 'BLOCKED', plannedHours: 10, actualHours: 8 },
        ],
        blockers: [{ description: 'Grafana agent memory leak in staging cluster', isKeyBlocker: true }],
        achievements: [{ description: 'BullMQ redis queue processed 50k jobs', isKeyAchievement: true }],
        hours: { DEVELOPMENT: 26.0, TESTING: 8.0, MEETINGS: 4.0 },
      }),
    },
  });

  // Manager Review requesting changes
  await prisma.review.create({
    data: {
      reportId: r2.id,
      reportVersionId: r2v1.id,
      reviewerId: manager.id,
      action: ReviewAction.CHANGES_REQUESTED,
      comment: 'Please clarify why the Grafana task is blocked and add planned completion percentage estimates for the memory optimization task.',
      createdAt: new Date(Date.now() - 12 * 3600 * 1000),
    },
  });

  // Report 3: Charlie - Current Week (DRAFT)
  const r3 = await prisma.report.create({
    data: {
      userId: member3.id,
      projectId: proj3.id,
      weekStart: w0.weekStart,
      weekEnd: w0.weekEnd,
      status: ReportStatus.DRAFT,
      notes: 'Work in progress draft.',
      links: 'https://gitlab.internal/pipeline-etl',
      currentVersionNumber: 1,
    },
  });

  await prisma.task.create({
    data: {
      reportId: r3.id,
      name: 'Configure Apache Kafka topic partitions for clickstream events',
      priority: Priority.HIGH,
      plannedPercent: 100,
      actualPercent: 50,
      status: TaskStatus.IN_PROGRESS,
      plannedHours: 18,
      actualHours: 12,
      deliverable: 'Kafka cluster config manifest',
      isPlannedForNextWeek: false,
    },
  });

  await prisma.timeBreakdown.create({
    data: { reportId: r3.id, category: TimeCategory.DEVELOPMENT, hours: 12.0 },
  });

  // Report 4: Diana - Current Week (APPROVED after 2 versions!)
  const r4 = await prisma.report.create({
    data: {
      userId: member4.id,
      projectId: proj4.id,
      weekStart: w0.weekStart,
      weekEnd: w0.weekEnd,
      status: ReportStatus.APPROVED,
      notes: 'All end-to-end automation tests passing for iOS and Android releases.',
      links: 'https://testrail.internal/suites/409',
      currentVersionNumber: 2,
      submittedAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
  });

  await prisma.task.createMany({
    data: [
      {
        reportId: r4.id,
        name: 'Automate checkout flow regression tests with Appium',
        priority: Priority.HIGH,
        plannedPercent: 100,
        actualPercent: 100,
        status: TaskStatus.COMPLETED,
        plannedHours: 20,
        actualHours: 19,
        deliverable: '35 automated test cases integrated into CI pipeline',
        isPlannedForNextWeek: false,
      },
      {
        reportId: r4.id,
        name: 'Perform load test on authentication endpoints',
        priority: Priority.MEDIUM,
        plannedPercent: 100,
        actualPercent: 100,
        status: TaskStatus.COMPLETED,
        plannedHours: 10,
        actualHours: 9.5,
        deliverable: 'K6 performance benchmark report',
        isPlannedForNextWeek: false,
      },
    ],
  });

  await prisma.achievement.create({
    data: {
      reportId: r4.id,
      description: 'Zero regression defects found in release candidate build 2.4.0.',
      isKeyAchievement: true,
    },
  });

  await prisma.timeBreakdown.createMany({
    data: [
      { reportId: r4.id, category: TimeCategory.TESTING, hours: 28.5 },
      { reportId: r4.id, category: TimeCategory.MEETINGS, hours: 5.0 },
      { reportId: r4.id, category: TimeCategory.DOCUMENTATION, hours: 4.5 },
    ],
  });

  // Version 1 of Diana's report
  const r4v1 = await prisma.reportVersion.create({
    data: {
      reportId: r4.id,
      versionNumber: 1,
      statusAtSubmission: ReportStatus.SUBMITTED,
      notes: 'Initial test run results.',
      submittedAt: new Date(Date.now() - 48 * 3600 * 1000),
      snapshotData: JSON.stringify({
        tasks: [{ name: 'Automate checkout flow', priority: 'HIGH', plannedPercent: 100, actualPercent: 80, status: 'IN_PROGRESS', plannedHours: 20, actualHours: 15 }],
        achievements: [],
        hours: { TESTING: 20 },
      }),
    },
  });

  await prisma.review.create({
    data: {
      reportId: r4.id,
      reportVersionId: r4v1.id,
      reviewerId: manager.id,
      action: ReviewAction.CHANGES_REQUESTED,
      comment: 'Please attach the K6 performance benchmark link and finalize the checkout test cases count.',
      createdAt: new Date(Date.now() - 36 * 3600 * 1000),
    },
  });

  // Version 2 of Diana's report (Approved)
  const r4v2 = await prisma.reportVersion.create({
    data: {
      reportId: r4.id,
      versionNumber: 2,
      statusAtSubmission: ReportStatus.SUBMITTED,
      notes: r4.notes,
      links: r4.links,
      submittedAt: new Date(Date.now() - 10 * 3600 * 1000),
      snapshotData: JSON.stringify({
        tasks: [
          { name: 'Automate checkout flow regression tests with Appium', priority: 'HIGH', plannedPercent: 100, actualPercent: 100, status: 'COMPLETED', plannedHours: 20, actualHours: 19 },
          { name: 'Perform load test on authentication endpoints', priority: 'MEDIUM', plannedPercent: 100, actualPercent: 100, status: 'COMPLETED', plannedHours: 10, actualHours: 9.5 },
        ],
        achievements: [{ description: 'Zero regression defects found in release candidate build 2.4.0', isKeyAchievement: true }],
        hours: { TESTING: 28.5, MEETINGS: 5.0, DOCUMENTATION: 4.5 },
      }),
    },
  });

  await prisma.review.create({
    data: {
      reportId: r4.id,
      reportVersionId: r4v2.id,
      reviewerId: manager.id,
      action: ReviewAction.APPROVED,
      comment: 'Excellent detail and thorough test coverage. Approved for release.',
      createdAt: new Date(Date.now() - 4 * 3600 * 1000),
    },
  });

  // 6. Seed Past 3 Weeks Historical Reports for all members to provide rich analytics charts
  for (let w = 1; w <= 3; w++) {
    const prevRange = getWeekRange(w);

    const historicalMembers = [member1, member2, member3, member4, member5];
    const historicalProjects = [proj1, proj2, proj3, proj4, proj1];

    for (let i = 0; i < historicalMembers.length; i++) {
      const user = historicalMembers[i];
      const project = historicalProjects[i];

      const histReport = await prisma.report.create({
        data: {
          userId: user.id,
          projectId: project.id,
          weekStart: prevRange.weekStart,
          weekEnd: prevRange.weekEnd,
          status: ReportStatus.APPROVED,
          notes: `Weekly sprint summary for week -${w}`,
          currentVersionNumber: 1,
          submittedAt: new Date(prevRange.weekEnd),
        },
      });

      await prisma.task.createMany({
        data: [
          {
            reportId: histReport.id,
            name: `Sprint Task ${w}.1 for ${project.name}`,
            priority: Priority.HIGH,
            plannedPercent: 100,
            actualPercent: 100,
            status: TaskStatus.COMPLETED,
            plannedHours: 15,
            actualHours: 14 + w,
            deliverable: `Delivered milestone #${w}`,
            isPlannedForNextWeek: false,
          },
          {
            reportId: histReport.id,
            name: `Code refactoring and unit tests ${w}.2`,
            priority: Priority.MEDIUM,
            plannedPercent: 100,
            actualPercent: 100,
            status: TaskStatus.COMPLETED,
            plannedHours: 12,
            actualHours: 11,
            deliverable: '100% test pass rate',
            isPlannedForNextWeek: false,
          },
        ],
      });

      await prisma.achievement.create({
        data: {
          reportId: histReport.id,
          description: `Successfully completed sprint goals for week -${w}`,
          isKeyAchievement: true,
        },
      });

      await prisma.timeBreakdown.createMany({
        data: [
          { reportId: histReport.id, category: TimeCategory.DEVELOPMENT, hours: 22.0 + (i * 2) },
          { reportId: histReport.id, category: TimeCategory.TESTING, hours: 6.0 + i },
          { reportId: histReport.id, category: TimeCategory.MEETINGS, hours: 5.0 },
          { reportId: histReport.id, category: TimeCategory.DOCUMENTATION, hours: 3.0 },
        ],
      });

      const histVersion = await prisma.reportVersion.create({
        data: {
          reportId: histReport.id,
          versionNumber: 1,
          statusAtSubmission: ReportStatus.SUBMITTED,
          submittedAt: new Date(prevRange.weekEnd),
          snapshotData: JSON.stringify({
            tasks: [
              { name: `Sprint Task ${w}.1 for ${project.name}`, priority: 'HIGH', plannedPercent: 100, actualPercent: 100, status: 'COMPLETED', plannedHours: 15, actualHours: 14 + w },
              { name: `Code refactoring ${w}.2`, priority: 'MEDIUM', plannedPercent: 100, actualPercent: 100, status: 'COMPLETED', plannedHours: 12, actualHours: 11 },
            ],
            achievements: [{ description: `Sprint goals completed for week -${w}`, isKeyAchievement: true }],
            hours: { DEVELOPMENT: 22.0 + (i * 2), TESTING: 6.0 + i, MEETINGS: 5.0, DOCUMENTATION: 3.0 },
          }),
        },
      });

      await prisma.review.create({
        data: {
          reportId: histReport.id,
          reportVersionId: histVersion.id,
          reviewerId: manager.id,
          action: ReviewAction.APPROVED,
          comment: `Great work on sprint week -${w}!`,
          createdAt: new Date(prevRange.weekEnd.getTime() + 12 * 3600 * 1000),
        },
      });
    }
  }

  console.log('✅ Seeded 15+ historical reports with analytics, reviews, and version histories across all members and projects');
  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
