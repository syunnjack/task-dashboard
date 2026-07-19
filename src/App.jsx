import { useEffect, useMemo, useRef, useState } from 'react'
import './App.css'

const spots = [
  { id: 1, name: '浅草寺・仲見世', area: '浅草', type: '観光', x: 73, y: 27, base: 86, trend: 8, wait: 34, offer: '周辺の体験を予約', partner: '旅の体験', url: 'https://www.jalan.net/kankou/' },
  { id: 2, name: '上野ミュージアム街', area: '上野', type: '観光', x: 58, y: 21, base: 62, trend: -5, wait: 18, offer: '日時指定チケット', partner: 'レジャー予約', url: 'https://www.asoview.com/' },
  { id: 3, name: '東京駅グルメゾーン', area: '丸の内', type: 'グルメ', x: 57, y: 52, base: 78, trend: 3, wait: 26, offer: '近くの空席を探す', partner: '飲食店予約', url: 'https://www.hotpepper.jp/' },
  { id: 4, name: '渋谷スクランブル', area: '渋谷', type: '街歩き', x: 29, y: 70, base: 92, trend: 10, wait: 40, offer: '手荷物預かりを予約', partner: '旅行サービス', url: 'https://cloak.ecbo.io/' },
  { id: 5, name: '清澄白河カフェ街', area: '清澄白河', type: 'グルメ', x: 76, y: 62, base: 38, trend: -4, wait: 8, offer: 'カフェ巡りを見る', partner: '地域ガイド', url: 'https://www.hotpepper.jp/' },
  { id: 6, name: '豊洲ウォーターフロント', area: '豊洲', type: 'ファミリー', x: 70, y: 79, base: 48, trend: 2, wait: 12, offer: '家族向け施設を予約', partner: 'レジャー予約', url: 'https://www.asoview.com/' },
  { id: 7, name: '新宿展望スポット', area: '新宿', type: '観光', x: 25, y: 43, base: 69, trend: -2, wait: 21, offer: '周辺ホテルを比較', partner: '宿泊予約', url: 'https://www.jalan.net/' },
  { id: 8, name: '谷中ぎんざ', area: '谷中', type: '街歩き', x: 48, y: 14, base: 31, trend: 1, wait: 6, offer: 'ローカル散歩を見る', partner: '地域ガイド', url: 'https://www.jalan.net/kankou/' },
]

const filters = ['すべて', '観光', 'グルメ', '街歩き', 'ファミリー']

function level(value) {
  if (value >= 80) return { label: 'かなり混雑', tone: 'danger' }
  if (value >= 60) return { label: '混雑', tone: 'warm' }
  if (value >= 40) return { label: 'やや混雑', tone: 'yellow' }
  return { label: '空いています', tone: 'calm' }
}

function predictedCrowd(spot, hour) {
  const lunch = Math.max(0, 1 - Math.abs(hour - 13) / 5) * (spot.type === 'グルメ' ? 24 : 10)
  const evening = Math.max(0, 1 - Math.abs(hour - 18) / 5) * (spot.type === '街歩き' ? 18 : 8)
  return Math.round(Math.min(99, Math.max(8, spot.base - 14 + lunch + evening)))
}

function HeatMap({ data, selectedId, onSelect }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    const draw = () => {
      const ratio = window.devicePixelRatio || 1
      const box = canvas.getBoundingClientRect()
      canvas.width = box.width * ratio
      canvas.height = box.height * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, box.width, box.height)
      data.forEach((spot) => {
        const x = (spot.x / 100) * box.width
        const y = (spot.y / 100) * box.height
        const radius = 36 + spot.crowd * 0.44
        const gradient = context.createRadialGradient(x, y, 2, x, y, radius)
        const hue = spot.crowd >= 75 ? '241, 76, 76' : spot.crowd >= 50 ? '255, 156, 66' : '71, 193, 145'
        gradient.addColorStop(0, `rgba(${hue}, .7)`)
        gradient.addColorStop(.42, `rgba(${hue}, .28)`)
        gradient.addColorStop(1, `rgba(${hue}, 0)`)
        context.fillStyle = gradient
        context.fillRect(x - radius, y - radius, radius * 2, radius * 2)
      })
    }
    draw()
    const observer = new ResizeObserver(draw)
    observer.observe(canvas)
    return () => observer.disconnect()
  }, [data])

  return (
    <div className="map-stage" aria-label="東京都心の混雑ヒートマップ">
      <div className="map-grid" aria-hidden="true" />
      <div className="river river-one" aria-hidden="true" />
      <div className="river river-two" aria-hidden="true" />
      <span className="map-label label-shinjuku">新宿</span>
      <span className="map-label label-ueno">上野</span>
      <span className="map-label label-tokyo">東京</span>
      <span className="map-label label-shibuya">渋谷</span>
      <span className="map-label label-toyosu">豊洲</span>
      <canvas ref={canvasRef} />
      {data.map((spot) => (
        <button
          className={`map-pin ${selectedId === spot.id ? 'is-selected' : ''}`}
          style={{ left: `${spot.x}%`, top: `${spot.y}%` }}
          onClick={() => onSelect(spot.id)}
          aria-label={`${spot.name}、混雑度${spot.crowd}%`}
          key={spot.id}
        >
          <span>{spot.crowd}</span>
        </button>
      ))}
      <div className="map-legend"><span />空いている <span />混雑 <span />かなり混雑</div>
    </div>
  )
}

