import type {
  ActionPlan,
  Assignment,
  Goal,
  KPI,
  Milestone,
  UnitOwner,
} from '../types';

const API_PREFIX = '/spu/api';


type ApiErrorPayload = {
  error?: string;
  message?: string;
};

type GoalFilters = {
  academicYearStart?: number;
};

type UnitOwnerFilters = {
  academicYearStart?: number;
};

type AssignmentFilters = {
  academicYearStart?: number;
  status?: Assignment['status'] | 'all';
  entityType?: Assignment['entityType'] | 'all';
  unit?: string;
  assignedTo?: string;
};

type KpiFilters = {
  academicYearStart?: number;
  goalId?: string;
  responsibleUnit?: string;
};

type ActionPlanFilters = {
  academicYearStart?: number;
  goalId?: string;
  responsibleUnit?: string;
};

type MilestoneFilters = {
  academicYearStart?: number;
  linkedId?: string;
  owner?: string;
  status?: Milestone['status'] | 'all';
};

export type CreateGoalPayload = Pick<
  Goal,
  | 'title'
  | 'description'
  | 'academicYearStart'
  | 'status'
  | 'priority'
  | 'responsibleUnit'
  | 'startDate'
  | 'endDate'
  | 'progress'
  | 'updatedBy'
> & {
  parentId?: string;
  assignedTo?: string[];
};

export type UpdateGoalPayload = Partial<
  Pick<
    Goal,
    | 'title'
    | 'description'
    | 'academicYearStart'
    | 'status'
    | 'priority'
    | 'responsibleUnit'
    | 'parentId'
    | 'startDate'
    | 'endDate'
    | 'progress'
    | 'assignedTo'
    | 'updatedBy'
  >
>;

export type CreateAssignmentPayload = Pick<
  Assignment,
  'entityType' | 'entityId' | 'assignedTo' | 'assignedBy' | 'deadline'
> & {
  academicYearStart?: number;
  unit?: string;
  status?: Assignment['status'];
  notes?: string;
};

export type CreateKpiPayload = Pick<
  KPI,
  | 'goalId'
  | 'name'
  | 'description'
  | 'targetValue'
  | 'currentValue'
  | 'unit'
  | 'academicYearStart'
  | 'responsibleUnit'
  | 'deadline'
  | 'status'
  | 'updatedBy'
> & {
  assignedTo?: string;
};

export type UpdateKpiPayload = Partial<
  Pick<
    KPI,
    | 'goalId'
    | 'name'
    | 'description'
    | 'targetValue'
    | 'currentValue'
    | 'unit'
    | 'academicYearStart'
    | 'responsibleUnit'
    | 'deadline'
    | 'status'
    | 'updatedBy'
    | 'assignedTo'
  >
>;

export type CreateActionPlanPayload = Pick<
  ActionPlan,
  | 'goalId'
  | 'title'
  | 'description'
  | 'responsibleUnit'
  | 'assignedTo'
  | 'deadline'
  | 'status'
  | 'priority'
  | 'updatedBy'
> & {
  kpiId?: string;
  academicYearStart?: number;
  progress?: number;
  notes?: string;
};

export type UpdateActionPlanPayload = Partial<
  Pick<
    ActionPlan,
    | 'goalId'
    | 'kpiId'
    | 'title'
    | 'description'
    | 'responsibleUnit'
    | 'assignedTo'
    | 'deadline'
    | 'status'
    | 'priority'
    | 'updatedBy'
    | 'academicYearStart'
    | 'progress'
    | 'notes'
  >
>;

export type CreateMilestonePayload = Pick<
  Milestone,
  | 'linkedType'
  | 'linkedId'
  | 'title'
  | 'description'
  | 'owner'
  | 'dueDate'
  | 'status'
  | 'definitionOfDone'
  | 'progress'
  | 'updatedBy'
>;

export type AddMilestoneProgressUpdatePayload = {
  user: string;
  note: string;
  progressPercentage: number;
};

export type AddMilestoneEvidencePayload = {
  link: string;
  user?: string;
};

export type UpsertUnitOwnerPayload = {
  academicYearStart: number;
  unitName: string;
  ownerName: string;
  updatedBy: string;
};

export type CopyAcademicYearGoalsPayload = {
  sourceAcademicYearStart: number;
  targetAcademicYearStart: number;
  goalIds?: string[];
  requestedBy: string;
};

