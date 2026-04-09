import pg from 'pg';

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const createGoalsTableSql = `
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    academic_year_start INTEGER NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    responsible_unit TEXT NOT NULL,
    parent_id TEXT REFERENCES goals(id) ON DELETE SET NULL,
    level INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    assigned_to JSONB NOT NULL DEFAULT '[]'::jsonb
  );
`;

const createAssignmentsTableSql = `
  CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    academic_year_start INTEGER,
    assigned_to TEXT NOT NULL,
    assigned_by TEXT NOT NULL,
    unit TEXT NOT NULL,
    assigned_date TEXT NOT NULL,
    deadline TEXT NOT NULL,
    status TEXT NOT NULL,
    notes TEXT
  );
`;

const createUnitOwnersTableSql = `
  CREATE TABLE IF NOT EXISTS unit_owners (
    academic_year_start INTEGER NOT NULL,
    unit_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    PRIMARY KEY (academic_year_start, unit_name)
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

const validAssignmentStatuses = new Set([
  'Pending',
  'Accepted',
  'In Progress',
  'Completed',
  'Rejected',
]);

const validAssignmentEntityTypes = new Set(['Goal', 'KPI', 'Action Plan']);

const seedGoals = [
  {
    id: 'G001',
    title: 'Enhance Research Quality and Impact',
    description:
      'Increase publications in high-impact journals and strengthen research collaborations across departments.',
    academic_year_start: 2025,
    status: 'On Track',
    priority: 'Critical',
    responsible_unit: 'Research Department',
    parent_id: null,
    level: 0,
    created_at: '2025-09-15T10:00:00Z',
    updated_at: '2025-12-01T14:30:00Z',
    updated_by: 'Dr. Sarah Johnson',
    start_date: '2025-09-01',
    end_date: '2026-01-31',
    progress: 75,
    assigned_to: JSON.stringify(['Dr. Sarah Johnson', 'Prof. Michael Anderson']),
  },
  {
    id: 'G002',
    title: 'Improve Student Success and Retention',
    description:
      'Enhance academic support services and reduce dropout rates through comprehensive student support.',
    academic_year_start: 2025,
    status: 'At Risk',
    priority: 'Critical',
    responsible_unit: 'Academic Affairs',
    parent_id: null,
    level: 0,
    created_at: '2025-09-15T10:00:00Z',
    updated_at: '2025-11-28T16:45:00Z',
    updated_by: 'Prof. Emily Chen',
    start_date: '2025-09-01',
    end_date: '2026-01-31',
    progress: 60,
    assigned_to: JSON.stringify(['Prof. Emily Chen', 'Dr. James Wilson']),
  },
  {
    id: 'G003',
    title: 'Digital Transformation Initiative',
    description:
      'Modernize IT infrastructure and implement digital tools across all departments.',
    academic_year_start: 2025,
    status: 'On Track',
    priority: 'High',
    responsible_unit: 'IT Department',
    parent_id: null,
    level: 0,
    created_at: '2025-09-15T10:00:00Z',
    updated_at: '2025-12-05T09:15:00Z',
    updated_by: 'John Smith',
    start_date: '2025-09-01',
    end_date: '2026-01-31',
    progress: 82,
    assigned_to: JSON.stringify(['John Smith', 'Maria Garcia']),
  },
];

const seedAssignments = [
  {
    id: 'ASG001',
    entity_type: 'Goal',
    entity_id: 'G001',
    academic_year_start: 2025,
    assigned_to: 'Dr. Sarah Johnson',
    assigned_by: 'Strategy Office Admin',
    unit: 'Research Department',
    assigned_date: '2025-09-15T10:00:00Z',
    deadline: '2026-01-31',
    status: 'In Progress',
    notes: 'Primary responsibility for main goal',
  },
  {
    id: 'ASG002',
    entity_type: 'Goal',
    entity_id: 'G002',
    academic_year_start: 2025,
    assigned_to: 'Prof. Emily Chen',
    assigned_by: 'Strategy Office Admin',
    unit: 'Academic Affairs',
    assigned_date: '2025-09-15T10:00:00Z',
    deadline: '2026-01-31',
    status: 'In Progress',
    notes: 'Lead stakeholder for retention workstream',
  },
  {
    id: 'ASG003',
    entity_type: 'Goal',
    entity_id: 'G003',
    academic_year_start: 2025,
    assigned_to: 'John Smith',
    assigned_by: 'Strategy Office Admin',
    unit: 'IT Department',
    assigned_date: '2025-09-15T10:00:00Z',
    deadline: '2026-01-31',
    status: 'In Progress',
    notes: 'Digital transformation delivery owner',
  },
];

const seedUnitOwners = [
  {
    academic_year_start: 2025,
    unit_name: 'Research Department',
    owner_name: 'Dr. Sarah Johnson',
    updated_at: '2025-09-15T10:00:00Z',
    updated_by: 'Strategy Office Admin',
  },
  {
    academic_year_start: 2025,
    unit_name: 'Academic Affairs',
    owner_name: 'Prof. Emily Chen',
    updated_at: '2025-09-15T10:00:00Z',
    updated_by: 'Strategy Office Admin',
  },
  {
    academic_year_start: 2025,
    unit_name: 'IT Department',
    owner_name: 'John Smith',
    updated_at: '2025-09-15T10:00:00Z',
    updated_by: 'Strategy Office Admin',
  },
];

seedGoals.push(
  {
    id: 'G101',
    title: 'Enhance Research Quality and Impact',
    description:
      'Increase publications in high-impact journals and strengthen research collaborations across departments.',
    academic_year_start: 2024,
    status: 'Completed',
    priority: 'Critical',
    responsible_unit: 'Research Department',
    parent_id: null,
    level: 0,
    created_at: '2024-09-15T10:00:00Z',
    updated_at: '2025-01-20T14:30:00Z',
    updated_by: 'Dr. Sarah Johnson',
    start_date: '2024-09-01',
    end_date: '2025-01-31',
    progress: 92,
    assigned_to: JSON.stringify(['Dr. Sarah Johnson', 'Prof. Michael Anderson']),
  },
  {
    id: 'G102',
    title: 'Improve Student Success and Retention',
    description:
      'Enhance academic support services and reduce dropout rates through comprehensive student support.',
    academic_year_start: 2024,
    status: 'Completed',
    priority: 'Critical',
    responsible_unit: 'Academic Affairs',
    parent_id: null,
    level: 0,
    created_at: '2024-09-15T10:00:00Z',
    updated_at: '2025-01-18T12:15:00Z',
    updated_by: 'Prof. Emily Chen',
    start_date: '2024-09-01',
    end_date: '2025-01-31',
    progress: 88,
    assigned_to: JSON.stringify(['Prof. Emily Chen', 'Dr. James Wilson']),
  },
  {
    id: 'G103',
    title: 'Digital Transformation Initiative',
    description:
      'Modernize IT infrastructure and implement digital tools across all departments.',
    academic_year_start: 2024,
    status: 'Completed',
    priority: 'High',
    responsible_unit: 'IT Department',
    parent_id: null,
    level: 0,
    created_at: '2024-09-15T10:00:00Z',
    updated_at: '2025-01-25T09:15:00Z',
    updated_by: 'John Smith',
    start_date: '2024-09-01',
    end_date: '2025-01-31',
    progress: 94,
    assigned_to: JSON.stringify(['John Smith', 'Maria Garcia']),
  }
);

seedAssignments.push(
  {
    id: 'ASG101',
    entity_type: 'Goal',
    entity_id: 'G101',
    academic_year_start: 2024,
    assigned_to: 'Dr. Sarah Johnson',
    assigned_by: 'Strategy Office Admin',
    unit: 'Research Department',
    assigned_date: '2024-09-15T10:00:00Z',
    deadline: '2025-01-31',
    status: 'Completed',
    notes: 'Historical demo assignment for copy-year testing',
  },
  {
    id: 'ASG102',
    entity_type: 'Goal',
    entity_id: 'G102',
    academic_year_start: 2024,
    assigned_to: 'Prof. Emily Chen',
    assigned_by: 'Strategy Office Admin',
    unit: 'Academic Affairs',
    assigned_date: '2024-09-15T10:00:00Z',
    deadline: '2025-01-31',
    status: 'Completed',
    notes: 'Historical demo assignment for copy-year testing',
  },
  {
    id: 'ASG103',
    entity_type: 'Goal',
    entity_id: 'G103',
    academic_year_start: 2024,
    assigned_to: 'John Smith',
    assigned_by: 'Strategy Office Admin',
    unit: 'IT Department',
    assigned_date: '2024-09-15T10:00:00Z',
    deadline: '2025-01-31',
    status: 'Completed',
    notes: 'Historical demo assignment for copy-year testing',
  }
);

seedUnitOwners.push(
  {
    academic_year_start: 2024,
    unit_name: 'Research Department',
    owner_name: 'Dr. Sarah Johnson',
    updated_at: '2024-09-15T10:00:00Z',
    updated_by: 'Strategy Office Admin',
  },
  {
    academic_year_start: 2024,
    unit_name: 'Academic Affairs',
    owner_name: 'Prof. Emily Chen',
    updated_at: '2024-09-15T10:00:00Z',
    updated_by: 'Strategy Office Admin',
  },
  {
    academic_year_start: 2024,
    unit_name: 'IT Department',
    owner_name: 'John Smith',
    updated_at: '2024-09-15T10:00:00Z',
    updated_by: 'Strategy Office Admin',
  },
  {
    academic_year_start: 2026,
    unit_name: 'Research Department',
    owner_name: 'Annie Case',
    updated_at: '2026-09-01T08:00:00Z',
    updated_by: 'Strategy Office Admin',
  },
  {
    academic_year_start: 2026,
    unit_name: 'Academic Affairs',
    owner_name: 'Lisa Carter',
    updated_at: '2026-09-01T08:00:00Z',
    updated_by: 'Strategy Office Admin',
  },
  {
    academic_year_start: 2026,
    unit_name: 'IT Department',
    owner_name: 'Alex Morgan',
    updated_at: '2026-09-01T08:00:00Z',
    updated_by: 'Strategy Office Admin',
  }
);

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

function normalizeStringArray(value) {
  if (!value) return [];
  if (!Array.isArray(value)) {
    throw createHttpError(400, 'assignedTo must be an array of strings');
  }

  return [...new Set(value.map((item) => String(item).trim()).filter(Boolean))];
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

function rowToGoal(row) {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    academicYearStart: row.academic_year_start,
    status: row.status,
    priority: row.priority,
    responsibleUnit: row.responsible_unit,
    parentId: row.parent_id ?? undefined,
    level: row.level,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
    startDate: row.start_date,
    endDate: row.end_date,
    progress: row.progress,
    assignedTo: parseJsonArray(row.assigned_to),
  };
}

function rowToAssignment(row) {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    academicYearStart: row.academic_year_start ?? undefined,
    assignedTo: row.assigned_to,
    assignedBy: row.assigned_by,
    unit: row.unit,
    assignedDate: row.assigned_date,
    deadline: row.deadline,
    status: row.status,
    notes: row.notes ?? undefined,
  };
}

function rowToUnitOwner(row) {
  return {
    academicYearStart: row.academic_year_start,
    unitName: row.unit_name,
    ownerName: row.owner_name,
    updatedAt: row.updated_at,
    updatedBy: row.updated_by,
  };
}

function slugify(value) {
  const normalized = String(value ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return normalized || 'user';
}

function buildViewerDirectory(goals, assignments, unitOwners) {
  const accountMap = new Map();

  const registerAccount = (name, unit) => {
    const trimmedName = String(name ?? '').trim();
    const trimmedUnit = String(unit ?? '').trim();
    if (!trimmedName) return;

    const key = `${trimmedName.toLowerCase()}::${trimmedUnit.toLowerCase()}`;
    if (accountMap.has(key)) return;

    const id = `${slugify(trimmedName)}-${slugify(trimmedUnit || 'general')}`;
    accountMap.set(key, {
      id,
      name: trimmedName,
      unit: trimmedUnit || undefined,
    });
  };

  for (const unitOwner of unitOwners) {
    registerAccount(unitOwner.ownerName, unitOwner.unitName);
  }

  for (const assignment of assignments) {
    registerAccount(assignment.assignedTo, assignment.unit);
  }

  for (const goal of goals) {
    for (const assignee of goal.assignedTo ?? []) {
      registerAccount(assignee, goal.responsibleUnit);
    }
  }

  return [...accountMap.values()].sort((left, right) => {
    const nameOrder = left.name.localeCompare(right.name);
    if (nameOrder !== 0) return nameOrder;
    return (left.unit ?? '').localeCompare(right.unit ?? '');
  });
}

function generateId(prefix) {
  return `${prefix}${Date.now()}${Math.floor(Math.random() * 1000)
    .toString()
    .padStart(3, '0')}`;
}

function validateUnitOwnerPayload(payload) {
  const unitOwner = {
    academicYearStart: toInt(
      payload.academicYearStart ?? payload.academic_year_start,
      'academicYearStart'
    ),
    unitName: String(payload.unitName ?? payload.unit_name ?? '').trim(),
    ownerName: String(payload.ownerName ?? payload.owner_name ?? '').trim(),
    updatedAt: String(payload.updatedAt ?? payload.updated_at ?? new Date().toISOString()),
    updatedBy: String(payload.updatedBy ?? payload.updated_by ?? '').trim(),
  };

  if (unitOwner.academicYearStart == null) {
    throw createHttpError(400, 'academicYearStart is required');
  }
  if (!unitOwner.unitName) throw createHttpError(400, 'unitName is required');
  if (!unitOwner.ownerName) throw createHttpError(400, 'ownerName is required');
  if (!unitOwner.updatedBy) throw createHttpError(400, 'updatedBy is required');

  return unitOwner;
}

function shiftDateToAcademicYear(dateString, yearOffset) {
  if (!dateString) return dateString;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return dateString;

  date.setUTCFullYear(date.getUTCFullYear() + yearOffset);
  const hasTime = dateString.includes('T');

  if (hasTime) {
    return date.toISOString();
  }

  return date.toISOString().slice(0, 10);
}

async function getGoalRowsByAcademicYear(client, academicYearStart, selectedGoalIds = null) {
  const params = [academicYearStart];
  let selectionClause = '';

  if (selectedGoalIds && selectedGoalIds.length > 0) {
    params.push(selectedGoalIds);
    selectionClause = `AND (
      id = ANY($2::text[])
      OR parent_id = ANY($2::text[])
    )`;
  }

  const { rows } = await client.query(
    `SELECT *
      FROM goals
      WHERE academic_year_start = $1
      ${selectionClause}
      ORDER BY level, id`,
    params
  );

  const allowedIds = new Set(rows.map((row) => row.id));
  return rows.filter((row) => !row.parent_id || allowedIds.has(row.parent_id));
}

async function getUnitOwnerMap(client, academicYearStart) {
  const { rows } = await client.query(
    `SELECT *
      FROM unit_owners
      WHERE academic_year_start = $1`,
    [academicYearStart]
  );

  return new Map(rows.map((row) => [row.unit_name, row.owner_name]));
}

function resolveAssigneesForUnit(unitOwnerMap, unitName, fallbackAssignees) {
  const ownerName = unitOwnerMap.get(unitName);
  if (ownerName) {
    return [ownerName];
  }

  return fallbackAssignees;
}

async function seedTableIfEmpty(client, tableName, seeds, insertSql, mapSeedToValues) {
  const { rows } = await client.query(
    `SELECT COUNT(*)::int AS count FROM ${tableName}`
  );

  if (rows[0].count > 0) return;

  for (const seed of seeds) {
    await client.query(insertSql, mapSeedToValues(seed));
  }

  console.log(`Seeded ${tableName} table with ${seeds.length} rows`);
}

async function ensureSeedRows(client, seeds, insertSql, mapSeedToValues) {
  for (const seed of seeds) {
    await client.query(insertSql, mapSeedToValues(seed));
  }
}

async function getGoalRowById(client, id) {
  const { rows } = await client.query('SELECT * FROM goals WHERE id = $1', [id]);
  return rows[0] ?? null;
}

function validateGoalPayload(payload) {
  const academicYearStart = toInt(
    payload.academicYearStart ?? payload.academic_year_start,
    'academicYearStart'
  );
  const progress = toInt(payload.progress ?? 0, 'progress');
  const assignedTo = normalizeStringArray(payload.assignedTo ?? payload.assigned_to);

  const goal = {
    id: payload.id ? String(payload.id).trim() : generateId('G'),
    title: String(payload.title ?? '').trim(),
    description: String(payload.description ?? '').trim(),
    academicYearStart,
    status: String(payload.status ?? '').trim(),
    priority: String(payload.priority ?? '').trim(),
    responsibleUnit: String(
      payload.responsibleUnit ?? payload.responsible_unit ?? ''
    ).trim(),
    parentId: payload.parentId ?? payload.parent_id ?? null,
    startDate: String(payload.startDate ?? payload.start_date ?? '').trim(),
    endDate: String(payload.endDate ?? payload.end_date ?? '').trim(),
    progress: progress ?? 0,
    assignedTo,
    createdAt: payload.createdAt ?? payload.created_at ?? new Date().toISOString(),
    updatedAt: payload.updatedAt ?? payload.updated_at ?? new Date().toISOString(),
    updatedBy: String(payload.updatedBy ?? payload.updated_by ?? '').trim(),
  };

  if (!goal.title) throw createHttpError(400, 'title is required');
  if (!goal.description) throw createHttpError(400, 'description is required');
  if (goal.academicYearStart == null) {
    throw createHttpError(400, 'academicYearStart is required');
  }
  if (!goal.startDate) throw createHttpError(400, 'startDate is required');
  if (!goal.endDate) throw createHttpError(400, 'endDate is required');
  if (!goal.responsibleUnit) {
    throw createHttpError(400, 'responsibleUnit is required');
  }
  if (!goal.updatedBy) throw createHttpError(400, 'updatedBy is required');
  if (!validGoalStatuses.has(goal.status)) {
    throw createHttpError(400, 'status is invalid');
  }
  if (!validPriorities.has(goal.priority)) {
    throw createHttpError(400, 'priority is invalid');
  }
  if (goal.progress < 0 || goal.progress > 100) {
    throw createHttpError(400, 'progress must be between 0 and 100');
  }

  return goal;
}

function validateAssignmentPayload(payload) {
  const academicYearStart = toInt(
    payload.academicYearStart ?? payload.academic_year_start,
    'academicYearStart'
  );

  const assignment = {
    id: payload.id ? String(payload.id).trim() : generateId('ASG'),
    entityType: String(payload.entityType ?? payload.entity_type ?? '').trim(),
    entityId: String(payload.entityId ?? payload.entity_id ?? '').trim(),
    academicYearStart,
    assignedTo: String(payload.assignedTo ?? payload.assigned_to ?? '').trim(),
    assignedBy: String(payload.assignedBy ?? payload.assigned_by ?? '').trim(),
    unit: String(payload.unit ?? '').trim(),
    assignedDate:
      payload.assignedDate ?? payload.assigned_date ?? new Date().toISOString(),
    deadline: String(payload.deadline ?? '').trim(),
    status: String(payload.status ?? 'Pending').trim(),
    notes:
      payload.notes == null || payload.notes === ''
        ? null
        : String(payload.notes).trim(),
  };

  if (!validAssignmentEntityTypes.has(assignment.entityType)) {
    throw createHttpError(400, 'entityType is invalid');
  }
  if (!assignment.entityId) throw createHttpError(400, 'entityId is required');
  if (!assignment.assignedTo) {
    throw createHttpError(400, 'assignedTo is required');
  }
  if (!assignment.assignedBy) {
    throw createHttpError(400, 'assignedBy is required');
  }
  if (!assignment.deadline) throw createHttpError(400, 'deadline is required');
  if (!validAssignmentStatuses.has(assignment.status)) {
    throw createHttpError(400, 'status is invalid');
  }

  return assignment;
}

async function appendGoalAssignee(client, goalId, assignee, updatedBy) {
  const goalRow = await getGoalRowById(client, goalId);

  if (!goalRow) {
    throw createHttpError(404, 'Goal not found');
  }

  const assignedTo = parseJsonArray(goalRow.assigned_to);
  if (assignedTo.includes(assignee)) {
    return rowToGoal(goalRow);
  }

  const nextAssignedTo = JSON.stringify([...assignedTo, assignee]);
  const { rows } = await client.query(
    `UPDATE goals
      SET assigned_to = $2::jsonb,
          updated_at = $3,
          updated_by = $4
    WHERE id = $1
    RETURNING *`,
    [goalId, nextAssignedTo, new Date().toISOString(), updatedBy]
  );

  return rowToGoal(rows[0]);
}

export async function initDb() {
  if (!pool) return;

  try {
    await pool.query(createGoalsTableSql);
    await pool.query(createAssignmentsTableSql);
    await pool.query(createUnitOwnersTableSql);

    await ensureSeedRows(
      pool,
      seedGoals,
      `INSERT INTO goals (
        id, title, description, academic_year_start, status, priority,
        responsible_unit, parent_id, level, created_at, updated_at, updated_by,
        start_date, end_date, progress, assigned_to
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb
      )
      ON CONFLICT (id) DO NOTHING`,
      (goal) => [
        goal.id,
        goal.title,
        goal.description,
        goal.academic_year_start,
        goal.status,
        goal.priority,
        goal.responsible_unit,
        goal.parent_id,
        goal.level,
        goal.created_at,
        goal.updated_at,
        goal.updated_by,
        goal.start_date,
        goal.end_date,
        goal.progress,
        goal.assigned_to,
      ]
    );

    await ensureSeedRows(
      pool,
      seedAssignments,
      `INSERT INTO assignments (
        id, entity_type, entity_id, academic_year_start, assigned_to,
        assigned_by, unit, assigned_date, deadline, status, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      ON CONFLICT (id) DO NOTHING`,
      (assignment) => [
        assignment.id,
        assignment.entity_type,
        assignment.entity_id,
        assignment.academic_year_start,
        assignment.assigned_to,
        assignment.assigned_by,
        assignment.unit,
        assignment.assigned_date,
        assignment.deadline,
        assignment.status,
        assignment.notes,
      ]
    );

    await ensureSeedRows(
      pool,
      seedUnitOwners,
      `INSERT INTO unit_owners (
        academic_year_start, unit_name, owner_name, updated_at, updated_by
      ) VALUES (
        $1, $2, $3, $4, $5
      )
      ON CONFLICT (academic_year_start, unit_name) DO NOTHING`,
      (unitOwner) => [
        unitOwner.academic_year_start,
        unitOwner.unit_name,
        unitOwner.owner_name,
        unitOwner.updated_at,
        unitOwner.updated_by,
      ]
    );
  } catch (err) {
    console.error('DB init error:', err.message);
  }
}

export async function getGoals(academicYearStart = null) {
  if (!pool) return [];

  const query =
    academicYearStart != null
      ? 'SELECT * FROM goals WHERE academic_year_start = $1 ORDER BY level, id'
      : 'SELECT * FROM goals ORDER BY level, id';
  const values = academicYearStart != null ? [academicYearStart] : [];
  const { rows } = await pool.query(query, values);
  return rows.map(rowToGoal);
}

export async function getGoalById(id) {
  if (!pool) return null;

  const { rows } = await pool.query('SELECT * FROM goals WHERE id = $1', [id]);
  return rows.length ? rowToGoal(rows[0]) : null;
}

export async function createGoal(payload) {
  const client = ensurePool();
  const goal = validateGoalPayload(payload);
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    let level = 0;
    let parentId = goal.parentId;

    if (parentId) {
      const parentRow = await getGoalRowById(dbClient, parentId);
      if (!parentRow) {
        throw createHttpError(404, 'Parent goal not found');
      }

      level = parentRow.level + 1;
      if (level > 2) {
        throw createHttpError(400, 'Nested goals deeper than level 2 are not supported');
      }
    } else {
      parentId = null;
    }

    const { rows } = await dbClient.query(
      `INSERT INTO goals (
        id, title, description, academic_year_start, status, priority,
        responsible_unit, parent_id, level, created_at, updated_at, updated_by,
        start_date, end_date, progress, assigned_to
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb
      )
      RETURNING *`,
      [
        goal.id,
        goal.title,
        goal.description,
        goal.academicYearStart,
        goal.status,
        goal.priority,
        goal.responsibleUnit,
        parentId,
        level,
        goal.createdAt,
        goal.updatedAt,
        goal.updatedBy,
        goal.startDate,
        goal.endDate,
        goal.progress,
        JSON.stringify(goal.assignedTo),
      ]
    );

    await dbClient.query('COMMIT');
    return rowToGoal(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    if (err.code === '23505') {
      throw createHttpError(409, 'Goal id already exists');
    }
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function updateGoal(id, payload) {
  const client = ensurePool();
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const existingRow = await getGoalRowById(dbClient, id);
    if (!existingRow) {
      throw createHttpError(404, 'Goal not found');
    }

    const mergedPayload = {
      ...rowToGoal(existingRow),
      ...payload,
      id,
      parentId:
        payload.parentId !== undefined || payload.parent_id !== undefined
          ? payload.parentId ?? payload.parent_id ?? null
          : existingRow.parent_id,
      createdAt: existingRow.created_at,
      updatedAt: new Date().toISOString(),
      updatedBy:
        payload.updatedBy ?? payload.updated_by ?? existingRow.updated_by,
      academicYearStart:
        payload.academicYearStart ??
        payload.academic_year_start ??
        existingRow.academic_year_start,
      assignedTo:
        payload.assignedTo ?? payload.assigned_to ?? parseJsonArray(existingRow.assigned_to),
    };

    if (mergedPayload.parentId === id) {
      throw createHttpError(400, 'A goal cannot be its own parent');
    }

    const goal = validateGoalPayload(mergedPayload);

    let level = 0;
    let parentId = goal.parentId;

    if (parentId) {
      const parentRow = await getGoalRowById(dbClient, parentId);
      if (!parentRow) {
        throw createHttpError(404, 'Parent goal not found');
      }
      if (parentRow.id === id) {
        throw createHttpError(400, 'A goal cannot be its own parent');
      }

      level = parentRow.level + 1;
      if (level > 2) {
        throw createHttpError(400, 'Nested goals deeper than level 2 are not supported');
      }
    } else {
      parentId = null;
    }

    const { rows } = await dbClient.query(
      `UPDATE goals
        SET title = $2,
            description = $3,
            academic_year_start = $4,
            status = $5,
            priority = $6,
            responsible_unit = $7,
            parent_id = $8,
            level = $9,
            updated_at = $10,
            updated_by = $11,
            start_date = $12,
            end_date = $13,
            progress = $14,
            assigned_to = $15::jsonb
      WHERE id = $1
      RETURNING *`,
      [
        id,
        goal.title,
        goal.description,
        goal.academicYearStart,
        goal.status,
        goal.priority,
        goal.responsibleUnit,
        parentId,
        level,
        goal.updatedAt,
        goal.updatedBy,
        goal.startDate,
        goal.endDate,
        goal.progress,
        JSON.stringify(goal.assignedTo),
      ]
    );

    await dbClient.query('COMMIT');
    return rowToGoal(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function getAssignments(filters = {}) {
  if (!pool) return [];

  const conditions = [];
  const values = [];

  if (filters.academicYearStart != null) {
    values.push(filters.academicYearStart);
    conditions.push(`academic_year_start = $${values.length}`);
  }
  if (filters.status) {
    values.push(filters.status);
    conditions.push(`status = $${values.length}`);
  }
  if (filters.entityType) {
    values.push(filters.entityType);
    conditions.push(`entity_type = $${values.length}`);
  }
  if (filters.unit) {
    values.push(filters.unit);
    conditions.push(`unit = $${values.length}`);
  }
  if (filters.assignedTo) {
    values.push(filters.assignedTo);
    conditions.push(`assigned_to = $${values.length}`);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const { rows } = await pool.query(
    `SELECT * FROM assignments ${whereClause} ORDER BY deadline, id`,
    values
  );

  return rows.map(rowToAssignment);
}

export async function createAssignment(payload) {
  const client = ensurePool();
  const assignment = validateAssignmentPayload(payload);
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    let academicYearStart = assignment.academicYearStart;
    let unit = assignment.unit;

    if (assignment.entityType === 'Goal') {
      const goalRow = await getGoalRowById(dbClient, assignment.entityId);
      if (!goalRow) {
        throw createHttpError(404, 'Goal not found');
      }

      academicYearStart ??= goalRow.academic_year_start;
      unit ||= goalRow.responsible_unit;
    }

    if (academicYearStart == null) {
      throw createHttpError(
        400,
        'academicYearStart is required for non-goal assignments'
      );
    }
    if (!unit) {
      throw createHttpError(400, 'unit is required for non-goal assignments');
    }

    const { rows } = await dbClient.query(
      `INSERT INTO assignments (
        id, entity_type, entity_id, academic_year_start, assigned_to,
        assigned_by, unit, assigned_date, deadline, status, notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11
      )
      RETURNING *`,
      [
        assignment.id,
        assignment.entityType,
        assignment.entityId,
        academicYearStart,
        assignment.assignedTo,
        assignment.assignedBy,
        unit,
        assignment.assignedDate,
        assignment.deadline,
        assignment.status,
        assignment.notes,
      ]
    );

    if (assignment.entityType === 'Goal') {
      await appendGoalAssignee(
        dbClient,
        assignment.entityId,
        assignment.assignedTo,
        assignment.assignedBy
      );
    }

    await dbClient.query('COMMIT');
    return rowToAssignment(rows[0]);
  } catch (err) {
    await dbClient.query('ROLLBACK');
    if (err.code === '23505') {
      throw createHttpError(409, 'Assignment id already exists');
    }
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function updateAssignmentStatus(id, status) {
  ensurePool();

  if (!validAssignmentStatuses.has(status)) {
    throw createHttpError(400, 'status is invalid');
  }

  const { rows } = await pool.query(
    `UPDATE assignments
      SET status = $2
    WHERE id = $1
    RETURNING *`,
    [id, status]
  );

  if (!rows.length) {
    throw createHttpError(404, 'Assignment not found');
  }

  return rowToAssignment(rows[0]);
}

export async function getUnitOwners(academicYearStart = null) {
  if (!pool) return [];

  const query =
    academicYearStart == null
      ? 'SELECT * FROM unit_owners ORDER BY academic_year_start, unit_name'
      : 'SELECT * FROM unit_owners WHERE academic_year_start = $1 ORDER BY unit_name';
  const values = academicYearStart == null ? [] : [academicYearStart];
  const { rows } = await pool.query(query, values);
  return rows.map(rowToUnitOwner);
}

export async function getViewerDirectory(academicYearStart = null) {
  if (!pool) {
    const goals = seedGoals
      .map(rowToGoal)
      .filter((goal) =>
        academicYearStart == null ? true : goal.academicYearStart === academicYearStart
      );
    const assignments = seedAssignments
      .map(rowToAssignment)
      .filter((assignment) =>
        academicYearStart == null
          ? true
          : assignment.academicYearStart === academicYearStart
      );
    const unitOwners = seedUnitOwners
      .map(rowToUnitOwner)
      .filter((unitOwner) =>
        academicYearStart == null
          ? true
          : unitOwner.academicYearStart === academicYearStart
      );

    return buildViewerDirectory(goals, assignments, unitOwners);
  }

  const [goals, assignments, unitOwners] = await Promise.all([
    getGoals(academicYearStart),
    getAssignments({
      academicYearStart,
    }),
    getUnitOwners(academicYearStart),
  ]);

  return buildViewerDirectory(goals, assignments, unitOwners);
}

export async function upsertUnitOwner(payload) {
  const client = ensurePool();
  const unitOwner = validateUnitOwnerPayload(payload);

  const { rows } = await client.query(
    `INSERT INTO unit_owners (
      academic_year_start, unit_name, owner_name, updated_at, updated_by
    ) VALUES (
      $1, $2, $3, $4, $5
    )
    ON CONFLICT (academic_year_start, unit_name)
    DO UPDATE SET
      owner_name = EXCLUDED.owner_name,
      updated_at = EXCLUDED.updated_at,
      updated_by = EXCLUDED.updated_by
    RETURNING *`,
    [
      unitOwner.academicYearStart,
      unitOwner.unitName,
      unitOwner.ownerName,
      unitOwner.updatedAt,
      unitOwner.updatedBy,
    ]
  );

  return rowToUnitOwner(rows[0]);
}

export async function copyAcademicYearGoals(payload) {
  const client = ensurePool();
  const sourceAcademicYearStart = toInt(
    payload.sourceAcademicYearStart ?? payload.source_academic_year_start,
    'sourceAcademicYearStart'
  );
  const targetAcademicYearStart = toInt(
    payload.targetAcademicYearStart ?? payload.target_academic_year_start,
    'targetAcademicYearStart'
  );
  const selectedGoalIds = Array.isArray(payload.goalIds ?? payload.goal_ids)
    ? [...new Set((payload.goalIds ?? payload.goal_ids).map((item) => String(item).trim()).filter(Boolean))]
    : [];
  const requestedBy = String(payload.requestedBy ?? payload.requested_by ?? '').trim();

  if (sourceAcademicYearStart == null) {
    throw createHttpError(400, 'sourceAcademicYearStart is required');
  }
  if (targetAcademicYearStart == null) {
    throw createHttpError(400, 'targetAcademicYearStart is required');
  }
  if (sourceAcademicYearStart === targetAcademicYearStart) {
    throw createHttpError(400, 'Source and target academic year must be different');
  }
  if (!requestedBy) {
    throw createHttpError(400, 'requestedBy is required');
  }

  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    const sourceGoalRows = await getGoalRowsByAcademicYear(
      dbClient,
      sourceAcademicYearStart,
      selectedGoalIds.length > 0 ? selectedGoalIds : null
    );
    if (!sourceGoalRows.length) {
      throw createHttpError(404, 'No goals found for the selected source year');
    }

    const selectedRootIds =
      selectedGoalIds.length > 0
        ? new Set(selectedGoalIds)
        : new Set(
            sourceGoalRows
              .filter((row) => row.level === 0 || row.parent_id == null)
              .map((row) => row.id)
          );
    const filteredGoalRows = sourceGoalRows.filter(
      (row) => row.parent_id == null || selectedRootIds.has(row.parent_id) || selectedRootIds.has(row.id)
    );
    const sourceGoalIds = filteredGoalRows.map((row) => row.id);
    const goalIdMap = new Map();
    const unitOwnerMap = await getUnitOwnerMap(dbClient, targetAcademicYearStart);
    const yearOffset = targetAcademicYearStart - sourceAcademicYearStart;
    const copiedAt = new Date().toISOString();

    for (const sourceRow of filteredGoalRows) {
      goalIdMap.set(sourceRow.id, generateId('G'));
    }

    for (const sourceRow of filteredGoalRows) {
      const assignedTo = resolveAssigneesForUnit(
        unitOwnerMap,
        sourceRow.responsible_unit,
        parseJsonArray(sourceRow.assigned_to)
      );
      const nextGoalId = goalIdMap.get(sourceRow.id);
      const nextParentId = sourceRow.parent_id ? goalIdMap.get(sourceRow.parent_id) : null;

      const { rows } = await dbClient.query(
        `INSERT INTO goals (
          id, title, description, academic_year_start, status, priority,
          responsible_unit, parent_id, level, created_at, updated_at, updated_by,
          start_date, end_date, progress, assigned_to
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb
        ) RETURNING *`,
        [
          nextGoalId,
          sourceRow.title,
          sourceRow.description,
          targetAcademicYearStart,
          'Not Started',
          sourceRow.priority,
          sourceRow.responsible_unit,
          nextParentId,
          sourceRow.level,
          copiedAt,
          copiedAt,
          requestedBy,
          shiftDateToAcademicYear(sourceRow.start_date, yearOffset),
          shiftDateToAcademicYear(sourceRow.end_date, yearOffset),
          0,
          JSON.stringify(assignedTo),
        ]
      );

      for (const assignee of assignedTo) {
        await dbClient.query(
          `INSERT INTO assignments (
            id, entity_type, entity_id, academic_year_start, assigned_to,
            assigned_by, unit, assigned_date, deadline, status, notes
          ) VALUES (
            $1, 'Goal', $2, $3, $4, $5, $6, $7, $8, 'Pending', $9
          )`,
          [
            generateId('ASG'),
            rows[0].id,
            targetAcademicYearStart,
            assignee,
            requestedBy,
            sourceRow.responsible_unit,
            copiedAt,
            shiftDateToAcademicYear(sourceRow.end_date, yearOffset),
            `Copied from academic year ${sourceAcademicYearStart}`,
          ]
        );
      }
    }

    const { rows: sourceKpis } = await dbClient.query(
      `SELECT *
        FROM kpis
        WHERE academic_year_start = $1
          AND goal_id = ANY($2::text[])
        ORDER BY id`,
      [sourceAcademicYearStart, sourceGoalIds]
    );
    const kpiIdMap = new Map();
    for (const sourceRow of sourceKpis) {
      kpiIdMap.set(sourceRow.id, generateId('KPI'));
    }

    for (const sourceRow of sourceKpis) {
      const assignee = unitOwnerMap.get(sourceRow.responsible_unit) ?? sourceRow.assigned_to;
      const nextKpiId = kpiIdMap.get(sourceRow.id);
      const nextGoalId = goalIdMap.get(sourceRow.goal_id);

      const { rows } = await dbClient.query(
        `INSERT INTO kpis (
          id, goal_id, name, description, target_value, current_value, unit,
          academic_year_start, responsible_unit, deadline, status, updated_at,
          updated_by, assigned_to
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
        ) RETURNING *`,
        [
          nextKpiId,
          nextGoalId,
          sourceRow.name,
          sourceRow.description,
          sourceRow.target_value,
          0,
          sourceRow.unit,
          targetAcademicYearStart,
          sourceRow.responsible_unit,
          shiftDateToAcademicYear(sourceRow.deadline, yearOffset),
          'Not Started',
          copiedAt,
          requestedBy,
          assignee,
        ]
      );

      if (assignee) {
        await dbClient.query(
          `INSERT INTO assignments (
            id, entity_type, entity_id, academic_year_start, assigned_to,
            assigned_by, unit, assigned_date, deadline, status, notes
          ) VALUES (
            $1, 'KPI', $2, $3, $4, $5, $6, $7, $8, 'Pending', $9
          )`,
          [
            generateId('ASG'),
            rows[0].id,
            targetAcademicYearStart,
            assignee,
            requestedBy,
            sourceRow.responsible_unit,
            copiedAt,
            shiftDateToAcademicYear(sourceRow.deadline, yearOffset),
            `Copied from academic year ${sourceAcademicYearStart}`,
          ]
        );
      }
    }

    const { rows: sourceActions } = await dbClient.query(
      `SELECT *
        FROM action_plans
        WHERE academic_year_start = $1
          AND goal_id = ANY($2::text[])
        ORDER BY id`,
      [sourceAcademicYearStart, sourceGoalIds]
    );

    for (const sourceRow of sourceActions) {
      const assignee = unitOwnerMap.get(sourceRow.responsible_unit) ?? sourceRow.assigned_to;
      const nextGoalId = goalIdMap.get(sourceRow.goal_id);
      const nextKpiId = sourceRow.kpi_id ? kpiIdMap.get(sourceRow.kpi_id) ?? null : null;

      const { rows } = await dbClient.query(
        `INSERT INTO action_plans (
          id, goal_id, kpi_id, title, description, responsible_unit, assigned_to,
          deadline, status, progress, created_at, updated_at, updated_by, notes,
          priority, academic_year_start
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *`,
        [
          generateId('AP'),
          nextGoalId,
          nextKpiId,
          sourceRow.title,
          sourceRow.description,
          sourceRow.responsible_unit,
          assignee,
          shiftDateToAcademicYear(sourceRow.deadline, yearOffset),
          'Not Started',
          0,
          copiedAt,
          copiedAt,
          requestedBy,
          sourceRow.notes,
          sourceRow.priority,
          targetAcademicYearStart,
        ]
      );

      if (assignee) {
        await dbClient.query(
          `INSERT INTO assignments (
            id, entity_type, entity_id, academic_year_start, assigned_to,
            assigned_by, unit, assigned_date, deadline, status, notes
          ) VALUES (
            $1, 'Action Plan', $2, $3, $4, $5, $6, $7, $8, 'Pending', $9
          )`,
          [
            generateId('ASG'),
            rows[0].id,
            targetAcademicYearStart,
            assignee,
            requestedBy,
            sourceRow.responsible_unit,
            copiedAt,
            shiftDateToAcademicYear(sourceRow.deadline, yearOffset),
            `Copied from academic year ${sourceAcademicYearStart}`,
          ]
        );
      }
    }

    const { rows: sourceMilestones } = await dbClient.query(
      `SELECT *
        FROM milestones
        WHERE linked_id = ANY($1::text[])
        ORDER BY id`,
      [sourceGoalIds]
    );

    for (const sourceRow of sourceMilestones) {
      const { rows: linkedGoalRows } = await dbClient.query(
        'SELECT responsible_unit FROM goals WHERE id = $1',
        [sourceRow.linked_id]
      );
      const responsibleUnit = linkedGoalRows[0]?.responsible_unit ?? '';
      const owner = unitOwnerMap.get(responsibleUnit) ?? sourceRow.owner;

      await dbClient.query(
        `INSERT INTO milestones (
          id, linked_type, linked_id, title, description, owner, due_date, status,
          definition_of_done, progress, created_at, updated_at, updated_by,
          progress_updates, evidence_links
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'Not Started', $8, 0, $9, $10, $11, '[]'::jsonb, '[]'::jsonb
        )`,
        [
          generateId('MS'),
          sourceRow.linked_type,
          goalIdMap.get(sourceRow.linked_id),
          sourceRow.title,
          sourceRow.description,
          owner,
          shiftDateToAcademicYear(sourceRow.due_date, yearOffset),
          sourceRow.definition_of_done,
          copiedAt,
          copiedAt,
          requestedBy,
        ]
      );
    }

    await dbClient.query('COMMIT');

    return {
      sourceAcademicYearStart,
      targetAcademicYearStart,
      copiedGoals: filteredGoalRows.length,
      copiedKPIs: sourceKpis.length,
      copiedActions: sourceActions.length,
      copiedMilestones: sourceMilestones.length,
    };
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

export async function deleteGoal(id) {
  const client = ensurePool();
  const dbClient = await client.connect();

  try {
    await dbClient.query('BEGIN');

    // Delete related assignments
    await dbClient.query(
      "DELETE FROM assignments WHERE entity_type = 'Goal' AND entity_id = $1",
      [id]
    );

    // Delete the goal itself
    // Note: kpis, action_plans, and milestones have ON DELETE CASCADE in planningDb.js
    const { rowCount } = await dbClient.query(
      'DELETE FROM goals WHERE id = $1',
      [id]
    );

    if (rowCount === 0) {
      throw createHttpError(404, 'Goal not found');
    }

    await dbClient.query('COMMIT');
  } catch (err) {
    await dbClient.query('ROLLBACK');
    throw err;
  } finally {
    dbClient.release();
  }
}

export { pool };
