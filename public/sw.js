const CACHE='sukima-platform-v2'
self.addEventListener('install',(event)=>event.waitUntil(caches.open(CACHE).then((cache)=>cache.addAll(['./','./manifest.webmanifest']))))
self.addEventListener('activate',(event)=>event.waitUntil(caches.keys().then((keys)=>Promise.all(keys.filter((key)=>key!==CACHE).map((key)=>caches.delete(key))))))
self.addEventListener('fetch',(event)=>event.respondWith(fetch(event.request).catch(()=>caches.match(event.request))))
self.addEventListener('push',(event)=>{
  const data=event.data?.json() ?? {title:'空きが出ました',body:'保存した場所が空いています。',url:'/'}
  event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'./favicon.svg',data:{url:data.url}}))
})
self.addEventListener('notificationclick',(event)=>{
  event.notification.close()
  const destination=new URL(event.notification.data?.url??'./',self.registration.scope).href
  event.waitUntil(clients.openWindow(destination))
})
