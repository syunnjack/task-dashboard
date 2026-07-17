import { useEffect, useMemo, useState } from 'react'
import './App.css'

const REPORTS_KEY = 'task-dashboard.rakutenReports'
const TASKS_KEY = 'task-dashboard.rakutenTasks'
const CONTENT_KEY = 'task-dashboard.rakutenContent'
const AUTOPILOT_KEY = 'task-dashboard.rakutenAutopilot'
const ROOM_FLOWS_KEY = 'task-dashboard.roomFlows'
const AFFILIATE_SETTINGS_KEY = 'task-dashboard.rakutenAffiliateSettings'
const USER_RAKUTEN_AFFILIATE_LINK = 'https://hb.afl.rakuten.co.jp/hsc/55d66bbd.abc43fa6.152c70c7.a660e6e7/?link_type=text&ut=eyJwYWdlIjoic2hvcCIsInR5cGUiOiJ0ZXh0IiwiY29sIjoxLCJjYXQiOjEsImJhbiI6MTkwMTUsImFtcCI6ZmFsc2V9'

const defaultReports = [
  { id: 'sample-1', date: '2026-07-15', clicks: 42, orders: 2, sales: 8600, reward: 172, memo: 'レビュー記事から初成果。商品ボタンを上部にも追加。' },
  { id: 'sample-2', date: '2026-07-16', clicks: 58, orders: 3, sales: 12600, reward: 252, memo: 'SNS投稿後にクリック増。夜の投稿が反応よし。' },
  { id: 'sample-3', date: '2026-07-17', clicks: 64, orders: 2, sales: 9800, reward: 196, memo: '比較表に公式リンクを追記。' },
]

const defaultTasks = [
  { id: 'task-1', title: '成果が出た記事の冒頭に楽天リンクを1つ追加', channel: 'ブログ', impact: '高', done: false },
  { id: 'task-2', title: 'クリックが多い商品を3つ比較表にする', channel: 'ブログ', impact: '高', done: false },
  { id: 'task-3', title: '昨日の売れた商品をSNSで再紹介する', channel: 'SNS', impact: '中', done: true },
  { id: 'task-4', title: '楽天レポートのクリック上位ページを確認', channel: '分析', impact: '中', done: false },
]

const defaultContent = [
  { id: 'content-1', name: '買ってよかった日用品まとめ', channel: 'ブログ', clicks: 38, reward: 118, idea: '季節ワードをタイトルに追加' },
  { id: 'content-2', name: '週末セール告知ポスト', channel: 'SNS', clicks: 21, reward: 64, idea: '投稿時間を21時に固定して検証' },
  { id: 'content-3', name: '家電の比較ページ', channel: 'ブログ', clicks: 12, reward: 0, idea: '価格帯別のおすすめを追記' },
]

const roomModes = [
  { value: 'favorite', label: 'いいね候補', hint: '商品や投稿を確認して、よいものだけ手動で反応' },
  { value: 'follow', label: 'フォロー候補', hint: '相性のよいROOMユーザーを探す' },
  { value: 'refollow', label: '再フォロー確認', hint: '反応があった相手を確認する' },
  { value: 'kore', label: 'これ投稿候補', hint: 'キーワードに合う商品を投稿候補にする' },
  { value: 'kore-delete', label: 'これ削除候補', hint: '古い投稿や成果が弱い投稿を整理する' },
]

const defaultRoomFlows = [
  {
    id: 'room-1',
    mode: 'favorite',
    keyword: '日用品 セール',
    maxActions: 20,
    spanMinutes: 8,
    doneCount: 4,
    status: 'running',
    nextAt: '21:00',
    memo: '成果記事と相性がよい商品だけ確認',
  },
  {
    id: 'room-2',
    mode: 'kore',
    keyword: '買ってよかった 家電',
    maxActions: 8,
    spanMinutes: 20,
    doneCount: 1,
    status: 'ready',
    nextAt: '22:10',
    memo: '投稿文は手で確認してから公開',
  },
]

