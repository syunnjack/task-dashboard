import webpush from 'web-push'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { openDatabase } from './db.mjs'

const db=openDatabase()
const dryRun=process.env.PUSH_DRY_RUN!=='false'
const vapidReady=Boolean(process.env.VAPID_PUBLIC_KEY&&process.env.VAPID_PRIVATE_KEY&&process.env.VAPID_SUBJECT)
if(vapidReady)webpush.setVapidDetails(process.env.VAPID_SUBJECT,process.env.VAPID_PUBLIC_KEY,process.env.VAPID_PRIVATE_KEY)

async function sendExpo(token,payload){
  const response=await fetch('https://exp.host/--/api/v2/push/send',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({to:token,title:payload.title,body:payload.body,data:{url:payload.url}})})
  if(!response.ok)throw new Error(`expo_${response.status}`)
}

async function sendJob(row){
  const subscription=JSON.parse(row.subscription_json);const payload=JSON.parse(row.payload_json)
  if(dryRun)return 'dry-run'
  if(subscription.platform==='expo')return sendExpo(subscription.token,payload)
  if(!vapidReady)throw new Error('vapid_not_configured')
  return webpush.sendNotification(subscription,JSON.stringify(payload),{TTL:300,urgency:'normal'})
}

export async function runBatch(limit=50){
  const now=new Date().toISOString()
  const jobs=db.prepare(`SELECT j.*,s.subscription_json FROM notification_jobs j JOIN notification_subscriptions s ON s.id=j.subscription_id WHERE j.status IN ('pending','retry') AND (j.next_attempt_at IS NULL OR j.next_attempt_at<=?) ORDER BY j.created_at LIMIT ?`).all(now,limit)
  const result={sent:0,retried:0,failed:0,dryRun}
  for(const job of jobs){
    try{
      await sendJob(job)
      db.prepare("UPDATE notification_jobs SET status=?,attempts=attempts+1,last_error=NULL WHERE id=?").run(dryRun?'dry-run':'sent',job.id);result.sent+=1
    }catch(error){
      const attempts=job.attempts+1;const terminal=attempts>=4||[404,410].includes(error.statusCode);const delay=Math.min(60,2**attempts)*60_000
      db.prepare('UPDATE notification_jobs SET status=?,attempts=?,last_error=?,next_attempt_at=? WHERE id=?').run(terminal?'failed':'retry',attempts,String(error.message).slice(0,300),terminal?null:new Date(Date.now()+delay).toISOString(),job.id)
      if(terminal)result.failed+=1
      else result.retried+=1
    }
  }
  return result
}

const isEntry=process.argv[1]&&fileURLToPath(import.meta.url)===resolve(process.argv[1])
if(isEntry)runBatch().then((result)=>console.log(JSON.stringify(result))).catch((error)=>{console.error(error);process.exitCode=1})
