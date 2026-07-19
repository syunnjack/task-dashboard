import { mkdirSync } from 'node:fs'
import { dirname,resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'

export function openDatabase(path=process.env.SUKIMA_DB_PATH||'./data/sukima.db'){
  const target=path===':memory:'?path:resolve(path)
  if(target!==':memory:') mkdirSync(dirname(target),{recursive:true})
  const db=new DatabaseSync(target)
  db.exec('PRAGMA foreign_keys = ON')
  migrate(db)
  return db
}

function migrate(db){
  const statements=[
    `CREATE TABLE IF NOT EXISTS facilities (id TEXT PRIMARY KEY, brand TEXT NOT NULL, name TEXT NOT NULL, secret_hash TEXT NOT NULL, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS zones (id TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), name TEXT NOT NULL, capacity INTEGER NOT NULL DEFAULT 100, UNIQUE(facility_id,name))`,
    `CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), expires_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS facility_members (id TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), name TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('owner','editor','viewer')), access_hash TEXT NOT NULL UNIQUE, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS facility_invites (token_hash TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), role TEXT NOT NULL CHECK(role IN ('editor','viewer')), expires_at TEXT NOT NULL, used_at TEXT)`,
    `CREATE TABLE IF NOT EXISTS crowd_events (id TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), zone_id TEXT NOT NULL REFERENCES zones(id), type TEXT NOT NULL, value REAL NOT NULL, source_hash TEXT, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS crowd_events_zone_time_idx ON crowd_events(zone_id,created_at)`,
    `CREATE TABLE IF NOT EXISTS notification_subscriptions (id TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), zone_id TEXT REFERENCES zones(id), endpoint TEXT NOT NULL UNIQUE, subscription_json TEXT NOT NULL, threshold INTEGER NOT NULL DEFAULT 40, offers INTEGER NOT NULL DEFAULT 0, last_notified_at TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS notification_jobs (id TEXT PRIMARY KEY, subscription_id TEXT NOT NULL REFERENCES notification_subscriptions(id), score INTEGER NOT NULL, payload_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', attempts INTEGER NOT NULL DEFAULT 0, last_error TEXT, next_attempt_at TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), project_key TEXT NOT NULL DEFAULT 'task-dashboard', brand TEXT NOT NULL, app TEXT NOT NULL, session_hash TEXT NOT NULL, event_name TEXT NOT NULL, page TEXT, properties_json TEXT NOT NULL DEFAULT '{}', revenue REAL NOT NULL DEFAULT 0, currency TEXT NOT NULL DEFAULT 'JPY', occurred_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS analytics_events_facility_time_idx ON analytics_events(facility_id,occurred_at)`,
    `CREATE INDEX IF NOT EXISTS analytics_events_name_time_idx ON analytics_events(event_name,occurred_at)`,
  ]
  for(const statement of statements) db.prepare(statement).run()
  const sessionColumns=db.prepare('PRAGMA table_info(sessions)').all().map((column)=>column.name)
  if(!sessionColumns.includes('role'))db.prepare("ALTER TABLE sessions ADD COLUMN role TEXT NOT NULL DEFAULT 'owner'").run()
  const jobColumns=db.prepare('PRAGMA table_info(notification_jobs)').all().map((column)=>column.name)
  if(!jobColumns.includes('attempts'))db.prepare('ALTER TABLE notification_jobs ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0').run()
  if(!jobColumns.includes('last_error'))db.prepare('ALTER TABLE notification_jobs ADD COLUMN last_error TEXT').run()
  if(!jobColumns.includes('next_attempt_at'))db.prepare('ALTER TABLE notification_jobs ADD COLUMN next_attempt_at TEXT').run()
  const analyticsColumns=db.prepare('PRAGMA table_info(analytics_events)').all().map((column)=>column.name)
  if(!analyticsColumns.includes('project_key'))db.prepare("ALTER TABLE analytics_events ADD COLUMN project_key TEXT NOT NULL DEFAULT 'task-dashboard'").run()
}
