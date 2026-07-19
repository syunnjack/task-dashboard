import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { addCrowdEvent, clearDemoEvents, EVENT_TYPES } from '../lib/crowdStore.js'

export default function OperationsPanel({brand,zones,onUpdated,initialMode='facility'}){
  const [mode,setMode]=useState(initialMode)
  const [zone,setZone]=useState(zones[0])
  const [queue,setQueue]=useState(3)
  const [message,setMessage]=useState('')
  const [qr,setQr]=useState('')
  const checkinUrl=useMemo(()=>{
    const url=new URL(window.location)
    url.searchParams.set('brand',brand.slug)
    url.searchParams.set('checkin','1')
    url.searchParams.set('zone',zone)
    return url.toString()
  },[brand,zone])

  useEffect(()=>{QRCode.toDataURL(checkinUrl,{width:220,margin:1,color:{dark:'#17211d',light:'#ffffff'}}).then(setQr)},[checkinUrl])

  const record=(type,value,label)=>{
    addCrowdEvent({brand:brand.slug,zone,type,value})
    setMessage(`${zone}を「${label}」として更新しました`)
    onUpdated()
  }
  const checkin=()=>record(EVENT_TYPES.CHECKIN,1,'現地チェックイン')
  const reset=()=>{clearDemoEvents();setMessage('端末内のデモデータを消去しました');onUpdated()}

  return <section className="operations" id="operations">
    <div className="operations-heading"><div><p className="eyebrow">OWN DATA OPERATIONS</p><h2>混雑データを、自分たちで作る。</h2><p>施設入力・現地QR・整理券・匿名センサーを同じ混雑スコアへ統合します。このデモの記録は端末内だけに保存されます。</p></div><div className="mode-tabs"><button className={mode==='facility'?'active':''} onClick={()=>setMode('facility')}>施設管理</button><button className={mode==='visitor'?'active':''} onClick={()=>setMode('visitor')}>来場者</button><button className={mode==='sensor'?'active':''} onClick={()=>setMode('sensor')}>センサー</button></div></div>
    <div className="operations-grid">
      <aside className="zone-list"><p>更新するゾーン</p>{zones.map((item)=><button key={item} className={zone===item?'active':''} onClick={()=>setZone(item)}><span>{item.slice(0,1)}</span>{item}</button>)}</aside>
      {mode==='facility'&&<div className="operation-card"><p className="card-label">スタッフ簡単更新</p><h3>{zone}の現在</h3><div className="staff-buttons"><button onClick={()=>record(EVENT_TYPES.STAFF,25,'空いている')}><i className="calm"/>空いている<small>0〜40%</small></button><button onClick={()=>record(EVENT_TYPES.STAFF,58,'普通')}><i className="yellow"/>普通<small>41〜70%</small></button><button onClick={()=>record(EVENT_TYPES.STAFF,88,'混雑')}><i className="danger"/>混雑<small>71〜100%</small></button></div><div className="queue-input"><label>待ち組数<input type="number" min="0" max="50" value={queue} onChange={(event)=>setQueue(Number(event.target.value))}/></label><button onClick={()=>record(EVENT_TYPES.QUEUE,queue,`待ち${queue}組`)}>整理券状況を反映</button></div></div>}
      {mode==='visitor'&&<div className="operation-card visitor-card"><div><p className="card-label">現地QRチェックイン</p><h3>{zone}</h3><p>施設に掲示したQRを読み取ると、現地にいる利用者から匿名の混雑サンプルを収集できます。</p><button className="checkin-button" onClick={checkin}>この端末でチェックイン</button></div>{qr&&<img src={qr} alt={`${zone}チェックイン用QRコード`}/>}</div>}
      {mode==='sensor'&&<div className="operation-card"><p className="card-label">匿名センサーデモ</p><h3>現在人数だけを記録</h3><p>映像や端末IDは保存せず、入口カウンターなどが算出した収容率だけを送る設計です。</p><div className="sensor-buttons">{[20,45,70,90].map((value)=><button key={value} onClick={()=>record(EVENT_TYPES.SENSOR,value,`収容率${value}%`)}>{value}%</button>)}</div></div>}
      <aside className="operation-log"><p>更新結果</p><div className={message?'has-message':''}>{message||'操作すると、ヒートマップと信頼度が即座に更新されます。'}</div><button onClick={reset}>デモデータをリセット</button></aside>
    </div>
  </section>
}
