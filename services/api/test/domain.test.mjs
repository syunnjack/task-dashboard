import test from 'node:test'
import assert from 'node:assert/strict'
import { openDatabase } from '../db.mjs'
import { addEvent,createSession,evaluateNotifications,seedFacility,snapshot,subscribe } from '../domain.mjs'

function setup(){const db=openDatabase(':memory:');seedFacility(db);return db}

test('facility session rejects incorrect secret and accepts correct secret',()=>{
  const db=setup();assert.equal(createSession(db,'demo-sauna','wrong'),null)
  assert.equal(createSession(db,'demo-sauna','demo-change-me').facility.id,'demo-sauna')
})

test('first-party events change zone score and confidence',()=>{
  const db=setup();const zone=db.prepare('SELECT id FROM zones WHERE facility_id=? LIMIT 1').get('demo-sauna')
  const before=snapshot(db,'demo-sauna').find((item)=>item.id===zone.id)
  addEvent(db,{facilityId:'demo-sauna',zoneId:zone.id,type:'staff',value:90,source:'test'})
  addEvent(db,{facilityId:'demo-sauna',zoneId:zone.id,type:'sensor',value:80,source:'test'})
  const after=snapshot(db,'demo-sauna').find((item)=>item.id===zone.id)
  assert.ok(after.score>before.score);assert.ok(after.confidence>before.confidence)
})

test('notification job is created when score is below threshold',()=>{
  const db=setup();const zone=db.prepare('SELECT id FROM zones WHERE facility_id=? LIMIT 1').get('demo-sauna')
  subscribe(db,{facilityId:'demo-sauna',zoneId:zone.id,endpoint:'https://push.example/1',subscription:{endpoint:'https://push.example/1'},threshold:100})
  const jobs=evaluateNotifications(db,'demo-sauna')
  assert.equal(jobs.length,1);assert.equal(jobs[0].payload.url.includes('demo-sauna'),true)
})
