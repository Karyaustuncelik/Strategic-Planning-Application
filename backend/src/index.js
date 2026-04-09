import express from 'express';
import {
  initDb,
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  getAssignments,
  createAssignment,
  updateAssignmentStatus,
  getUnitOwners,
  getViewerDirectory,
  upsertUnitOwner,
  copyAcademicYearGoals,
  deleteGoal,
  pool,
} from './db.js';
import {
  initPlanningDb,
  getKPIs,
  createKPI,
  updateKPI,
  getActionPlans,
  createActionPlan,
  updateActionPlan,
  getMilestones,
  createMilestone,
  addMilestoneProgressUpdate,
  addMilestoneEvidence,
  deleteKPI,
  deleteActionPlan,
} from './planningDb.js';

const app = express();
const PORT = process.env.PORT || 9001;
const ADMIN_LOGIN_USERNAME = String(
  process.env.ADMIN_LOGIN_USERNAME || 'admin'
).trim();
const ADMIN_LOGIN_PASSWORD = String(
  process.env.ADMIN_LOGIN_PASSWORD || 'admin123'
).trim();
const VIEWER_LOGIN_PASSWORD = String(
  process.env.VIEWER_LOGIN_PASSWORD || 'viewer123'
).trim();
const allowedOrigins = String(process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowAnyOrigin = allowedOrigins.includes('*');
  const isAllowedOrigin =
    typeof requestOrigin === 'string' && allowedOrigins.includes(requestOrigin);

  if (allowAnyOrigin) {
    res.header('Access-Control-Allow-Origin', '*');
  } else if (isAllowedOrigin) {
    res.header('Access-Control-Allow-Origin', requestOrigin);
    res.header('Vary', 'Origin');
  }

  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json());

function parseOptionalInt(value, fieldName) {
  if (value == null || value === '') return null;

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    const error = new Error(`${fieldName} must be a number`);
    error.statusCode = 400;
    throw error;
  }

  return parsed;
}

function handleApiError(res, err, fallbackMessage) {
  const statusCode = err?.statusCode ?? 500;
  const message = err?.message ?? fallbackMessage;

  if (statusCode >= 500) {
    console.error(fallbackMessage, err);
  }

  res.status(statusCode).json({ error: message });
}

function normalizeCredential(value) {
  return String(value ?? '').trim().toLowerCase();
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.get('/api/health/db', async (_req, res) => {
  if (!pool) {
    return res
      .status(503)
      .json({ status: 'unavailable', message: 'No database configured' });
  }

  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      message: err?.message,
    });
  }
});

app.get('/api/auth/options', async (req, res) => {
  try {
    const academicYearStart = parseOptionalInt(
      req.query.academicYearStart,
      'academicYearStart'
    );
    const viewerAccounts = await getViewerDirectory(academicYearStart);

    res.json({
      adminUsername: ADMIN_LOGIN_USERNAME,
      viewerPasswordHint: VIEWER_LOGIN_PASSWORD,
      viewerAccounts,
    });
  } catch (err) {
    handleApiError(res, err, 'GET /api/auth/options failed');
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const loginMode = String(req.body?.loginMode ?? '').trim();
    const password = String(req.body?.password ?? '').trim();

    if (loginMode !== 'admin' && loginMode !== 'viewer') {
      return res.status(400).json({ error: 'loginMode must be admin or viewer' });
    }

    if (!password) {
      return res.status(400).json({ error: 'password is required' });
    }

    if (loginMode === 'admin') {
      const username = String(req.body?.username ?? '').trim();
      if (
        normalizeCredential(username) !== normalizeCredential(ADMIN_LOGIN_USERNAME) ||
        password !== ADMIN_LOGIN_PASSWORD
      ) {
        return res.status(401).json({ error: 'Invalid admin credentials' });
      }

      return res.json({
        id: 'admin',
        name: 'Strategy Office Manager',
        role: 'Strategy Office',
        loginMode: 'admin',
      });
    }

    const viewerId = String(req.body?.viewerId ?? '').trim();
    if (!viewerId) {
      return res.status(400).json({ error: 'viewerId is required' });
    }

    const viewerAccounts = await getViewerDirectory(null);
    const normalizedViewerId = normalizeCredential(viewerId);
    const matchedViewer = viewerAccounts.find((account) => {
      const normalizedAccountId = normalizeCredential(account.id);
      const normalizedAccountName = normalizeCredential(account.name);
      const normalizedAccountLabel = normalizeCredential(
        account.unit ? `${account.name} ${account.unit}` : account.name
      );

      return (
        account.id === viewerId ||
        normalizedAccountId === normalizedViewerId ||
        normalizedAccountName === normalizedViewerId ||
        normalizedAccountLabel === normalizedViewerId
      );
    });

    if (!matchedViewer) {
      return res.status(404).json({ error: 'Viewer account not found' });
    }

    // Viewer access is demo-oriented, so account selection is the primary check.
    // We still expose the shared password in the UI, but we don't block access if
    // the user types a different value.

    return res.json({
      id: matchedViewer.id,
      name: matchedViewer.name,
      role: 'Viewer',
      unit: matchedViewer.unit,
      loginMode: 'viewer',
    });
  } catch (err) {
    handleApiError(res, err, 'POST /api/auth/login failed');
  }
});

