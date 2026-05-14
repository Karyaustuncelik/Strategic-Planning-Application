import express from 'express';
import passport from 'passport';
import { Strategy as SamlStrategy } from '@node-saml/passport-saml';
import jwt from 'jsonwebtoken';
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
  assignGoalTrees,
  deleteGoal,
  getUserByUsername,
  pool,
  initAuthorizedUsers,
  getAuthorizedUserByEmail,
  getAllAuthorizedUsers,
  createAuthorizedUser,
  updateAuthorizedUser,
  deleteAuthorizedUser,
} from './db.js';
import {
  initPlanningDb,
  getKPIs,
  createKPI,
  updateKPI,
  getKPIById,
  extendKPIDeadline,
  getActionPlans,
  createActionPlan,
  updateActionPlan,
  getActionPlanById,
  extendActionPlanDeadline,
  getMilestones,
  createMilestone,
  addMilestoneProgressUpdate,
  addMilestoneEvidence,
  deleteKPI,
  deleteActionPlan,
  isDeadlinePassed,
  insertSubmissionLog,
  getSubmissionLogsByEntity,
  getAllSubmissionLogs,
} from './planningDb.js';

const RESULT_FIELDS = new Set([
  'resultType', 'result_type',
  'resultValue', 'result_value',
  'resultUpdatedAt', 'result_updated_at',
  'resultUpdatedBy', 'result_updated_by',
]);

const PROJECTION_FIELDS = new Set([
  'projectionValues', 'projection_values',
  'projectionUpdatedAt', 'projection_updated_at',
  'projectionUpdatedBy', 'projection_updated_by',
]);

function hasResultOrProjectionFields(body) {
  return Object.keys(body).some((k) => RESULT_FIELDS.has(k) || PROJECTION_FIELDS.has(k));
}

function hasResultFields(body) {
  return Object.keys(body).some((k) => RESULT_FIELDS.has(k));
}

function hasProjectionFields(body) {
  return Object.keys(body).some((k) => PROJECTION_FIELDS.has(k));
}

const app = express();
const PORT = process.env.PORT || 9001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:8001';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
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

// ─── SAML Strategy ────────────────────────────────────────────────────────────
const SSO_CERT = process.env.SSO_CERT || '';
if (!SSO_CERT) {
  console.warn('⚠️  SSO_CERT is not set — SAML authentication disabled.');
}

if (SSO_CERT) {
// PEM header/footer ve whitespace varsa temizle — node-saml bare base64 bekliyor
const CERTIFICATE = SSO_CERT
  .replace(/-----BEGIN CERTIFICATE-----/g, '')
  .replace(/-----END CERTIFICATE-----/g, '')
  .replace(/\s+/g, '');

passport.use(
  new SamlStrategy(
    {
      entryPoint: 'https://login.microsoftonline.com/f1a26096-6ac1-45ab-86a3-938aa985bdf5/saml2',
      issuer: 'https://student-projects.sabanciuniv.edu/spu/',
      idpIssuer: 'https://sts.windows.net/f1a26096-6ac1-45ab-86a3-938aa985bdf5/',
      callbackUrl: process.env.NODE_ENV === 'production'
        ? 'https://student-projects.sabanciuniv.edu/spu/saml/module.php/saml/sp/saml2-acs.php/default-sp'
        : 'http://localhost:9001/api/auth/saml/callback',
      // idpCert: Azure AD IdP'nin public sertifikası (bare base64, header'sız)
      idpCert: CERTIFICATE,
      // Azure AD assertion'ı imzalar ama tüm response'u imzalamayabilir
      wantAuthnResponseSigned: false,
      wantAssertionsSigned: true,
      validateInResponseTo: 'never',
    },
    (profile, done) => {
      const email =
        profile.nameID ||
        profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] ||
        profile['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] ||
        'unknown@sabanciuniv.edu';
      const name =
        profile['http://schemas.microsoft.com/identity/claims/displayname'] ||
        profile.nameID ||
        'SPU User';
      return done(null, { email, name, ...profile });
    },
    (_profile, done) => done(null)
  )
);
} // end if (SSO_CERT)

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

