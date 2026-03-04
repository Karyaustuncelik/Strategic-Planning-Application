import pg from 'pg';

const pool = process.env.DATABASE_URL
  ? new pg.Pool({ connectionString: process.env.DATABASE_URL })
  : null;

const createTableSql = `
  CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    academic_year_start INTEGER NOT NULL,
    status TEXT NOT NULL,
    priority TEXT NOT NULL,
    responsible_unit TEXT NOT NULL,
    parent_id TEXT,
    level INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    updated_by TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    assigned_to JSONB DEFAULT '[]'::jsonb
  );
`;

const seedGoals = [
  {
    id: 'G001',
    title: 'Enhance Research Quality and Impact',
    description: 'Increase publications in high-impact journals and strengthen research collaborations across departments.',
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
    description: 'Enhance academic support services and reduce dropout rates through comprehensive student support.',
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
    description: 'Modernize IT infrastructure and implement digital tools across all departments.',
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

export async function initDb() {
  if (!pool) return;
  try {
    await pool.query(createTableSql);
    const { rows } = await pool.query('SELECT COUNT(*)::int AS count FROM goals');
    if (rows[0].count === 0) {
      for (const g of seedGoals) {
        await pool.query(
          `INSERT INTO goals (
            id, title, description, academic_year_start, status, priority,
            responsible_unit, parent_id, level, created_at, updated_at, updated_by,
            start_date, end_date, progress, assigned_to
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb)`,
          [
            g.id, g.title, g.description, g.academic_year_start, g.status, g.priority,
            g.responsible_unit, g.parent_id, g.level, g.created_at, g.updated_at, g.updated_by,
            g.start_date, g.end_date, g.progress, g.assigned_to,
          ]
        );
      }
      console.log('Seeded goals table with', seedGoals.length, 'rows');
    }
  } catch (err) {
    console.error('DB init error:', err.message);
  }
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
    assignedTo: row.assigned_to ?? [],
  };
}

export async function getGoals(academicYearStart = null) {
  if (!pool) return [];
  const query = academicYearStart != null
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

export { pool };
