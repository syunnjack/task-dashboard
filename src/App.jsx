import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { getVertical, verticals } from './data/verticals.js'
import OperationsPanel from './components/OperationsPanel.jsx'
import TravelConcierge from './components/TravelConcierge.jsx'
import { readEvents, scoreCrowd } from './lib/crowdStore.js'
import { apiConfigured } from './lib/apiClient.js'
import { registerWebPush } from './lib/pushClient.js'

const baseSpots = [
  { id:1, x:24, y:31, base:82, name:'中央エリア', wait:32 },
  { id:2, x:48, y:22, base:56, name:'北エリア', wait:14 },
  { id:3, x:72, y:35, base:37, name:'東エリア', wait:5 },
  { id:4, x:31, y:69, base:68, name:'西エリア', wait:19 },
  { id:5, x:61, y:64, base:28, name:'南エリア', wait:3 },
  { id:6, x:80, y:76, base:48, name:'別館エリア', wait:10 },
]

function crowdAt(spot, hour) {
  const midday = Math.max(0, 1 - Math.abs(hour - 13) / 5) * 18
  const evening = Math.max(0, 1 - Math.abs(hour - 19) / 4) * 22
  return Math.min(99, Math.max(8, Math.round(spot.base - 16 + midday + evening)))
}

function crowdLabel(score) {
  if (score >= 80) return ['かなり混雑','danger']
  if (score >= 60) return ['混雑','warm']
  if (score >= 40) return ['やや混雑','yellow']
  return ['空いています','calm']
}

function HeatMap({ points, selected, onSelect }) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const draw = () => {
      const box = canvas.getBoundingClientRect()
      const ratio = window.devicePixelRatio || 1
      const ctx = canvas.getContext('2d')
      canvas.width = box.width * ratio
      canvas.height = box.height * ratio
      ctx.setTransform(ratio,0,0,ratio,0,0)
      ctx.clearRect(0,0,box.width,box.height)
      points.forEach((point) => {
        const x = box.width * point.x / 100
        const y = box.height * point.y / 100
        const radius = 34 + point.crowd * .55
        const color = point.crowd >= 75 ? '234,64,64' : point.crowd >= 50 ? '249,144,54' : '45,180,128'
        const gradient = ctx.createRadialGradient(x,y,0,x,y,radius)
        gradient.addColorStop(0,`rgba(${color},.72)`)
        gradient.addColorStop(.48,`rgba(${color},.25)`)
        gradient.addColorStop(1,`rgba(${color},0)`)
        ctx.fillStyle = gradient
        ctx.fillRect(x-radius,y-radius,radius*2,radius*2)
      })
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  },[points])
  return <div className="heat-map">
    <div className="map-lines" aria-hidden="true" /><canvas ref={canvasRef} />
    {points.map((point) => <button key={point.id} className={`heat-pin ${selected === point.id ? 'selected' : ''}`} style={{left:`${point.x}%`,top:`${point.y}%`}} onClick={() => onSelect(point.id)} aria-label={`${point.name} 混雑度${point.crowd}%`}>{point.crowd}</button>)}
    <div className="legend"><i className="calm"/>空き<i className="yellow"/>通常<i className="danger"/>混雑</div>
  </div>
}

function BrandSwitcher({ current, onChange }) {
  const [open,setOpen] = useState(false)
  return <div className="brand-switcher">
    <button className="switcher-button" onClick={() => setOpen(!open)} aria-expanded={open}>30ブランド <span>⌄</span></button>
    {open && <div className="brand-menu">{verticals.map((item) => <button key={item.slug} className={current.slug === item.slug ? 'active' : ''} onClick={() => { onChange(item.slug); setOpen(false) }}><span>{String(item.rank).padStart(2,'0')}</span><b>{item.name}</b><small>{item.category}</small></button>)}</div>}
  </div>
}

