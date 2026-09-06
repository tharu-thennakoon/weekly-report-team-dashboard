import prisma from '../config/prisma.js';
import { Role, ReportStatus, ReviewAction } from '@prisma/client';

export interface CreateReportDTO {
  projectId: number;
  weekStart: Date;
  weekEnd: Date;
  notes?: string | null;
  links?: string | null;
  tasks?: any[];
  blockers?: any[];
  achievements?: any[];
  timeBreakdowns?: any[];
}

export interface UpdateReportDTO {
  projectId?: number;
  weekStart?: Date;
  weekEnd?: Date;
  notes?: string | null;
  links?: string | null;
  tasks?: any[];
  blockers?: any[];
  achievements?: any[];
  timeBreakdowns?: any[];
}

export interface ReportQueryFilters {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  projectId?: number;
  userId?: number;
  search?: string;
  weekStart?: string;
  weekEnd?: string;
}

export class ReportService {
  /**
   * List reports with pagination and multi-dimensional filters (Manager/Admin view)
   */
  async getReports(filters: ReportQueryFilters) {
    const page = Math.max(1, filters.page || 1);
    const limit = Math.max(1, Math.min(100, filters.limit || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.projectId) where.projectId = filters.projectId;
    if (filters.userId) where.userId = filters.userId;

    if (filters.weekStart) {
      where.weekStart = { gte: new Date(filters.weekStart) };
    }
    if (filters.weekEnd) {
      where.weekEnd = { lte: new Date(filters.weekEnd) };
    }

    if (filters.search) {
      where.OR = [
        { user: { name: { contains: filters.search } } },
        { user: { email: { contains: filters.search } } },
        { project: { name: { contains: filters.search } } },
        { notes: { contains: filters.search } },
      ];
    }

    const [total, reports] = await Promise.all([
      prisma.report.count({ where }),
      prisma.report.findMany({
        where,
        skip,
        take: limit,
        orderBy: { weekStart: 'desc' },
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
          _count: {
            select: {
              tasks: true,
              blockers: true,
              achievements: true,
              versions: true,
              reviews: true,
            },
          },
          reviews: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: {
              reviewer: { select: { id: true, name: true } },
            },
          },
        },
      }),
    ]);

