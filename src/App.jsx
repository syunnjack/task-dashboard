import { useMemo, useState } from 'react'
import './App.css'

const favoritesKey = 'task-dashboard.routeSpotFavorites'
const votesKey = 'task-dashboard.routeSpotVotes'

const categories = ['すべて', 'ゲーム', '喫煙', 'カフェ', '宿', 'レトロ', 'スポーツ', '行政']

const sampleSpots = [
  {
    id: 'osu-game',
    name: '大須レトロゲーム横丁',
    area: '名古屋',
    station: '上前津',
    category: 'ゲーム',
    minutes: 4,
    price: 700,
    rating: 4.4,
    votes: 128,
    wait: 18,
    open: '12:00-23:00',
    features: ['遠征向け', '近くに飲食店', '雨でも歩きやすい'],
    note: 'レトロゲーセン、コンカフェ、漫画喫茶をまとめて回れるモデルケース。',
  },
  {
    id: 'meieki-smoke',
    name: '名駅スマート喫煙スポット',
    area: '名古屋',
    station: '名古屋',
    category: '喫煙',
    minutes: 2,
    price: 0,
    rating: 4.1,
    votes: 84,
    wait: 6,
    open: '07:00-22:00',
    features: ['駅近', '屋内', 'QR案内'],
    note: '猫の目コム風に、混雑と最短導線を見せる想定。',
  },
  {
    id: 'shizuoka-hotel',
    name: '静岡駅前バストイレ別ホテル',
    area: '静岡',
    station: '静岡',
    category: '宿',
    minutes: 7,
    price: 6800,
    rating: 4.2,
    votes: 62,
    wait: 0,
    open: 'チェックイン 15:00',
    features: ['喫煙可', 'バストイレ付', '高速バス連携'],
    note: '高速バス検索の到着地から宿へ誘導する比較枠。',
  },
  {
    id: 'sakae-cafe',
    name: '栄 待ち時間ニュースカフェ',
    area: '名古屋',
    station: '栄',
    category: 'カフェ',
    minutes: 3,
    price: 520,
    rating: 4.0,
    votes: 51,
    wait: 12,
    open: '08:00-21:00',
    features: ['待ち時間向け', '電源', '軽食'],
    note: 'matene風に短時間で読めるニュースやエンタメ導線を置く。',
  },
  {
    id: 'kuwana-bowling',
    name: '桑名ボウリング遠征メモ',
    area: '三重',
    station: '桑名',
    category: 'スポーツ',
    minutes: 9,
    price: 1600,
    rating: 4.3,
    votes: 77,
    wait: 24,
    open: '10:00-24:00',
    features: ['大会情報', 'スコア投稿', '宿リンク'],
    note: 'ランクシーカー風に大会成績、周辺宿、日記投稿をつなぐ。',
  },
  {
    id: 'nakagawa-office',
    name: '中川区 手続き待ち時間案内',
    area: '名古屋',
    station: '高畑',
    category: '行政',
    minutes: 5,
    price: 0,
    rating: 3.8,
    votes: 39,
    wait: 42,
    open: '08:45-17:15',
    features: ['待ち時間', '周辺カフェ', 'QR案内'],
    note: '民間施設にも応用できる、待ち時間から周辺行動へ誘導する枠。',
  },
  {
    id: 'jihanki-route',
    name: '懐かし自販機めぐり',
    area: '愛知',
    station: '岡崎',
    category: 'レトロ',
    minutes: 15,
    price: 300,
    rating: 4.6,
    votes: 144,
    wait: 3,
    open: '24時間',
    features: ['地図アンカー', '写真投稿', '閉店確認'],
    note: '地図スクロールだけでなく、アンカーテキストで素早く探す導線。',
  },
]

const sampleRoutes = [
  { id: 'route-1', from: '名古屋', to: '静岡', type: '高速バス', time: '2時間42分', fare: 2900, comfort: '安い', transfer: 0 },
  { id: 'route-2', from: '名古屋', to: '静岡', type: '新幹線', time: '54分', fare: 5940, comfort: '速い', transfer: 0 },
  { id: 'route-3', from: '栄', to: '高畑', type: '地下鉄', time: '21分', fare: 270, comfort: '駅近', transfer: 1 },
]

const updates = [
  '名古屋駅周辺の喫煙スポットを3件確認。閉鎖情報は要レビュー。',
  '静岡駅前ホテルに「喫煙可」「バストイレ付」フィルターを追加予定。',
  'ゲーセン閉店情報はユーザー投稿と管理者確認の2段階にする。',
]

