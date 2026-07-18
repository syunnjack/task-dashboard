import { useMemo, useState } from 'react'
import './App.css'

const favoriteKey = 'task-dashboard.tripFavorites'
const reviewKey = 'task-dashboard.tripReviews'
const alertKey = 'task-dashboard.tripAlerts'

const categories = ['すべて', '休憩・仮眠', 'シャワー・入浴', '荷物預かり', '電源・Wi-Fi', '早朝ごはん']

const spots = [
  {
    id: 'nagoya-spa',
    city: '名古屋',
    station: '名古屋駅',
    category: 'シャワー・入浴',
    name: '駅西リフレッシュスパ',
    summary: '夜行バス到着後に使いやすい、シャワーと身支度スペースのある休憩施設。',
    walk: 6,
    price: 980,
    hours: '6:00〜翌1:00',
    openHour: 6,
    rating: 4.4,
    reviews: 126,
    verified: '2026-07-12',
    tags: ['女性専用エリア', 'ヘアアイロン', '大型荷物'],
    tone: 'coral',
  },
  {
    id: 'nagoya-locker',
    city: '名古屋',
    station: '名古屋駅',
    category: '荷物預かり',
    name: '名駅スマートクローク',
    summary: '予約できる有人クローク。コインロッカーに入らないスーツケースにも対応。',
    walk: 3,
    price: 700,
    hours: '7:00〜23:00',
    openHour: 7,
    rating: 4.6,
    reviews: 88,
    verified: '2026-07-16',
    tags: ['予約可', '大型荷物', '当日利用'],
    tone: 'blue',
  },
  {
    id: 'nagoya-cafe',
    city: '名古屋',
    station: '名古屋駅',
    category: '電源・Wi-Fi',
    name: '朝活ラウンジ ミッドランド前',
    summary: '静かな作業席と高速Wi-Fi。到着後の予定整理やオンライン会議にも。',
    walk: 5,
    price: 600,
    hours: '6:30〜21:00',
    openHour: 6.5,
    rating: 4.2,
    reviews: 64,
    verified: '2026-07-10',
    tags: ['全席電源', 'Wi-Fi実測', '女性一人利用'],
    tone: 'green',
  },
  {
    id: 'tokyo-nap',
    city: '東京',
    station: '新宿駅',
    category: '休憩・仮眠',
    name: '新宿バスタ前 ナップラウンジ',
    summary: 'リクライニング席を時間単位で利用。早朝の休憩と充電に向いた施設。',
    walk: 4,
    price: 1200,
    hours: '24時間',
    openHour: 0,
    rating: 4.1,
    reviews: 214,
    verified: '2026-07-15',
    tags: ['24時間', '女性専用席', '充電'],
    tone: 'purple',
  },
  {
    id: 'osaka-breakfast',
    city: '大阪',
    station: '大阪駅',
    category: '早朝ごはん',
    name: 'うめきた朝ごはん食堂',
    summary: '朝6時から温かい定食。バス到着口から屋根のあるルートで移動できる。',
    walk: 7,
    price: 780,
    hours: '6:00〜14:00',
    openHour: 6,
    rating: 4.5,
    reviews: 173,
    verified: '2026-07-14',
    tags: ['朝6時', '一人席', 'キャリー可'],
    tone: 'yellow',
  },
  {
    id: 'fukuoka-bath',
    city: '福岡',
    station: '博多駅',
    category: 'シャワー・入浴',
    name: '博多あさ風呂ステーション',
    summary: 'タオル付きで手ぶら利用可能。駅から近く、朝の身支度に必要な設備を集約。',
    walk: 8,
    price: 1100,
    hours: '5:30〜24:00',
    openHour: 5.5,
    rating: 4.3,
    reviews: 97,
    verified: '2026-07-11',
    tags: ['タオル付き', 'メイク台', '大型荷物'],
    tone: 'aqua',
  },
]

const revenueLinks = [
  { label: '今夜のホテルを比較', note: '空室と料金をまとめて確認', icon: '泊', href: 'https://travel.rakuten.co.jp/' },
  { label: '高速バスを探す', note: '到着時刻から便を比較', icon: 'バ', href: 'https://travel.rakuten.co.jp/bus/' },
  { label: '旅先の通信を準備', note: 'eSIM・Wi-Fiの候補を見る', icon: '通', href: 'https://search.rakuten.co.jp/search/mall/eSIM/' },
]

function readStorage(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback
  } catch {
    return fallback
  }
}