    return {
      data: reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * List authenticated member's own reports
   */
  async getMyReports(userId: number) {
    return prisma.report.findMany({
      where: { userId },
      orderBy: { weekStart: 'desc' },
      include: {
        project: { select: { id: true, name: true } },
        _count: {
          select: { tasks: true, blockers: true, achievements: true, versions: true },
        },
        reviews: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true } },
          },
        },
      },
    });
  }

  /**
   * Get single report by ID with ownership enforcement
   */
  async getReportById(id: number, requestingUser: { userId: number; role: Role }) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
        tasks: {
          where: { reportVersionId: null },
          orderBy: { id: 'asc' },
        },
        blockers: {
          where: { reportVersionId: null },
          orderBy: { id: 'asc' },
        },
        achievements: {
          where: { reportVersionId: null },
          orderBy: { id: 'asc' },
        },
        timeBreakdowns: {
          where: { reportVersionId: null },
          orderBy: { id: 'asc' },
        },
        reviews: {
          orderBy: { createdAt: 'desc' },
          include: {
            reviewer: { select: { id: true, name: true } },
          },
        },
        versions: {
          orderBy: { versionNumber: 'desc' },
          select: {
            id: true,
            versionNumber: true,
            statusAtSubmission: true,
            submittedAt: true,
            notes: true,
            links: true,
            snapshotData: true,
            reviews: {
              include: {
                reviewer: { select: { id: true, name: true } },
              },
            },
          },
        },
      },
    });

    if (!report) {
      const error: any = new Error('Report not found.');
      error.statusCode = 404;
      throw error;
    }

    // Role-based authorization check
    if (requestingUser.role === Role.TEAM_MEMBER && report.userId !== requestingUser.userId) {
      const error: any = new Error('Forbidden: You do not have permission to view this report.');
      error.statusCode = 403;
      throw error;
    }

    return report;
  }

  /**
   * Create a new draft report (Team Member)
   */
  async createReport(userId: number, data: CreateReportDTO) {
    const project = await prisma.project.findUnique({ where: { id: data.projectId } });
    if (!project) {
      const error: any = new Error('Selected project does not exist.');
      error.statusCode = 400;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const report = await tx.report.create({
        data: {
          userId,
          projectId: data.projectId,
          weekStart: data.weekStart,
          weekEnd: data.weekEnd,
          status: ReportStatus.DRAFT,
          notes: data.notes,
          links: data.links,
          currentVersionNumber: 1,
        },
      });

      if (data.tasks && data.tasks.length > 0) {
        await tx.task.createMany({
          data: data.tasks.map((t) => ({
            reportId: report.id,
            name: t.name,
            priority: t.priority,
            plannedPercent: t.plannedPercent ?? 0,
            actualPercent: t.actualPercent ?? 0,
            status: t.status,
            plannedHours: t.plannedHours ?? 0,
            actualHours: t.actualHours ?? 0,
            deliverable: t.deliverable,
            isPlannedForNextWeek: t.isPlannedForNextWeek ?? false,
          })),
        });
      }

      if (data.blockers && data.blockers.length > 0) {
        await tx.blocker.createMany({
          data: data.blockers.map((b) => ({
            reportId: report.id,
            description: b.description,
            isKeyBlocker: b.isKeyBlocker ?? false,
          })),
        });
      }

      if (data.achievements && data.achievements.length > 0) {
        await tx.achievement.createMany({
          data: data.achievements.map((a) => ({
            reportId: report.id,
            description: a.description,
            isKeyAchievement: a.isKeyAchievement ?? false,
          })),
        });
      }

      if (data.timeBreakdowns && data.timeBreakdowns.length > 0) {
        await tx.timeBreakdown.createMany({
          data: data.timeBreakdowns.map((tb) => ({
            reportId: report.id,
            category: tb.category,
            hours: tb.hours ?? 0,
          })),
        });
      }

      return report;
    });
  }

  /**
   * Update report content (Team Member only while in DRAFT or NEEDS_CORRECTION)
   */
  async updateReport(id: number, userId: number, data: UpdateReportDTO) {
    const report = await prisma.report.findUnique({ where: { id } });

    if (!report) {
      const error: any = new Error('Report not found.');
      error.statusCode = 404;
      throw error;
    }

    if (report.userId !== userId) {
      const error: any = new Error('Forbidden: You can only edit your own reports.');
      error.statusCode = 403;
      throw error;
    }

    if (report.status !== ReportStatus.DRAFT && report.status !== ReportStatus.NEEDS_CORRECTION) {
      const error: any = new Error(
        `Cannot edit report in '${report.status}' status. Reports can only be edited when in DRAFT or NEEDS_CORRECTION status.`
      );
      error.statusCode = 400;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      await tx.report.update({
        where: { id },
        data: {
          ...(data.projectId && { projectId: data.projectId }),
          ...(data.weekStart && { weekStart: data.weekStart }),
          ...(data.weekEnd && { weekEnd: data.weekEnd }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.links !== undefined && { links: data.links }),
        },
      });

      if (data.tasks !== undefined) {
        await tx.task.deleteMany({ where: { reportId: id, reportVersionId: null } });
        if (data.tasks.length > 0) {
          await tx.task.createMany({
            data: data.tasks.map((t) => ({
              reportId: id,
              name: t.name,
              priority: t.priority,
              plannedPercent: t.plannedPercent ?? 0,
              actualPercent: t.actualPercent ?? 0,
              status: t.status,
              plannedHours: t.plannedHours ?? 0,
              actualHours: t.actualHours ?? 0,
              deliverable: t.deliverable,
              isPlannedForNextWeek: t.isPlannedForNextWeek ?? false,
            })),
          });
        }
      }

      if (data.blockers !== undefined) {
        await tx.blocker.deleteMany({ where: { reportId: id, reportVersionId: null } });
        if (data.blockers.length > 0) {
          await tx.blocker.createMany({
            data: data.blockers.map((b) => ({
              reportId: id,
              description: b.description,
              isKeyBlocker: b.isKeyBlocker ?? false,
            })),
          });
        }
      }

      if (data.achievements !== undefined) {
        await tx.achievement.deleteMany({ where: { reportId: id, reportVersionId: null } });
        if (data.achievements.length > 0) {
          await tx.achievement.createMany({
            data: data.achievements.map((a) => ({
              reportId: id,
              description: a.description,
              isKeyAchievement: a.isKeyAchievement ?? false,
            })),
          });
        }
      }

      if (data.timeBreakdowns !== undefined) {
        await tx.timeBreakdown.deleteMany({ where: { reportId: id, reportVersionId: null } });
        if (data.timeBreakdowns.length > 0) {
          await tx.timeBreakdown.createMany({
            data: data.timeBreakdowns.map((tb) => ({
              reportId: id,
              category: tb.category,
              hours: tb.hours ?? 0,
            })),
          });
        }
      }

      return tx.report.findUnique({
        where: { id },
        include: {
          tasks: { where: { reportVersionId: null } },
          blockers: { where: { reportVersionId: null } },
          achievements: { where: { reportVersionId: null } },
          timeBreakdowns: { where: { reportVersionId: null } },
        },
      });
    });
  }

  /**
   * Submit or Resubmit a Report (Transitions DRAFT -> SUBMITTED or NEEDS_CORRECTION -> SUBMITTED)
   * Creates an immutable ReportVersion snapshot.
   */
  async submitReport(id: number, userId: number) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        tasks: { where: { reportVersionId: null } },
        blockers: { where: { reportVersionId: null } },
        achievements: { where: { reportVersionId: null } },
        timeBreakdowns: { where: { reportVersionId: null } },
      },
    });

    if (!report) {
      const error: any = new Error('Report not found.');
      error.statusCode = 404;
      throw error;
    }

    if (report.userId !== userId) {
      const error: any = new Error('Forbidden: You can only submit your own report.');
      error.statusCode = 403;
      throw error;
    }

    // State machine check
    if (report.status !== ReportStatus.DRAFT && report.status !== ReportStatus.NEEDS_CORRECTION) {
      const error: any = new Error(
        `Invalid status transition. Cannot submit a report with status '${report.status}'.`
      );
      error.statusCode = 400;
      throw error;
    }

    const nextVersionNumber = report.status === ReportStatus.NEEDS_CORRECTION ? report.currentVersionNumber + 1 : 1;

    return prisma.$transaction(async (tx) => {
      // 1. Snapshot full report contents
      const snapshot = {
        versionNumber: nextVersionNumber,
        notes: report.notes,
        links: report.links,
        tasks: report.tasks,
        blockers: report.blockers,
        achievements: report.achievements,
        timeBreakdowns: report.timeBreakdowns,
      };

      const version = await tx.reportVersion.create({
        data: {
          reportId: id,
          versionNumber: nextVersionNumber,
          statusAtSubmission: ReportStatus.SUBMITTED,
          notes: report.notes,
          links: report.links,
          snapshotData: JSON.stringify(snapshot),
          submittedAt: new Date(),
        },
      });

      // 2. Clone active tasks/blockers/achievements/hours linked to this version for relational querying
      if (report.tasks.length > 0) {
        await tx.task.createMany({
          data: report.tasks.map((t) => ({
            reportId: id,
            reportVersionId: version.id,
            name: t.name,
            priority: t.priority,
            plannedPercent: t.plannedPercent,
            actualPercent: t.actualPercent,
            status: t.status,
            plannedHours: t.plannedHours,
            actualHours: t.actualHours,
            deliverable: t.deliverable,
            isPlannedForNextWeek: t.isPlannedForNextWeek,
          })),
        });
      }

      if (report.blockers.length > 0) {
        await tx.blocker.createMany({
          data: report.blockers.map((b) => ({
            reportId: id,
            reportVersionId: version.id,
            description: b.description,
            isKeyBlocker: b.isKeyBlocker,
          })),
        });
      }

      if (report.achievements.length > 0) {
        await tx.achievement.createMany({
          data: report.achievements.map((a) => ({
            reportId: id,
            reportVersionId: version.id,
            description: a.description,
            isKeyAchievement: a.isKeyAchievement,
          })),
        });
      }

      if (report.timeBreakdowns.length > 0) {
        await tx.timeBreakdown.createMany({
          data: report.timeBreakdowns.map((tb) => ({
            reportId: id,
            reportVersionId: version.id,
            category: tb.category,
            hours: tb.hours,
          })),
        });
      }

      // 3. Update master report status
      return tx.report.update({
        where: { id },
        data: {
          status: ReportStatus.SUBMITTED,
          currentVersionNumber: nextVersionNumber,
          submittedAt: new Date(),
        },
        include: {
          project: true,
          versions: true,
        },
      });
    });
  }

  /**
   * Manager Review (Approve or Request Changes)
   */
  async reviewReport(
    id: number,
    reviewerId: number,
    reviewData: { action: ReviewAction; comment: string }
  ) {
    const report = await prisma.report.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 1,
        },
      },
    });

    if (!report) {
      const error: any = new Error('Report not found.');
      error.statusCode = 404;
      throw error;
    }

    // Only SUBMITTED reports can be reviewed
    if (report.status !== ReportStatus.SUBMITTED) {
      const error: any = new Error(
        `Cannot review report in '${report.status}' status. Only SUBMITTED reports can be reviewed.`
      );
      error.statusCode = 400;
      throw error;
    }

    const latestVersion = report.versions[0];
    const newStatus =
      reviewData.action === ReviewAction.APPROVED
        ? ReportStatus.APPROVED
        : ReportStatus.NEEDS_CORRECTION;

    return prisma.$transaction(async (tx) => {
      // 1. Create review entry
      await tx.review.create({
        data: {
          reportId: id,
          reportVersionId: latestVersion ? latestVersion.id : null,
          reviewerId,
          action: reviewData.action,
          comment: reviewData.comment,
        },
      });

      // 2. Update report status
      return tx.report.update({
        where: { id },
        data: { status: newStatus },
        include: {
          user: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
          reviews: {
            orderBy: { createdAt: 'desc' },
            include: { reviewer: { select: { id: true, name: true } } },
          },
        },
      });
    });
  }

  /**
   * Get version history for a report
   */
  async getReportVersions(reportId: number, requestingUser: { userId: number; role: Role }) {
    await this.getReportById(reportId, requestingUser);

    return prisma.reportVersion.findMany({
      where: { reportId },
      orderBy: { versionNumber: 'desc' },
      include: {
        tasks: true,
        blockers: true,
        achievements: true,
        timeBreakdowns: true,
        reviews: {
          include: {
            reviewer: { select: { id: true, name: true } },
          },
        },
      },
    });
  }
}

export const reportService = new ReportService();
