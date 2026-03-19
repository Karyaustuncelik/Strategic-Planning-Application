import { pool } from './db.js';

const createKpisTableSql = `
  CREATE TABLE IF NOT EXISTS kpis (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    target_value INTEGER NOT NULL,
    current_value INTEGER NOT NULL,
    unit TEXT NOT NULL,
    academic_year_start INTEGER NOT NULL,
    responsible_unit TEXT NOT NULL,
    deadline TEXT NOT NULL,
    status TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    assigned_to TEXT
  );
`;

const createActionPlansTableSql = `
  CREATE TABLE IF NOT EXISTS action_plans (
    id TEXT PRIMARY KEY,
    goal_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    kpi_id TEXT REFERENCES kpis(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    responsible_unit TEXT NOT NULL,
    assigned_to TEXT NOT NULL,
    deadline TEXT NOT NULL,
    status TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    priority TEXT NOT NULL,
    academic_year_start INTEGER NOT NULL
  );
`;

const createMilestonesTableSql = `
  CREATE TABLE IF NOT EXISTS milestones (
    id TEXT PRIMARY KEY,
    linked_type TEXT NOT NULL,
    linked_id TEXT NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    owner TEXT NOT NULL,
    due_date TEXT NOT NULL,
    status TEXT NOT NULL,
    definition_of_done TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    progress_updates JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_links JSONB NOT NULL DEFAULT '[]'::jsonb
  );
`;

const validGoalStatuses = new Set([
  'On Track',
  'At Risk',
  'Delayed',
  'Completed',
  'Not Started',
]);

const validPriorities = new Set(['Low', 'Medium', 'High', 'Critical']);

const validActionStatuses = new Set([
  'Not Started',
  'In Progress',
  'Completed',
  'Blocked',
]);

const validMilestoneStatuses = new Set([
  'Not Started',
  'In Progress',
  'Completed',
  'Overdue',
]);

const validLinkedTypes = new Set(['Goal', 'SubGoal']);

const seedKpis = [
  {
    id: 'KPI001',
    goal_id: 'G001',
    name: 'High-impact journal publications',
    description:
      'Track the number of publications accepted in top-tier journals.',
    target_value: 30,
    current_value: 24,
    unit: 'publications',
    academic_year_start: 2025,
    responsible_unit: 'Research Department',
    deadline: '2026-01-31',
    status: 'On Track',
    updated_at: '2025-12-01T14:30:00Z',
    updated_by: 'Dr. Sarah Johnson',
    assigned_to: 'Dr. Sarah Johnson',
  },
  {
    id: 'KPI002',
    goal_id: 'G002',
    name: 'Student retention rate',
    description:
      'Measure retention rate improvement for first-year and at-risk students.',
    target_value: 92,
    current_value: 84,
    unit: '%',
    academic_year_start: 2025,
    responsible_unit: 'Academic Affairs',
    deadline: '2026-01-31',
    status: 'At Risk',
    updated_at: '2025-11-28T16:45:00Z',
    updated_by: 'Prof. Emily Chen',
    assigned_to: 'Prof. Emily Chen',
  },
  {
    id: 'KPI003',
    goal_id: 'G003',
    name: 'LMS migration completion',
    description: 'Percentage of LMS migration tasks completed on schedule.',
    target_value: 100,
    current_value: 78,
    unit: '%',
    academic_year_start: 2025,
    responsible_unit: 'IT Department',
    deadline: '2026-01-15',
    status: 'On Track',
    updated_at: '2025-12-05T09:15:00Z',
    updated_by: 'John Smith',
    assigned_to: 'John Smith',
  },
  {
    id: 'KPI004',
    goal_id: 'G003',
    name: 'Digital adoption training coverage',
    description: 'Track staff participation in digital adoption training sessions.',
    target_value: 140,
    current_value: 20,
    unit: 'participants',
    academic_year_start: 2025,
    responsible_unit: 'IT Department',
    deadline: '2026-03-31',
    status: 'Not Started',
    updated_at: '2025-12-18T10:00:00Z',
    updated_by: 'Maria Garcia',
    assigned_to: 'Maria Garcia',
  },
];