const emptyReport = {
  date: new Date().toISOString().slice(0, 10),
  clicks: '',
  orders: '',
  sales: '',
  reward: '',
  memo: '',
}

const emptyTask = {
  title: '',
  channel: 'ブログ',
  impact: '中',
}

const emptyContent = {
  name: '',
  channel: 'ブログ',
  clicks: '',
  reward: '',
  idea: '',
}

const emptyRoomFlow = {
  mode: 'favorite',
  keyword: '',
  maxActions: 10,
  spanMinutes: 10,
  memo: '',
}

const defaultAffiliateSettings = {
  affiliateLink: USER_RAKUTEN_AFFILIATE_LINK,
  campaignName: '楽天市場テキストリンク',
  targetMemo: '日本最大級ショッピングサイト！お買い物なら楽天市場',
}

function readStorage(key, fallback) {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatNumber(value) {
  return new Intl.NumberFormat('ja-JP').format(value)
}

function formatTime(date) {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

function toNumber(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

function impactScore(impact) {
  return { 高: 3, 中: 2, 低: 1 }[impact] ?? 1
}

function uniqueTasks(currentTasks, nextTasks) {
  const existingTitles = new Set(currentTasks.map((task) => task.title))
  return nextTasks.filter((task) => !existingTitles.has(task.title))
}

function createAutoTasks({ totals, bestContent, weakestContent, latestReport }) {
  const tasks = []

  if (!latestReport) {
    tasks.push({
      title: '楽天レポートから今日のクリック・注文・報酬を入力する',
      channel: '分析',
      impact: '高',
    })
  }

  if (totals.clicks > 0 && totals.conversionRate < 3) {
    tasks.push({
      title: 'クリックがあるページの楽天リンク位置を冒頭・比較表・購入直前に増やす',
      channel: 'ブログ',
      impact: '高',
    })
  }

  if (totals.rewardPerClick < 5) {
    tasks.push({
      title: '低単価商品だけでなく買い替え需要のある商品を1つ追加する',
      channel: '商品選定',
      impact: '中',
    })
  }

  if (bestContent) {
    tasks.push({
      title: `${bestContent.name} の成功パターンを別記事にも横展開する`,
      channel: bestContent.channel,
      impact: '高',
    })
  }

  if (weakestContent && toNumber(weakestContent.clicks) >= 10 && toNumber(weakestContent.reward) === 0) {
    tasks.push({
      title: `${weakestContent.name} の商品選定と購入ボタン文言を見直す`,
      channel: weakestContent.channel,
      impact: '高',
    })
  }

  if (latestReport && toNumber(latestReport.clicks) > 0) {
    tasks.push({
      title: '昨日反応があった商品をSNSで再投稿する',
      channel: 'SNS',
      impact: '中',
    })
  }

  return tasks.map((task) => ({
    id: crypto.randomUUID(),
    ...task,
    done: false,
    source: 'auto',
  }))
}

function roomModeLabel(mode) {
  return roomModes.find((item) => item.value === mode)?.label ?? mode
}

function App() {
  const [reports, setReports] = useState(() => readStorage(REPORTS_KEY, defaultReports))
  const [tasks, setTasks] = useState(() => readStorage(TASKS_KEY, defaultTasks))
  const [contents, setContents] = useState(() => readStorage(CONTENT_KEY, defaultContent))
  const [roomFlows, setRoomFlows] = useState(() => readStorage(ROOM_FLOWS_KEY, defaultRoomFlows))
  const [affiliateSettings, setAffiliateSettings] = useState(() =>
    readStorage(AFFILIATE_SETTINGS_KEY, defaultAffiliateSettings),
  )
  const [autopilot, setAutopilot] = useState(() => readStorage(AUTOPILOT_KEY, true))
  const [reportForm, setReportForm] = useState(emptyReport)
  const [taskForm, setTaskForm] = useState(emptyTask)
  const [contentForm, setContentForm] = useState(emptyContent)
  const [roomForm, setRoomForm] = useState(emptyRoomFlow)
  const [affiliateForm, setAffiliateForm] = useState(affiliateSettings)
  const [automationMessage, setAutomationMessage] = useState('自動運転はオンです。数字を入れると改善タスクを自動で作ります。')

  useEffect(() => {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports))
  }, [reports])

  useEffect(() => {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks))
  }, [tasks])

  useEffect(() => {
    localStorage.setItem(CONTENT_KEY, JSON.stringify(contents))
  }, [contents])

  useEffect(() => {
    localStorage.setItem(ROOM_FLOWS_KEY, JSON.stringify(roomFlows))
  }, [roomFlows])

  useEffect(() => {
    localStorage.setItem(AFFILIATE_SETTINGS_KEY, JSON.stringify(affiliateSettings))
  }, [affiliateSettings])

  useEffect(() => {
    if (affiliateSettings.affiliateLink.trim()) return
    setAffiliateSettings(defaultAffiliateSettings)
    setAffiliateForm(defaultAffiliateSettings)
  }, [affiliateSettings.affiliateLink])

  useEffect(() => {
    localStorage.setItem(AUTOPILOT_KEY, JSON.stringify(autopilot))
  }, [autopilot])

  const sortedReports = useMemo(
    () => [...reports].sort((a, b) => b.date.localeCompare(a.date)),
    [reports],
  )

  const totals = useMemo(() => {
    const totalClicks = reports.reduce((sum, report) => sum + toNumber(report.clicks), 0)
    const totalOrders = reports.reduce((sum, report) => sum + toNumber(report.orders), 0)
    const totalSales = reports.reduce((sum, report) => sum + toNumber(report.sales), 0)
    const totalReward = reports.reduce((sum, report) => sum + toNumber(report.reward), 0)

    return {
      clicks: totalClicks,
      orders: totalOrders,
      sales: totalSales,
      reward: totalReward,
      conversionRate: totalClicks ? (totalOrders / totalClicks) * 100 : 0,
      rewardPerClick: totalClicks ? totalReward / totalClicks : 0,
    }
  }, [reports])

  const activeTasks = tasks.filter((task) => !task.done)
  const completedTasks = tasks.filter((task) => task.done)
  const bestContent = [...contents].sort((a, b) => toNumber(b.reward) - toNumber(a.reward))[0]
  const weakestContent = [...contents].sort((a, b) => toNumber(b.clicks) - toNumber(a.clicks) || toNumber(a.reward) - toNumber(b.reward))[0]
  const latestReport = sortedReports[0]

  const suggestions = [
    totals.conversionRate < 3
      ? 'クリックはあるので、記事冒頭・比較表・購入直前の3か所に楽天リンクを置く'
      : '成約率は悪くないので、成果記事への導線をSNSと関連記事から増やす',
    totals.rewardPerClick < 5
      ? '単価が低めの商品だけでなく、買い替え需要のある商品を1つ混ぜる'
      : '報酬効率が良い商品を、別キーワードの記事にも横展開する',
    weakestContent?.reward === 0
      ? `${weakestContent.name} はクリック後の購入が弱いので、商品選定か訴求文を見直す`
      : '週1回、クリック上位3ページだけ改善して小さく積み上げる',
  ]

  const autoTaskCandidates = useMemo(
    () => createAutoTasks({ totals, bestContent, weakestContent, latestReport }),
    [bestContent, latestReport, totals, weakestContent],
  )

  const todayTasks = [...activeTasks]
    .sort((a, b) => impactScore(b.impact) - impactScore(a.impact))
    .slice(0, 3)

  const roomStats = useMemo(() => {
    const totalLimit = roomFlows.reduce((sum, flow) => sum + toNumber(flow.maxActions), 0)
    const doneTotal = roomFlows.reduce((sum, flow) => sum + toNumber(flow.doneCount), 0)
    const running = roomFlows.filter((flow) => flow.status === 'running').length
    return { totalLimit, doneTotal, running }
  }, [roomFlows])

  const affiliateReady = affiliateSettings.affiliateLink.trim().startsWith('http')

  const runAutomation = () => {
    setTasks((current) => {
      const nextTasks = uniqueTasks(current, autoTaskCandidates)
      setAutomationMessage(
        nextTasks.length > 0
          ? `${nextTasks.length}件の改善タスクを自動追加しました。`
          : '追加できる新しい自動タスクはありません。既存タスクを進めましょう。',
      )
      return [...nextTasks, ...current]
    })
  }

  const addReport = (event) => {
    event.preventDefault()
    const nextReport = {
      id: crypto.randomUUID(),
      date: reportForm.date,
      clicks: toNumber(reportForm.clicks),
      orders: toNumber(reportForm.orders),
      sales: toNumber(reportForm.sales),
      reward: toNumber(reportForm.reward),
      memo: reportForm.memo.trim(),
    }
    setReports((current) => [nextReport, ...current])
    if (autopilot) {
      const nextAutoTasks = createAutoTasks({
        totals,
        bestContent,
        weakestContent,
        latestReport: nextReport,
      })
      setTasks((current) => [...uniqueTasks(current, nextAutoTasks), ...current])
      setAutomationMessage('レポート入力に合わせて改善タスクを自動更新しました。')
    }
    setReportForm(emptyReport)
  }

  const addTask = (event) => {
    event.preventDefault()
    if (!taskForm.title.trim()) return
    setTasks((current) => [
      { id: crypto.randomUUID(), ...taskForm, title: taskForm.title.trim(), done: false },
      ...current,
    ])
    setTaskForm(emptyTask)
  }

  const addContent = (event) => {
    event.preventDefault()
    if (!contentForm.name.trim()) return
    setContents((current) => [
      {
        id: crypto.randomUUID(),
        name: contentForm.name.trim(),
        channel: contentForm.channel,
        clicks: toNumber(contentForm.clicks),
        reward: toNumber(contentForm.reward),
        idea: contentForm.idea.trim(),
      },
      ...current,
    ])
    setContentForm(emptyContent)
  }

  const addRoomFlow = (event) => {
    event.preventDefault()
    if (!roomForm.keyword.trim()) return
    setRoomFlows((current) => [
      {
        id: crypto.randomUUID(),
        ...roomForm,
        keyword: roomForm.keyword.trim(),
        maxActions: toNumber(roomForm.maxActions),
        spanMinutes: toNumber(roomForm.spanMinutes),
        doneCount: 0,
        status: 'ready',
        nextAt: formatTime(new Date()),
        memo: roomForm.memo.trim(),
      },
      ...current,
    ])
    setRoomForm(emptyRoomFlow)
  }

  const startRoomFlow = (flowId) => {
    setRoomFlows((current) =>
      current.map((flow) =>
        flow.id === flowId
          ? {
              ...flow,
              status: 'running',
              nextAt: formatTime(new Date(Date.now() + toNumber(flow.spanMinutes) * 60 * 1000)),
            }
          : flow,
      ),
    )
  }

  const pauseRoomFlow = (flowId) => {
    setRoomFlows((current) =>
      current.map((flow) => (flow.id === flowId ? { ...flow, status: 'paused' } : flow)),
    )
  }

  const completeRoomStep = (flowId) => {
    setRoomFlows((current) =>
      current.map((flow) => {
        if (flow.id !== flowId) return flow
        const nextDoneCount = Math.min(toNumber(flow.doneCount) + 1, toNumber(flow.maxActions))
        return {
          ...flow,
          doneCount: nextDoneCount,
          status: nextDoneCount >= toNumber(flow.maxActions) ? 'done' : flow.status,
          nextAt: formatTime(new Date(Date.now() + toNumber(flow.spanMinutes) * 60 * 1000)),
        }
      }),
    )
  }

  const deleteRoomFlow = (flowId) => {
    setRoomFlows((current) => current.filter((flow) => flow.id !== flowId))
  }

  const toggleTask = (taskId) => {
    setTasks((current) =>
      current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)),
    )
  }

  const deleteReport = (reportId) => {
    setReports((current) => current.filter((report) => report.id !== reportId))
  }

  const deleteTask = (taskId) => {
    setTasks((current) => current.filter((task) => task.id !== taskId))
  }

  const deleteContent = (contentId) => {
    setContents((current) => current.filter((content) => content.id !== contentId))
  }

  const saveAffiliateSettings = (event) => {
    event.preventDefault()
    setAffiliateSettings({
      affiliateLink: affiliateForm.affiliateLink.trim(),
      campaignName: affiliateForm.campaignName.trim() || '楽天ROOM導線',
      targetMemo: affiliateForm.targetMemo.trim(),
    })
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">Rakuten affiliate growth</p>
          <h1>楽天報酬を、毎日少しずつ増やす作業場</h1>
          <p className="lead">
            楽天アフィリエイトのレポート数値を入れて、クリック、成約、報酬、改善タスクを同じ画面で管理します。
            大きな一発狙いではなく、昨日より1つ良くするためのダッシュボードです。
          </p>
          <div className="hero-actions">
            <a href="https://affiliate.rakuten.co.jp/report/summary?l-id=af_header_mypage_02" target="_blank" rel="noreferrer">
              楽天レポートを開く
            </a>
            <a href="#today-work">今日の改善へ</a>
          </div>
        </div>
        <aside className="focus-panel" aria-label="今日の注目ポイント">
          <p className="panel-label">Next action</p>
          <h2>{suggestions[0]}</h2>
          <p>クリック数、成約率、1クリックあたり報酬を見ながら、改善の優先順位を決めます。</p>
        </aside>
      </section>

      <section className="metric-grid" aria-label="報酬サマリー">
        <article>
          <span>クリック</span>
          <strong>{formatNumber(totals.clicks)}</strong>
          <small>集客量の合計</small>
        </article>
        <article>
          <span>注文</span>
          <strong>{formatNumber(totals.orders)}</strong>
          <small>成約率 {totals.conversionRate.toFixed(1)}%</small>
        </article>
        <article>
          <span>売上</span>
          <strong>{formatCurrency(totals.sales)}</strong>
          <small>成果金額の合計</small>
        </article>
        <article>
          <span>報酬</span>
          <strong>{formatCurrency(totals.reward)}</strong>
          <small>1クリック {formatCurrency(totals.rewardPerClick)}</small>
        </article>
      </section>

      <section className="automation-section" aria-label="自動運転">
        <article className="automation-panel">
          <div>
            <p className="eyebrow">Autopilot</p>
            <h2>数字から改善タスクを自動で作る</h2>
            <p>
              成約率、1クリックあたり報酬、成果が出ている記事、クリックだけ多い記事を見て、
              今日やるべき改善を自動で未完了タスクへ追加します。
            </p>
            <span className="automation-message">{automationMessage}</span>
          </div>
          <div className="automation-actions">
            <label className="toggle-row">
              <input type="checkbox" checked={autopilot} onChange={(event) => setAutopilot(event.target.checked)} />
              自動運転をオンにする
            </label>
            <button type="button" onClick={runAutomation}>今すぐ自動生成</button>
          </div>
        </article>

        <article className="today-panel">
          <div className="panel-heading">
            <p className="eyebrow">Today</p>
            <h2>今日やる3つ</h2>
          </div>
          <ol className="today-list">
            {todayTasks.map((task) => (
              <li key={task.id}>
                <strong>{task.title}</strong>
                <span>{task.channel} / 効果 {task.impact}</span>
              </li>
            ))}
            {todayTasks.length === 0 && <li>未完了タスクはありません。自動生成を押すと候補を作れます。</li>}
          </ol>
        </article>
      </section>

      <section className="affiliate-section">
        <article className="affiliate-panel">
          <div>
            <p className="eyebrow">Affiliate link</p>
            <h2>あなたの楽天リンクを使う</h2>
            <p>
              楽天アフィリエイトで作ったリンクを保存して、ROOM運用・記事改善・SNS再投稿の共通導線として使います。
            </p>
            <span className={`link-status ${affiliateReady ? 'ready' : ''}`}>
              {affiliateReady ? 'リンク設定済み' : 'リンク未設定'}
            </span>
          </div>
          <form className="affiliate-form" onSubmit={saveAffiliateSettings}>
            <input
              type="url"
              value={affiliateForm.affiliateLink}
              onChange={(event) => setAffiliateForm({ ...affiliateForm, affiliateLink: event.target.value })}
              placeholder="楽天アフィリエイトで作成したURL"
            />
            <input
              value={affiliateForm.campaignName}
              onChange={(event) => setAffiliateForm({ ...affiliateForm, campaignName: event.target.value })}
              placeholder="導線名"
            />
            <input
              value={affiliateForm.targetMemo}
              onChange={(event) => setAffiliateForm({ ...affiliateForm, targetMemo: event.target.value })}
              placeholder="使う場所のメモ"
            />
            <button type="submit">保存</button>
            <a
              className={!affiliateReady ? 'disabled-link' : ''}
              href={affiliateReady ? affiliateSettings.affiliateLink : undefined}
              target="_blank"
              rel="noreferrer sponsored"
            >
              リンクを開く
            </a>
          </form>
        </article>
      </section>

      <section className="workspace-grid" id="today-work">
        <article className="tool-panel">
          <div className="panel-heading">
            <p className="eyebrow">Daily report</p>
            <h2>日次レポートを記録</h2>
          </div>
          <form className="report-form" onSubmit={addReport}>
            <label>
              日付
              <input type="date" value={reportForm.date} onChange={(event) => setReportForm({ ...reportForm, date: event.target.value })} required />
            </label>
            <label>
              クリック
              <input type="number" min="0" value={reportForm.clicks} onChange={(event) => setReportForm({ ...reportForm, clicks: event.target.value })} required />
            </label>
            <label>
              注文
              <input type="number" min="0" value={reportForm.orders} onChange={(event) => setReportForm({ ...reportForm, orders: event.target.value })} required />
            </label>
            <label>
              売上
              <input type="number" min="0" value={reportForm.sales} onChange={(event) => setReportForm({ ...reportForm, sales: event.target.value })} required />
            </label>
            <label>
              報酬
              <input type="number" min="0" value={reportForm.reward} onChange={(event) => setReportForm({ ...reportForm, reward: event.target.value })} required />
            </label>
            <label className="wide-field">
              メモ
              <textarea value={reportForm.memo} onChange={(event) => setReportForm({ ...reportForm, memo: event.target.value })} placeholder="伸びた記事、投稿時間、変更したリンクなど" />
            </label>
            <button type="submit">記録する</button>
          </form>
        </article>

        <article className="tool-panel">
          <div className="panel-heading">
            <p className="eyebrow">Improvement queue</p>
            <h2>改善タスク</h2>
          </div>
          <form className="task-form" onSubmit={addTask}>
            <input value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} placeholder="例: 成果記事に比較表を追加" />
            <select value={taskForm.channel} onChange={(event) => setTaskForm({ ...taskForm, channel: event.target.value })}>
              <option>ブログ</option>
              <option>SNS</option>
              <option>分析</option>
              <option>商品選定</option>
            </select>
            <select value={taskForm.impact} onChange={(event) => setTaskForm({ ...taskForm, impact: event.target.value })}>
              <option>高</option>
              <option>中</option>
              <option>低</option>
            </select>
            <button type="submit">追加</button>
          </form>
          <div className="task-list">
            {tasks.map((task) => (
              <div className={`task-row ${task.done ? 'done' : ''}`} key={task.id}>
                <button type="button" className="check-button" onClick={() => toggleTask(task.id)} aria-label={`${task.title}を完了にする`}>
                  {task.done ? '✓' : ''}
                </button>
                <div>
                  <strong>{task.title}</strong>
                  <span>{task.channel} / 効果 {task.impact}{task.source === 'auto' ? ' / 自動' : ''}</span>
                </div>
                <button type="button" className="delete-button" onClick={() => deleteTask(task.id)}>削除</button>
              </div>
            ))}
          </div>
          <p className="panel-note">未完了 {activeTasks.length}件 / 完了 {completedTasks.length}件</p>
        </article>
      </section>

      <section className="insight-grid">
        <article className="tool-panel">
          <div className="panel-heading">
            <p className="eyebrow">What to improve</p>
            <h2>次に伸ばすポイント</h2>
          </div>
          <ul className="suggestion-list">
            {suggestions.map((suggestion) => (
              <li key={suggestion}>{suggestion}</li>
            ))}
          </ul>
        </article>

        <article className="tool-panel">
          <div className="panel-heading">
            <p className="eyebrow">Top content</p>
            <h2>成果が出ている導線</h2>
          </div>
          {bestContent ? (
            <div className="best-content">
              <span>{bestContent.channel}</span>
              <strong>{bestContent.name}</strong>
              <p>{formatNumber(bestContent.clicks)}クリック / {formatCurrency(toNumber(bestContent.reward))}</p>
              <small>{bestContent.idea}</small>
            </div>
          ) : (
            <p className="empty-text">媒体メモを追加すると表示されます。</p>
          )}
        </article>
      </section>

      <section className="room-section">
        <div className="panel-heading">
          <p className="eyebrow">ROOM safe pilot</p>
          <h2>ROOM REPEAT改良版</h2>
        </div>
        <div className="room-summary">
          <article>
            <span>稼働中</span>
            <strong>{roomStats.running}</strong>
          </article>
          <article>
            <span>今日の実行上限</span>
            <strong>{formatNumber(roomStats.totalLimit)}</strong>
          </article>
          <article>
            <span>確認済み</span>
            <strong>{formatNumber(roomStats.doneTotal)}</strong>
          </article>
        </div>
        <form className="room-form" onSubmit={addRoomFlow}>
          <select value={roomForm.mode} onChange={(event) => setRoomForm({ ...roomForm, mode: event.target.value })}>
            {roomModes.map((mode) => (
              <option value={mode.value} key={mode.value}>{mode.label}</option>
            ))}
          </select>
          <input value={roomForm.keyword} onChange={(event) => setRoomForm({ ...roomForm, keyword: event.target.value })} placeholder="キーワード、ジャンル、商品テーマ" />
          <input type="number" min="1" max="100" value={roomForm.maxActions} onChange={(event) => setRoomForm({ ...roomForm, maxActions: event.target.value })} aria-label="最大確認数" />
          <input type="number" min="3" max="120" value={roomForm.spanMinutes} onChange={(event) => setRoomForm({ ...roomForm, spanMinutes: event.target.value })} aria-label="間隔分" />
          <input value={roomForm.memo} onChange={(event) => setRoomForm({ ...roomForm, memo: event.target.value })} placeholder="運用メモ" />
          <button type="submit">キュー追加</button>
        </form>
        <div className="mode-help">
          {roomModes.map((mode) => (
            <span key={mode.value}>{mode.label}: {mode.hint}</span>
          ))}
        </div>
        <div className="room-flow-list">
          {roomFlows.map((flow) => {
            const progress = toNumber(flow.maxActions) ? Math.round((toNumber(flow.doneCount) / toNumber(flow.maxActions)) * 100) : 0
            return (
              <article className="room-flow" key={flow.id}>
                <div>
                  <span className={`status-pill ${flow.status}`}>{flow.status}</span>
                  <h3>{roomModeLabel(flow.mode)} / {flow.keyword}</h3>
                  <p>{flow.memo || affiliateSettings.targetMemo || 'メモなし'}</p>
                </div>
                <div className="room-progress">
                  <div>
                    <span style={{ width: `${progress}%` }} />
                  </div>
                  <strong>{formatNumber(flow.doneCount)} / {formatNumber(flow.maxActions)}</strong>
                  <small>{flow.spanMinutes}分間隔 / 次回 {flow.nextAt}</small>
                </div>
                <div className="room-actions">
                  <button type="button" onClick={() => startRoomFlow(flow.id)}>開始</button>
                  <button type="button" onClick={() => completeRoomStep(flow.id)}>1件確認</button>
                  <a
                    className={!affiliateReady ? 'disabled-link' : ''}
                    href={affiliateReady ? affiliateSettings.affiliateLink : undefined}
                    target="_blank"
                    rel="noreferrer sponsored"
                  >
                    リンク
                  </a>
                  <button type="button" onClick={() => pauseRoomFlow(flow.id)}>停止</button>
                  <button type="button" onClick={() => deleteRoomFlow(flow.id)}>削除</button>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section className="content-section">
        <div className="panel-heading">
          <p className="eyebrow">Content tracker</p>
          <h2>媒体・記事別メモ</h2>
        </div>
        <form className="content-form" onSubmit={addContent}>
          <input value={contentForm.name} onChange={(event) => setContentForm({ ...contentForm, name: event.target.value })} placeholder="記事名、投稿名、ページ名" />
          <select value={contentForm.channel} onChange={(event) => setContentForm({ ...contentForm, channel: event.target.value })}>
            <option>ブログ</option>
            <option>SNS</option>
            <option>メール</option>
            <option>その他</option>
          </select>
          <input type="number" min="0" value={contentForm.clicks} onChange={(event) => setContentForm({ ...contentForm, clicks: event.target.value })} placeholder="クリック" />
          <input type="number" min="0" value={contentForm.reward} onChange={(event) => setContentForm({ ...contentForm, reward: event.target.value })} placeholder="報酬" />
          <input value={contentForm.idea} onChange={(event) => setContentForm({ ...contentForm, idea: event.target.value })} placeholder="次の改善案" />
          <button type="submit">追加</button>
        </form>
        <div className="content-table" role="table" aria-label="媒体別成果">
          <div className="table-head" role="row">
            <span>媒体</span>
            <span>名前</span>
            <span>クリック</span>
            <span>報酬</span>
            <span>改善案</span>
            <span></span>
          </div>
          {contents.map((content) => (
            <div className="table-row" role="row" key={content.id}>
              <span>{content.channel}</span>
              <strong>{content.name}</strong>
              <span>{formatNumber(toNumber(content.clicks))}</span>
              <span>{formatCurrency(toNumber(content.reward))}</span>
              <span>{content.idea || '次回入力'}</span>
              <button type="button" onClick={() => deleteContent(content.id)}>削除</button>
            </div>
          ))}
        </div>
      </section>

      <section className="history-section">
        <div className="panel-heading">
          <p className="eyebrow">Report history</p>
          <h2>記録履歴</h2>
        </div>
        <div className="history-list">
          {sortedReports.map((report) => (
            <article key={report.id}>
              <div>
                <time>{report.date}</time>
                <strong>{formatCurrency(toNumber(report.reward))}</strong>
                <span>{formatNumber(toNumber(report.clicks))}クリック / {formatNumber(toNumber(report.orders))}注文 / 売上 {formatCurrency(toNumber(report.sales))}</span>
                {report.memo && <p>{report.memo}</p>}
              </div>
              <button type="button" onClick={() => deleteReport(report.id)}>削除</button>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}

export default App
