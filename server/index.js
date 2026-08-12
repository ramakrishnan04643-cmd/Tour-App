import express from "express";
import cors from "cors";
import pkg from "pg";

const { Pool } = pkg;

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Add it in the Render dashboard (Environment tab).");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Render's managed Postgres requires SSL; rejectUnauthorized:false avoids
  // needing to bundle Render's CA cert for this simple setup.
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : false,
});

async function init() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS kv_store (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT now()
    );
  `);
  console.log("Database ready.");
}
init().catch((err) => console.error("Failed to set up database:", err));

// Simple shared key-value store. This mirrors the shape of the
// window.storage API the frontend originally used inside Claude.
// It only ever stores "shared" data — data every visitor sees.

app.get("/api/storage/:key", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM kv_store WHERE key = $1", [req.params.key]);
    if (rows.length === 0) return res.status(404).json({ error: "not found" });
    res.json({ key: req.params.key, value: rows[0].value });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.put("/api/storage/:key", async (req, res) => {
  try {
    const { value } = req.body;
    if (typeof value !== "string") return res.status(400).json({ error: "value must be a string" });
    await pool.query(
      `INSERT INTO kv_store (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [req.params.key, value]
    );
    res.json({ key: req.params.key, value, ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.delete("/api/storage/:key", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM kv_store WHERE key = $1", [req.params.key]);
    res.json({ key: req.params.key, deleted: result.rowCount > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/api/storage", async (req, res) => {
  try {
    const prefix = req.query.prefix || "";
    const { rows } = await pool.query("SELECT key FROM kv_store WHERE key LIKE $1 ORDER BY key", [prefix + "%"]);
    res.json({ keys: rows.map((r) => r.key), prefix });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "server error" });
  }
});

app.get("/", (req, res) => res.send("Tour Ledger API is running."));

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Tour Ledger API listening on port ${port}`));
