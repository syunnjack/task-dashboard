import { useMemo,useState } from 'react'
import './TravelConcierge.css'

const questions=[
  {key:'country',text:'どちらへ行きますか？',choices:['韓国','台湾']},
  {key:'purpose',text:'旅の一番の目的を教えてください。',choices:['チアイベント','ライブ・ファンミ','スポーツ観戦','コスメ','グルメ・観光','成人限定イベント']},
  {key:'date',text:'出発予定日はいつですか？',type:'date'},
  {key:'experience',text:'海外旅行には慣れていますか？',choices:['初めて・不安あり','経験あり']},
  {key:'connectivity',text:'現地の通信方法は決まっていますか？',choices:['eSIMを使いたい','海外Wi-Fiを使いたい','まだ決めていない']},
  {key:'camera',text:'カメラや撮影機材を持参しますか？',choices:['持参する','スマホだけ']},
]

const baseTasks=[
  ['passport','パスポートの有効期限を確認','安全'],
  ['entry','入国条件を公式情報で確認','安全'],
  ['ticket','チケット・本人確認条件を保存','イベント'],
  ['hotel','終演後に戻れるホテルを確保','予約'],
  ['insurance','旅行保険・携行品補償を確認','安全'],
  ['power','充電器の対応電圧と変換プラグを確認','持ち物'],
]

function makeTasks(answers){
  const tasks=[...baseTasks]
  if(answers.connectivity?.includes('eSIM'))tasks.push(['esim','端末のeSIM対応と開通手順を確認','通信'])
  else tasks.push(['wifi','海外Wi-Fiの受取・返却場所を確認','通信'])
  if(answers.camera==='持参する')tasks.push(['camera-rule','撮影・レンズ・電池の規定を確認','撮影'],['memory','予備電池とメモリーカードを準備','撮影'])
  if(answers.purpose==='チアイベント')tasks.push(['cheer-rule','チーム公式の撮影・SNS投稿規定を確認','チア'])
  if(answers.purpose==='グルメ・観光')tasks.push(['food','予約店・アレルギー用の現地語カードを保存','グルメ'])
  if(answers.purpose==='成人限定イベント')tasks.push(['adult','年齢・本人確認・会場規定を確認','18+'])
  return tasks.map(([id,label,group])=>({id,label,group}))
}

const offers=[
  {id:'hotel',title:'終演後に戻りやすいホテル',detail:'会場からの距離と深夜チェックインで比較',cta:'ホテルを比較',kind:'予約'},
  {id:'connect',title:'通信方法を診断',detail:'eSIM・海外Wi-Fiを人数と端末で比較',cta:'通信を比較',kind:'広告'},
  {id:'power',title:'渡航先対応の電源セット',detail:'変換プラグ・USB-C充電器・ケーブル',cta:'準備用品を見る',kind:'広告'},
  {id:'experience',title:'グルメ・観光の空き枠',detail:'イベント前後に入れられる体験を表示',cta:'現地体験を見る',kind:'広告'},
]

export default function TravelConcierge(){
  const [answers,setAnswers]=useState(()=>{try{return JSON.parse(localStorage.getItem('sukima.concierge.answers')||'{}')}catch{return {}}})
  const [completed,setCompleted]=useState(()=>{try{return JSON.parse(localStorage.getItem('sukima.concierge.completed')||'[]')}catch{return []}})
  const [step,setStep]=useState(()=>Math.min(Object.keys(answers).length,questions.length))
  const [draftDate,setDraftDate]=useState('')
  const current=questions[step]
  const tasks=useMemo(()=>makeTasks(answers),[answers])
  const progress=Math.round((completed.filter((id)=>tasks.some((task)=>task.id===id)).length/Math.max(1,tasks.length))*100)

  const answer=(value)=>{
    if(current.key==='purpose'&&value==='成人限定イベント'&&!window.confirm('18歳以上ですか？'))return
    const next={...answers,[current.key]:value}
    setAnswers(next);localStorage.setItem('sukima.concierge.answers',JSON.stringify(next));setStep((value)=>Math.min(value+1,questions.length))
  }
  const toggle=(id)=>{
    const next=completed.includes(id)?completed.filter((item)=>item!==id):[...completed,id]
    setCompleted(next);localStorage.setItem('sukima.concierge.completed',JSON.stringify(next))
  }
  const reset=()=>{setAnswers({});setCompleted([]);setStep(0);localStorage.removeItem('sukima.concierge.answers');localStorage.removeItem('sukima.concierge.completed')}

  return <section className="concierge" id="concierge">
    <div className="concierge-heading"><div><p className="eyebrow">OSHI TRIP CONCIERGE</p><h2>話すだけで、<br/>遠征準備が整う。</h2></div><p>韓国・台湾のイベント、チア、グルメ、観光に合わせて、必要な準備と予約候補を一つずつ整理します。</p></div>
    <div className="concierge-shell">
      <div className="concierge-chat" aria-live="polite">
        <div className="assistant-message"><span>AI</span><p>こんにちは。推し旅の準備を一緒に進めます。パスポート番号やカード番号は入力しないでください。</p></div>
        {questions.slice(0,step).map((question)=><div key={question.key} className="chat-pair"><div className="assistant-message"><span>AI</span><p>{question.text}</p></div><div className="user-message">{answers[question.key]}</div></div>)}
        {current?<div className="current-question"><div className="assistant-message"><span>AI</span><p>{current.text}</p></div>{current.type==='date'?<form className="date-answer" onSubmit={(event)=>{event.preventDefault();if(draftDate)answer(draftDate)}}><input type="date" min={new Date().toISOString().slice(0,10)} value={draftDate} onChange={(event)=>setDraftDate(event.target.value)} aria-label="出発予定日"/><button disabled={!draftDate}>この日程で進む</button></form>:<div className="choice-grid">{current.choices.map((choice)=><button key={choice} onClick={()=>answer(choice)}>{choice}</button>)}</div>}</div>:<div className="assistant-message complete"><span>AI</span><p>{answers.country}の{answers.purpose}に合わせた準備リストができました。準備済みの項目にチェックを付けてください。</p></div>}
        {step>0&&<button className="reset-chat" onClick={reset}>最初からやり直す</button>}
      </div>
      <aside className="concierge-plan">
        <div className="plan-progress"><div><span>準備の進捗</span><strong>{progress}%</strong></div><div><i style={{width:`${progress}%`}}/></div></div>
        <div className="task-list">{tasks.map((task)=><label key={task.id} className={completed.includes(task.id)?'done':''}><input type="checkbox" checked={completed.includes(task.id)} onChange={()=>toggle(task.id)}/><span><small>{task.group}</small>{task.label}</span></label>)}</div>
        <p className="offer-label">あなたの準備候補</p>
        <div className="concierge-offers">{offers.map((offer)=><article key={offer.id}><div><span>{offer.kind}</span><h3>{offer.title}</h3><p>{offer.detail}</p></div><a href="#offer" aria-label={`${offer.title} ${offer.kind}`}>{offer.cta} →</a></article>)}</div>
        <small className="concierge-disclosure">「広告」と表示されたリンクを経由して予約・購入されると、運営者に報酬が入る場合があります。</small>
      </aside>
    </div>
  </section>
}
