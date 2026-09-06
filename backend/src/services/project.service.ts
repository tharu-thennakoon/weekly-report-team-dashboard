import prisma from '../config/prisma.js';
import { CreateProjectInput, UpdateProjectInput } from '../validators/project.validator.js';

export class ProjectService {
  /**
   * List all projects (with report counts)
   */
  async getAllProjects(onlyActive = false) {
    return prisma.project.findMany({
      where: {
        ...(onlyActive && { isActive: true }),
      },
      include: {
        _count: {
          select: { reports: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  /**
   * Get single project by ID
   */
  async getProjectById(id: number) {
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: {
          select: { reports: true },
        },
      },
    });

    if (!project) {
      const error: any = new Error('Project not found.');
      error.statusCode = 404;
      throw error;
    }

    return project;
  }

  /**
   * Create a new project
   */
  async createProject(data: CreateProjectInput) {
    const existing = await prisma.project.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      const error: any = new Error('A project with this name already exists.');
      error.statusCode = 409;
      throw error;
    }

    return prisma.project.create({
      data: {
        name: data.name,
        description: data.description,
        isActive: data.isActive ?? true,
      },
    });
  }

  /**
   * Update an existing project
   */
  async updateProject(id: number, data: UpdateProjectInput) {
    await this.getProjectById(id);

    if (data.name) {
      const duplicate = await prisma.project.findFirst({
        where: {
          name: data.name,
          NOT: { id },
        },
      });

      if (duplicate) {
        const error: any = new Error('Another project already has this name.');
        error.statusCode = 409;
        throw error;
      }
    }

    return prisma.project.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete or deactivate a project
   */
  async deleteProject(id: number) {
    const project = await this.getProjectById(id);

    // If project has existing reports, softly deactivate instead of deleting to preserve historical integrity
    const reportCount = await prisma.report.count({ where: { projectId: id } });

    if (reportCount > 0) {
      return prisma.project.update({
        where: { id },
        data: { isActive: false },
      });
    }

    return prisma.project.delete({
      where: { id },
    });
  }
}

export const projectService = new ProjectService();