function App() {
  const [filter, setFilter] = useState('すべて')
  const [hour, setHour] = useState(new Date().getHours())
  const [selectedId, setSelectedId] = useState(1)

  const data = useMemo(() => spots.map((spot) => ({ ...spot, crowd: predictedCrowd(spot, hour) })), [hour])
  const visible = data.filter((spot) => filter === 'すべて' || spot.type === filter)
  const selected = data.find((spot) => spot.id === selectedId) ?? data[0]
  const alternatives = [...data].filter((spot) => spot.id !== selected.id).sort((a, b) => a.crowd - b.crowd).slice(0, 3)

  const chooseFilter = (value) => {
    setFilter(value)
    const first = data.find((spot) => value === 'すべて' || spot.type === value)
    if (first) setSelectedId(first.id)
  }

  return (
    <main>
      <header className="topbar">
        <a className="brand" href="#top" aria-label="SUKIMA MAP ホーム"><span>◉</span> SUKIMA MAP</a>
        <nav aria-label="メインナビゲーション"><a href="#map">混雑マップ</a><a href="#spots">空いている場所</a><a href="#business">掲載について</a></nav>
        <button className="location-button" type="button" onClick={() => setSelectedId(3)}>現在地付近</button>
      </header>

      <section className="hero" id="top">
        <div>
          <p className="eyebrow">TOKYO LIVE CROWD GUIDE</p>
          <h1>混雑を避けて、<br /><em>いい時間</em>を選ぼう。</h1>
          <p className="lead">観光地・飲食店・レジャー施設の混雑をひと目で比較。空いている代替スポットと、今すぐ使える予約先まで案内します。</p>
          <div className="trust-row"><span>● 5分ごとに推定</span><span>掲載スポット 248</span><span>広告を明記</span></div>
        </div>
        <aside className="now-card">
          <p>東京エリアの現在</p><strong>{Math.round(data.reduce((sum, item) => sum + item.crowd, 0) / data.length)}%</strong><span>平均混雑度</span>
          <div className="pulse-line"><i /><i /><i /><i /><i /><i /></div>
          <small>{hour}:00 の予測値・デモデータ</small>
        </aside>
      </section>

      <section className="map-section" id="map">
        <div className="map-toolbar">
          <div className="filter-tabs" aria-label="カテゴリ絞り込み">{filters.map((item) => <button className={filter === item ? 'active' : ''} onClick={() => chooseFilter(item)} key={item}>{item}</button>)}</div>
          <label>時刻 <strong>{hour}:00</strong><input type="range" min="7" max="23" value={hour} onChange={(event) => setHour(Number(event.target.value))} /></label>
        </div>
        <div className="map-layout">
          <HeatMap data={visible} selectedId={selectedId} onSelect={setSelectedId} />
          <aside className="spot-detail">
            <p className="detail-kicker">選択中のスポット</p>
            <h2>{selected.name}</h2><p>{selected.area} ・ {selected.type}</p>
            <div className={`crowd-score ${level(selected.crowd).tone}`}><strong>{selected.crowd}%</strong><span>{level(selected.crowd).label}<small>待ち時間目安 {selected.wait}分</small></span></div>
            <div className="forecast"><span>この先</span>{[0, 2, 4].map((offset) => <div key={offset}><i style={{ height: `${predictedCrowd(selected, Math.min(23, hour + offset))}%` }} /><small>{hour + offset}:00</small></div>)}</div>
            <a className="primary-cta" href={selected.url} target="_blank" rel="noreferrer sponsored">{selected.offer}<span>→</span></a>
            <small className="ad-note">広告・{selected.partner}へ移動します</small>
          </aside>
        </div>
      </section>

      <section className="alternatives" id="spots">
        <div className="section-title"><div><p className="eyebrow">SMART ALTERNATIVES</p><h2>混雑を避ける、3つの選択肢</h2></div><p>近い体験価値の中から、いま空いている場所を優先しています。</p></div>
        <div className="spot-grid">{alternatives.map((spot, index) => (
          <article key={spot.id} onClick={() => { setSelectedId(spot.id); document.querySelector('#map').scrollIntoView({ behavior: 'smooth' }) }}>
            <div className="rank">0{index + 1}</div><span className={`status ${level(spot.crowd).tone}`}>{level(spot.crowd).label}</span>
            <h3>{spot.name}</h3><p>{spot.area} ・ {spot.type}</p>
            <div className="mini-score"><strong>{spot.crowd}%</strong><span>混雑度</span></div><button type="button">マップで見る →</button>
          </article>
        ))}</div>
      </section>

      <section className="business" id="business">
        <div><p className="eyebrow">FOR LOCAL BUSINESS</p><h2>混雑の「すきま」を、<br />地域の売上に変える。</h2></div>
        <div className="business-copy"><p>空いている時間帯の限定プラン、当日予約、周辺店舗への送客を、混雑データと組み合わせて掲載できます。</p><a href="mailto:hello@sukima-map.example">掲載パートナーに相談する →</a></div>
      </section>

      <footer><a className="brand" href="#top"><span>◉</span> SUKIMA MAP</a><p>混雑予測は統計的な推定値です。実際の状況と異なる場合があります。</p><p>© 2026 SUKIMA MAP</p></footer>
    </main>
  )
}

export default App