function generateJwt(user, role = 'Strategy Office') {
  return jwt.sign(
    { email: user.email, name: user.name, role: user.role ?? role },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/** admin → 'Strategy Office', user → 'Viewer' */
function dbRoleToAppRole(dbRole) {
  return dbRole === 'admin' ? 'Strategy Office' : 'Viewer';
}

/** Extract Sabanci username from email (e.g. 'karya.ustuncelik' from 'karya.ustuncelik@sabanciuniv.edu') */
function usernameFromEmail(email = '') {
  return email.split('@')[0].toLowerCase();
}

async function handleSamlUser(user, res) {
  const email = user.email || user.nameID || '';
  const dbUser = await getAuthorizedUserByEmail(email);

  if (!dbUser) {
    console.warn(`SSO login denied for unknown user: ${email}`);
    return res.redirect(303, `${CLIENT_URL}/?error=unauthorized`);
  }

  const appRole = dbUser.role;
  const token = generateJwt({ email, name: user.name || email }, appRole);
  res.cookie('spu_sso_token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 1000,
    path: '/',
  });
  return res.redirect(303, CLIENT_URL + '/');
}

function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'Strategy Office') return res.status(403).json({ error: 'Forbidden: admin only' });
    req.adminUser = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}
// ──────────────────────────────────────────────────────────────────────────────

app.use(express.json());
app.use(express.urlencoded({ extended: false })); // SAML ACS POST için zorunlu - route'lardan ÖNCE olmalı
app.use(passport.initialize());

// ─── SAML Routes ──────────────────────────────────────────────────────────────

// 1. Login başlatır → Azure AD'ye yönlendirir
app.get('/api/auth/saml/login', (req, res, next) => {
  if (!SSO_CERT) {
    return res.redirect(303, `${CLIENT_URL}/?error=sso_not_configured`);
  }
  passport.authenticate('saml', { failureRedirect: '/', failureFlash: false })(req, res, next);
});

// 2. Local dev callback
app.post(
  '/api/auth/saml/callback',
  (req, res, next) => {
    passport.authenticate('saml', { session: false }, async (err, user) => {
      if (err || !user) {
        console.error('SAML Authentication error:', err);
        return res.redirect(303, `${CLIENT_URL}/?error=sso_failed`);
      }
      return handleSamlUser(user, res);
    })(req, res, next);
  }
);

