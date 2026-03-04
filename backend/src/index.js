import express from 'express';
import { initDb, getGoals, getGoalById, pool } from './db.js';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'backend' });
});

app.get('/api/health/db', async (_req, res) => {
  if (!pool) {
    return res.status(503).json({ status: 'unavailable', message: 'No database configured' });
  }
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    res.status(503).json({ status: 'error', database: 'disconnected', message: err?.message });
  }
});

app.get('/api/goals', async (req, res) => {
  try {
    const academicYearStart = req.query.academicYearStart != null
      ? parseInt(req.query.academicYearStart, 10)
      : null;
    if (academicYearStart != null && Number.isNaN(academicYearStart)) {
      return res.status(400).json({ error: 'academicYearStart must be a number' });
    }
    const goals = await getGoals(academicYearStart);
    res.json(goals);
  } catch (err) {
    console.error('GET /api/goals error:', err);
    res.status(500).json({ error: 'Failed to fetch goals' });
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
    console.error('GET /api/goals/:id error:', err);
    res.status(500).json({ error: 'Failed to fetch goal' });
  }
});

async function start() {
  await initDb();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend listening on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('Startup error:', err);
  process.exit(1);
});
