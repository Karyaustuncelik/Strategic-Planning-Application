export type UserRole =
  | 'Strategy Office'
  | 'Unit Manager'
  | 'Senior Management'
  | 'Viewer';

export type LoginMode = 'admin' | 'viewer';

export interface AuthSession {
  id?: string;
  name: string;
  role: UserRole;
  unit?: string;
  loginMode: LoginMode;
}

export interface ViewerAccount {
  id: string;
  name: string;
  unit?: string;
}

export interface AuthOptions {
  adminUsername: string;
  viewerPasswordHint: string;
  viewerAccounts: ViewerAccount[];
}

export interface LoginPayload {
  loginMode: LoginMode;
  password: string;
  username?: string;
  viewerId?: string;
}

export type GoalStatus =
  | 'On Track'
  | 'At Risk'
  | 'Delayed'
  | 'Completed'
  | 'Not Started';
export type ActionStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Blocked';
export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';
export type MilestoneStatus = 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
export type LinkedEntityType = 'Goal' | 'SubGoal';

export interface Goal {
  id: string;
  title: string;
  description: string;
  academicYearStart: number; // e.g., 2025 for "2025-26"
  status: GoalStatus;
  priority: Priority;
  responsibleUnit: string;
  parentId?: string; // For hierarchical structure
  level: number; // 0 = main goal, 1 = sub-goal, 2 = sub-item
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  startDate: string;
  endDate: string;
  progress: number; // 0-100
  assignedTo?: string[];
}

export interface KPI {
  id: string;
  goalId: string;
  name: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  academicYearStart: number;
  responsibleUnit: string;
  deadline: string;
  status: GoalStatus;
  updatedAt: string;
  updatedBy: string;
  assignedTo?: string;
}

export interface ActionPlan {
  id: string;
  goalId: string;
  kpiId?: string;
  title: string;
  description: string;
  responsibleUnit: string;
  assignedTo: string;
  deadline: string;
  status: ActionStatus;
  progress: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  notes: string;
  priority: Priority;
  academicYearStart?: number;
}

export interface Assignment {
  id: string;
  entityType: 'Goal' | 'SubGoal' | 'KPI' | 'Action Plan';
  entityId: string;
  academicYearStart?: number;
  assignedTo: string;
  assignedBy: string;
  unit: string;
  assignedDate: string;
  deadline: string;
  status: 'Pending' | 'Accepted' | 'In Progress' | 'Completed' | 'Rejected';
  notes?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  entityType: 'Goal' | 'KPI' | 'Action Plan';
  entityId: string;
  changes: string;
}

export interface TimelineEvent {
  id: string;
  title: string;
  goalId: string;
  type: 'Goal' | 'KPI' | 'Action' | 'Milestone';
  startDate: string;
  endDate: string;
  status: GoalStatus | ActionStatus;
  responsibleUnit: string;
  assignedTo?: string;
}

export interface Milestone {
  id: string;
  linkedType: LinkedEntityType; // 'Goal' or 'SubGoal'
  linkedId: string; // ID of the linked goal or subgoal
  title: string;
  description: string;
  owner: string; // Default to assignee
  dueDate: string;
  status: MilestoneStatus;
  definitionOfDone: string;
  progress: number; // 0-100
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
  progressUpdates: ProgressUpdate[];
  evidenceLinks: string[];
}

export interface ProgressUpdate {
  id: string;
  milestoneId: string;
  timestamp: string;
  user: string;
  note: string;
  progressPercentage: number;
}

export interface UnitOwner {
  academicYearStart: number;
  unitName: string;
  ownerName: string;
  updatedAt: string;
  updatedBy: string;
}

export interface HierarchyNavigationFilter {
  status?: GoalStatus | 'all';
  level?: 0 | 1 | 2 | 'all';
  department?: string;
  goalName?: string;
}
