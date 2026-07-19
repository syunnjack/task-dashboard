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
    `CREATE TABLE IF NOT EXISTS crowd_events (id TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), zone_id TEXT NOT NULL REFERENCES zones(id), type TEXT NOT NULL, value REAL NOT NULL, source_hash TEXT, created_at TEXT NOT NULL)`,
    `CREATE INDEX IF NOT EXISTS crowd_events_zone_time_idx ON crowd_events(zone_id,created_at)`,
    `CREATE TABLE IF NOT EXISTS notification_subscriptions (id TEXT PRIMARY KEY, facility_id TEXT NOT NULL REFERENCES facilities(id), zone_id TEXT REFERENCES zones(id), endpoint TEXT NOT NULL UNIQUE, subscription_json TEXT NOT NULL, threshold INTEGER NOT NULL DEFAULT 40, offers INTEGER NOT NULL DEFAULT 0, last_notified_at TEXT, created_at TEXT NOT NULL)`,
    `CREATE TABLE IF NOT EXISTS notification_jobs (id TEXT PRIMARY KEY, subscription_id TEXT NOT NULL REFERENCES notification_subscriptions(id), score INTEGER NOT NULL, payload_json TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL)`,
  ]
  for(const statement of statements) db.prepare(statement).run()
}
