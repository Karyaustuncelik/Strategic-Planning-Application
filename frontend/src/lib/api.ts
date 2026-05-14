import type {
  ActionPlan,
  Assignment,
  AuthOptions,
  AuthorizedUser,
  AuthSession,
  Goal,
  GoalTreeAssignmentResult,
  KPI,
  KpiResultType,
  LoginPayload,
  Milestone,
  SubmissionLog,
  UnitOwner,
  UserRole,
} from '../types';

const API_PREFIX = '/spu/api';

let _authToken: string | null = null;
export function setAuthToken(token: string | null) {
  _authToken = token;
}

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

type GoalFilters = {
  academicYearStart?: number;
};

type AuthOptionsFilters = {
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
    | 'lineageKey'
    | 'resultType'
    | 'resultValue'
    | 'resultUpdatedAt'
    | 'resultUpdatedBy'
    | 'projectionValues'
    | 'projectionUpdatedAt'
    | 'projectionUpdatedBy'
  >
>;

export type UpdateKpiResultPayload = {
  resultType: KpiResultType;
  resultValue: string;
  updatedBy: string;
};

export type UpdateKpiProjectionPayload = {
  projectionValues: string[];
  updatedBy: string;
};

export type CreateActionPlanPayload = Pick<
  ActionPlan,
  | 'goalId'
  | 'title'
  | 'description'
  | 'responsibleUnit'
  | 'assignedTo'
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
    | 'lineageKey'
    | 'resultType'
    | 'resultValue'
    | 'resultUpdatedAt'
    | 'resultUpdatedBy'
    | 'projectionValues'
    | 'projectionUpdatedAt'
    | 'projectionUpdatedBy'
  >
>;

export type UpdateActionPlanResultPayload = {
  resultType: KpiResultType;
  resultValue: string;
  updatedBy: string;
};

export type UpdateActionPlanProjectionPayload = {
  projectionValues: string[];
  updatedBy: string;
};

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

export type AssignGoalTreesPayload = {
  academicYearStart: number;
  goalIds: string[];
  assignedTo: string;
  assignedBy: string;
};

async function apiRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const authHeaders: Record<string, string> = _authToken
    ? { Authorization: `Bearer ${_authToken}` }
    : {};
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders,
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

  if (response.status === 204) {
    return {} as T;
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

export function fetchAuthOptions(filters: AuthOptionsFilters = {}) {
  return apiRequest<AuthOptions>(
    `${API_PREFIX}/auth/options${buildQuery({
      academicYearStart: filters.academicYearStart,
    })}`
  );
}

export function login(payload: LoginPayload) {
  return apiRequest<AuthSession>(`${API_PREFIX}/auth/login`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
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

export function assignGoalTrees(payload: AssignGoalTreesPayload) {
  return apiRequest<GoalTreeAssignmentResult>(API_PREFIX + '/goals/assign-tree', {
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

export function updateKpiResult(kpiId: string, payload: UpdateKpiResultPayload) {
  const shouldSyncCurrentValue =
    payload.resultType === 'number' ||
    payload.resultType === 'percentage' ||
    payload.resultType === 'currency';
  const numericResult = Number(payload.resultValue);

  return updateKPI(kpiId, {
    resultType: payload.resultType,
    resultValue: payload.resultValue,
    resultUpdatedAt: new Date().toISOString(),
    resultUpdatedBy: payload.updatedBy,
    currentValue:
      shouldSyncCurrentValue && Number.isFinite(numericResult)
        ? numericResult
        : undefined,
    updatedBy: payload.updatedBy,
  });
}

export function updateKpiProjections(kpiId: string, payload: UpdateKpiProjectionPayload) {
  return updateKPI(kpiId, {
    projectionValues: payload.projectionValues,
    projectionUpdatedAt: new Date().toISOString(),
    projectionUpdatedBy: payload.updatedBy,
    updatedBy: payload.updatedBy,
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

export function updateActionPlanResult(
  actionPlanId: string,
  payload: UpdateActionPlanResultPayload
) {
  return updateActionPlan(actionPlanId, {
    resultType: payload.resultType,
    resultValue: payload.resultValue,
    resultUpdatedAt: new Date().toISOString(),
    resultUpdatedBy: payload.updatedBy,
    updatedBy: payload.updatedBy,
  });
}

export function updateActionPlanProjections(
  actionPlanId: string,
  payload: UpdateActionPlanProjectionPayload
) {
  return updateActionPlan(actionPlanId, {
    projectionValues: payload.projectionValues,
    projectionUpdatedAt: new Date().toISOString(),
    projectionUpdatedBy: payload.updatedBy,
    updatedBy: payload.updatedBy,
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

export function extendKPIDeadline(kpiId: string, newDeadline: string, extendedBy: string) {
  return apiRequest<KPI>(`${API_PREFIX}/kpis/${kpiId}/extend-deadline`, {
    method: 'POST',
    body: JSON.stringify({ newDeadline, extendedBy }),
  });
}

export function fetchKPIHistory(kpiId: string) {
  return apiRequest<SubmissionLog[]>(`${API_PREFIX}/kpis/${kpiId}/history`);
}

export function extendActionPlanDeadline(actionId: string, newDeadline: string, extendedBy: string) {
  return apiRequest<ActionPlan>(`${API_PREFIX}/actions/${actionId}/extend-deadline`, {
    method: 'POST',
    body: JSON.stringify({ newDeadline, extendedBy }),
  });
}

export function fetchActionPlanHistory(actionId: string) {
  return apiRequest<SubmissionLog[]>(`${API_PREFIX}/actions/${actionId}/history`);
}

export function fetchAllSubmissionLogs(filters: {
  entityType?: 'kpi' | 'action_plan';
  goalId?: string;
  academicYearStart?: number;
} = {}) {
  return apiRequest<SubmissionLog[]>(
    `${API_PREFIX}/submission-logs${buildQuery(filters)}`
  );
}

export function deleteGoal(goalId: string) {
  return apiRequest<void>(`${API_PREFIX}/goals/${goalId}`, {
    method: 'DELETE',
  });
}

export function deleteKPI(kpiId: string) {
  return apiRequest<void>(`${API_PREFIX}/kpis/${kpiId}`, {
    method: 'DELETE',
  });
}

export function deleteActionPlan(actionPlanId: string) {
  return apiRequest<void>(`${API_PREFIX}/actions/${actionPlanId}`, {
    method: 'DELETE',
  });
}

// ─── User Management ──────────────────────────────────────────────────────────

export type CreateUserPayload = {
  email: string;
  fullName: string;
  role: UserRole;
};

export type UpdateUserPayload = {
  fullName?: string;
  role?: UserRole;
};

export function fetchUsers() {
  return apiRequest<AuthorizedUser[]>(`${API_PREFIX}/users`);
}

export function createUser(payload: CreateUserPayload) {
  return apiRequest<AuthorizedUser>(`${API_PREFIX}/users`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateUser(id: number, payload: UpdateUserPayload) {
  return apiRequest<AuthorizedUser>(`${API_PREFIX}/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteUser(id: number) {
  return apiRequest<void>(`${API_PREFIX}/users/${id}`, {
    method: 'DELETE',
  });
}