export type CopyAcademicYearGoalsResult = {
  sourceAcademicYearStart: number;
  targetAcademicYearStart: number;
  copiedGoals: number;
  copiedKPIs: number;
  copiedActions: number;
  copiedMilestones: number;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    let payload: ApiErrorPayload | null = null;
    try {
      payload = (await response.json()) as ApiErrorPayload;
    } catch {
      payload = null;
    }

    throw new Error(
      payload?.error ?? payload?.message ?? `Request failed with status ${response.status}`
    );
  }

  return (await response.json()) as T;
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const query = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value == null || value === '') continue;
    query.set(key, String(value));
  }

  const output = query.toString();
  return output ? `?${output}` : '';
}

export function fetchGoals(filters: GoalFilters = {}) {
  return apiRequest<Goal[]>(
    `${API_PREFIX}/goals${buildQuery({
      academicYearStart: filters.academicYearStart,
    })}`
  );
}

export function fetchGoalById(goalId: string) {
  return apiRequest<Goal>(`${API_PREFIX}/goals/${goalId}`);
}

export function copyAcademicYearGoals(payload: CopyAcademicYearGoalsPayload) {
  return apiRequest<CopyAcademicYearGoalsResult>(API_PREFIX + '/goals/copy-year', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function createGoal(payload: CreateGoalPayload) {
  return apiRequest<Goal>(API_PREFIX + '/goals', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateGoal(goalId: string, payload: UpdateGoalPayload) {
  return apiRequest<Goal>(`${API_PREFIX}/goals/${goalId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function fetchAssignments(filters: AssignmentFilters = {}) {
  return apiRequest<Assignment[]>(
    `${API_PREFIX}/assignments${buildQuery({
      academicYearStart: filters.academicYearStart,
      status: filters.status && filters.status !== 'all' ? filters.status : undefined,
      entityType:
        filters.entityType && filters.entityType !== 'all'
          ? filters.entityType
          : undefined,
      unit: filters.unit,
      assignedTo: filters.assignedTo,
    })}`
  );
}

export function createAssignment(payload: CreateAssignmentPayload) {
  return apiRequest<Assignment>(API_PREFIX + '/assignments', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchUnitOwners(filters: UnitOwnerFilters = {}) {
  return apiRequest<UnitOwner[]>(
    `${API_PREFIX}/unit-owners${buildQuery({
      academicYearStart: filters.academicYearStart,
    })}`
  );
}

export function upsertUnitOwner(payload: UpsertUnitOwnerPayload) {
  return apiRequest<UnitOwner>(API_PREFIX + '/unit-owners', {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateAssignmentStatus(
  assignmentId: string,
  status: Assignment['status']
) {
  return apiRequest<Assignment>(`${API_PREFIX}/assignments/${assignmentId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function fetchKPIs(filters: KpiFilters = {}) {
  return apiRequest<KPI[]>(
    `${API_PREFIX}/kpis${buildQuery({
      academicYearStart: filters.academicYearStart,
      goalId: filters.goalId,
      responsibleUnit: filters.responsibleUnit,
    })}`
  );
}

export function createKPI(payload: CreateKpiPayload) {
  return apiRequest<KPI>(API_PREFIX + '/kpis', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateKPI(kpiId: string, payload: UpdateKpiPayload) {
  return apiRequest<KPI>(`${API_PREFIX}/kpis/${kpiId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function fetchActionPlans(filters: ActionPlanFilters = {}) {
  return apiRequest<ActionPlan[]>(
    `${API_PREFIX}/actions${buildQuery({
      academicYearStart: filters.academicYearStart,
      goalId: filters.goalId,
      responsibleUnit: filters.responsibleUnit,
    })}`
  );
}

export function createActionPlan(payload: CreateActionPlanPayload) {
  return apiRequest<ActionPlan>(API_PREFIX + '/actions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateActionPlan(
  actionPlanId: string,
  payload: UpdateActionPlanPayload
) {
  return apiRequest<ActionPlan>(`${API_PREFIX}/actions/${actionPlanId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function fetchMilestones(filters: MilestoneFilters = {}) {
  return apiRequest<Milestone[]>(
    `${API_PREFIX}/milestones${buildQuery({
      academicYearStart: filters.academicYearStart,
      linkedId: filters.linkedId,
      owner: filters.owner,
      status: filters.status && filters.status !== 'all' ? filters.status : undefined,
    })}`
  );
}

export function createMilestone(payload: CreateMilestonePayload) {
  return apiRequest<Milestone>(API_PREFIX + '/milestones', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addMilestoneProgressUpdate(
  milestoneId: string,
  payload: AddMilestoneProgressUpdatePayload
) {
  return apiRequest<Milestone>(`${API_PREFIX}/milestones/${milestoneId}/updates`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function addMilestoneEvidence(
  milestoneId: string,
  payload: AddMilestoneEvidencePayload
) {
  return apiRequest<Milestone>(`${API_PREFIX}/milestones/${milestoneId}/evidence`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
