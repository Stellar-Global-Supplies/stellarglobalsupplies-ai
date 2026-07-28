import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { entPool } from "../lib/db.js";

const router = Router();

// List available tables (read-only)
router.get("/tables", requireAuth, async (req, res) => {
  if (!entPool) return res.status(503).json({ error: "Enterprise DB not configured" });
  try {
    const { rows } = await entPool.query(`
      SELECT table_name, table_schema
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog','information_schema')
        AND table_type = 'BASE TABLE'
      ORDER BY table_schema, table_name
      LIMIT 100
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Preview a table (SELECT only, LIMIT enforced)
router.get("/tables/:schema/:table/preview", requireAuth, async (req, res) => {
  if (!entPool) return res.status(503).json({ error: "Enterprise DB not configured" });

  const { schema, table } = req.params;
  // Validate identifiers to prevent injection
  const idRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!idRegex.test(schema) || !idRegex.test(table)) {
    return res.status(400).json({ error: "Invalid identifier" });
  }

  try {
    const { rows } = await entPool.query(
      `SELECT * FROM "${schema}"."${table}" LIMIT 50`
    );
    res.json({ rows, schema, table });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Execute a read-only query (SELECT only)
router.post("/query", requireAuth, async (req, res) => {
  if (!entPool) return res.status(503).json({ error: "Enterprise DB not configured" });

  const { sql } = req.body;
  if (!sql) return res.status(400).json({ error: "SQL required" });

  // Enforce read-only: reject anything that's not a SELECT/WITH
  const normalized = sql.trim().toUpperCase();
  const allowed = ["SELECT", "WITH", "EXPLAIN"];
  if (!allowed.some((kw) => normalized.startsWith(kw))) {
    return res.status(403).json({ error: "Only SELECT queries are allowed" });
  }

  try {
    const { rows, fields } = await entPool.query(sql);
    const columns = fields.map((f) => f.name);
    res.json({ rows: rows.slice(0, 200), columns, count: rows.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get context summary for LLM
router.get("/context", requireAuth, async (req, res) => {
  if (!entPool) return res.status(503).json({ error: "Enterprise DB not configured" });

  const { table, schema = "public", limit = 10 } = req.query;
  if (!table) return res.status(400).json({ error: "table required" });

  const idRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  if (!idRegex.test(schema) || !idRegex.test(table)) {
    return res.status(400).json({ error: "Invalid identifier" });
  }

  try {
    const { rows } = await entPool.query(
      `SELECT * FROM "${schema}"."${table}" LIMIT $1`,
      [Math.min(parseInt(limit), 50)]
    );
    const context = `Enterprise data from ${schema}.${table}:\n${JSON.stringify(rows, null, 2)}`;
    res.json({ context, rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