function readStoredObject(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? {}
  } catch {
    return {}
  }
}

function formatYen(value) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

function App() {
  const [query, setQuery] = useState('名古屋')
  const [category, setCategory] = useState('すべて')
  const [sortBy, setSortBy] = useState('おすすめ')
  const [favorites, setFavorites] = useState(() => readStoredObject(favoritesKey))
  const [extraVotes, setExtraVotes] = useState(() => readStoredObject(votesKey))
  const [routeInput, setRouteInput] = useState({ from: '名古屋', to: '静岡' })
  const [proposal, setProposal] = useState({ name: '', area: '', category: 'ゲーム' })

  const spots = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    const filtered = sampleSpots.filter((spot) => {
      const matchesCategory = category === 'すべて' || spot.category === category
      const haystack = `${spot.name} ${spot.area} ${spot.station} ${spot.features.join(' ')} ${spot.note}`.toLowerCase()
      return matchesCategory && (!normalizedQuery || haystack.includes(normalizedQuery))
    })

    return filtered.sort((a, b) => {
      if (sortBy === '近い順') return a.minutes - b.minutes
      if (sortBy === '安い順') return a.price - b.price
      if (sortBy === '待ち時間短い順') return a.wait - b.wait
      return b.rating + (extraVotes[b.id] ?? 0) * 0.02 - (a.rating + (extraVotes[a.id] ?? 0) * 0.02)
    })
  }, [category, extraVotes, query, sortBy])

  const routeResults = useMemo(
    () =>
      sampleRoutes.filter((route) => {
        const fromMatch = route.from.includes(routeInput.from.trim()) || routeInput.from.trim().includes(route.from)
        const toMatch = route.to.includes(routeInput.to.trim()) || routeInput.to.trim().includes(route.to)
        return fromMatch && toMatch
      }),
    [routeInput],
  )

  const featuredSpot = spots[0] ?? sampleSpots[0]
  const favoriteCount = Object.values(favorites).filter(Boolean).length
  const averageWait = Math.round(spots.reduce((sum, spot) => sum + spot.wait, 0) / Math.max(spots.length, 1))

  const toggleFavorite = (spotId) => {
    setFavorites((current) => {
      const next = { ...current, [spotId]: !current[spotId] }
      localStorage.setItem(favoritesKey, JSON.stringify(next))
      return next
    })
  }

  const addVote = (spotId) => {
    setExtraVotes((current) => {
      const next = { ...current, [spotId]: (current[spotId] ?? 0) + 1 }
      localStorage.setItem(votesKey, JSON.stringify(next))
      return next
    })
  }

  const submitProposal = (event) => {
    event.preventDefault()
    if (!proposal.name.trim() || !proposal.area.trim()) return
    setQuery(proposal.area.trim())
    setCategory(proposal.category)
    setProposal({ name: '', area: '', category: 'ゲーム' })
  }

  return (
    <main className="app-shell">
      <header className="top-bar">
        <div>
          <span className="app-mark">Route Spot Lab</span>
          <h1>移動先で「次に行く場所」まで探せる比較ナビ</h1>
        </div>
        <nav aria-label="主要セクション">
          <a href="#search">検索</a>
          <a href="#routes">経路比較</a>
          <a href="#ranking">投票</a>
        </nav>
      </header>

      <section className="control-surface" id="search">
        <div className="search-panel">
          <label>
            行き先・駅・ジャンル
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例: 名古屋、静岡、喫煙、ゲーム" />
          </label>
          <label>
            カテゴリ
            <select value={category} onChange={(event) => setCategory(event.target.value)}>
              {categories.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
          </label>
          <label>
            並び替え
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
              <option>おすすめ</option>
              <option>近い順</option>
              <option>安い順</option>
              <option>待ち時間短い順</option>
            </select>
          </label>
        </div>

        <div className="summary-strip" aria-label="検索結果サマリー">
          <article>
            <span>掲載候補</span>
            <strong>{spots.length}</strong>
          </article>
          <article>
            <span>平均待ち時間</span>
            <strong>{averageWait}分</strong>
          </article>
          <article>
            <span>保存済み</span>
            <strong>{favoriteCount}</strong>
          </article>
        </div>
      </section>

      <section className="main-grid">
        <div className="result-list" aria-label="スポット検索結果">
          {spots.map((spot) => (
            <article className="spot-card" key={spot.id}>
              <div className="spot-visual" aria-hidden="true">
                <span>{spot.category}</span>
              </div>
              <div className="spot-body">
                <div className="spot-heading">
                  <div>
                    <span className="area-label">{spot.area} / {spot.station}駅</span>
                    <h2>{spot.name}</h2>
                  </div>
                  <button type="button" className={favorites[spot.id] ? 'icon-button active' : 'icon-button'} onClick={() => toggleFavorite(spot.id)} aria-label={`${spot.name}を保存`}>
                    ☆
                  </button>
                </div>
                <p>{spot.note}</p>
                <div className="spot-metrics">
                  <span>徒歩 {spot.minutes}分</span>
                  <span>{spot.price ? formatYen(spot.price) : '無料'}</span>
                  <span>待ち {spot.wait}分</span>
                  <span>評価 {(spot.rating + (extraVotes[spot.id] ?? 0) * 0.02).toFixed(1)}</span>
                </div>
                <div className="tag-row">
                  {spot.features.map((feature) => (
                    <span key={feature}>{feature}</span>
                  ))}
                </div>
                <div className="card-actions">
                  <button type="button" onClick={() => addVote(spot.id)}>投票する</button>
                  <a href={`https://www.google.com/maps/search/${encodeURIComponent(`${spot.area} ${spot.name}`)}`} target="_blank" rel="noreferrer">
                    地図で開く
                  </a>
                </div>
              </div>
            </article>
          ))}
        </div>

        <aside className="side-rail">
          <section className="map-panel" aria-label="周辺導線マップ">
            <div className="route-map">
              <span className="node start">駅</span>
              <span className="line" />
              <span className="node middle">待ち時間</span>
              <span className="line" />
              <span className="node end">{featuredSpot.category}</span>
            </div>
            <h2>{featuredSpot.station}駅からの寄り道候補</h2>
            <p>{featuredSpot.name} は徒歩 {featuredSpot.minutes}分。到着前に混雑、料金、周辺宿リンクをまとめて見せる想定です。</p>
          </section>

          <section className="updates-panel">
            <h2>運営メモ</h2>
            <ul>
              {updates.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>

      <section className="route-section" id="routes">
        <div className="section-heading">
          <span className="app-mark">Route compare</span>
          <h2>乗換・高速バス検索から周辺情報へつなぐ</h2>
        </div>
        <form className="route-form">
          <input value={routeInput.from} onChange={(event) => setRouteInput({ ...routeInput, from: event.target.value })} aria-label="出発地" />
          <input value={routeInput.to} onChange={(event) => setRouteInput({ ...routeInput, to: event.target.value })} aria-label="到着地" />
        </form>
        <div className="route-list">
          {(routeResults.length ? routeResults : sampleRoutes).map((route) => (
            <article key={route.id}>
              <div>
                <span>{route.type}</span>
                <strong>{route.from} → {route.to}</strong>
              </div>
              <p>{route.time} / {formatYen(route.fare)} / 乗換 {route.transfer}回</p>
              <small>{route.comfort}ルート。到着地の宿・カフェ・喫煙所を下に自動表示する設計。</small>
            </article>
          ))}
        </div>
      </section>

      <section className="bottom-grid" id="ranking">
        <article className="ranking-panel">
          <div className="section-heading">
            <span className="app-mark">User voting</span>
            <h2>ユーザー参加型ランキング</h2>
          </div>
          <ol>
            {[...sampleSpots]
              .sort((a, b) => b.votes + (extraVotes[b.id] ?? 0) - (a.votes + (extraVotes[a.id] ?? 0)))
              .slice(0, 5)
              .map((spot) => (
                <li key={spot.id}>
                  <strong>{spot.name}</strong>
                  <span>{spot.votes + (extraVotes[spot.id] ?? 0)}票</span>
                </li>
              ))}
          </ol>
        </article>

        <article className="proposal-panel">
          <div className="section-heading">
            <span className="app-mark">Submit</span>
            <h2>掲載候補をメモする</h2>
          </div>
          <form onSubmit={submitProposal}>
            <input value={proposal.name} onChange={(event) => setProposal({ ...proposal, name: event.target.value })} placeholder="施設名・サイト名" />
            <input value={proposal.area} onChange={(event) => setProposal({ ...proposal, area: event.target.value })} placeholder="地域・駅名" />
            <select value={proposal.category} onChange={(event) => setProposal({ ...proposal, category: event.target.value })}>
              {categories.filter((item) => item !== 'すべて').map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <button type="submit">検索条件へ反映</button>
          </form>
        </article>
      </section>
    </main>
  )
}

export default App
