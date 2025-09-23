// backend/server.js
const http = require('http');          // built-in HTTP server
const { Pool } = require('pg');        // Postgres driver

const port = 3000;                     // backend listens on port 3000
let hits = 0;                          // in-memory counter for Prometheus

// Read DB config from environment (injected by docker-compose)
const {
  DB_HOST = 'db',
  DB_PORT = '5432',
  DB_USER = 'appuser',
  DB_PASSWORD = 'apppass',
  DB_NAME = 'appdb',
} = process.env;

const pool = new Pool({
  host: DB_HOST,
  port: Number(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
});

// tiny helper to pause
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Wait until the DB accepts connections (first boot can take a few seconds)
async function waitForDb(retries = 30, delayMs = 500) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query('SELECT 1;');
      return;
    } catch {
      await sleep(delayMs);
    }
  }
  throw new Error('DB not ready after retries');
}

// Prepare the database on startup
async function initDb() {
  // Ensure the DB is ready to accept queries
  await waitForDb();

  await pool.query(`
    CREATE TABLE IF NOT EXISTS hit_counter (
      id SERIAL PRIMARY KEY,
      total BIGINT NOT NULL DEFAULT 0
    );
  `);

  const { rows } = await pool.query('SELECT total FROM hit_counter LIMIT 1;');
  if (rows.length === 0) {
    await pool.query('INSERT INTO hit_counter (total) VALUES (0);');
  }
}

// Helper: increment and read the DB-backed counter
async function incrementAndGet() {
  // Make sure there is at least one row; if not, create it (defensive)
  await pool.query(`
    INSERT INTO hit_counter (id, total)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING;
  `);

  await pool.query('UPDATE hit_counter SET total = total + 1 WHERE id = 1;');
  const { rows } = await pool.query('SELECT total FROM hit_counter WHERE id = 1;');
  return rows[0].total;
}

// Request handler (exported for tests)
function handler(req, res) {
  const path = new URL(req.url, 'http://localhost').pathname;

  // Health check (with 5s delay) + DB ping
  if (path === '/health') {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    setTimeout(async () => {
      try {
        await pool.query('SELECT 1;'); // DB reachable
        res.end('OK\n');
      } catch {
        res.statusCode = 500;
        res.end('DB_ERROR\n');
      }
    }, 5000);
    return;
  }

  // Prometheus metrics (still in-memory counter)
  if (path === '/metrics') {
    hits++;
    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end(
      `# HELP app_requests_total Total requests\n` +
      `# TYPE app_requests_total counter\n` +
      `app_requests_total ${hits}\n`
    );
  }

  // DB-backed counter endpoint
  if (path === '/hits') {
    incrementAndGet()
      .then((total) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ total }));
      })
      .catch((err) => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'DB_ERROR', detail: err.message }));
      });
    return;
  }

  // Default route
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('Backend says hai noroc bade Vasile!\n');
}

// Start server if run directly
if (require.main === module) {
  initDb()
    .then(() => {
      const srv = http.createServer(handler).listen(port, () =>
        console.log(`Backend running on :${port}`)
      );

      // Graceful shutdown (useful in containers)
      const shutdown = () => {
        srv.close(() => {
          pool.end().finally(() => process.exit(0));
        });
      };
      process.on('SIGTERM', shutdown);
      process.on('SIGINT', shutdown);
    })
    .catch((err) => {
      console.error('Failed to init DB:', err);
      process.exit(1);
    });
}

module.exports = { handler, initDb, pool };
