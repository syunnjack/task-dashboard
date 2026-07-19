const SESSION_KEY='sukima.analytics.session'

function sessionId(){
  let value=sessionStorage.getItem(SESSION_KEY)
  if(!value){value=crypto.randomUUID();sessionStorage.setItem(SESSION_KEY,value)}
  return value
}

export function createAnalytics({apiUrl,facilityId='demo-sauna',projectKey,brand='default',app='web',hasConsent=()=>false}){
  const endpoint=`${apiUrl.replace(/\/$/,'')}/v1/analytics/events`
  const track=(eventName,{page=location.pathname,properties={},revenue=0,currency='JPY'}={})=>{
    if(!hasConsent())return false
    const payload=JSON.stringify({facilityId,projectKey,brand,app,sessionId:sessionId(),eventName,page,properties,revenue,currency})
    if(navigator.sendBeacon)return navigator.sendBeacon(endpoint,new Blob([payload],{type:'application/json'}))
    fetch(endpoint,{method:'POST',headers:{'content-type':'application/json'},body:payload,keepalive:true}).catch(()=>{})
    return true
  }
  const start=()=>{track('session_started');track('page_view')}
  return {start,track}
}