const seedActionPlans = [
  {
    id: 'AP001',
    goal_id: 'G001',
    kpi_id: 'KPI001',
    title: 'Deliver academic writing bootcamps',
    description:
      'Run monthly academic writing bootcamps for faculty and graduate students.',
    responsible_unit: 'Research Department',
    assigned_to: 'Dr. Sarah Johnson',
    deadline: '2026-01-10',
    status: 'In Progress',
    progress: 70,
    created_at: '2025-09-15T10:00:00Z',
    updated_at: '2025-12-01T14:30:00Z',
    updated_by: 'Dr. Sarah Johnson',
    notes: 'Three workshops completed, two more scheduled.',
    priority: 'High',
    academic_year_start: 2025,
  },
  {
    id: 'AP002',
    goal_id: 'G002',
    kpi_id: 'KPI002',
    title: 'Expand tutoring center coverage',
    description:
      'Recruit additional tutors and extend tutoring center operating hours.',
    responsible_unit: 'Academic Affairs',
    assigned_to: 'Prof. Emily Chen',
    deadline: '2026-01-20',
    status: 'Blocked',
    progress: 35,
    created_at: '2025-09-18T09:00:00Z',
    updated_at: '2025-11-28T16:45:00Z',
    updated_by: 'Prof. Emily Chen',
    notes: 'Pending budget approval for evening staffing.',
    priority: 'Critical',
    academic_year_start: 2025,
  },
  {
    id: 'AP003',
    goal_id: 'G003',
    kpi_id: 'KPI003',
    title: 'Migrate pilot faculties to the new LMS',
    description:
      'Move pilot faculties into the new LMS and verify course delivery workflows.',
    responsible_unit: 'IT Department',
    assigned_to: 'John Smith',
    deadline: '2026-01-05',
    status: 'In Progress',
    progress: 78,
    created_at: '2025-09-20T08:30:00Z',
    updated_at: '2025-12-05T09:15:00Z',
    updated_by: 'John Smith',
    notes: 'Pilot migration is running for two faculties.',
    priority: 'High',
    academic_year_start: 2025,
  },
  {
    id: 'AP004',
    goal_id: 'G003',
    kpi_id: 'KPI004',
    title: 'Publish digital adoption training calendar',
    description:
      'Finalize and publish the rollout calendar for digital adoption sessions.',
    responsible_unit: 'IT Department',
    assigned_to: 'Maria Garcia',
    deadline: '2026-02-15',
    status: 'Not Started',
    progress: 0,
    created_at: '2025-12-18T10:00:00Z',
    updated_at: '2025-12-18T10:00:00Z',
    updated_by: 'Maria Garcia',
    notes: 'Calendar depends on final training room availability.',
    priority: 'Medium',
    academic_year_start: 2025,
  },
];

const seedMilestones = [
  {
    id: 'MS001',
    linked_type: 'Goal',
    linked_id: 'G001',
    title: 'Workshop curriculum approved',
    description: 'Approve the curriculum and speaker roster for bootcamps.',
    owner: 'Dr. Sarah Johnson',
    due_date: '2025-10-15',
    status: 'Completed',
    definition_of_done:
      'Curriculum approved, speakers confirmed, and materials shared.',
    progress: 100,
    created_at: '2025-09-15T10:00:00Z',
    updated_at: '2025-10-15T16:00:00Z',
    updated_by: 'Dr. Sarah Johnson',
    progress_updates: JSON.stringify([
      {
        id: 'PU001',
        milestoneId: 'MS001',
        timestamp: '2025-10-15T16:00:00Z',
        user: 'Dr. Sarah Johnson',
        note: 'Curriculum and speakers approved by the research committee.',
        progressPercentage: 100,
      },
    ]),
    evidence_links: JSON.stringify([
      'https://example.edu/research/workshop-curriculum',
    ]),
  },
  {
    id: 'MS002',
    linked_type: 'Goal',
    linked_id: 'G002',
    title: 'Tutoring hiring plan finalized',
    description: 'Complete staffing plan for extended tutoring hours.',
    owner: 'Prof. Emily Chen',
    due_date: '2026-01-20',
    status: 'In Progress',
    definition_of_done:
      'Hiring plan approved and at least four tutors shortlisted.',
    progress: 45,
    created_at: '2025-10-01T09:00:00Z',
    updated_at: '2025-11-28T16:45:00Z',
    updated_by: 'Prof. Emily Chen',
    progress_updates: JSON.stringify([
      {
        id: 'PU002',
        milestoneId: 'MS002',
        timestamp: '2025-11-28T16:45:00Z',
        user: 'Prof. Emily Chen',
        note: 'Staffing model drafted; finance review is pending.',
        progressPercentage: 45,
      },
    ]),
    evidence_links: JSON.stringify([]),
  },
  {
    id: 'MS003',
    linked_type: 'Goal',
    linked_id: 'G003',
    title: 'Pilot migration sign-off',
    description: 'Complete sign-off for the pilot LMS migration release.',
    owner: 'John Smith',
    due_date: '2026-01-15',
    status: 'Not Started',
    definition_of_done:
      'Pilot faculties sign off, defects triaged, and release approved.',
    progress: 0,
    created_at: '2025-10-05T08:00:00Z',
    updated_at: '2025-10-05T08:00:00Z',
    updated_by: 'John Smith',
    progress_updates: JSON.stringify([]),
    evidence_links: JSON.stringify([]),
  },
];