function App() {
  const params = new URLSearchParams(window.location.search)
  const [slug,setSlug] = useState(params.get('brand') || 'tourism')
  const [hour,setHour] = useState(Math.min(23,Math.max(7,new Date().getHours())))
  const [selected,setSelected] = useState(1)
  const [notice,setNotice] = useState(() => localStorage.getItem('sukima.notice') === 'on')
  const [noticeMessage,setNoticeMessage] = useState('')
  const [threshold,setThreshold] = useState(40)
  const [crowdEvents,setCrowdEvents] = useState(readEvents)
  const brand = getVertical(slug)
  const points = useMemo(() => {
    return baseSpots.map((spot,index) => {
      const name=brand.zones[index % brand.zones.length]
      const snapshot=scoreCrowd({brand:brand.slug,zone:name,baseline:crowdAt(spot,hour),events:crowdEvents})
      return {...spot,name,crowd:snapshot.score,...snapshot}
    })
  },[brand,hour,crowdEvents])
  const active = points.find((item) => item.id === selected) ?? points[0]
  const alternatives = [...points].filter((item) => item.id !== selected).sort((a,b) => a.crowd-b.crowd).slice(0,3)

  useEffect(() => {
    document.documentElement.style.setProperty('--brand',brand.primary)
    document.documentElement.style.setProperty('--accent',brand.accent)
    document.title = `${brand.name}｜混雑を避けて、いい時間を選ぶ`
    const url = new URL(window.location)
    url.searchParams.set('brand',brand.slug)
    window.history.replaceState({},'',url)
  },[brand])

  const changeBrand = (next) => { setSlug(next); setSelected(1) }
  const enableNotice = async () => {
    try {
      if(apiConfigured)await registerWebPush({facilityId:'demo-sauna',threshold})
      else {
        if (!('Notification' in window)) throw new Error('push_not_supported')
        const permission = await Notification.requestPermission()
        if(permission!=='granted')throw new Error('permission_denied')
        new Notification(`${brand.name}の通知を登録しました`,{body:`混雑度が${threshold}%以下になったらお知らせします。`})
      }
      setNotice(true);setNoticeMessage(apiConfigured?'この端末へ空き通知を配信します。':'デモ通知を登録しました。')
      localStorage.setItem('sukima.notice','on')
    } catch(error) {
      setNotice(false);localStorage.setItem('sukima.notice','off')
      setNoticeMessage(error.message==='push_not_configured'?'通知サーバーの公開鍵が未設定です。':error.message==='permission_denied'?'ブラウザで通知を許可してください。':'この環境では通知を登録できません。')
    }
  }

  return <main>
    <header className="topbar">
      <a className="brand" href="#top"><span>●</span>{brand.name}</a>
      <nav><a href="#concierge">旅支度AI</a><a href="#live">混雑状況</a><a href="#operations">データ入力</a><a href="#notify">空き通知</a></nav>
      <BrandSwitcher current={brand} onChange={changeBrand}/>
    </header>

    <section className="hero" id="top">
      <div><p className="eyebrow">NO EXTERNAL CROWD API · OWN DATA PLATFORM</p><h1>混雑を避けて、<br/><em>いい時間</em>を選ぼう。</h1><p className="lead">{brand.category}の混雑を、施設入力・QRチェックイン・整理券・センサーから可視化。空いた瞬間を通知し、そのまま予約・購入できます。</p><div className="hero-actions"><a href="#live">現在の混雑を見る</a><button onClick={enableNotice}>{notice ? '通知登録済み' : '空いたら通知'}</button></div></div>
      <aside className="brand-card"><p>おすすめ順位</p><strong>#{String(brand.rank).padStart(2,'0')}</strong><h2>{brand.category}</h2><dl><div><dt>ドメイン候補</dt><dd>{brand.domain}</dd></div><div><dt>収益導線</dt><dd>{brand.revenue}</dd></div></dl></aside>
    </section>

    <TravelConcierge />

    <section className="live" id="live">
      <div className="live-toolbar"><div><p className="eyebrow">LIVE DENSITY</p><h2>{brand.name} 混雑ヒートマップ</h2></div><label>時刻 <strong>{hour}:00</strong><input type="range" min="7" max="23" value={hour} onChange={(e) => setHour(Number(e.target.value))}/></label></div>
      <div className="live-layout"><HeatMap points={points} selected={selected} onSelect={setSelected}/><aside className="detail"><p>選択中</p><h3>{active.name}</h3><div className={`score ${crowdLabel(active.crowd)[1]}`}><strong>{active.crowd}%</strong><span>{crowdLabel(active.crowd)[0]}<small>待ち時間目安 {active.wait}分</small></span></div><div className="confidence"><div><span>信頼度</span><strong>{active.confidence}%</strong></div><div className="confidence-track"><i style={{width:`${active.confidence}%`}}/></div><small>{active.sources.join('・')} / サンプル {active.sampleCount}件</small></div><div className="bars">{[0,2,4,6].map((offset) => <div key={offset}><i style={{height:`${crowdAt(active,Math.min(23,hour+offset))}%`}}/><small>{Math.min(23,hour+offset)}時</small></div>)}</div><a href="#offer" className="primary-cta">{brand.cta}<span>→</span></a><small className="ad-label">広告・提携先へ移動します</small></aside></div>
    </section>

    <OperationsPanel brand={brand} zones={brand.zones} onUpdated={()=>setCrowdEvents(readEvents())} initialMode={params.get('checkin')==='1'?'visitor':'facility'}/>

    <section className="notification-section" id="notify"><div><p className="eyebrow">SMART ALERT</p><h2>空いた瞬間だけ、<br/>お知らせ。</h2><p>通知条件は端末に保存します。外部の混雑APIや個人の移動履歴は使用しません。</p>{noticeMessage&&<p role="status">{noticeMessage}</p>}</div><div className="notification-card"><label>通知する混雑度 <strong>{threshold}%以下</strong><input type="range" min="20" max="70" step="10" value={threshold} onChange={(e) => setThreshold(Number(e.target.value))}/></label><label className="check"><input type="checkbox" defaultChecked/>近くの空いている代替候補も通知</label><label className="check"><input type="checkbox"/>限定クーポンを受け取る</label><button onClick={enableNotice}>{notice ? '通知条件を更新' : 'この条件で通知を登録'}</button></div></section>

    <section className="alternatives"><p className="eyebrow">AVAILABLE NOW</p><h2>いま空いている選択肢</h2><div className="spot-grid">{alternatives.map((spot,index) => <article key={spot.id} onClick={() => {setSelected(spot.id);document.querySelector('#live').scrollIntoView({behavior:'smooth'})}}><span>0{index+1}</span><b className={crowdLabel(spot.crowd)[1]}>{crowdLabel(spot.crowd)[0]}</b><h3>{spot.name}</h3><div><strong>{spot.crowd}%</strong><small>混雑度</small></div><button>詳しく見る →</button></article>)}</div></section>

    <section className="brand-catalog" id="brands"><div className="section-heading"><div><p className="eyebrow">ONE PLATFORM, 30 BRANDS</p><h2>30ジャンルを共通基盤で展開</h2></div><p>各カードを選ぶと、このサイト全体がそのジャンル専用サービスへ切り替わります。</p></div><div className="catalog-grid">{verticals.map((item) => <button key={item.slug} onClick={() => {changeBrand(item.slug);window.scrollTo({top:0,behavior:'smooth'})}} style={{'--tile':item.primary}}><span>{String(item.rank).padStart(2,'0')}</span><div><b>{item.name}</b><small>{item.category}</small></div><i>→</i></button>)}</div></section>

    <section className="business" id="offer"><div><p className="eyebrow">BUSINESS MODEL</p><h2>空いている時間を、<br/>売上に変える。</h2></div><div><p>施設向け月額、通知配信、予約成果報酬を組み合わせます。広告と自然順位を分離し、混雑情報の取得時刻と信頼度を明示します。</p><a href={`mailto:hello@${brand.domain}`}>掲載パートナーに相談 →</a></div></section>
    <footer><a className="brand" href="#top"><span>●</span>{brand.name}</a><p>混雑情報は推定値を含みます。実際の状況と異なる場合があります。</p><p>© 2026 SUKIMA PLATFORM</p></footer>
  </main>
}

export default App
