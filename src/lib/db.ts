import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "data", "prompt-experiments.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    const fs = require("fs");
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
    migrate(db);
  }
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS prompts (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS prompt_versions (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      parent_version_id TEXT,
      version_number INTEGER NOT NULL,
      strategy TEXT NOT NULL DEFAULT 'manual',
      content TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE,
      FOREIGN KEY (parent_version_id) REFERENCES prompt_versions(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS experiments (
      id TEXT PRIMARY KEY,
      prompt_id TEXT NOT NULL,
      title TEXT NOT NULL,
      input_data TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (prompt_id) REFERENCES prompts(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS experiment_results (
      id TEXT PRIMARY KEY,
      experiment_id TEXT NOT NULL,
      version_id TEXT NOT NULL,
      output TEXT NOT NULL,
      hyv_processed INTEGER NOT NULL DEFAULT 0,
      rank INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (experiment_id) REFERENCES experiments(id) ON DELETE CASCADE,
      FOREIGN KEY (version_id) REFERENCES prompt_versions(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS hyv_profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_prompt_versions_prompt_id ON prompt_versions(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_experiments_prompt_id ON experiments(prompt_id);
    CREATE INDEX IF NOT EXISTS idx_experiment_results_experiment_id ON experiment_results(experiment_id);
    CREATE INDEX IF NOT EXISTS idx_experiment_results_version_id ON experiment_results(version_id);
  `);
}

export function createPrompt(title: string, description: string): string {
  const { v4: uuid } = require("uuid") as typeof import("uuid");
  const id = uuid();
  const d = getDb();
  d.prepare("INSERT INTO prompts (id, title, description) VALUES (?, ?, ?)").run(id, title, description);
  return id;
}

export function getPrompt(id: string) {
  return getDb().prepare("SELECT * FROM prompts WHERE id = ?").get(id) as any;
}

export function getAllPrompts() {
  return getDb()
    .prepare(
      `SELECT p.*, 
        (SELECT COUNT(*) FROM prompt_versions WHERE prompt_id = p.id) as version_count,
        (SELECT COUNT(*) FROM experiments WHERE prompt_id = p.id) as experiment_count
       FROM prompts p ORDER BY p.created_at DESC`
    )
    .all();
}

export function createPromptVersion(
  promptId: string,
  content: string,
  parentVersionId: string | null,
  strategy: string = "manual"
): string {
  const { v4: uuid } = require("uuid") as typeof import("uuid");
  const id = uuid();
  const d = getDb();
  const verCount = d
    .prepare("SELECT COUNT(*) as cnt FROM prompt_versions WHERE prompt_id = ?")
    .get(promptId) as any;
  const versionNumber = (verCount?.cnt || 0) + 1;
  d.prepare(
    "INSERT INTO prompt_versions (id, prompt_id, parent_version_id, version_number, strategy, content) VALUES (?, ?, ?, ?, ?, ?)"
  ).run(id, promptId, parentVersionId, versionNumber, strategy, content);
  return id;
}

export function getVersionTree(promptId: string) {
  const versions = getDb()
    .prepare(
      `SELECT pv.*, 
        (SELECT COUNT(*) FROM experiment_results WHERE version_id = pv.id AND rank = 1) as wins
       FROM prompt_versions pv WHERE pv.prompt_id = ? ORDER BY pv.version_number ASC`
    )
    .all(promptId) as any[];

  return versions;
}

export function createExperiment(promptId: string, title: string, inputData: string): string {
  const { v4: uuid } = require("uuid") as typeof import("uuid");
  const id = uuid();
  getDb()
    .prepare("INSERT INTO experiments (id, prompt_id, title, input_data) VALUES (?, ?, ?, ?)")
    .run(id, promptId, title, inputData);
  return id;
}

export function addExperimentResult(
  experimentId: string,
  versionId: string,
  output: string,
  hyvProcessed: boolean
): string {
  const { v4: uuid } = require("uuid") as typeof import("uuid");
  const id = uuid();
  getDb()
    .prepare(
      "INSERT INTO experiment_results (id, experiment_id, version_id, output, hyv_processed) VALUES (?, ?, ?, ?, ?)"
    )
    .run(id, experimentId, versionId, output, hyvProcessed ? 1 : 0);
  return id;
}

export function rankResult(resultId: string, rank: number) {
  getDb().prepare("UPDATE experiment_results SET rank = ? WHERE id = ?").run(rank, resultId);
}

export function getExperiment(id: string) {
  const exp = getDb().prepare("SELECT * FROM experiments WHERE id = ?").get(id) as any;
  if (!exp) return null;
  const results = getDb()
    .prepare(
      `SELECT er.*, pv.content as version_content, pv.strategy, pv.version_number
       FROM experiment_results er
       JOIN prompt_versions pv ON er.version_id = pv.id
       WHERE er.experiment_id = ?
       ORDER BY er.rank ASC NULLS LAST, pv.version_number ASC`
    )
    .all(id);
  return { ...exp, results };
}

export function getPromptExperiments(promptId: string) {
  return getDb()
    .prepare("SELECT * FROM experiments WHERE prompt_id = ? ORDER BY created_at DESC")
    .all(promptId);
}

export function getLeaderboard(promptId: string) {
  return getDb()
    .prepare(
      `SELECT pv.id, pv.version_number, pv.strategy, pv.created_at,
        COUNT(CASE WHEN er.rank = 1 THEN 1 END) as wins,
        COUNT(CASE WHEN er.rank = 2 THEN 1 END) as second_place,
        COUNT(CASE WHEN er.rank = 3 THEN 1 END) as third_place,
        COUNT(er.id) as total_experiments
       FROM prompt_versions pv
       LEFT JOIN experiment_results er ON er.version_id = pv.id
       WHERE pv.prompt_id = ?
       GROUP BY pv.id
       ORDER BY wins DESC, total_experiments DESC`
    )
    .all(promptId);
}

export function getGlobalLeaderboard() {
  return getDb()
    .prepare(
      `SELECT pv.id, pv.version_number, pv.strategy, p.title as prompt_title,
        COUNT(CASE WHEN er.rank = 1 THEN 1 END) as wins,
        COUNT(er.id) as total_experiments
       FROM prompt_versions pv
       JOIN prompts p ON p.id = pv.prompt_id
       LEFT JOIN experiment_results er ON er.version_id = pv.id
       GROUP BY pv.id
       HAVING total_experiments > 0
       ORDER BY wins DESC
       LIMIT 20`
    )
    .all();
}

export function addHyvProfile(name: string): string {
  const { v4: uuid } = require("uuid") as typeof import("uuid");
  const id = uuid();
  const existing = getDb().prepare("SELECT id FROM hyv_profiles WHERE name = ?").get(name);
  if (existing) return (existing as any).id;
  getDb().prepare("INSERT INTO hyv_profiles (id, name) VALUES (?, ?)").run(id, name);
  return id;
}

export function getHyvProfiles() {
  return getDb().prepare("SELECT * FROM hyv_profiles ORDER BY name ASC").all();
}