function createHttpError(statusCode, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function ensurePool() {
  if (!pool) {
    throw createHttpError(503, 'No database configured');
  }

  return pool;
}

function toInt(value, fieldName) {
  if (value == null || value === '') return null;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw createHttpError(400, `${fieldName} must be a number`);
  }

  return parsed;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
}

function normalizeEvidenceLinks(value) {
  if (!value) return [];
  if (!Array.isArray(value)) {
    throw createHttpError(400, 'evidenceLinks must be an array of strings');
  }

  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
}

function normalizeProgressUpdates(value) {
  if (!value) return [];
  if (!Array.isArray(value)) {
    throw createHttpError(400, 'progressUpdates must be an array');
  }

  return value.map((item) => validateProgressUpdatePayload(item));
}

function generateId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;
}

function deriveMilestoneStatus(status, dueDate, progress) {
  if (progress >= 100 || status === 'Completed') {
    return 'Completed';
  }

  if (new Date(dueDate).getTime() < Date.now()) {
    return 'Overdue';
  }

  return status;
}

function rowToKpi(row) {
  return {
    id: row.id,
    goalId: row.goal_id,
    name: row.name,
    description: row.description,
    targetValue: row.target_value,
    currentValue: row.current_value,
    unit: row.unit,
    academicYearStart: row.academic_year_start,
    responsibleUnit: row.responsible_unit,
    deadline: row.deadline,
    status: row.status,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    assignedTo: row.assigned_to ?? undefined,
  };
}

function rowToActionPlan(row) {
  return {
    id: row.id,
    goalId: row.goal_id,
    kpiId: row.kpi_id ?? undefined,
    title: row.title,
    description: row.description,
    responsibleUnit: row.responsible_unit,
    assignedTo: row.assigned_to,
    deadline: row.deadline,
    status: row.status,
    progress: row.progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    notes: row.notes,
    priority: row.priority,
    academicYearStart: row.academic_year_start,
  };
}

function rowToMilestone(row) {
  const status = deriveMilestoneStatus(row.status, row.due_date, row.progress);
  const progressUpdates = parseJsonArray(row.progress_updates).map((item) => ({
    id: String(item.id ?? ''),
    milestoneId: String(item.milestoneId ?? item.milestone_id ?? row.id),
    timestamp: String(item.timestamp ?? new Date().toISOString()),
    user: String(item.user ?? ''),
    note: String(item.note ?? ''),
    progressPercentage: Number(item.progressPercentage ?? item.progress_percentage ?? 0),
  }));

  return {
    id: row.id,
    linkedType: row.linked_type,
    linkedId: row.linked_id,
    title: row.title,
    description: row.description,
    owner: row.owner,
    dueDate: row.due_date,
    status,
    definitionOfDone: row.definition_of_done,
    progress: row.progress,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    progressUpdates,
    evidenceLinks: parseJsonArray(row.evidence_links).map((item) => String(item)),
  };
}