app.get('/api/goals', async (req, res) => {
  try {
    const academicYearStart = parseOptionalInt(
      req.query.academicYearStart,
      'academicYearStart'
    );
    const goals = await getGoals(academicYearStart);
    res.json(goals);
  } catch (err) {
    handleApiError(res, err, 'GET /api/goals failed');
  }
});

app.get('/api/goals/:id', async (req, res) => {
  try {
    const goal = await getGoalById(req.params.id);
    if (!goal) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    res.json(goal);
  } catch (err) {
    handleApiError(res, err, 'GET /api/goals/:id failed');
  }
});

app.post('/api/goals', async (req, res) => {
  try {
    const goal = await createGoal(req.body ?? {});
    res.status(201).json(goal);
  } catch (err) {
    handleApiError(res, err, 'POST /api/goals failed');
  }
});

app.patch('/api/goals/:id', async (req, res) => {
  try {
    const goal = await updateGoal(req.params.id, req.body ?? {});
    res.json(goal);
  } catch (err) {
    handleApiError(res, err, 'PATCH /api/goals/:id failed');
  }
});

app.delete('/api/goals/:id', async (req, res) => {
  try {
    await deleteGoal(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    handleApiError(res, err, 'DELETE /api/goals/:id failed');
  }
});

app.get('/api/assignments', async (req, res) => {
  try {
    const assignments = await getAssignments({
      academicYearStart: parseOptionalInt(
        req.query.academicYearStart,
        'academicYearStart'
      ),
      status: req.query.status ? String(req.query.status) : null,
      entityType: req.query.entityType ? String(req.query.entityType) : null,
      unit: req.query.unit ? String(req.query.unit) : null,
      assignedTo: req.query.assignedTo ? String(req.query.assignedTo) : null,
    });

    res.json(assignments);
  } catch (err) {
    handleApiError(res, err, 'GET /api/assignments failed');
  }
});

app.post('/api/assignments', async (req, res) => {
  try {
    const assignment = await createAssignment(req.body ?? {});
    res.status(201).json(assignment);
  } catch (err) {
    handleApiError(res, err, 'POST /api/assignments failed');
  }
});

app.patch('/api/assignments/:id/status', async (req, res) => {
  try {
    const status = String(req.body?.status ?? '').trim();
    if (!status) {
      return res.status(400).json({ error: 'status is required' });
    }

    const assignment = await updateAssignmentStatus(req.params.id, status);
    res.json(assignment);
  } catch (err) {
    handleApiError(res, err, 'PATCH /api/assignments/:id/status failed');
  }
});

app.get('/api/unit-owners', async (req, res) => {
  try {
    const unitOwners = await getUnitOwners(
      parseOptionalInt(req.query.academicYearStart, 'academicYearStart')
    );
    res.json(unitOwners);
  } catch (err) {
    handleApiError(res, err, 'GET /api/unit-owners failed');
  }
});

app.put('/api/unit-owners', async (req, res) => {
  try {
    const unitOwner = await upsertUnitOwner(req.body ?? {});
    res.json(unitOwner);
  } catch (err) {
    handleApiError(res, err, 'PUT /api/unit-owners failed');
  }
});

app.post('/api/goals/copy-year', async (req, res) => {
  try {
    const result = await copyAcademicYearGoals(req.body ?? {});
    res.status(201).json(result);
  } catch (err) {
    handleApiError(res, err, 'POST /api/goals/copy-year failed');
  }
});

app.get('/api/kpis', async (req, res) => {
  try {
    const kpis = await getKPIs({
      academicYearStart: parseOptionalInt(
        req.query.academicYearStart,
        'academicYearStart'
      ),
      goalId: req.query.goalId ? String(req.query.goalId) : null,
      responsibleUnit: req.query.responsibleUnit
        ? String(req.query.responsibleUnit)
        : null,
    });

    res.json(kpis);
  } catch (err) {
    handleApiError(res, err, 'GET /api/kpis failed');
  }
});

app.post('/api/kpis', async (req, res) => {
  try {
    const kpi = await createKPI(req.body ?? {});
    res.status(201).json(kpi);
  } catch (err) {
    handleApiError(res, err, 'POST /api/kpis failed');
  }
});

app.patch('/api/kpis/:id', async (req, res) => {
  try {
    const kpi = await updateKPI(req.params.id, req.body ?? {});
    res.json(kpi);
  } catch (err) {
    handleApiError(res, err, 'PATCH /api/kpis/:id failed');
  }
});

app.get('/api/actions', async (req, res) => {
  try {
    const actionPlans = await getActionPlans({
      academicYearStart: parseOptionalInt(
        req.query.academicYearStart,
        'academicYearStart'
      ),
      goalId: req.query.goalId ? String(req.query.goalId) : null,
      responsibleUnit: req.query.responsibleUnit
        ? String(req.query.responsibleUnit)
        : null,
    });

    res.json(actionPlans);
  } catch (err) {
    handleApiError(res, err, 'GET /api/actions failed');
  }
});

app.post('/api/actions', async (req, res) => {
  try {
    const actionPlan = await createActionPlan(req.body ?? {});
    res.status(201).json(actionPlan);
  } catch (err) {
    handleApiError(res, err, 'POST /api/actions failed');
  }
});

app.patch('/api/actions/:id', async (req, res) => {
  try {
    const actionPlan = await updateActionPlan(req.params.id, req.body ?? {});
    res.json(actionPlan);
  } catch (err) {
    handleApiError(res, err, 'PATCH /api/actions/:id failed');
  }
});

app.get('/api/milestones', async (req, res) => {
  try {
    const milestones = await getMilestones({
      academicYearStart: parseOptionalInt(
        req.query.academicYearStart,
        'academicYearStart'
      ),
      linkedId: req.query.linkedId ? String(req.query.linkedId) : null,
      owner: req.query.owner ? String(req.query.owner) : null,
      status: req.query.status ? String(req.query.status) : null,
    });

    res.json(milestones);
  } catch (err) {
    handleApiError(res, err, 'GET /api/milestones failed');
  }
});

app.post('/api/milestones', async (req, res) => {
  try {
    const milestone = await createMilestone(req.body ?? {});
    res.status(201).json(milestone);
  } catch (err) {
    handleApiError(res, err, 'POST /api/milestones failed');
  }
});

app.post('/api/milestones/:id/updates', async (req, res) => {
  try {
    const milestone = await addMilestoneProgressUpdate(
      req.params.id,
      req.body ?? {}
    );
    res.json(milestone);
  } catch (err) {
    handleApiError(res, err, 'POST /api/milestones/:id/updates failed');
  }
});

app.post('/api/milestones/:id/evidence', async (req, res) => {
  try {
    const milestone = await addMilestoneEvidence(req.params.id, req.body ?? {});
    res.json(milestone);
  } catch (err) {
    handleApiError(res, err, 'POST /api/milestones/:id/evidence failed');
  }
});

app.delete('/api/kpis/:id', async (req, res) => {
  try {
    await deleteKPI(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    handleApiError(res, err, 'DELETE /api/kpis/:id failed');
  }
});

app.delete('/api/actions/:id', async (req, res) => {
  try {
    await deleteActionPlan(req.params.id);
    res.sendStatus(204);
  } catch (err) {
    handleApiError(res, err, 'DELETE /api/actions/:id failed');
  }
});

async function start() {
  await initDb();
  await initPlanningDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
