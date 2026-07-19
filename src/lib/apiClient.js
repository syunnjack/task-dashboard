const API_URL=(import.meta.env.VITE_SUKIMA_API_URL||'').replace(/\/$/,'')

async function request(path,{token,method='GET',body}={}){
  if(!API_URL)throw new Error('api_not_configured')
  const response=await fetch(`${API_URL}${path}`,{method,headers:{'content-type':'application/json',...(token?{authorization:`Bearer ${token}`}:{})},body:body?JSON.stringify(body):undefined})
  const data=await response.json()
  if(!response.ok)throw new Error(data.error||'request_failed')
  return data
}

export const apiConfigured=Boolean(API_URL)
export const loginFacility=(facilityId,secret)=>request('/v1/session',{method:'POST',body:{facilityId,secret}})
export const fetchCrowd=(facilityId)=>request(`/v1/crowd?facilityId=${encodeURIComponent(facilityId)}`)
export const postEvent=(token,event)=>request('/v1/events',{token,method:'POST',body:event})
export const postCheckin=(facilityId,zoneId)=>request('/v1/events/checkin',{method:'POST',body:{facilityId,zoneId}})
export const evaluateNotifications=(token)=>request('/v1/notifications/evaluate',{token,method:'POST'})