function App() {
  const [city, setCity] = useState('名古屋')
  const [arrival, setArrival] = useState('06:30')
  const [category, setCategory] = useState('すべて')
  const [query, setQuery] = useState('')
  const [favorites, setFavorites] = useState(() => readStorage(favoriteKey, {}))
  const [reviews, setReviews] = useState(() => readStorage(reviewKey, []))
  const [alerts, setAlerts] = useState(() => readStorage(alertKey, []))
  const [reviewForm, setReviewForm] = useState({ spot: '駅西リフレッシュスパ', status: '営業していた', note: '' })
  const [alertForm, setAlertForm] = useState({ email: '', topic: '名古屋駅の新着・変更' })
  const [message, setMessage] = useState('')

  const results = useMemo(() => {
    const term = query.trim().toLowerCase()
    return spots
      .filter((spot) => spot.city === city)
      .filter((spot) => category === 'すべて' || spot.category === category)
      .filter((spot) => !term || `${spot.name} ${spot.category} ${spot.tags.join(' ')}`.toLowerCase().includes(term))
      .sort((a, b) => a.walk - b.walk)
  }, [category, city, query])

  const toggleFavorite = (id) => {
    setFavorites((current) => {
      const next = { ...current, [id]: !current[id] }
      localStorage.setItem(favoriteKey, JSON.stringify(next))
      return next
    })
  }

  const submitReview = (event) => {
    event.preventDefault()
    if (!reviewForm.note.trim()) return
    const next = [{ ...reviewForm, id: Date.now(), createdAt: new Date().toLocaleDateString('ja-JP') }, ...reviews]
    setReviews(next)
    localStorage.setItem(reviewKey, JSON.stringify(next))
    setReviewForm((current) => ({ ...current, note: '' }))
    setMessage('現地情報を受け付けました。公開前に内容を確認します。')
  }

  const submitAlert = (event) => {
    event.preventDefault()
    if (!alertForm.email.includes('@')) return
    const next = [...alerts, { ...alertForm, id: Date.now() }]
    setAlerts(next)
    localStorage.setItem(alertKey, JSON.stringify(next))
    setAlertForm((current) => ({ ...current, email: '' }))
    setMessage('通知条件をこの端末に保存しました。MVPではメールは送信されません。')
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="遠征ラクナビ ホーム">
          <span className="brand-mark">R</span>
          <span><strong>遠征ラクナビ</strong><small>ARRIVAL SUPPORT</small></span>
        </a>
        <nav aria-label="メインナビゲーション">
          <a href="#spots">施設を探す</a>
          <a href="#voices">現地レポート</a>
          <a href="#alerts">通知</a>
        </nav>
        <a className="header-save" href="#saved">保存済み <b>{Object.values(favorites).filter(Boolean).length}</b></a>
      </header>

      <main id="top">
        <section className="hero">
          <div className="hero-copy">
            <p className="eyebrow"><span>●</span> 夜行バス・ライブ遠征の到着後をスムーズに</p>
            <h1>着いた。でも、<br/><em>次の予定までどうする？</em></h1>
            <p className="hero-lead">到着地と時刻から、シャワー、仮眠、荷物預かり、電源スポットをまとめて比較。現地の最新レポートで「今使える」が分かります。</p>
            <div className="trust-row">
              <span>✓ 更新日の見える情報</span><span>✓ 現地UGC</span><span>✓ 料金・設備を比較</span>
            </div>
          </div>
          <div className="route-card" aria-label="到着後のモデルプラン">
            <div className="route-card-head"><span>6:30 名古屋駅 到着</span><b>モデルプラン</b></div>
            <ol>
              <li><time>6:40</time><span><b>荷物を預ける</b><small>徒歩3分・予約可</small></span></li>
              <li><time>7:00</time><span><b>シャワー＆身支度</b><small>女性専用エリアあり</small></span></li>
              <li><time>8:20</time><span><b>電源カフェで準備</b><small>Wi-Fi実測レポートあり</small></span></li>
            </ol>
            <p>次の予定まで <strong>2時間50分</strong> を快適に</p>
          </div>
        </section>

        <section className="search-dock" aria-label="施設検索">
          <label><span>到着地</span><select value={city} onChange={(e) => setCity(e.target.value)}><option>名古屋</option><option>東京</option><option>大阪</option><option>福岡</option></select></label>
          <label><span>到着時刻</span><input type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} /></label>
          <label className="keyword"><span>目的・設備</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="例：女性専用、電源、大型荷物" /></label>
          <a className="search-button" href="#spots">この条件で探す <span>→</span></a>
        </section>

        <section className="section" id="spots">
          <div className="section-title-row">
            <div><p className="eyebrow">SPOT FINDER</p><h2>{city}の到着後スポット</h2><p>{arrival}到着を想定したデモ情報です。来店前に公式情報をご確認ください。</p></div>
            <span className="result-count">{results.length}件</span>
          </div>
          <div className="category-tabs" role="group" aria-label="カテゴリー">
            {categories.map((item) => <button className={item === category ? 'active' : ''} type="button" key={item} onClick={() => setCategory(item)}>{item}</button>)}
          </div>
          <div className="spot-grid">
            {results.map((spot) => (
              <article className="spot-card" key={spot.id}>
                <div className={`spot-visual ${spot.tone}`}><span>{spot.category}</span><b>{spot.station}<br/>徒歩 {spot.walk}分</b><small>情報確認 {spot.verified}</small></div>
                <div className="spot-content">
                  <div className="spot-top"><div><p>{spot.station}・{spot.hours}</p><h3>{spot.name}</h3></div><button type="button" className={favorites[spot.id] ? 'favorite active' : 'favorite'} onClick={() => toggleFavorite(spot.id)} aria-label={`${spot.name}を保存`}>{favorites[spot.id] ? '★' : '☆'}</button></div>
                  <p>{spot.summary}</p>
                  <div className="rating"><strong>★ {spot.rating}</strong><span>現地レポート {spot.reviews + reviews.filter((item) => item.spot === spot.name).length}件</span><b>目安 ¥{spot.price.toLocaleString()}</b></div>
                  <div className="tag-list">{spot.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                  <div className="spot-actions"><a href={`https://www.google.com/maps/search/${encodeURIComponent(`${spot.station} ${spot.name}`)}`} target="_blank" rel="noreferrer">地図で確認</a><button type="button" onClick={() => { setReviewForm((current) => ({ ...current, spot: spot.name })); document.querySelector('#voices')?.scrollIntoView({ behavior: 'smooth' }) }}>現地情報を投稿</button></div>
                </div>
              </article>
            ))}
          </div>
          {!results.length && <div className="empty-state"><b>条件に合うスポットがまだありません</b><p>カテゴリーを「すべて」に戻すか、現地情報を投稿してください。</p></div>}
        </section>

        <section className="revenue-strip" aria-label="予約・比較サービス">
          <div><p className="eyebrow">TRIP READY</p><h2>移動と宿泊も、まとめて準備</h2><small>一部リンクは提携サービスへの広告リンクです。</small></div>
          <div className="revenue-links">{revenueLinks.map((item) => <a key={item.label} href={item.href} target="_blank" rel="sponsored nofollow noreferrer"><span>{item.icon}</span><b>{item.label}<small>{item.note}</small></b><i>↗</i></a>)}</div>
        </section>

        <section className="community-grid" id="voices">
          <div className="community-copy">
            <p className="eyebrow">LOCAL VOICES</p><h2>あなたの「今」が、<br/>次の遠征者を助けます。</h2>
            <p>営業時間、混雑、設備など、現地で分かった小さな情報を共有してください。投稿は内容確認後の公開を想定しています。</p>
            <div className="voice-stats"><div><strong>{reviews.length}</strong><span>この端末からの投稿</span></div><div><strong>3分</strong><span>投稿の目安</span></div></div>
          </div>
          <form className="report-form" onSubmit={submitReview}>
            <h3>現地レポートを送る</h3>
            <label>施設<select value={reviewForm.spot} onChange={(e) => setReviewForm({ ...reviewForm, spot: e.target.value })}>{spots.map((spot) => <option key={spot.id}>{spot.name}</option>)}</select></label>
            <label>確認できたこと<select value={reviewForm.status} onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}><option>営業していた</option><option>混雑していた</option><option>空いていた</option><option>設備情報が違った</option><option>休業・閉店していた</option></select></label>
            <label>ひとこと<textarea required value={reviewForm.note} onChange={(e) => setReviewForm({ ...reviewForm, note: e.target.value })} placeholder="例：6時45分ごろ、女性用メイク台は待ちなしでした。" /></label>
            <button type="submit">確認用レポートを送信</button>
            <small>個人情報、誹謗中傷、宣伝投稿は送信しないでください。</small>
          </form>
        </section>

        <section className="alert-section" id="alerts">
          <div><span className="alert-icon">!</span><p className="eyebrow">SMART ALERT</p><h2>変更を見逃さない。</h2><p>お気に入り地域の新着、営業時間変更、値下がり情報を受け取る通知機能のMVPです。</p></div>
          <form onSubmit={submitAlert}>
            <label>通知テーマ<select value={alertForm.topic} onChange={(e) => setAlertForm({ ...alertForm, topic: e.target.value })}><option>名古屋駅の新着・変更</option><option>ホテルの値下がり</option><option>高速バスの空席</option><option>推し活・イベント遠征情報</option></select></label>
            <label>メールアドレス<input type="email" required value={alertForm.email} onChange={(e) => setAlertForm({ ...alertForm, email: e.target.value })} placeholder="you@example.com" /></label>
            <button type="submit">通知条件を保存</button>
            <small>保存済み条件：{alerts.length}件。このMVPでは外部送信しません。</small>
          </form>
        </section>

        <section className="editorial-note">
          <b>情報の信頼性について</b><p>掲載施設・料金・口コミはMVP用のサンプルです。本公開版では公式情報、確認日、ユーザー投稿、訂正履歴を分けて表示し、広告掲載の有無が通常の評価順位に影響しない設計とします。</p>
        </section>
      </main>

      {message && <button className="toast" type="button" onClick={() => setMessage('')}>{message}<span>×</span></button>}
      <footer><a className="brand" href="#top"><span className="brand-mark">R</span><span><strong>遠征ラクナビ</strong><small>ARRIVAL SUPPORT</small></span></a><p>到着後の困ったを、みんなの情報でラクにする。</p><div><a href="#spots">施設検索</a><a href="#voices">投稿ガイド</a><a href="#alerts">通知設定</a><a href="#top">広告・運営方針</a></div><small>© 2026 遠征ラクナビ / MVP prototype</small></footer>
    </div>
  )
}

export default App