// 3. Production callback
app.post(
  '/api/auth/saml/module.php/saml/sp/saml2-acs.php/default-sp',
  (req, res, next) => {
    passport.authenticate('saml', { session: false }, async (err, user) => {
      if (err || !user) {
        console.error('SAML Authentication error:', err);
        return res.redirect(303, `${CLIENT_URL}/?error=sso_failed`);
      }
      return handleSamlUser(user, res);
    })(req, res, next);
  }
);
// ──────────────────────────────────────────────────────────────────────────────

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

  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,OPTIONS');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});


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

      const adminToken = generateJwt({ email: ADMIN_LOGIN_USERNAME, name: 'Strategy Office Manager', role: 'Strategy Office' });
      return res.json({
        id: 'admin',
        name: 'Strategy Office Manager',
        role: 'Strategy Office',
        loginMode: 'admin',
        token: adminToken,
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

app.post('/api/goals/assign-tree', async (req, res) => {
  try {
    const result = await assignGoalTrees(req.body ?? {});
    res.json(result);
  } catch (err) {
    handleApiError(res, err, 'POST /api/goals/assign-tree failed');
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
    const body = req.body ?? {};
    const isResultOrProjection = hasResultOrProjectionFields(body);

    if (isResultOrProjection) {
      const kpi = await getKPIById(req.params.id);
      if (!kpi) return res.status(404).json({ error: 'KPI not found' });
      const goal = await getGoalById(kpi.goalId);
      const deadline = goal?.endDate ?? kpi.deadline;
      if (isDeadlinePassed(deadline)) {
        return res.status(423).json({ error: 'KPI is locked: the goal deadline has passed. An admin must extend the goal deadline to allow edits.' });
      }
    }

    const kpi = await updateKPI(req.params.id, body);

    // Log result and projection saves as separate entries
    if (isResultOrProjection) {
      const goal = await getGoalById(kpi.goalId);
      const cycleDeadline = goal?.endDate ?? kpi.deadline ?? null;
      const baseLog = {
        entityType: 'kpi',
        entityId: kpi.id,
        entityTitle: kpi.name,
        goalId: kpi.goalId,
        academicYearStart: kpi.academicYearStart,
        submittedBy: kpi.assignedTo ?? null,
        cycleDeadline,
      };

      if (hasResultFields(body)) {
        await insertSubmissionLog({
          ...baseLog,
          logType: 'result',
          resultData: {
            resultType: kpi.resultType ?? null,
            resultValue: kpi.resultValue ?? null,
            resultUpdatedAt: kpi.resultUpdatedAt ?? null,
            resultUpdatedBy: kpi.resultUpdatedBy ?? null,
          },
          projectionData: [],
          extendedBy: body.resultUpdatedBy ?? body.updatedBy ?? 'system',
        });
      }

      if (hasProjectionFields(body)) {
        await insertSubmissionLog({
          ...baseLog,
          logType: 'projection',
          resultData: {},
          projectionData: kpi.projectionValues ?? [],
          extendedBy: body.projectionUpdatedBy ?? body.updatedBy ?? 'system',
        });
      }
    }

    res.json(kpi);
  } catch (err) {
    handleApiError(res, err, 'PATCH /api/kpis/:id failed');
  }
});

app.post('/api/kpis/:id/extend-deadline', async (req, res) => {
  try {
    const { newDeadline, extendedBy } = req.body ?? {};
    if (!newDeadline) return res.status(400).json({ error: 'newDeadline is required' });
    if (!extendedBy) return res.status(400).json({ error: 'extendedBy is required' });

    // 1. Read current state before changing anything
    const kpi = await getKPIById(req.params.id);
    if (!kpi) return res.status(404).json({ error: 'KPI not found' });
    const goal = await getGoalById(kpi.goalId);

    // 2. Snapshot current results/projections into submission_logs
    await insertSubmissionLog({
      entityType: 'kpi',
      entityId: kpi.id,
      entityTitle: kpi.name,
      goalId: kpi.goalId,
      academicYearStart: kpi.academicYearStart,
      resultData: {
        resultType: kpi.resultType ?? null,
        resultValue: kpi.resultValue ?? null,
        resultUpdatedAt: kpi.resultUpdatedAt ?? null,
        resultUpdatedBy: kpi.resultUpdatedBy ?? null,
      },
      projectionData: kpi.projectionValues ?? [],
      submittedBy: kpi.assignedTo ?? null,
      extendedBy,
      cycleDeadline: goal?.endDate ?? kpi.deadline ?? null,
    });

    // 3. Apply the new deadline
    const updated = await extendKPIDeadline(req.params.id, { newDeadline, extendedBy });
    res.json(updated);
  } catch (err) {
    handleApiError(res, err, 'POST /api/kpis/:id/extend-deadline failed');
  }
});

app.get('/api/kpis/:id/history', async (req, res) => {
  try {
    const logs = await getSubmissionLogsByEntity('kpi', req.params.id);
    res.json(logs);
  } catch (err) {
    handleApiError(res, err, 'GET /api/kpis/:id/history failed');
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
    const body = req.body ?? {};
    const isResultOrProjection = hasResultOrProjectionFields(body);

    if (isResultOrProjection) {
      const action = await getActionPlanById(req.params.id);
      if (!action) return res.status(404).json({ error: 'Action plan not found' });
      const goal = await getGoalById(action.goalId);
      const deadline = goal?.endDate ?? action.deadline;
      if (isDeadlinePassed(deadline)) {
        return res.status(423).json({ error: 'Action plan is locked: the goal deadline has passed. An admin must extend the goal deadline to allow edits.' });
      }
    }

    const actionPlan = await updateActionPlan(req.params.id, body);

    // Log result and projection saves as separate entries
    if (isResultOrProjection) {
      const goal = await getGoalById(actionPlan.goalId);
      const cycleDeadline = goal?.endDate ?? actionPlan.deadline ?? null;
      const baseLog = {
        entityType: 'action_plan',
        entityId: actionPlan.id,
        entityTitle: actionPlan.title,
        goalId: actionPlan.goalId,
        academicYearStart: actionPlan.academicYearStart,
        submittedBy: actionPlan.assignedTo ?? null,
        cycleDeadline,
      };

      if (hasResultFields(body)) {
        await insertSubmissionLog({
          ...baseLog,
          logType: 'result',
          resultData: {
            resultType: actionPlan.resultType ?? null,
            resultValue: actionPlan.resultValue ?? null,
            resultUpdatedAt: actionPlan.resultUpdatedAt ?? null,
            resultUpdatedBy: actionPlan.resultUpdatedBy ?? null,
          },
          projectionData: [],
          extendedBy: body.resultUpdatedBy ?? body.updatedBy ?? 'system',
        });
      }

      if (hasProjectionFields(body)) {
        await insertSubmissionLog({
          ...baseLog,
          logType: 'projection',
          resultData: {},
          projectionData: actionPlan.projectionValues ?? [],
          extendedBy: body.projectionUpdatedBy ?? body.updatedBy ?? 'system',
        });
      }
    }

    res.json(actionPlan);
  } catch (err) {
    handleApiError(res, err, 'PATCH /api/actions/:id failed');
  }
});

app.post('/api/actions/:id/extend-deadline', async (req, res) => {
  try {
    const { newDeadline, extendedBy } = req.body ?? {};
    if (!newDeadline) return res.status(400).json({ error: 'newDeadline is required' });
    if (!extendedBy) return res.status(400).json({ error: 'extendedBy is required' });

    // 1. Read current state before changing anything
    const action = await getActionPlanById(req.params.id);
    if (!action) return res.status(404).json({ error: 'Action plan not found' });
    const goal = await getGoalById(action.goalId);

    // 2. Snapshot current results/projections into submission_logs
    await insertSubmissionLog({
      entityType: 'action_plan',
      entityId: action.id,
      entityTitle: action.title,
      goalId: action.goalId,
      academicYearStart: action.academicYearStart,
      resultData: {
        resultType: action.resultType ?? null,
        resultValue: action.resultValue ?? null,
        resultUpdatedAt: action.resultUpdatedAt ?? null,
        resultUpdatedBy: action.resultUpdatedBy ?? null,
      },
      projectionData: action.projectionValues ?? [],
      submittedBy: action.assignedTo ?? null,
      extendedBy,
      cycleDeadline: goal?.endDate ?? action.deadline ?? null,
    });

    // 3. Apply the new deadline
    const updated = await extendActionPlanDeadline(req.params.id, { newDeadline, extendedBy });
    res.json(updated);
  } catch (err) {
    handleApiError(res, err, 'POST /api/actions/:id/extend-deadline failed');
  }
});

app.get('/api/actions/:id/history', async (req, res) => {
  try {
    const logs = await getSubmissionLogsByEntity('action_plan', req.params.id);
    res.json(logs);
  } catch (err) {
    handleApiError(res, err, 'GET /api/actions/:id/history failed');
  }
});

app.get('/api/submission-logs', async (req, res) => {
  try {
    const logs = await getAllSubmissionLogs({
      entityType: req.query.entityType ? String(req.query.entityType) : undefined,
      goalId: req.query.goalId ? String(req.query.goalId) : undefined,
      academicYearStart: req.query.academicYearStart
        ? parseOptionalInt(req.query.academicYearStart, 'academicYearStart')
        : undefined,
    });
    res.json(logs);
  } catch (err) {
    handleApiError(res, err, 'GET /api/submission-logs failed');
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

// ─── User Management (admin-only) ─────────────────────────────────────────────

app.get('/api/users', requireAdmin, async (_req, res) => {
  try {
    const users = await getAllAuthorizedUsers();
    res.json(users);
  } catch (err) {
    handleApiError(res, err, 'GET /api/users failed');
  }
});

app.post('/api/users', requireAdmin, async (req, res) => {
  try {
    const user = await createAuthorizedUser(req.body ?? {});
    res.status(201).json(user);
  } catch (err) {
    handleApiError(res, err, 'POST /api/users failed');
  }
});

app.patch('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    const user = await updateAuthorizedUser(Number(req.params.id), req.body ?? {});
    res.json(user);
  } catch (err) {
    handleApiError(res, err, 'PATCH /api/users/:id failed');
  }
});

app.delete('/api/users/:id', requireAdmin, async (req, res) => {
  try {
    await deleteAuthorizedUser(Number(req.params.id));
    res.sendStatus(204);
  } catch (err) {
    handleApiError(res, err, 'DELETE /api/users/:id failed');
  }
});

// ──────────────────────────────────────────────────────────────────────────────

async function start() {
  await initDb();
  await initPlanningDb();
  const bootstrapAdminEmail = process.env.BOOTSTRAP_ADMIN_EMAIL || 'mabeilgaz@gmail.com';
  const bootstrapAdminName = process.env.BOOTSTRAP_ADMIN_NAME || 'Admin';
  await initAuthorizedUsers(bootstrapAdminEmail, bootstrapAdminName);
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
