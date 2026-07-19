import { getPushPublicKey,savePushSubscription } from './apiClient.js'

function decodeKey(value){
  const padding='='.repeat((4-value.length%4)%4)
  const raw=atob((value+padding).replace(/-/g,'+').replace(/_/g,'/'))
  return Uint8Array.from([...raw].map((char)=>char.charCodeAt(0)))
}

export async function registerWebPush({facilityId='demo-sauna',zoneId,threshold=40,offers=false}={}){
  if(!('serviceWorker' in navigator)||!('PushManager' in window)||!('Notification' in window))throw new Error('push_not_supported')
  const permission=await Notification.requestPermission()
  if(permission!=='granted')throw new Error('permission_denied')
  const {publicKey}=await getPushPublicKey()
  if(!publicKey)throw new Error('push_not_configured')
  const registration=await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`)
  await navigator.serviceWorker.ready
  let subscription=await registration.pushManager.getSubscription()
  if(!subscription)subscription=await registration.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:decodeKey(publicKey)})
  await savePushSubscription({facilityId,zoneId,endpoint:subscription.endpoint,subscription:subscription.toJSON(),threshold,offers})
  return subscription
}
