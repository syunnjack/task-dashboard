import { createHash,randomBytes,randomUUID,timingSafeEqual } from 'node:crypto'

export const hash=(value)=>createHash('sha256').update(value).digest('hex')
export const token=()=>randomBytes(32).toString('base64url')
export const safeEqual=(left,right)=>{
  const a=Buffer.from(left);const b=Buffer.from(right)
  return a.length===b.length&&timingSafeEqual(a,b)
}

export function seedFacility(db,{id='demo-sauna',brand='sauna',name='ととのうナビ デモ施設',secret='demo-change-me',zones=['浴室','サウナ室','休憩席']}={}){
  db.prepare('INSERT OR IGNORE INTO facilities(id,brand,name,secret_hash,created_at) VALUES(?,?,?,?,?)').run(id,brand,name,hash(secret),new Date().toISOString())
  for(const name of zones) db.prepare('INSERT OR IGNORE INTO zones(id,facility_id,name,capacity) VALUES(?,?,?,?)').run(`${id}-${hash(name).slice(0,8)}`,id,name,100)
  return db.prepare('SELECT * FROM facilities WHERE id=?').get(id)
}

export function createSession(db,facilityId,secret){
  const facility=db.prepare('SELECT * FROM facilities WHERE id=?').get(facilityId)
  if(!facility)return null
  let role='owner'
  if(!safeEqual(facility.secret_hash,hash(secret))){
    const member=db.prepare('SELECT role FROM facility_members WHERE facility_id=? AND access_hash=?').get(facilityId,hash(secret))
    if(!member)return null
    role=member.role
  }
  const raw=token();const expires=new Date(Date.now()+12*60*60*1000).toISOString()
  db.prepare('INSERT INTO sessions(token_hash,facility_id,expires_at,role) VALUES(?,?,?,?)').run(hash(raw),facilityId,expires,role)
  return {token:raw,expiresAt:expires,role,facility:{id:facility.id,name:facility.name,brand:facility.brand}}
}

export function authenticate(db,header=''){
  const raw=header.startsWith('Bearer ')?header.slice(7):''
  if(!raw)return null
  const session=db.prepare('SELECT facility_id,role FROM sessions WHERE token_hash=? AND expires_at>?').get(hash(raw),new Date().toISOString())
  return session?{facilityId:session.facility_id,role:session.role}:null
}

export function createInvite(db,facilityId,role='viewer'){
  if(!['editor','viewer'].includes(role))throw new Error('invalid_role')
  const raw=token();const expiresAt=new Date(Date.now()+48*60*60*1000).toISOString()
  db.prepare('INSERT INTO facility_invites(token_hash,facility_id,role,expires_at) VALUES(?,?,?,?)').run(hash(raw),facilityId,role,expiresAt)
  return {inviteToken:raw,role,expiresAt}
}

export function acceptInvite(db,inviteToken,name){
  const now=new Date().toISOString()
  const invite=db.prepare('SELECT * FROM facility_invites WHERE token_hash=? AND expires_at>? AND used_at IS NULL').get(hash(inviteToken),now)
  if(!invite||!name?.trim())throw new Error('invalid_invite')
  const accessKey=token();const member={id:randomUUID(),facilityId:invite.facility_id,name:name.trim(),role:invite.role,createdAt:now}
  db.prepare('INSERT INTO facility_members(id,facility_id,name,role,access_hash,created_at) VALUES(?,?,?,?,?,?)').run(member.id,member.facilityId,member.name,member.role,hash(accessKey),member.createdAt)
  db.prepare('UPDATE facility_invites SET used_at=? WHERE token_hash=?').run(now,hash(inviteToken))
  return {...member,accessKey}
}

export function addEvent(db,{facilityId,zoneId,type,value,source}){
  const allowed=new Set(['staff','checkin','queue','sensor'])
  if(!allowed.has(type)||!Number.isFinite(value)||value<0||value>100) throw new Error('invalid_event')
  const zone=db.prepare('SELECT id FROM zones WHERE id=? AND facility_id=?').get(zoneId,facilityId)
  if(!zone) throw new Error('zone_not_found')
  const event={id:randomUUID(),facilityId,zoneId,type,value,createdAt:new Date().toISOString()}
  db.prepare('INSERT INTO crowd_events(id,facility_id,zone_id,type,value,source_hash,created_at) VALUES(?,?,?,?,?,?,?)').run(event.id,facilityId,zoneId,type,value,source?hash(source):null,event.createdAt)
  return event
}

