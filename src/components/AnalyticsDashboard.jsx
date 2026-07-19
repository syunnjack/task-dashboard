import { useState } from 'react'
import { apiConfigured,fetchAnalyticsSummary,loginFacility } from '../lib/apiClient.js'
import './AnalyticsDashboard.css'

const sample={sessions:18420,views:52780,impressions:22640,clicks:1947,ctr:8.6,conversions:164,revenue:428600,conversionRate:8.4,revenuePerSession:23,funnel:[{label:'閲覧',value:52780},{label:'AI準備開始',value:12140},{label:'AI準備完了',value:7360},{label:'広告クリック',value:1947},{label:'成果',value:164}],recommendations:['AI準備完了後のホテル候補を出発日順に並べる','CTRが低い旅行用品枠を通信診断の下へ移動する','台湾チア記事の通知登録CTAをA/Bテストする'],byProject:[{project:'task-dashboard',views:12840,impressions:5210,clicks:782,conversions:71,revenue:168400},{project:'oshi-route-web',views:10920,impressions:4890,clicks:514,conversions:43,revenue:124800},{project:'korea-cheer-guide',views:8340,impressions:3760,clicks:297,conversions:26,revenue:76800},{project:'taiwan-gourmet-map',views:6920,impressions:2910,clicks:221,conversions:17,revenue:39700},{project:'cosme-trip-app',views:5110,impressions:1840,clicks:133,conversions:7,revenue:18900}]}

const yen=(value)=>new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(value)
const number=(value)=>new Intl.NumberFormat('ja-JP').format(value)

export default function AnalyticsDashboard(){
  const [data,setData]=useState(sample);const [days,setDays]=useState(30);const [facilityId,setFacilityId]=useState('demo-sauna');const [secret,setSecret]=useState('');const [message,setMessage]=useState(apiConfigured?'APIへログインすると実測値へ切り替わります。':'サンプル集計を表示しています。')
  const load=async()=>{try{const session=await loginFacility(facilityId,secret);const summary=await fetchAnalyticsSummary(session.token,days);setData({...sample,...summary});setMessage(`実測値を表示中：${session.facility.name}`)}catch(error){setMessage(`集計の取得に失敗しました：${error.message}`)}}
  const max=Math.max(...data.funnel.map((item)=>item.value),1)
  return <section className="insight" id="insight">
    <div className="insight-heading"><div><p className="eyebrow">SUKIMA INSIGHT</p><h2>公開したすべてを、<br/>数字で育てる。</h2></div><div><p>GitHub全リポジトリ、Web、PWA、アプリ、30ブランドを横断し、アクセスから売上まで同じKPIで比較します。</p><div className="insight-controls"><select value={days} onChange={(event)=>setDays(Number(event.target.value))} aria-label="集計期間"><option value="7">7日</option><option value="30">30日</option><option value="90">90日</option></select>{apiConfigured&&<><input value={facilityId} onChange={(event)=>setFacilityId(event.target.value)} aria-label="施設ID"/><input type="password" value={secret} onChange={(event)=>setSecret(event.target.value)} placeholder="アクセスキー" aria-label="アクセスキー"/><button onClick={load}>実測値を取得</button></>}</div><small role="status">{message}</small></div></div>
    <div className="kpi-grid">
      <article><span>アクセス数</span><strong>{number(data.sessions)}</strong><small>匿名セッション</small></article>
      <article><span>ページ表示</span><strong>{number(data.views)}</strong><small>PV</small></article>
      <article><span>CTR</span><strong>{data.ctr}%</strong><small>{number(data.clicks)} / {number(data.impressions)}表示</small></article>
      <article><span>CVR</span><strong>{data.conversionRate}%</strong><small>{number(data.conversions)}成果</small></article>
      <article><span>推定売上</span><strong>{yen(data.revenue)}</strong><small>承認前を含む</small></article>
      <article><span>セッション収益</span><strong>{yen(data.revenuePerSession)}</strong><small>RPS</small></article>
    </div>
    <div className="insight-layout">
      <div className="funnel-panel"><div className="panel-title"><div><span>CONVERSION FUNNEL</span><h3>どこで離脱しているか</h3></div><small>{days}日間</small></div><div className="funnel-bars">{data.funnel.map((item,index)=><div key={item.label}><span>{item.label}</span><div><i style={{width:`${Math.max(2,item.value/max*100)}%`}}/></div><strong>{number(item.value)}</strong>{index>0&&<small>{data.funnel[index-1].value?Math.round(item.value/data.funnel[index-1].value*100):0}%</small>}</div>)}</div></div>
      <aside className="improvement-panel"><span>IMPROVEMENT QUEUE</span><h3>次に直す3項目</h3><ol>{data.recommendations.slice(0,3).map((item,index)=><li key={item}><b>0{index+1}</b><p>{item}</p></li>)}</ol><button onClick={()=>setMessage('改善実験の作成機能は次フェーズで有効になります。')}>改善実験を作成</button></aside>
    </div>
    <div className="repo-panel"><div className="panel-title"><div><span>ALL GITHUB REPOSITORIES</span><h3>リポジトリ別パフォーマンス</h3></div><small>GitHub Appで追加・移管・削除を自動同期</small></div><div className="repo-table"><div className="repo-row header"><span>リポジトリ</span><span>PV</span><span>CTR</span><span>成果</span><span>売上</span></div>{data.byProject.map((repo)=><div className="repo-row" key={repo.project}><strong>{repo.project}</strong><span>{number(repo.views)}</span><span>{repo.impressions?Math.round(repo.clicks/repo.impressions*1000)/10:0}%</span><span>{number(repo.conversions)}</span><span>{yen(repo.revenue)}</span></div>)}</div></div>
    <div className="sell-panel"><div><p className="eyebrow">SELL AS SaaS</p><h3>自社で実証し、顧客へ販売。</h3><p>顧客ごとにデータを分離し、プロジェクト数と月間イベント数で課金します。</p></div><div className="plan-cards"><article><b>Starter</b><span>3プロジェクト</span><small>基本KPI・週次レポート</small></article><article><b>Growth</b><span>30プロジェクト</span><small>収益・実験・通知分析</small></article><article><b>Agency</b><span>複数顧客</span><small>権限・ホワイトラベル</small></article></div></div>
  </section>
}
