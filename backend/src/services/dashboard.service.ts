import prisma from '../config/prisma.js';
import { ReportStatus, TaskStatus, Role } from '@prisma/client';

export interface WeekRange {
  weekStart: Date;
  weekEnd: Date;
}

export class DashboardService {
  /**
   * Helper to determine Monday-Friday date range for a given date or range
   */
  public getWeekRange(startDateParam?: string, endDateParam?: string, targetDateParam?: string): WeekRange {
    if (startDateParam && endDateParam) {
      const start = new Date(startDateParam);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDateParam);
      end.setHours(23, 59, 59, 999);
      return { weekStart: start, weekEnd: end };
    }

    const baseDate = targetDateParam ? new Date(targetDateParam) : (startDateParam ? new Date(startDateParam) : new Date());
    const day = baseDate.getDay();
    const diffToMonday = (day === 0 ? -6 : 1) - day;
    
    const monday = new Date(baseDate);
    monday.setDate(baseDate.getDate() + diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    friday.setHours(23, 59, 59, 999);

    return { weekStart: monday, weekEnd: friday };
  }

  /**
   * Member Dashboard Analytics
   */
  async getMemberDashboard(userId: number) {
    const { weekStart, weekEnd } = this.getWeekRange();

    // 1. Current week report
    const currentReport = await prisma.report.findFirst({
      where: {
        userId,
        weekStart: { gte: weekStart, lte: weekEnd },
      },
      include: {
        project: true,
        tasks: { where: { reportVersionId: null } },
        blockers: { where: { reportVersionId: null } },
        achievements: { where: { reportVersionId: null } },
        timeBreakdowns: { where: { reportVersionId: null } },
        reviews: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: { name: true } } },
        },
      },
    });

    // 2. Summary stats across all reports for this user
    const [totalReports, approvedCount, needsCorrectionCount, submittedCount] = await Promise.all([
      prisma.report.count({ where: { userId } }),
      prisma.report.count({ where: { userId, status: ReportStatus.APPROVED } }),
      prisma.report.count({ where: { userId, status: ReportStatus.NEEDS_CORRECTION } }),
      prisma.report.count({ where: { userId, status: ReportStatus.SUBMITTED } }),
    ]);

    // 3. Recent reports list (last 5)
    const recentReports = await prisma.report.findMany({
      where: { userId },
      take: 5,
      orderBy: { weekStart: 'desc' },
      include: {
        project: { select: { name: true } },
        reviews: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: { name: true } } },
        },
      },
    });

    return {
      currentWeek: { weekStart, weekEnd },
      currentReport,
      stats: {
        totalReports,
        approvedCount,
        needsCorrectionCount,
        submittedCount,
      },
      recentReports,
    };
  }

  /**
   * Manager Dashboard Analytics
   * Strictly scopes ALL metrics, workload, time breakdowns, blockers, and compliance to the selected week.
   */
  async getManagerDashboard(startDateParam?: string, endDateParam?: string, targetDateParam?: string) {
    const { weekStart, weekEnd } = this.getWeekRange(startDateParam, endDateParam, targetDateParam);
    const now = new Date();
    const isDeadlinePassed = now.getTime() > weekEnd.getTime();

    // 1. Fetch active team members & all projects
    const [teamMembers, allProjects] = await Promise.all([
      prisma.user.findMany({
        where: { role: Role.TEAM_MEMBER, isActive: true },
        select: { id: true, name: true, email: true },
        orderBy: { name: 'asc' },
      }),
      prisma.project.findMany({
        where: { isActive: true },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);

    const totalMembers = teamMembers.length;

    // 2. Fetch reports strictly scoped to the selected reporting week
    const selectedWeekReports = await prisma.report.findMany({
      where: {
        weekStart: { gte: weekStart, lte: weekEnd },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        tasks: { where: { reportVersionId: null } },
        blockers: { where: { reportVersionId: null } },
        achievements: { where: { reportVersionId: null } },
        timeBreakdowns: { where: { reportVersionId: null } },
        reviews: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: { reviewer: { select: { name: true } } },
        },
      },
    });

    const reportMap = new Map(selectedWeekReports.map((r) => [r.userId, r]));

    // 3. Submission Compliance & Valid Submissions calculation
    // Valid submissions include SUBMITTED, NEEDS_CORRECTION, and APPROVED (NOT DRAFT or missing)
    const validSubmittedReports = selectedWeekReports.filter((r) =>
      ([ReportStatus.SUBMITTED, ReportStatus.NEEDS_CORRECTION, ReportStatus.APPROVED] as ReportStatus[]).includes(r.status)
    );

    const totalSubmittedThisWeek = validSubmittedReports.length;
    const submittedCount = selectedWeekReports.filter((r) => r.status === ReportStatus.SUBMITTED).length;
    const approvedCount = selectedWeekReports.filter((r) => r.status === ReportStatus.APPROVED).length;
    const needsCorrectionCount = selectedWeekReports.filter((r) => r.status === ReportStatus.NEEDS_CORRECTION).length;
    const draftCount = selectedWeekReports.filter((r) => r.status === ReportStatus.DRAFT).length;

    const complianceRate = totalMembers > 0 ? Math.round((totalSubmittedThisWeek / totalMembers) * 100) : 0;

    // 4. Open Blockers strictly in selected week's active reports
    const openBlockers = selectedWeekReports.reduce((sum, r) => sum + (r.blockers ? r.blockers.length : 0), 0);

    // 5. Workload / Task Distribution by Project for selected week
    const projectDistributionMap: Record<string, { tasks: number; hours: number }> = {};
    for (const proj of allProjects) {
      projectDistributionMap[proj.name] = { tasks: 0, hours: 0 };
    }

    for (const rep of selectedWeekReports) {
      const projName = rep.project.name;
      if (!projectDistributionMap[projName]) {
        projectDistributionMap[projName] = { tasks: 0, hours: 0 };
      }
      projectDistributionMap[projName].tasks += rep.tasks.length;
      projectDistributionMap[projName].hours += rep.timeBreakdowns.reduce((sum, tb) => sum + tb.hours, 0);
    }

    const projectWorkload = Object.entries(projectDistributionMap).map(([name, data]) => ({
      name,
      tasks: data.tasks,
      hours: data.hours,
    }));

    // 6. Time Spent by Category strictly for selected week
    const categoryTotals: Record<string, number> = {
      DEVELOPMENT: 0,
      TESTING: 0,
      MEETINGS: 0,
      DOCUMENTATION: 0,
      OTHER: 0,
    };

    for (const rep of selectedWeekReports) {
      for (const tb of rep.timeBreakdowns) {
        if (categoryTotals[tb.category] !== undefined) {
          categoryTotals[tb.category] += tb.hours;
        } else {
          categoryTotals[tb.category] = (categoryTotals[tb.category] || 0) + tb.hours;
        }
      }
    }

    const timeSpentByCategory = Object.entries(categoryTotals).map(([category, hours]) => ({
      category,
      hours,
    }));

    // 7. Member-by-Member Derived Status (including Late Submission tracking)
    let lateCount = 0;
    let notStartedCount = 0;

    const memberStatuses = teamMembers.map((member) => {
      const report = reportMap.get(member.id);
      let derivedStatus: string;

      if (!report) {
        if (isDeadlinePassed) {
          derivedStatus = 'LATE';
          lateCount++;
        } else {
          derivedStatus = 'NOT_STARTED';
          notStartedCount++;
        }
      } else if (report.status === ReportStatus.DRAFT) {
        if (isDeadlinePassed) {
          derivedStatus = 'LATE';
          lateCount++;
        } else {
          derivedStatus = 'DRAFT';
        }
      } else {
        derivedStatus = report.status;
      }

      return {
        memberId: member.id,
        memberName: member.name,
        email: member.email,
        derivedStatus,
        reportId: report?.id || null,
        projectName: report?.project?.name || null,
        tasksCount: report?.tasks?.length || 0,
        hoursLogged: report?.timeBreakdowns?.reduce((sum, tb) => sum + tb.hours, 0) || 0,
      };
    });

    const statusCounts = {
      APPROVED: approvedCount,
      SUBMITTED: submittedCount,
      NEEDS_CORRECTION: needsCorrectionCount,
      DRAFT: draftCount,
      NOT_STARTED: notStartedCount,
      LATE: lateCount,
    };

    // 8. Completed deliverables in selected week
    const completedTasksCount = selectedWeekReports.reduce(
      (sum, r) => sum + r.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length,
      0
    );

    // 9. Reports awaiting review in selected week
    const awaitingReview = selectedWeekReports
      .filter((r) => r.status === ReportStatus.SUBMITTED)
      .sort((a, b) => (b.submittedAt?.getTime() || 0) - (a.submittedAt?.getTime() || 0));

    // 10. Recent reviews within this reporting context
    const recentActivity = await prisma.review.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        reviewer: { select: { name: true } },
        report: {
          include: {
            user: { select: { name: true } },
            project: { select: { name: true } },
          },
        },
      },
    });

    return {
      selectedWeek: {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
        isDeadlinePassed,
      },
      kpis: {
        totalMembers,
        totalSubmittedThisWeek, // SUBMITTED + NEEDS_CORRECTION + APPROVED
        submittedThisWeek: submittedCount,
        approvedThisWeek: approvedCount,
        complianceRate,
        needsCorrectionCount,
        openBlockers,
        completedTasksCount,
        lateSubmissionsCount: lateCount,
      },
      charts: {
        projectWorkload,
        timeSpentByCategory,
        statusCounts,
        memberStatuses,
      },
      awaitingReview,
      recentActivity,
    };
  }

  /**
   * Weekly Overview Matrix Table (Compares all team members side by side for a given week)
   */
  async getWeeklyOverview(targetWeekDate?: string, startDateParam?: string, endDateParam?: string) {
    const { weekStart, weekEnd } = this.getWeekRange(startDateParam, endDateParam, targetWeekDate);
    const now = new Date();
    const isDeadlinePassed = now.getTime() > weekEnd.getTime();

    // Get all active team members
    const teamMembers = await prisma.user.findMany({
      where: { role: Role.TEAM_MEMBER, isActive: true },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });

    // Get reports strictly for this week
    const reports = await prisma.report.findMany({
      where: {
        weekStart: { gte: weekStart, lte: weekEnd },
      },
      include: {
        project: true,
        tasks: { where: { reportVersionId: null } },
        blockers: { where: { reportVersionId: null } },
        achievements: { where: { reportVersionId: null } },
        timeBreakdowns: { where: { reportVersionId: null } },
      },
    });

    const reportMap = new Map(reports.map((r) => [r.userId, r]));

    const matrix = teamMembers.map((member) => {
      const report = reportMap.get(member.id);

      if (!report) {
        return {
          memberId: member.id,
          memberName: member.name,
          email: member.email,
          status: isDeadlinePassed ? 'LATE' : 'NOT_STARTED',
          reportId: null,
          project: null,
          completedTasksCount: 0,
          totalHours: 0,
          keyBlocker: null,
          keyAchievement: null,
        };
      }

      const completedTasksCount = report.tasks.filter((t) => t.status === TaskStatus.COMPLETED).length;
      const totalHours = report.timeBreakdowns.reduce((sum, tb) => sum + tb.hours, 0);
      const keyBlocker = report.blockers.find((b) => b.isKeyBlocker)?.description || report.blockers[0]?.description || null;
      const keyAchievement = report.achievements.find((a) => a.isKeyAchievement)?.description || report.achievements[0]?.description || null;

      let derivedStatus: string = report.status;
      if (report.status === ReportStatus.DRAFT && isDeadlinePassed) {
        derivedStatus = 'LATE';
      }

      return {
        memberId: member.id,
        memberName: member.name,
        email: member.email,
        status: derivedStatus,
        rawStatus: report.status,
        reportId: report.id,
        project: report.project.name,
        completedTasksCount,
        totalTasksCount: report.tasks.length,
        totalHours,
        keyBlocker,
        keyAchievement,
        versionNumber: report.currentVersionNumber,
      };
    });

    return {
      week: {
        weekStart: weekStart.toISOString().split('T')[0],
        weekEnd: weekEnd.toISOString().split('T')[0],
      },
      matrix,
    };
  }
}

export const dashboardService = new DashboardService();

