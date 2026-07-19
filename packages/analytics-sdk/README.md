# @sukima/analytics

全GitHubリポジトリのWeb/PWAへ組み込む最小計測SDK。利用者が分析へ同意した場合だけ送信する。

```js
import { createAnalytics } from '@sukima/analytics'

const analytics=createAnalytics({
  apiUrl:import.meta.env.VITE_SUKIMA_API_URL,
  projectKey:'owner/repository',
  brand:'product-name',
  app:'web',
  hasConsent:()=>localStorage.getItem('analytics-consent')==='granted',
})

analytics.start()
analytics.track('offer_impression',{properties:{placement:'travel-checklist'}})
analytics.track('affiliate_click',{properties:{placement:'travel-checklist'}})
analytics.track('conversion',{revenue:2400})
```

許可されていないイベント名・属性は収集API側で拒否または除外される。