async function seedTableIfEmpty(client, tableName, seeds, insertSql, mapSeedToValues) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM ${tableName}`
  );

  if (rows[0].count > 0) return;

  for (const seed of seeds) {
    await client.query(insertSql, mapSeedToValues(seed));
  }
}

async function getGoalRowById(client, id) {
  const { rows } = await client.query('SELECT * FROM goals WHERE id = $1', [id]);
  return rows[0] ?? null;
}

async function getKpiRowById(client, id) {
  const { rows } = await client.query('SELECT * FROM kpis WHERE id = $1', [id]);
  return rows[0] ?? null;
}

async function getActionPlanRowById(client, id) {
  const { rows } = await client.query('SELECT * FROM action_plans WHERE id = $1', [
    id,
  ]);
  return rows[0] ?? null;
}

async function getMilestoneRowById(client, id) {
  const { rows } = await client.query('SELECT * FROM milestones WHERE id = $1', [
    id,
  ]);
  return rows[0] ?? null;
}

function validateKpiPayload(payload) {
  const kpi = {
    id: payload.id ? String(payload.id).trim() : generateId('KPI'),
    goalId: String(payload.goalId ?? payload.goal_id ?? '').trim(),
    name: String(payload.name ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    targetValue: toInt(payload.targetValue ?? payload.target_value, 'targetValue'),
    currentValue: toInt(payload.currentValue ?? payload.current_value ?? 0, 'currentValue'),
    unit: String(payload.unit ?? '').trim(),
    academicYearStart: toInt(
      payload.academicYearStart ?? payload.academic_year_start,
      'academicYearStart'
    ),
    responsibleUnit: String(
      payload.responsibleUnit ?? payload.responsible_unit ?? ''
    ).trim(),
    deadline: String(payload.deadline ?? '').trim(),
    status: String(payload.status ?? '').trim(),
    updatedAt: String(payload.updatedAt ?? payload.updated_at ?? new Date().toISOString()),
    updatedBy: String(payload.updatedBy ?? payload.updated_by ?? '').trim(),
    assignedTo:
      payload.assignedTo == null || payload.assigned_to == null
        ? String(payload.assignedTo ?? payload.assigned_to ?? '').trim() || null
        : String(payload.assignedTo ?? payload.assigned_to).trim() || null,
  };

  if (!kpi.goalId) throw createHttpError(400, 'goalId is required');
  if (!kpi.name) throw createHttpError(400, 'name is required');
  if (!kpi.description) throw createHttpError(400, 'description is required');
  if (kpi.targetValue == null) throw createHttpError(400, 'targetValue is required');
  if (kpi.currentValue == null) throw createHttpError(400, 'currentValue is required');
  if (!kpi.unit) throw createHttpError(400, 'unit is required');
  if (!kpi.deadline) throw createHttpError(400, 'deadline is required');
  if (!kpi.updatedBy) throw createHttpError(400, 'updatedBy is required');
  if (kpi.targetValue < 0 || kpi.currentValue < 0) {
    throw createHttpError(400, 'KPI values must be 0 or greater');
  }
  if (!validGoalStatuses.has(kpi.status)) {
    throw createHttpError(400, 'status is invalid');
  }

  return kpi;
}

function validateActionPlanPayload(payload) {
  const actionPlan = {
    id: payload.id ? String(payload.id).trim() : generateId('AP'),
    goalId: String(payload.goalId ?? payload.goal_id ?? '').trim(),
    kpiId:
      payload.kpiId == null && payload.kpi_id == null
        ? null
        : String(payload.kpiId ?? payload.kpi_id ?? '').trim() || null,
    title: String(payload.title ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    responsibleUnit: String(
      payload.responsibleUnit ?? payload.responsible_unit ?? ''
    ).trim(),
    assignedTo: String(payload.assignedTo ?? payload.assigned_to ?? '').trim(),
    deadline: String(payload.deadline ?? '').trim(),
    status: String(payload.status ?? '').trim(),
    progress: toInt(payload.progress ?? 0, 'progress'),
    createdAt: String(payload.createdAt ?? payload.created_at ?? new Date().toISOString()),
    updatedAt: String(payload.updatedAt ?? payload.updated_at ?? new Date().toISOString()),
    updatedBy: String(payload.updatedBy ?? payload.updated_by ?? '').trim(),
    notes: String(payload.notes ?? '').trim(),
    priority: String(payload.priority ?? '').trim(),
    academicYearStart: toInt(
      payload.academicYearStart ?? payload.academic_year_start,
      'academicYearStart'
    ),
  };

  if (!actionPlan.goalId) throw createHttpError(400, 'goalId is required');
  if (!actionPlan.title) throw createHttpError(400, 'title is required');
  if (!actionPlan.description) {
    throw createHttpError(400, 'description is required');
  }
  if (!actionPlan.assignedTo) throw createHttpError(400, 'assignedTo is required');
  if (!actionPlan.deadline) throw createHttpError(400, 'deadline is required');
  if (!actionPlan.updatedBy) throw createHttpError(400, 'updatedBy is required');
  if (!validActionStatuses.has(actionPlan.status)) {
    throw createHttpError(400, 'status is invalid');
  }
  if (!validPriorities.has(actionPlan.priority)) {
    throw createHttpError(400, 'priority is invalid');
  }
  if (actionPlan.progress == null || actionPlan.progress < 0 || actionPlan.progress > 100) {
    throw createHttpError(400, 'progress must be between 0 and 100');
  }

  return actionPlan;
}

function validateProgressUpdatePayload(payload) {
  const progressUpdate = {
    id: payload.id ? String(payload.id).trim() : generateId('PU'),
    milestoneId: String(payload.milestoneId ?? payload.milestone_id ?? '').trim(),
    timestamp: String(payload.timestamp ?? new Date().toISOString()),
    user: String(payload.user ?? '').trim(),
    note: String(payload.note ?? '').trim(),
    progressPercentage: toInt(
      payload.progressPercentage ?? payload.progress_percentage,
      'progressPercentage'
    ),
  };

  if (!progressUpdate.user) throw createHttpError(400, 'user is required');
  if (!progressUpdate.note) throw createHttpError(400, 'note is required');
  if (
    progressUpdate.progressPercentage == null ||
    progressUpdate.progressPercentage < 0 ||
    progressUpdate.progressPercentage > 100
  ) {
    throw createHttpError(400, 'progressPercentage must be between 0 and 100');
  }

  return progressUpdate;
}

function validateMilestonePayload(payload) {
  const milestone = {
    id: payload.id ? String(payload.id).trim() : generateId('MS'),
    linkedType: String(payload.linkedType ?? payload.linked_type ?? '').trim(),
    linkedId: String(payload.linkedId ?? payload.linked_id ?? '').trim(),
    title: String(payload.title ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    owner: String(payload.owner ?? '').trim(),
    dueDate: String(payload.dueDate ?? payload.due_date ?? '').trim(),
    status: String(payload.status ?? 'Not Started').trim(),
    definitionOfDone: String(
      payload.definitionOfDone ?? payload.definition_of_done ?? ''
    ).trim(),
    progress: toInt(payload.progress ?? 0, 'progress'),
    createdAt: String(payload.createdAt ?? payload.created_at ?? new Date().toISOString()),
    updatedAt: String(payload.updatedAt ?? payload.updated_at ?? new Date().toISOString()),
    updatedBy: String(payload.updatedBy ?? payload.updated_by ?? '').trim(),
    progressUpdates: normalizeProgressUpdates(
      payload.progressUpdates ?? payload.progress_updates
    ),
    evidenceLinks: normalizeEvidenceLinks(
      payload.evidenceLinks ?? payload.evidence_links
    ),
  };

  if (!validLinkedTypes.has(milestone.linkedType)) {
    throw createHttpError(400, 'linkedType is invalid');
  }
  if (!milestone.linkedId) throw createHttpError(400, 'linkedId is required');
  if (!milestone.title) throw createHttpError(400, 'title is required');
  if (!milestone.description) throw createHttpError(400, 'description is required');
  if (!milestone.owner) throw createHttpError(400, 'owner is required');
  if (!milestone.dueDate) throw createHttpError(400, 'dueDate is required');
  if (!milestone.definitionOfDone) {
    throw createHttpError(400, 'definitionOfDone is required');
  }
  if (!milestone.updatedBy) throw createHttpError(400, 'updatedBy is required');
  if (!validMilestoneStatuses.has(milestone.status)) {
    throw createHttpError(400, 'status is invalid');
  }
  if (milestone.progress == null || milestone.progress < 0 || milestone.progress > 100) {
    throw createHttpError(400, 'progress must be between 0 and 100');
  }

  return milestone;
}

function validateEvidencePayload(payload) {
  const evidence = {
    link: String(payload.link ?? payload.url ?? '').trim(),
    user: String(payload.user ?? '').trim(),
  };

  if (!evidence.link) throw createHttpError(400, 'link is required');
  return evidence;
}

export async function initPlanningDb() {
  if (!pool) return;

  await pool.query(createKpisTableSql);
  await pool.query(createActionPlansTableSql);
  await pool.query(createMilestonesTableSql);

  await seedTableIfEmpty(
    pool,
    'kpis',
    seedKpis,
    `INSERT INTO kpis (
      id, goal_id, name, description, target_value, current_value, unit,
      academic_year_start, responsible_unit, deadline, status, updated_at,
      updated_by, assigned_to
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
    )`,
    (item) => [
      item.id,
      item.goal_id,
      item.name,
      item.description,
      item.target_value,
      item.current_value,
      item.unit,
      item.academic_year_start,
      item.responsible_unit,
      item.deadline,
      item.status,
      item.updated_at,
      item.updated_by,
      item.assigned_to,
    ]
  );

  await seedTableIfEmpty(
    pool,
    'action_plans',
    seedActionPlans,
    `INSERT INTO action_plans (
      id, goal_id, kpi_id, title, description, responsible_unit, assigned_to,
      deadline, status, progress, created_at, updated_at, updated_by, notes,
      priority, academic_year_start
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
    )`,
    (item) => [
      item.id,
      item.goal_id,
      item.kpi_id,
      item.title,
      item.description,
      item.responsible_unit,
      item.assigned_to,
      item.deadline,
      item.status,
      item.progress,
      item.created_at,
      item.updated_at,
      item.updated_by,
      item.notes,
      item.priority,
      item.academic_year_start,
    ]
  );

  await seedTableIfEmpty(
    pool,
    'milestones',
    seedMilestones,
    `INSERT INTO milestones (
      id, linked_type, linked_id, title, description, owner, due_date, status,
      definition_of_done, progress, created_at, updated_at, updated_by,
      progress_updates, evidence_links
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb
    )`,
    (item) => [
      item.id,
      item.linked_type,
      item.linked_id,
      item.title,
      item.description,
      item.owner,
      item.due_date,
      item.status,
      item.definition_of_done,
      item.progress,
      item.created_at,
      item.updated_at,
      item.updated_by,
      item.progress_updates,
      item.evidence_links,
    ]
  );
}

export async function getKPIs(filters = {}) {
  if (!pool) return [];

  const conditions = [];
  const values = [];

  if (filters.academicYearStart != null) {
    values.push(filters.academicYearStart);
    conditions.push(`academic_year_start = $${values.length}`);
  }
  if (filters.goalId) {
    values.push(filters.goalId);
    conditions.push(`goal_id = $${values.length}`);
  }
  if (filters.responsibleUnit) {
    values.push(filters.responsibleUnit);
    conditions.push(`responsible_unit = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM kpis ${whereClause} ORDER BY deadline, id`,
    values
  );

  return rows.map(rowToKpi);
}

export async function createKPI(payload) {
  const client = ensurePool();
  const kpi = validateKpiPayload(payload);
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const goalRow = await getGoalRowById(dbClient, kpi.goalId);
    if (!goalRow) {
      throw createHttpError(404, 'Goal not found');
    }

    const academicYearStart = kpi.academicYearStart ?? goalRow.academic_year_start;
    const responsibleUnit = kpi.responsibleUnit || goalRow.responsible_unit;

    const { rows } = await dbClient.query(
      `INSERT INTO kpis (
        id, goal_id, name, description, target_value, current_value, unit,
        academic_year_start, responsible_unit, deadline, status, updated_at,
        updated_by, assigned_to
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *`,
      [
        kpi.id,
        kpi.goalId,
        kpi.name,
        kpi.description,
        kpi.targetValue,
        kpi.currentValue,
        kpi.unit,
        academicYearStart,
        responsibleUnit,
        kpi.deadline,
        kpi.status,
        kpi.updatedAt,
        kpi.updatedBy,
        kpi.assignedTo,
      ]
    );

    await dbClient.query('COMMIT');
    return rowToKpi(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    if (err.code === '23505') {
      throw createHttpError(409, 'KPI id already exists');
    }
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function updateKPI(id, payload) {
  const client = ensurePool();
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const existingRow = await getKpiRowById(dbClient, id);
    if (!existingRow) {
      throw createHttpError(404, 'KPI not found');
    }

    const merged = validateKpiPayload({
      ...rowToKpi(existingRow),
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
      updatedBy: payload.updatedBy ?? payload.updated_by ?? existingRow.updated_by,
    });

    const goalRow = await getGoalRowById(dbClient, merged.goalId);
    if (!goalRow) {
      throw createHttpError(404, 'Goal not found');
    }

    const { rows } = await dbClient.query(
      `UPDATE kpis
        SET goal_id = $2,
            name = $3,
            description = $4,
            target_value = $5,
            current_value = $6,
            unit = $7,
            academic_year_start = $8,
            responsible_unit = $9,
            deadline = $10,
            status = $11,
            updated_at = $12,
            updated_by = $13,
            assigned_to = $14
      WHERE id = $1
      RETURNING *`,
      [
        id,
        merged.goalId,
        merged.name,
        merged.description,
        merged.targetValue,
        merged.currentValue,
        merged.unit,
        merged.academicYearStart ?? goalRow.academic_year_start,
        merged.responsibleUnit || goalRow.responsible_unit,
        merged.deadline,
        merged.status,
        merged.updatedAt,
        merged.updatedBy,
        merged.assignedTo,
      ]
    );

    await dbClient.query('COMMIT');
    return rowToKpi(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function getActionPlans(filters = {}) {
  if (!pool) return [];

  const conditions = [];
  const values = [];

  if (filters.academicYearStart != null) {
    values.push(filters.academicYearStart);
    conditions.push(`academic_year_start = $${values.length}`);
  }
  if (filters.goalId) {
    values.push(filters.goalId);
    conditions.push(`goal_id = $${values.length}`);
  }
  if (filters.responsibleUnit) {
    values.push(filters.responsibleUnit);
    conditions.push(`responsible_unit = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM action_plans ${whereClause} ORDER BY deadline, id`,
    values
  );

  return rows.map(rowToActionPlan);
}

export async function createActionPlan(payload) {
  const client = ensurePool();
  const actionPlan = validateActionPlanPayload(payload);
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const goalRow = await getGoalRowById(dbClient, actionPlan.goalId);
    if (!goalRow) {
      throw createHttpError(404, 'Goal not found');
    }

    if (actionPlan.kpiId) {
      const kpiRow = await getKpiRowById(dbClient, actionPlan.kpiId);
      if (!kpiRow) {
        throw createHttpError(404, 'KPI not found');
      }
    }

    const { rows } = await dbClient.query(
      `INSERT INTO action_plans (
        id, goal_id, kpi_id, title, description, responsible_unit, assigned_to,
        deadline, status, progress, created_at, updated_at, updated_by, notes,
        priority, academic_year_start
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
      )
      RETURNING *`,
      [
        actionPlan.id,
        actionPlan.goalId,
        actionPlan.kpiId,
        actionPlan.title,
        actionPlan.description,
        actionPlan.responsibleUnit || goalRow.responsible_unit,
        actionPlan.assignedTo,
        actionPlan.deadline,
        actionPlan.status,
        actionPlan.progress,
        actionPlan.createdAt,
        actionPlan.updatedAt,
        actionPlan.updatedBy,
        actionPlan.notes,
        actionPlan.priority,
        actionPlan.academicYearStart ?? goalRow.academic_year_start,
      ]
    );

    await dbClient.query('COMMIT');
    return rowToActionPlan(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    if (err.code === '23505') {
      throw createHttpError(409, 'Action plan id already exists');
    }
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function updateActionPlan(id, payload) {
  const client = ensurePool();
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const existingRow = await getActionPlanRowById(dbClient, id);
    if (!existingRow) {
      throw createHttpError(404, 'Action plan not found');
    }

    const merged = validateActionPlanPayload({
      ...rowToActionPlan(existingRow),
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
      updatedBy: payload.updatedBy ?? payload.updated_by ?? existingRow.updated_by,
    });

    const goalRow = await getGoalRowById(dbClient, merged.goalId);
    if (!goalRow) {
      throw createHttpError(404, 'Goal not found');
    }

    if (merged.kpiId) {
      const kpiRow = await getKpiRowById(dbClient, merged.kpiId);
      if (!kpiRow) {
        throw createHttpError(404, 'KPI not found');
      }
    }

    const { rows } = await dbClient.query(
      `UPDATE action_plans
        SET goal_id = $2,
            kpi_id = $3,
            title = $4,
            description = $5,
            responsible_unit = $6,
            assigned_to = $7,
            deadline = $8,
            status = $9,
            progress = $10,
            updated_at = $11,
            updated_by = $12,
            notes = $13,
            priority = $14,
            academic_year_start = $15
      WHERE id = $1
      RETURNING *`,
      [
        id,
        merged.goalId,
        merged.kpiId,
        merged.title,
        merged.description,
        merged.responsibleUnit || goalRow.responsible_unit,
        merged.assignedTo,
        merged.deadline,
        merged.status,
        merged.progress,
        merged.updatedAt,
        merged.updatedBy,
        merged.notes,
        merged.priority,
        merged.academicYearStart ?? goalRow.academic_year_start,
      ]
    );

    await dbClient.query('COMMIT');
    return rowToActionPlan(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function getMilestones(filters = {}) {
  if (!pool) return [];

  const conditions = [];
  const values = [];

  if (filters.academicYearStart != null) {
    values.push(filters.academicYearStart);
    conditions.push(`g.academic_year_start = $${values.length}`);
  }
  if (filters.linkedId) {
    values.push(filters.linkedId);
    conditions.push(`m.linked_id = $${values.length}`);
  }
  if (filters.owner) {
    values.push(filters.owner);
    conditions.push(`m.owner = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT m.*
      FROM milestones m
      LEFT JOIN goals g ON g.id = m.linked_id
      ${whereClause}
      ORDER BY m.due_date, m.id`,
    values
  );

  const milestones = rows.map(rowToMilestone);

  if (!filters.status) {
    return milestones;
  }

  return milestones.filter((milestone) => milestone.status === filters.status);
}

export async function createMilestone(payload) {
  const client = ensurePool();
  const milestone = validateMilestonePayload(payload);
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const goalRow = await getGoalRowById(dbClient, milestone.linkedId);
    if (!goalRow) {
      throw createHttpError(404, 'Linked goal not found');
    }

    const status = deriveMilestoneStatus(
      milestone.status,
      milestone.dueDate,
      milestone.progress
    );

    const { rows } = await dbClient.query(
      `INSERT INTO milestones (
        id, linked_type, linked_id, title, description, owner, due_date, status,
        definition_of_done, progress, created_at, updated_at, updated_by,
        progress_updates, evidence_links
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb
      )
      RETURNING *`,
      [
        milestone.id,
        milestone.linkedType,
        milestone.linkedId,
        milestone.title,
        milestone.description,
        milestone.owner,
        milestone.dueDate,
        status,
        milestone.definitionOfDone,
        milestone.progress,
        milestone.createdAt,
        milestone.updatedAt,
        milestone.updatedBy,
        JSON.stringify(milestone.progressUpdates),
        JSON.stringify(milestone.evidenceLinks),
      ]
    );

    await dbClient.query('COMMIT');
    return rowToMilestone(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    if (err.code === '23505') {
      throw createHttpError(409, 'Milestone id already exists');
    }
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function addMilestoneProgressUpdate(id, payload) {
  const client = ensurePool();
  const progressUpdate = validateProgressUpdatePayload(payload);
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const row = await getMilestoneRowById(dbClient, id);
    if (!row) {
      throw createHttpError(404, 'Milestone not found');
    }

    const progressUpdates = parseJsonArray(row.progress_updates);
    const nextProgressUpdates = [
      ...progressUpdates,
      {
        id: progressUpdate.id,
        milestoneId: id,
        timestamp: progressUpdate.timestamp,
        user: progressUpdate.user,
        note: progressUpdate.note,
        progressPercentage: progressUpdate.progressPercentage,
      },
    ];
    const nextProgress = progressUpdate.progressPercentage;
    const nextStatus = deriveMilestoneStatus(row.status, row.due_date, nextProgress);

    const { rows } = await dbClient.query(
      `UPDATE milestones
        SET progress = $2,
            status = $3,
            updated_at = $4,
            updated_by = $5,
            progress_updates = $6::jsonb
      WHERE id = $1
      RETURNING *`,
      [
        id,
        nextProgress,
        nextStatus,
        new Date().toISOString(),
        progressUpdate.user,
        JSON.stringify(nextProgressUpdates),
      ]
    );

    await dbClient.query('COMMIT');
    return rowToMilestone(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function addMilestoneEvidence(id, payload) {
  const client = ensurePool();
  const evidence = validateEvidencePayload(payload);
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const row = await getMilestoneRowById(dbClient, id);
    if (!row) {
      throw createHttpError(404, 'Milestone not found');
    }

    const evidenceLinks = parseJsonArray(row.evidence_links).map((item) =>
      String(item)
    );
    const nextEvidenceLinks = [...new Set([...evidenceLinks, evidence.link])];

    const { rows } = await dbClient.query(
      `UPDATE milestones
        SET updated_at = $2,
            updated_by = $3,
            evidence_links = $4::jsonb
      WHERE id = $1
      RETURNING *`,
      [
        id,
        new Date().toISOString(),
        evidence.user || row.updated_by,
        JSON.stringify(nextEvidenceLinks),
      ]
    );

    await dbClient.query('COMMIT');
    return rowToMilestone(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function deleteKPI(id) {
  const client = ensurePool();
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    // Delete related assignments
    await dbClient.query(
      "DELETE FROM assignments WHERE entity_type = 'KPI' AND entity_id = $1",
      [id]
    );

    // Delete the KPI itself
    // Note: action_plans that reference this KPI will have kpi_id set to NULL due to ON DELETE SET NULL
    const { rowCount } = await dbClient.query(
      'DELETE FROM kpis WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw createHttpError(404, 'KPI not found');
    }

    await dbClient.query('COMMIT');
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function deleteActionPlan(id) {
  const client = ensurePool();
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    // Delete related assignments
    await dbClient.query(
      "DELETE FROM assignments WHERE entity_type = 'Action Plan' AND entity_id = $1",
      [id]
    );

    // Delete the action plan itself
    const { rowCount } = await dbClient.query(
      'DELETE FROM action_plans WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw createHttpError(404, 'Action Plan not found');
    }

    await dbClient.query('COMMIT');
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}