export function snapshot(db,facilityId){
  const zones=db.prepare('SELECT * FROM zones WHERE facility_id=? ORDER BY name').all(facilityId)
  const since=new Date(Date.now()-2*60*60*1000).toISOString()
  return zones.map((zone)=>{
    const events=db.prepare('SELECT type,value,created_at FROM crowd_events WHERE zone_id=? AND created_at>=? ORDER BY created_at').all(zone.id,since)
    const staff=events.filter((item)=>item.type==='staff').at(-1)
    const sensor=events.filter((item)=>item.type==='sensor').at(-1)
    const queue=events.filter((item)=>item.type==='queue').at(-1)
    const checkins=events.filter((item)=>item.type==='checkin').length
    const signals=[{value:45,weight:.2,source:'通常予測'}]
    if(staff)signals.push({value:staff.value,weight:.25,source:'施設更新'})
    if(sensor)signals.push({value:sensor.value,weight:.35,source:'匿名センサー'})
    if(queue)signals.push({value:Math.min(100,queue.value*8),weight:.15,source:`待ち${queue.value}組`})
    if(checkins)signals.push({value:Math.min(100,checkins*12),weight:.2,source:`チェックイン${checkins}件`})
    const weight=signals.reduce((sum,item)=>sum+item.weight,0)
    const score=Math.round(signals.reduce((sum,item)=>sum+item.value*item.weight,0)/weight)
    const confidence=Math.round((.45+Math.min(1,(signals.length-1)/3)*.45)*100)
    return {id:zone.id,name:zone.name,capacity:zone.capacity,score,confidence,sources:signals.map((item)=>item.source),sampleCount:events.length}
  })
}

export function subscribe(db,{facilityId,zoneId,endpoint,subscription,threshold=40,offers=false}){
  const id=randomUUID();const createdAt=new Date().toISOString()
  db.prepare(`INSERT INTO notification_subscriptions(id,facility_id,zone_id,endpoint,subscription_json,threshold,offers,created_at) VALUES(?,?,?,?,?,?,?,?) ON CONFLICT(endpoint) DO UPDATE SET zone_id=excluded.zone_id,subscription_json=excluded.subscription_json,threshold=excluded.threshold,offers=excluded.offers`).run(id,facilityId,zoneId||null,endpoint,JSON.stringify(subscription),threshold,offers?1:0,createdAt)
  return {id,threshold,offers,createdAt}
}

export function evaluateNotifications(db,facilityId){
  const scores=new Map(snapshot(db,facilityId).map((item)=>[item.id,item]))
  const subscriptions=db.prepare('SELECT * FROM notification_subscriptions WHERE facility_id=?').all(facilityId)
  const jobs=[]
  for(const subscription of subscriptions){
    const candidates=subscription.zone_id?[scores.get(subscription.zone_id)]:[...scores.values()]
    const match=candidates.filter(Boolean).sort((a,b)=>a.score-b.score).find((item)=>item.score<=subscription.threshold)
    if(!match)continue
    const recently=subscription.last_notified_at&&Date.now()-new Date(subscription.last_notified_at).getTime()<12*60*60*1000
    if(recently)continue
    const payload={title:`${match.name}が空きました`,body:`現在の混雑度は${match.score}%です。`,url:`/?facility=${facilityId}&zone=${match.id}`}
    const job={id:randomUUID(),subscriptionId:subscription.id,score:match.score,payload,status:'pending',createdAt:new Date().toISOString()}
    db.prepare('INSERT INTO notification_jobs(id,subscription_id,score,payload_json,status,created_at) VALUES(?,?,?,?,?,?)').run(job.id,job.subscriptionId,job.score,JSON.stringify(job.payload),job.status,job.createdAt)
    db.prepare('UPDATE notification_subscriptions SET last_notified_at=? WHERE id=?').run(job.createdAt,subscription.id)
    jobs.push(job)
  }
  return jobs
}
