import { createServer } from 'node:http'
import { openDatabase } from './db.mjs'
import { acceptInvite,addEvent,analyticsSummary,authenticate,createInvite,createSession,evaluateNotifications,recordAnalyticsEvent,seedFacility,snapshot,subscribe } from './domain.mjs'
import { rateLimit } from './rate-limit.mjs'

const db=openDatabase()
seedFacility(db,{secret:process.env.SUKIMA_ADMIN_SECRET||'demo-change-me'})
const port=Number(process.env.PORT||8787)
const origin=process.env.ALLOWED_ORIGIN||'http://localhost:5173'

function send(response,status,data){
  response.writeHead(status,{'content-type':'application/json; charset=utf-8','access-control-allow-origin':origin,'access-control-allow-headers':'content-type,authorization','access-control-allow-methods':'GET,POST,OPTIONS','cache-control':'no-store'})
  response.end(JSON.stringify(data))
}

async function body(request){
  const chunks=[];let size=0
  for await(const chunk of request){size+=chunk.length;if(size>64_000)throw new Error('body_too_large');chunks.push(chunk)}
  return chunks.length?JSON.parse(Buffer.concat(chunks).toString('utf8')):{}
}

const server=createServer(async(request,response)=>{
  if(request.method==='OPTIONS')return send(response,204,{})
  const url=new URL(request.url,'http://localhost')
  try{
    if(request.method==='GET'&&url.pathname==='/health')return send(response,200,{ok:true,service:'sukima-api'})
    if(request.method==='GET'&&url.pathname==='/v1/push/public-key')return send(response,200,{publicKey:process.env.VAPID_PUBLIC_KEY||null})
    if(request.method==='POST'&&url.pathname==='/v1/session'){
      const rate=rateLimit(`login:${request.socket.remoteAddress}`,{limit:8,windowMs:15*60_000})
      if(!rate.allowed)return send(response,429,{error:'too_many_attempts',retryAfter:rate.retryAfter})
      const input=await body(request);const session=createSession(db,input.facilityId,input.secret)
      return send(response,session?200:401,session??{error:'invalid_credentials'})
    }
    if(request.method==='POST'&&url.pathname==='/v1/invites/accept'){
      const rate=rateLimit(`invite:${request.socket.remoteAddress}`,{limit:10,windowMs:60*60_000})
      if(!rate.allowed)return send(response,429,{error:'invite_rate_limited',retryAfter:rate.retryAfter})
      const input=await body(request);return send(response,201,acceptInvite(db,input.inviteToken,input.name))
    }
    if(request.method==='GET'&&url.pathname==='/v1/crowd'){
      const facilityId=url.searchParams.get('facilityId')||'demo-sauna'
      return send(response,200,{facilityId,generatedAt:new Date().toISOString(),zones:snapshot(db,facilityId)})
    }
    if(request.method==='POST'&&url.pathname==='/v1/events/checkin'){
      const rate=rateLimit(`checkin:${request.socket.remoteAddress}`,{limit:6,windowMs:60*60_000})
      if(!rate.allowed)return send(response,429,{error:'checkin_rate_limited',retryAfter:rate.retryAfter})
      const input=await body(request);const event=addEvent(db,{facilityId:input.facilityId||'demo-sauna',zoneId:input.zoneId,type:'checkin',value:1,source:request.socket.remoteAddress})
      return send(response,201,{event,crowd:snapshot(db,input.facilityId||'demo-sauna')})
    }
    if(request.method==='POST'&&url.pathname==='/v1/subscriptions'){
      const rate=rateLimit(`subscription:${request.socket.remoteAddress}`,{limit:12,windowMs:60*60_000})
      if(!rate.allowed)return send(response,429,{error:'subscription_rate_limited',retryAfter:rate.retryAfter})
      const input=await body(request);return send(response,201,subscribe(db,input))
    }
    if(request.method==='POST'&&url.pathname==='/v1/analytics/events'){
      const rate=rateLimit(`analytics:${request.socket.remoteAddress}`,{limit:120,windowMs:60*60_000})
      if(!rate.allowed)return send(response,429,{error:'analytics_rate_limited',retryAfter:rate.retryAfter})
      const input=await body(request);return send(response,202,recordAnalyticsEvent(db,input))
    }
    const session=authenticate(db,request.headers.authorization)
    if(!session)return send(response,401,{error:'authentication_required'})
    const {facilityId,role}=session
    if(request.method==='POST'&&url.pathname==='/v1/events'){
      if(role==='viewer')return send(response,403,{error:'editor_role_required'})
      const input=await body(request);const event=addEvent(db,{facilityId,zoneId:input.zoneId,type:input.type,value:Number(input.value),source:'facility'})
      return send(response,201,{event,crowd:snapshot(db,facilityId)})
    }
    if(request.method==='POST'&&url.pathname==='/v1/invites'){
      if(role!=='owner')return send(response,403,{error:'owner_role_required'})
      const input=await body(request);return send(response,201,createInvite(db,facilityId,input.role))
    }
    if(request.method==='POST'&&url.pathname==='/v1/notifications/evaluate'){
      if(role==='viewer')return send(response,403,{error:'editor_role_required'})
      return send(response,200,{dryRun:process.env.PUSH_DRY_RUN!=='false',jobs:evaluateNotifications(db,facilityId)})
    }
    if(request.method==='GET'&&url.pathname==='/v1/analytics/summary')return send(response,200,analyticsSummary(db,facilityId,url.searchParams.get('days')))
    return send(response,404,{error:'not_found'})
  }catch(error){return send(response,error.message==='body_too_large'?413:400,{error:error.message})}
})

server.listen(port,()=>console.log(`SUKIMA API listening on http://localhost:${port}`))
