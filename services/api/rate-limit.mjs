import { createHash } from 'node:crypto'
const buckets=new Map()
export function rateLimit(key,{limit=10,windowMs=60_000}={}){
  const now=Date.now();const safeKey=createHash('sha256').update(key||'unknown').digest('hex');const bucket=buckets.get(safeKey)
  if(!bucket||bucket.resetAt<=now){buckets.set(safeKey,{count:1,resetAt:now+windowMs});return {allowed:true,remaining:limit-1}}
  bucket.count+=1
  return {allowed:bucket.count<=limit,remaining:Math.max(0,limit-bucket.count),retryAfter:Math.ceil((bucket.resetAt-now)/1000)}
}
