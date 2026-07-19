import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'

const API_URL=(process.env.EXPO_PUBLIC_SUKIMA_API_URL||'').replace(/\/$/,'')

export async function registerExpoPush({facilityId='demo-sauna',threshold=40,offers=false}={}){
  if(!API_URL)throw new Error('api_not_configured')
  const permission=await Notifications.requestPermissionsAsync()
  if(!permission.granted)throw new Error('permission_denied')
  const projectId=process.env.EXPO_PUBLIC_EAS_PROJECT_ID||Constants.expoConfig?.extra?.eas?.projectId
  if(!projectId)throw new Error('project_id_not_configured')
  const token=(await Notifications.getExpoPushTokenAsync({projectId})).data
  const response=await fetch(`${API_URL}/v1/subscriptions`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({facilityId,endpoint:token,subscription:{platform:'expo',token},threshold,offers})})
  const data=await response.json()
  if(!response.ok)throw new Error(data.error||'request_failed')
  return data
}
