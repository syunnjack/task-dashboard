const STORAGE_KEY='sukima.crowd-events.v1'

export const EVENT_TYPES={STAFF:'staff',CHECKIN:'checkin',QUEUE:'queue',SENSOR:'sensor'}

export function readEvents(){
  try{return JSON.parse(localStorage.getItem(STORAGE_KEY)??'[]')}catch{return []}
}

export function addCrowdEvent(event){
  const next=[...readEvents(),{id:crypto.randomUUID(),createdAt:new Date().toISOString(),...event}].slice(-500)
  localStorage.setItem(STORAGE_KEY,JSON.stringify(next))
  window.dispatchEvent(new CustomEvent('sukima:crowd-update',{detail:event}))
  return next
}

export function eventsFor(brand,zone,events=readEvents()){
  return events.filter((event)=>event.brand===brand&&event.zone===zone)
}

export function scoreCrowd({brand,zone,baseline,events=readEvents()}){
  const now=Date.now()
  const recent=eventsFor(brand,zone,events).filter((event)=>now-new Date(event.createdAt).getTime()<2*60*60*1000)
  const staff=recent.filter((event)=>event.type===EVENT_TYPES.STAFF).at(-1)
  const checkins=recent.filter((event)=>event.type===EVENT_TYPES.CHECKIN&&now-new Date(event.createdAt).getTime()<90*60*1000).length
  const queue=recent.filter((event)=>event.type===EVENT_TYPES.QUEUE).at(-1)
  const sensor=recent.filter((event)=>event.type===EVENT_TYPES.SENSOR).at(-1)
  const signals=[{value:baseline,weight:.2,source:'通常予測'}]
  if(staff) signals.push({value:staff.value,weight:.25,source:'施設更新'})
  if(checkins) signals.push({value:Math.min(100,checkins*12),weight:.2,source:`チェックイン${checkins}件`})
  if(queue) signals.push({value:Math.min(100,queue.value*8),weight:.15,source:`待ち${queue.value}組`})
  if(sensor) signals.push({value:sensor.value,weight:.35,source:'匿名センサー'})
  const total=signals.reduce((sum,item)=>sum+item.weight,0)
  const score=Math.round(signals.reduce((sum,item)=>sum+item.value*item.weight,0)/total)
  const lastUpdate=recent.length?recent.map((event)=>new Date(event.createdAt).getTime()).sort((a,b)=>b-a)[0]:null
  const freshness=lastUpdate?Math.max(0,1-(now-lastUpdate)/(2*60*60*1000)):0
  const sourceCoverage=Math.min(1,(signals.length-1)/3)
  const confidence=Math.round((.45+freshness*.3+sourceCoverage*.25)*100)
  return {score,confidence,lastUpdate,sources:signals.map((item)=>item.source),sampleCount:recent.length}
}

export function clearDemoEvents(){
  localStorage.removeItem(STORAGE_KEY)
  window.dispatchEvent(new CustomEvent('sukima:crowd-update'))
}
