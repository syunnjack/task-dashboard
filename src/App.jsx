import './App.css'

const featuredCreators = [
  {
    name: '作品タイトルから探す',
    role: 'title / maker / label',
    tag: '#作品名 #品番 #メーカー',
    tone: 'coral',
  },
  {
    name: '特徴タグで絞る',
    role: 'scene / costume / genre',
    tag: '#衣装 #髪型 #ジャンル',
    tone: 'mint',
  },
  {
    name: '公式リンクを確認',
    role: 'profile / SNS / store',
    tag: '#公式SNS #配信ページ',
    tone: 'sky',
  },
]

const categories = ['作品名', '品番', 'メーカー', '出演者', 'ジャンル', '配信サイト']

const faqItems = [
  {
    question: '作品名や品番だけで出演女優名を探せますか？',
    answer: '公開されている作品ページ、メーカー情報、販売サイトのクレジットをもとに候補を整理します。',
  },
  {
    question: '名前が違う、別名義がある場合はどうなりますか？',
    answer: '別名義、旧名義、SNS名をプロフィールに紐づけ、ユーザー投稿で補完できる設計にします。',
  },
  {
    question: 'ユーザー投稿はすぐ掲載されますか？',
    answer: '誤情報を防ぐため、投稿は証拠URLとあわせて受け付け、運営確認後に反映します。',
  },
]

function App() {
  return (
    <main className="site-shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Public creator discovery</p>
          <h1>この子だれ？</h1>
          <p className="lead">
            気になった出演女優の名前を、作品名・品番・メーカー・ジャンル・公開クレジットから探せる
            女優名検索サイト。
          </p>
          <div className="search-panel" aria-label="クリエイター検索">
            <input type="search" placeholder="作品名、品番、メーカー、特徴タグで検索" />
            <button type="button">探す</button>
          </div>
          <div className="quick-tags" aria-label="人気タグ">
            {categories.map((category) => (
              <a href="#creators" key={category}>{category}</a>
            ))}
          </div>
        </div>

        <div className="visual-board" aria-label="注目クリエイター">
          {featuredCreators.map((creator, index) => (
            <article className={`creator-tile ${creator.tone}`} key={creator.name}>
              <div className="avatar-mark">{creator.name.slice(0, 1)}</div>
              <div>
                <p className="tile-rank">No.0{index + 1}</p>
                <h2>{creator.name}</h2>
                <p>{creator.role}</p>
                <span>{creator.tag}</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-band" id="creators">
        <div className="section-heading">
          <p className="eyebrow">Find faster</p>
          <h2>名前にたどり着く導線</h2>
        </div>
        <div className="feature-grid">
          <article>
            <h3>作品情報検索</h3>
            <p>タイトル、品番、メーカー、シリーズ名から公開されている出演者情報を探します。</p>
          </article>
          <article>
            <h3>出演者プロフィール</h3>
            <p>公式プロフィール、SNS、配信サイト、販売ページへの公開リンクを整理します。</p>
          </article>
          <article>
            <h3>UGC補完</h3>
            <p>ユーザー投稿で候補情報を集め、運営確認後に公開データとして反映します。</p>
          </article>
        </div>
      </section>

      <section className="intent-band">
        <div className="section-heading">
          <p className="eyebrow">SEO / AIO / LLMO</p>
          <h2>検索AIに伝わる情報設計</h2>
        </div>
        <div className="intent-grid">
          <article>
            <h3>作品名で女優名を知りたい</h3>
            <p>「作品名 出演女優」「品番 女優名」「メーカー 出演者」の検索意図に対応します。</p>
          </article>
          <article>
            <h3>似ている候補を比較したい</h3>
            <p>候補者ごとに出演作品、公開SNS、別名義、活動ジャンルを比較できるページを作ります。</p>
          </article>
          <article>
            <h3>公式情報へ移動したい</h3>
            <p>プロフィールから公式SNS、配信サイト、販売ページ、ファンクラブへ自然に送客します。</p>
          </article>
        </div>
      </section>

      <section className="ugc-band">
        <div>
          <p className="eyebrow">UGC</p>
          <h2>ユーザー投稿で情報を育てる</h2>
          <p>
            見つけた作品ページ、SNS投稿、メーカー情報を投稿できる仕組みにし、確認済み情報として
            女優プロフィールへ反映します。
          </p>
        </div>
        <form className="ugc-form">
          <input type="text" placeholder="作品名または品番" />
          <input type="url" placeholder="証拠URL" />
          <button type="button">候補を投稿</button>
        </form>
      </section>

      <section className="ranking-band">
        <div>
          <p className="eyebrow">Monetize</p>
          <h2>収益導線</h2>
        </div>
        <ul className="revenue-list">
          <li>配信サイト・販売ページへのアフィリエイトリンク</li>
          <li>女優プロフィールの公式SNS・ファンクラブ導線</li>
          <li>メーカー・レーベル向けの掲載強化枠</li>
        </ul>
      </section>

      <section className="faq-band">
        <div className="section-heading">
          <p className="eyebrow">FAQ</p>
          <h2>よくある検索</h2>
        </div>
        <div className="faq-list">
          {faqItems.map((item) => (
            <article key={item.question}>
              <h3>{item.question}</h3>
              <p>{item.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
