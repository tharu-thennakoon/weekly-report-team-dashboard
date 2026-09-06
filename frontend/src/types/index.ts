export type Role = 'TEAM_MEMBER' | 'MANAGER' | 'ADMIN';

export type ReportStatus = 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH';

export type TaskStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED';

export type TimeCategory = 'DEVELOPMENT' | 'TESTING' | 'MEETINGS' | 'DOCUMENTATION' | 'OTHER';

export type ReviewAction = 'APPROVED' | 'CHANGES_REQUESTED';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  isActive: boolean;
  createdAt?: string;
  _count?: {
    reports?: number;
  };
}

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  isActive: boolean;
  createdAt?: string;
  _count?: {
    reports?: number;
  };
}

export interface TaskItem {
  id?: number;
  name: string;
  priority: Priority;
  plannedPercent: number;
  actualPercent: number;
  status: TaskStatus;
  plannedHours: number;
  actualHours: number;
  deliverable?: string | null;
  isPlannedForNextWeek?: boolean;
}

export interface BlockerItem {
  id?: number;
  description: string;
  isKeyBlocker: boolean;
}

export interface AchievementItem {
  id?: number;
  description: string;
  isKeyAchievement: boolean;
}

export interface TimeBreakdownItem {
  id?: number;
  category: TimeCategory;
  hours: number;
}

export interface ReviewItem {
  id: number;
  reportId: number;
  reportVersionId?: number | null;
  reviewerId: number;
  action: ReviewAction;
  comment: string;
  createdAt: string;
  reviewer?: {
    id: number;
    name: string;
  };
}

export interface ReportVersion {
  id: number;
  reportId: number;
  versionNumber: number;
  statusAtSubmission: ReportStatus;
  notes?: string | null;
  links?: string | null;
  snapshotData: string;
  submittedAt: string;
  tasks?: TaskItem[];
  blockers?: BlockerItem[];
  achievements?: AchievementItem[];
  timeBreakdowns?: TimeBreakdownItem[];
  reviews?: ReviewItem[];
}

export interface Report {
  id: number;
  userId: number;
  projectId: number;
  weekStart: string;
  weekEnd: string;
  status: ReportStatus;
  notes?: string | null;
  links?: string | null;
  currentVersionNumber: number;
  submittedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
  project: {
    id: number;
    name: string;
  };
  tasks?: TaskItem[];
  blockers?: BlockerItem[];
  achievements?: AchievementItem[];
  timeBreakdowns?: TimeBreakdownItem[];
  reviews?: ReviewItem[];
  versions?: ReportVersion[];
  _count?: {
    tasks: number;
    blockers: number;
    achievements: number;
    versions: number;
    reviews: number;
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}
