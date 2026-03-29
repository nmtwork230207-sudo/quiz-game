import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react'
import confetti from 'canvas-confetti'

// ══════ TYPES ══════
type QType = 'mc' | 'tf' | 'open'
interface Question { id: number; round: number; type: QType; text: string; options?: string[]; answer: any }
interface Team { id: number; name: string; color: string; score: number }
interface WheelItem { label: string; type: string; value: number; color: string; weight: number }
interface MusicItem { url: string; title: string }
interface TriviaQ { q: string; a: string }
interface GameConfig {
  teams: Team[]; questions: Question[]; rewardWheel: WheelItem[]; penaltyWheel: WheelItem[]
  challengeQs: TriviaQ[]; musicQs: MusicItem[]; bgMusic: string
}
interface CardData { id: number; matchKey: string; label: string; kind: 'normal' | 'jackpot' | 'bomb'; num: number }

// ══════ STORAGE ══════
const LS = {
  get: (k: string) => { try { const v = localStorage.getItem('mqs_' + k); return v ? JSON.parse(v) : null } catch { return null } },
  set: (k: string, v: any) => { try { localStorage.setItem('mqs_' + k, JSON.stringify(v)) } catch {} },
  del: (k: string) => { try { localStorage.removeItem('mqs_' + k) } catch {} },
}

// ══════ DEFAULTS ══════
const DEF_TEAMS: Team[] = [
  { id: 0, name: 'Đội 1', color: '#3b82f6', score: 0 },
  { id: 1, name: 'Đội 2', color: '#ef4444', score: 0 },
  { id: 2, name: 'Đội 3', color: '#10b981', score: 0 },
]

const DEF_QS: Question[] = [
  {id:1,round:1,type:'tf',text:'Động lực là sự thôi thúc chủ quan dẫn đến hành động nhằm đáp ứng nhu cầu.',answer:true},
  {id:2,round:1,type:'mc',text:'Theo Taylor, yếu tố nào là động lực chính?',options:['Quan hệ xã hội','Lương cao','Sự tôn trọng','Tự khẳng định'],answer:1},
  {id:3,round:1,type:'tf',text:'Hawthorne: lương là yếu tố DUY NHẤT quyết định động lực.',answer:false},
  {id:4,round:1,type:'mc',text:'Tháp Maslow gồm bao nhiêu bậc?',options:['3','4','5','6'],answer:2},
  {id:5,round:1,type:'open',text:'Nhu cầu bậc thấp nhất theo Maslow?',answer:'Sinh lý'},
  {id:6,round:1,type:'mc',text:'Thuyết ERG gồm mấy loại nhu cầu?',options:['2','3','4','5'],answer:1},
  {id:7,round:1,type:'tf',text:'ERG: chỉ theo đuổi MỘT nhu cầu tại một thời điểm.',answer:false},
  {id:8,round:1,type:'mc',text:'McClelland — 3 nhu cầu:',options:['Sinh lý, an toàn, xã hội','Thành đạt, liên minh, quyền lực','Tồn tại, quan hệ, phát triển','Lương, thưởng, MT'],answer:1},
  {id:9,round:1,type:'mc',text:'6.4: bao nhiêu yếu tố ảnh hưởng hiệu quả lãnh đạo?',options:['2','3','4','5'],answer:2},
  {id:10,round:1,type:'tf',text:'Lãnh đạo đạt hiệu quả chỉ cần ý chí, không cần nhận định đúng.',answer:false},
  {id:11,round:2,type:'open',text:'Herzberg: 2 yếu tố?',answer:'Duy trì và Động viên'},
  {id:12,round:2,type:'tf',text:'Herzberg: lương là yếu tố ĐỘNG VIÊN quan trọng nhất.',answer:false},
  {id:13,round:2,type:'mc',text:'Thuyết Vroom năm?',options:['1954','1960','1964','1975'],answer:2},
  {id:14,round:2,type:'tf',text:'Adams: không công bằng → năng suất giảm.',answer:true},
  {id:15,round:2,type:'mc',text:'"Động lực = Sức hấp dẫn × Niềm tin" — thuyết?',options:['Maslow','Herzberg','Vroom','Adams'],answer:2},
  {id:16,round:2,type:'open',text:'Yếu tố đầu tiên ảnh hưởng hiệu quả lãnh đạo?',answer:'Nhận định đúng'},
  {id:17,round:2,type:'mc',text:'Kinh nghiệm ảnh hưởng lãnh đạo:',options:['Chỉ với lãnh đạo trẻ','Chọn PP phù hợp','Thay thế nhận định','Không bằng học vấn'],answer:1},
  {id:18,round:2,type:'tf',text:'Nên dùng CÙNG MỘT phong cách cho tất cả NV.',answer:false},
  {id:19,round:2,type:'mc',text:'NV trình độ cao → lãnh đạo:',options:['Kiểm soát chặt','Dân chủ','Không quan tâm','Độc đoán'],answer:1},
  {id:20,round:2,type:'open',text:'Yếu tố thứ 4: quan hệ với?',answer:'Đồng nghiệp'},
  {id:21,round:3,type:'mc',text:'ERG vs Maslow:',options:['ERG 5 bậc','Đồng thời nhiều NC','Chỉ quản trị','Không sinh lý'],answer:1},
  {id:22,round:3,type:'open',text:'Lý thuyết cổ điển — F. W. ai?',answer:'Taylor'},
  {id:23,round:3,type:'tf',text:'Porter-Lawler: thưởng → thỏa mãn → làm tốt hơn.',answer:true},
  {id:24,round:3,type:'mc',text:'Porter-Lawler: KHÔNG thuộc mô hình?',options:['Khả năng thực hiện','Nhận thức NV','Phần thưởng','LĐ độc đoán'],answer:3},
  {id:25,round:3,type:'mc',text:'So sánh đóng góp vs lợi ích?',options:['Maslow','Vroom','Adams','Taylor'],answer:2},
  {id:26,round:3,type:'mc',text:'QĐ mới, NV trình độ thấp:',options:['Tự do','Dân chủ','Giám sát chặt','Không QL'],answer:2},
  {id:27,round:3,type:'tf',text:'Maslow và ERG đều chia 5 bậc.',answer:false},
  {id:28,round:3,type:'mc',text:'NV lương thấp hơn ĐN → giảm nỗ lực:',options:['Maslow','Herzberg','Adams','Vroom'],answer:2},
  {id:29,round:3,type:'open',text:'Porter-Lawler: Giá trị PT → ___ → Nỗ lực → KQ',answer:'Khả năng thực hiện nhiệm vụ'},
  {id:30,round:3,type:'mc',text:'CT giải thể, bỏ mặc NV. Vi phạm?',options:['Thiếu KN','Thiếu NĐ + quan hệ','Trình độ NV','Không VP'],answer:1},
]

const DEF_REWARD: WheelItem[] = [
  {label:'+15đ',type:'pts',value:15,color:'#00b894',weight:1},{label:'+10đ',type:'pts',value:10,color:'#0984e3',weight:1},
  {label:'Rất tiếc!',type:'none',value:0,color:'#b2bec3',weight:1},{label:'+20đ',type:'pts',value:20,color:'#6c5ce7',weight:1},
  {label:'+10đ',type:'pts',value:10,color:'#fdcb6e',weight:1},{label:'+5đ',type:'pts',value:5,color:'#00cec9',weight:1},
  {label:'Rất tiếc!',type:'none',value:0,color:'#b2bec3',weight:1},{label:'+25đ',type:'pts',value:25,color:'#fd79a8',weight:1},
]
const DEF_PENALTY: WheelItem[] = [
  {label:'-10đ',type:'pts',value:-10,color:'#ff6b6b',weight:1},{label:'Thoát phạt!',type:'none',value:0,color:'#00b894',weight:1},
  {label:'Tặng 10đ',type:'give',value:10,color:'#fdcb6e',weight:1},{label:'-5đ',type:'pts',value:-5,color:'#e17055',weight:1},
  {label:'Câu hỏi phạt',type:'quiz',value:-15,color:'#6c5ce7',weight:1},{label:'Thoát!',type:'none',value:0,color:'#55efc4',weight:1},
  {label:'🎵 Đoán nhạc',type:'music',value:-10,color:'#fd79a8',weight:1},{label:'Tặng 15đ',type:'give',value:15,color:'#ffeaa7',weight:1},
]
const DEF_TRIVIA: TriviaQ[] = [
  {q:'(MC tự đặt câu hỏi)',a:'(MC tự phán)'},
]
const DEF_MUSIC: MusicItem[] = [
  {url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',title:'Bài hát 1'},
  {url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',title:'Bài hát 2'},
]

const DEF_CFG: GameConfig = {
  teams: DEF_TEAMS, questions: DEF_QS, rewardWheel: DEF_REWARD,
  penaltyWheel: DEF_PENALTY, challengeQs: DEF_TRIVIA, musicQs: DEF_MUSIC, bgMusic: '',
}

const NORMALS = [
  {pid:'maslow',lb:'🏔️ Maslow'},{pid:'herzberg',lb:'⚖️ Herzberg'},{pid:'vroom',lb:'🎯 Vroom'},
  {pid:'adams',lb:'⚡ Adams'},{pid:'taylor',lb:'🏭 Taylor'},{pid:'erg',lb:'🔄 ERG'},{pid:'porter',lb:'📊 Porter'},
]

const RC: Record<number,{name:string;timer:number;mult:number;bomb:boolean;jack:boolean}> = {
  1:{name:'Khởi động',timer:15,mult:1,bomb:false,jack:false},
  2:{name:'Tăng tốc',timer:15,mult:2,bomb:true,jack:false},
  3:{name:'Sinh tử',timer:20,mult:3,bomb:true,jack:true},
}

// ══════ UTILS ══════
const shuffle = <T,>(a: T[]): T[] => {
  const b = [...a]; for (let i = b.length-1; i > 0; i--) { const j = Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]] }; return b
}

/**
 * CRITICAL: matchKey determines matching.
 * - Normal cards: matchKey = their pid (maslow, herzberg, etc.) — only same pair matches
 * - ALL bombs share matchKey = "BOMB" — ANY bomb matches ANY other bomb
 * - ALL jackpots share matchKey = "JACKPOT" — ANY jackpot matches ANY other jackpot
 */
function buildCards(): CardData[] {
  const cards: CardData[] = []; let id = 0
  NORMALS.forEach(n => {
    cards.push({ id: id++, matchKey: n.pid, label: n.lb, kind: 'normal', num: 0 })
    cards.push({ id: id++, matchKey: n.pid, label: n.lb, kind: 'normal', num: 0 })
  })
  // 3 cặp NỔ HỦ = 6 thẻ, ALL share matchKey "JACKPOT"
  for (let i = 0; i < 6; i++) cards.push({ id: id++, matchKey: 'JACKPOT', label: '🎰', kind: 'jackpot', num: 0 })
  // 2 cặp BOM = 4 thẻ, ALL share matchKey "BOMB"
  for (let i = 0; i < 4; i++) cards.push({ id: id++, matchKey: 'BOMB', label: '💣', kind: 'bomb', num: 0 })
  const shuffled = shuffle(cards)
  // Assign numbers 1..N
  shuffled.forEach((c, i) => { c.num = i + 1 })
  return shuffled
}

const fireConfetti = () => {
  confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 }, colors: ['#fdcb6e','#f39c12','#e67e22','#fff'] })
  setTimeout(() => confetti({ particleCount: 80, spread: 120, origin: { y: 0.4 } }), 300)
}
const fireBomb = () => {
  confetti({ particleCount: 80, spread: 60, origin: { y: 0.5 }, colors: ['#e74c3c','#c0392b','#2d3436','#636e72'], gravity: 2, scalar: 1.2 })
}

// ══════ SMALL COMPONENTS ══════
function Toast({ msg, type, onDone }: { msg: string; type: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3200); return () => clearTimeout(t) }, [])
  const bg: Record<string, string> = { success:'#00b894', error:'#ff6b6b', gold:'#f39c12', bomb:'#e74c3c', info:'#6c5ce7' }
  return <div style={{ position:'fixed',top:28,left:'50%',transform:'translateX(-50%)',zIndex:9999, background:bg[type]||'#6c5ce7',color:type==='gold'?'#2d3436':'#fff', padding:'20px 52px',borderRadius:24,fontSize:26,fontWeight:900, boxShadow:`0 14px 52px ${bg[type]||'#6c5ce7'}60`, animation:'slideDown .5s cubic-bezier(.34,1.56,.64,1)' }}>{msg}</div>
}

function MultBadge({ m }: { m: number }) {
  if (m <= 1) return null
  return <span style={{ display:'inline-block',padding:'4px 16px',borderRadius:24, background:m===3?'linear-gradient(135deg,#e74c3c,#fd79a8)':'linear-gradient(135deg,#fdcb6e,#e17055)', color:m===3?'#fff':'#2d3436',fontSize:15,fontWeight:900, animation:'multPop .5s cubic-bezier(.34,1.56,.64,1)',marginLeft:10 }}>×{m}</span>
}

function FloatPts({ val, color }: { val: number; color: string }) {
  return <div style={{ position:'fixed',left:'50%',top:'35%',transform:'translateX(-50%)',zIndex:9998, fontSize:44,fontWeight:900,color,animation:'floatUp 1.6s ease-out forwards', pointerEvents:'none',textShadow:'0 4px 16px rgba(0,0,0,.25)' }}>{val>0?`+${val}đ`:`${val}đ`}</div>
}

function Overlay({ children, bg }: { children: ReactNode; bg?: string }) {
  return <div style={{ position:'fixed',inset:0,background:bg||'rgba(15,23,42,.6)',backdropFilter:'blur(12px)', display:'flex',alignItems:'center',justifyContent:'center',zIndex:9997,animation:'fadeIn .3s ease' }}>
    <div style={{ animation:'scaleIn .5s cubic-bezier(.34,1.56,.64,1)' }}>{children}</div>
  </div>
}

function Modal({ children }: { children: ReactNode }) {
  return <Overlay><div style={{ background:'#fff',borderRadius:28,padding:'44px 48px',maxWidth:560,width:'92vw', textAlign:'center',boxShadow:'0 24px 80px rgba(0,0,0,.25)' }}>{children}</div></Overlay>
}

// ══════ SPIN WHEEL — BIGGER ══════
function SpinWheel({ items, onResult, title }: { items: WheelItem[]; onResult: (it: WheelItem) => void; title: string }) {
  const [spinning, setSpinning] = useState(false)
  const [rot, setRot] = useState(0)
  const [result, setResult] = useState<WheelItem | null>(null)
  const SIZE = 620
  const R = SIZE/2 - 20; const C = SIZE/2

  const spin = () => {
    if (spinning) return; setSpinning(true); setResult(null)
    const total = items.reduce((s, i) => s + (i.weight||1), 0)
    let r = Math.random()*total; let idx = 0
    for (let i = 0; i < items.length; i++) { r -= (items[i].weight||1); if (r <= 0) { idx = i; break } }
    const seg = 360/items.length
    const target = 360*8 + (360 - idx*seg - seg/2)
    setRot(prev => prev + target)
    setTimeout(() => { setSpinning(false); setResult(items[idx]); onResult(items[idx]) }, 3600)
  }

  const seg = 360/items.length
  return (
    <div style={{ textAlign:'center' }} className="animate-fadeUp">
      <h2 style={{ fontSize:38,fontWeight:900,color:'var(--text)',marginBottom:28 }}>{title}</h2>
      <div style={{ position:'relative',width:SIZE,height:SIZE,margin:'0 auto' }}>
        <div style={{ position:'absolute',top:-26,left:'50%',transform:'translateX(-50%)', width:0,height:0,borderLeft:'20px solid transparent',borderRight:'20px solid transparent', borderTop:'38px solid var(--text)',zIndex:10,filter:'drop-shadow(0 4px 10px rgba(0,0,0,.25))' }} />
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{
          transition:spinning?'transform 3.6s cubic-bezier(.17,.67,.04,.99)':'none',
          transform:`rotate(${rot}deg)`,filter:'drop-shadow(0 10px 36px rgba(0,0,0,.14))'
        }}>
          {items.map((it,i) => {
            const s=(i*seg-90)*Math.PI/180,e=((i+1)*seg-90)*Math.PI/180
            const x1=C+R*Math.cos(s),y1=C+R*Math.sin(s),x2=C+R*Math.cos(e),y2=C+R*Math.sin(e)
            const mid=((i*seg+(i+1)*seg)/2-90)*Math.PI/180
            const tx=C+R*0.6*Math.cos(mid),ty=C+R*0.6*Math.sin(mid),tr=(i*seg+(i+1)*seg)/2
            return <g key={i}>
              <path d={`M${C},${C} L${x1},${y1} A${R},${R} 0 0,1 ${x2},${y2} Z`} fill={it.color} stroke="#fff" strokeWidth="3.5"/>
              <text x={tx} y={ty} fill="#fff" fontSize="20" fontWeight="800" textAnchor="middle" dominantBaseline="middle"
                transform={`rotate(${tr},${tx},${ty})`}>{it.label}</text>
            </g>
          })}
          <circle cx={C} cy={C} r="46" fill="var(--text)"/>
          <text x={C} y={C} fill="#fff" fontSize="30" textAnchor="middle" dominantBaseline="middle">🎰</text>
        </svg>
      </div>
      {!spinning && !result && <button onClick={spin} className="btn-hover animate-glow" style={{
        marginTop:36,padding:'24px 96px',fontSize:34,fontWeight:900,
        background:'linear-gradient(135deg,#6c5ce7,#a855f7)',color:'#fff',
        border:'none',borderRadius:24,boxShadow:'0 10px 40px rgba(108,92,231,.4)'
      }}>🎰 QUAY!</button>}
      {result && <div style={{ marginTop:36,padding:'24px 60px',background:result.color,
        color:['#fdcb6e','#ffeaa7','#55efc4','#b2bec3'].includes(result.color)?'#2d3436':'#fff',
        borderRadius:22,fontSize:38,fontWeight:900,display:'inline-block',
        animation:'scalePop .5s cubic-bezier(.34,1.56,.64,1)',boxShadow:`0 10px 36px ${result.color}50`
      }}>{result.label}</div>}
    </div>
  )
}

// ══════ CARD — NUMBERED, BIGGER ══════
function MemCard({ card, isUp, isMatch, onClick, anim }: { card: CardData; isUp: boolean; isMatch: boolean; onClick: () => void; anim?: string }) {
  const show = isUp || isMatch
  let bg = show ? '#fff' : 'linear-gradient(135deg,#6c5ce7,#a855f7)'
  let border = '3px solid #dfe6e9'
  if (isMatch && card.kind === 'jackpot') { bg = 'linear-gradient(135deg,#ffeaa7,#fdcb6e)'; border = '3px solid #f39c12' }
  if (isMatch && card.kind === 'bomb') { bg = 'linear-gradient(135deg,#fab1a0,#ff6b6b)'; border = '3px solid #e74c3c' }
  if (isMatch && card.kind === 'normal') { bg = 'linear-gradient(135deg,#dfe6e9,#55efc4)'; border = '3px solid #00b894' }
  if (isUp && !isMatch) border = '3px solid #6c5ce7'

  return (
    <div onClick={(!isMatch && !isUp) ? onClick : undefined} style={{
      aspectRatio:'1/1',borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',flexDirection:'column',
      background:bg,border,cursor:(!isMatch&&!isUp)?'pointer':'default',gap:2,
      opacity:isMatch?.35:1,transition:'all .35s cubic-bezier(.34,1.56,.64,1)',userSelect:'none',
      boxShadow:isUp?'0 10px 32px rgba(0,0,0,.18)':'0 4px 16px rgba(0,0,0,.08)',
      fontWeight:900,color:'var(--text)',textAlign:'center',padding:8,
      transform:isUp&&!isMatch?'scale(1.08)':'scale(1)',
      animation: anim || (isUp&&!isMatch ? 'cardFlip .6s ease' : 'none'),
      fontSize: show ? (card.label.length > 6 ? 18 : 36) : 28,
    }}>
      {show ? <span>{card.label}</span> : <span style={{ fontSize:32,color:'#fff',fontWeight:900 }}>{card.num}</span>}
    </div>
  )
}

// ══════ SETTINGS ══════
function SettingsScreen({ cfg, setCfg, onBack }: { cfg: GameConfig; setCfg: (fn: (c: GameConfig) => GameConfig) => void; onBack: () => void }) {
  const [tab, setTab] = useState('teams')
  const u = (key: string, val: any) => setCfg(c => ({ ...c, [key]: val }))
  const IS: React.CSSProperties = { width:'100%',padding:'14px 18px',fontSize:16,border:'2px solid #e2e8f0',borderRadius:14,fontFamily:'Nunito',transition:'border .2s' }
  const CS: React.CSSProperties = { background:'#fff',padding:22,borderRadius:18,border:'2px solid #e2e8f0',marginBottom:14 }
  const tabs = [{id:'teams',icon:'👥',l:'Đội chơi'},{id:'questions',icon:'📋',l:'Câu hỏi'},{id:'reward',icon:'🎰',l:'V.quay Thưởng'},
    {id:'penalty',icon:'⚠️',l:'V.quay Phạt'},{id:'challenges',icon:'❓',l:'Câu hỏi phạt'},{id:'music',icon:'🎵',l:'Đoán nhạc'},{id:'bg',icon:'🔊',l:'Nhạc nền'}]
  const save = () => { LS.set('config', cfg); alert('Đã lưu!') }

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',display:'flex' }}>
      <div style={{ width:230,background:'#fff',borderRight:'2px solid #e2e8f0',padding:'20px 0',display:'flex',flexDirection:'column',gap:2 }}>
        <button onClick={onBack} className="btn-hover" style={{ margin:'0 16px 20px',padding:'12px 18px',fontSize:15,fontWeight:700,background:'#f1f5f9',color:'var(--sub)',border:'none',borderRadius:12,textAlign:'left' }}>← Trở về</button>
        {tabs.map(t => <button key={t.id} onClick={()=>setTab(t.id)} style={{ padding:'14px 22px',fontSize:15,fontWeight:tab===t.id?800:600,background:tab===t.id?'#6c5ce715':'transparent',color:tab===t.id?'var(--accent)':'var(--sub)',border:'none',borderLeft:tab===t.id?'4px solid var(--accent)':'4px solid transparent',textAlign:'left',transition:'all .2s' }}>{t.icon} {t.l}</button>)}
      </div>
      <div style={{ flex:1,padding:36,overflow:'auto' }}>
        <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:32 }}>
          <h1 style={{ fontSize:30,fontWeight:900 }}>⚙️ CÀI ĐẶT (MC)</h1>
          <button onClick={save} className="btn-hover" style={{ padding:'14px 32px',fontSize:16,fontWeight:800,background:'linear-gradient(135deg,#00b894,#55efc4)',color:'#fff',border:'none',borderRadius:14 }}>💾 LƯU</button>
        </div>

        {tab==='teams' && <div>
          <h2 style={{fontSize:24,fontWeight:800,marginBottom:20}}>Danh sách Đội chơi</h2>
          {cfg.teams.map((t,i) => <div key={t.id} style={{...CS,display:'flex',gap:16,alignItems:'center'}}>
            <input type="color" value={t.color} onChange={e=>u('teams',cfg.teams.map((x,j)=>j===i?{...x,color:e.target.value}:x))} style={{width:52,height:52,border:'none',borderRadius:14,cursor:'pointer'}}/>
            <input value={t.name} onChange={e=>u('teams',cfg.teams.map((x,j)=>j===i?{...x,name:e.target.value}:x))} style={{...IS,flex:1}}/>
            {cfg.teams.length>2 && <button onClick={()=>u('teams',cfg.teams.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--red)',fontWeight:700,cursor:'pointer',fontSize:15}}>Xóa</button>}
          </div>)}
          {cfg.teams.length<6 && <button onClick={()=>u('teams',[...cfg.teams,{id:Date.now(),name:`Đội ${cfg.teams.length+1}`,color:'#6c5ce7',score:0}])} className="btn-hover" style={{padding:'10px 24px',fontSize:14,fontWeight:700,background:'var(--accent)',color:'#fff',border:'none',borderRadius:12,marginTop:8}}>+ Thêm đội</button>}
        </div>}

        {tab==='questions' && <div>
          <h2 style={{fontSize:24,fontWeight:800,marginBottom:20}}>Câu hỏi ({cfg.questions.length})</h2>
          <div style={{maxHeight:640,overflow:'auto'}}>
            {cfg.questions.map((q,i) => <div key={q.id} style={CS}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10}}>
                <strong style={{color:'var(--accent)',fontSize:15}}>Câu {q.id} - Vòng {q.round}</strong>
                <select value={q.type} onChange={e=>u('questions',cfg.questions.map((x,j)=>j===i?{...x,type:e.target.value as QType}:x))} style={{padding:'8px 14px',borderRadius:10,border:'2px solid #e2e8f0',fontSize:14,fontWeight:600}}>
                  <option value="mc">Trắc nghiệm</option><option value="tf">Đúng/Sai</option><option value="open">Tự luận</option>
                </select>
              </div>
              <textarea value={q.text} onChange={e=>u('questions',cfg.questions.map((x,j)=>j===i?{...x,text:e.target.value}:x))} style={{...IS,minHeight:70,resize:'vertical'}}/>
              {q.type==='mc' && <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginTop:12}}>
                {(q.options||[]).map((o,oi)=><label key={oi} style={{display:'flex',gap:8,alignItems:'center'}}>
                  <input type="radio" checked={q.answer===oi} onChange={()=>u('questions',cfg.questions.map((x,j)=>j===i?{...x,answer:oi}:x))}/>
                  <input value={o} onChange={e=>{const no=[...(q.options||[])];no[oi]=e.target.value;u('questions',cfg.questions.map((x,j)=>j===i?{...x,options:no}:x))}} style={{...IS,padding:'10px 14px',fontSize:14}}/>
                </label>)}
              </div>}
              {q.type==='tf' && <div style={{marginTop:10,display:'flex',gap:20}}>
                <label style={{fontWeight:600}}><input type="radio" checked={q.answer===true} onChange={()=>u('questions',cfg.questions.map((x,j)=>j===i?{...x,answer:true}:x))}/> Đúng</label>
                <label style={{fontWeight:600}}><input type="radio" checked={q.answer===false} onChange={()=>u('questions',cfg.questions.map((x,j)=>j===i?{...x,answer:false}:x))}/> Sai</label>
              </div>}
              {q.type==='open' && <input value={q.answer||''} placeholder="Đáp án" onChange={e=>u('questions',cfg.questions.map((x,j)=>j===i?{...x,answer:e.target.value}:x))} style={{...IS,marginTop:10,fontSize:14}}/>}
            </div>)}
          </div>
        </div>}

        {tab==='challenges' && <div>
          <h2 style={{fontSize:24,fontWeight:800,marginBottom:12}}>Câu hỏi phạt / bonus</h2>
          <p style={{fontSize:14,color:'var(--mute)',marginBottom:20}}>MC tự đặt câu hỏi. Khi vào thử thách, câu hỏi sẽ random từ danh sách này.</p>
          {cfg.challengeQs.map((c,i)=><div key={i} style={{...CS,display:'flex',gap:10,alignItems:'center'}}>
            <input value={c.q} placeholder="Câu hỏi" onChange={e=>{const n=[...cfg.challengeQs];n[i]={...n[i],q:e.target.value};u('challengeQs',n)}} style={{...IS,flex:2}}/>
            <input value={c.a} placeholder="Đáp án (MC xem)" onChange={e=>{const n=[...cfg.challengeQs];n[i]={...n[i],a:e.target.value};u('challengeQs',n)}} style={{...IS,flex:1}}/>
            <button onClick={()=>u('challengeQs',cfg.challengeQs.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--red)',fontWeight:700,cursor:'pointer'}}>X</button>
          </div>)}
          <button onClick={()=>u('challengeQs',[...cfg.challengeQs,{q:'',a:''}])} className="btn-hover" style={{padding:'10px 24px',fontSize:14,fontWeight:700,background:'var(--accent)',color:'#fff',border:'none',borderRadius:12,marginTop:8}}>+ Thêm</button>
        </div>}

        {tab==='music' && <div>
          <h2 style={{fontSize:24,fontWeight:800,marginBottom:12}}>🎵 Đoán nhạc</h2>
          <p style={{fontSize:14,color:'var(--mute)',marginBottom:20}}>Nhạc random không trùng. Đáp án ẩn, có nút khui. Dán link <b>hoặc</b> tải file mp3 lên.</p>
          {cfg.musicQs.map((m,i)=><div key={i} style={CS}>
            <div style={{display:'flex',gap:10,marginBottom:8,alignItems:'center'}}>
              <input value={m.url} placeholder="Link nhạc (URL) hoặc tải file ↓" onChange={e=>{const n=[...cfg.musicQs];n[i]={...n[i],url:e.target.value};u('musicQs',n)}} style={{...IS,flex:1,fontSize:14}}/>
              <label className="btn-hover" style={{padding:'10px 16px',fontSize:13,fontWeight:700,background:'#6c5ce715',color:'var(--accent)',border:'2px solid var(--accent)',borderRadius:10,cursor:'pointer',whiteSpace:'nowrap'}}>
                📁 Tải file
                <input type="file" accept="audio/*" style={{display:'none'}} onChange={e=>{
                  const file = e.target.files?.[0]
                  if(!file) return
                  if(file.size > 5*1024*1024) { alert('File quá lớn! Tối đa 5MB.'); return }
                  const reader = new FileReader()
                  reader.onload = () => {
                    const n=[...cfg.musicQs]
                    n[i]={...n[i], url: reader.result as string, title: n[i].title || file.name.replace(/\.[^.]+$/,'')}
                    u('musicQs',n)
                  }
                  reader.readAsDataURL(file)
                }}/>
              </label>
              <button onClick={()=>u('musicQs',cfg.musicQs.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--red)',fontWeight:700,cursor:'pointer'}}>Xóa</button>
            </div>
            {m.url && <div style={{marginBottom:8}}><audio controls src={m.url} style={{width:'100%',height:36}}/></div>}
            <input value={m.title} placeholder="Tên bài / đáp án (ẩn khi chơi)" onChange={e=>{const n=[...cfg.musicQs];n[i]={...n[i],title:e.target.value};u('musicQs',n)}} style={{...IS,fontSize:14,background:'#f0fdf4'}}/>
          </div>)}
          <button onClick={()=>u('musicQs',[...cfg.musicQs,{url:'',title:''}])} className="btn-hover" style={{padding:'10px 24px',fontSize:14,fontWeight:700,background:'var(--accent)',color:'#fff',border:'none',borderRadius:12,marginTop:8}}>+ Thêm</button>
        </div>}

        {tab==='bg' && <div>
          <h2 style={{fontSize:24,fontWeight:800,marginBottom:16}}>🔊 Nhạc nền (loop)</h2>
          <p style={{fontSize:14,color:'var(--mute)',marginBottom:20}}>Dán link mp3 hoặc tải file lên. Tự phát lặp khi vào game.</p>
          <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16}}>
            <input value={(cfg.bgMusic||'').startsWith('data:') ? '(File đã tải lên)' : cfg.bgMusic||''} placeholder="Link nhạc nền (URL mp3)" onChange={e=>u('bgMusic',e.target.value)} style={{...IS,flex:1}} readOnly={(cfg.bgMusic||'').startsWith('data:')}/>
            <label className="btn-hover" style={{padding:'12px 20px',fontSize:14,fontWeight:700,background:'#6c5ce715',color:'var(--accent)',border:'2px solid var(--accent)',borderRadius:12,cursor:'pointer',whiteSpace:'nowrap'}}>
              📁 Tải file
              <input type="file" accept="audio/*" style={{display:'none'}} onChange={e=>{
                const file = e.target.files?.[0]
                if(!file) return
                if(file.size > 5*1024*1024) { alert('File quá lớn! Tối đa 5MB.'); return }
                const reader = new FileReader()
                reader.onload = () => u('bgMusic', reader.result as string)
                reader.readAsDataURL(file)
              }}/>
            </label>
            {cfg.bgMusic && <button onClick={()=>u('bgMusic','')} style={{background:'none',border:'none',color:'var(--red)',fontWeight:700,cursor:'pointer'}}>Xóa</button>}
          </div>
          {cfg.bgMusic && <audio controls loop src={cfg.bgMusic} style={{width:'100%'}}/>}
        </div>}

        {(tab==='reward'||tab==='penalty') && <WheelEditor items={tab==='reward'?cfg.rewardWheel:cfg.penaltyWheel} onChange={v=>u(tab==='reward'?'rewardWheel':'penaltyWheel',v)} label={tab==='reward'?'Vòng quay Thưởng':'Vòng quay Phạt'} isPenalty={tab==='penalty'}/>}
      </div>
    </div>
  )
}

function WheelEditor({ items, onChange, label, isPenalty }: { items: WheelItem[]; onChange: (v: WheelItem[]) => void; label: string; isPenalty: boolean }) {
  const types = isPenalty
    ? [{v:'pts',l:'Điểm (+/-)'},{v:'none',l:'Không có gì'},{v:'give',l:'Tặng điểm'},{v:'quiz',l:'Thử thách'},{v:'music',l:'Đoán nhạc'}]
    : [{v:'pts',l:'Điểm (+/-)'},{v:'none',l:'Không có gì'}]
  const totalW = items.reduce((s,it) => s + (it.weight||1), 0)
  return <div>
    <h2 style={{fontSize:24,fontWeight:800,marginBottom:20}}>{label}</h2>
    <div style={{display:'grid',gridTemplateColumns:'48px 1fr 140px 80px 100px 36px',gap:8,alignItems:'center',marginBottom:12,padding:'0 4px'}}>
      <span style={{fontSize:12,fontWeight:700,color:'var(--mute)',textAlign:'center'}}>Màu</span>
      <span style={{fontSize:12,fontWeight:700,color:'var(--mute)'}}>Tên ô</span>
      <span style={{fontSize:12,fontWeight:700,color:'var(--mute)'}}>Loại</span>
      <span style={{fontSize:12,fontWeight:700,color:'var(--mute)',textAlign:'center'}}>Điểm</span>
      <span style={{fontSize:12,fontWeight:700,color:'var(--mute)',textAlign:'center'}}>Tỉ lệ %</span>
      <span></span>
    </div>
    {items.map((it,i) => {
      const pct = Math.round((it.weight||1) / totalW * 100)
      return <div key={i} style={{display:'grid',gridTemplateColumns:'48px 1fr 140px 80px 100px 36px',gap:8,alignItems:'center',marginBottom:8,background:'#fff',padding:'10px 12px',borderRadius:14,border:'2px solid #e2e8f0'}}>
        <input type="color" value={it.color} onChange={e=>{const n=[...items];n[i]={...n[i],color:e.target.value};onChange(n)}} style={{width:40,height:40,border:'none',borderRadius:10,cursor:'pointer'}}/>
        <input value={it.label} onChange={e=>{const n=[...items];n[i]={...n[i],label:e.target.value};onChange(n)}} style={{padding:'10px 14px',fontSize:15,border:'2px solid #e2e8f0',borderRadius:10,fontFamily:'Nunito',width:'100%'}}/>
        <select value={it.type} onChange={e=>{const n=[...items];n[i]={...n[i],type:e.target.value};onChange(n)}} style={{padding:'10px 8px',fontSize:14,border:'2px solid #e2e8f0',borderRadius:10,fontFamily:'Nunito'}}>
          {types.map(t=><option key={t.v} value={t.v}>{t.l}</option>)}
        </select>
        <input type="number" value={it.value} onChange={e=>{const n=[...items];n[i]={...n[i],value:+e.target.value};onChange(n)}} style={{padding:'10px 8px',fontSize:15,border:'2px solid #e2e8f0',borderRadius:10,fontFamily:'Nunito',textAlign:'center',width:'100%'}}/>
        <div style={{display:'flex',alignItems:'center',gap:6,justifyContent:'center'}}>
          <input type="number" value={it.weight||1} min={1} max={20} onChange={e=>{const n=[...items];n[i]={...n[i],weight:Math.max(1,+e.target.value)};onChange(n)}} style={{padding:'10px 6px',fontSize:15,border:'2px solid #e2e8f0',borderRadius:10,fontFamily:'Nunito',textAlign:'center',width:50}}/>
          <span style={{fontSize:13,fontWeight:700,color:'var(--accent)',minWidth:36}}>{pct}%</span>
        </div>
        <button onClick={()=>onChange(items.filter((_,j)=>j!==i))} style={{background:'none',border:'none',color:'var(--red)',fontWeight:800,cursor:'pointer',fontSize:18}}>✕</button>
      </div>
    })}
    <button onClick={()=>onChange([...items,{label:'Mới',type:'pts',value:10,color:'#6c5ce7',weight:1}])} className="btn-hover" style={{marginTop:14,padding:'12px 28px',fontSize:15,fontWeight:700,background:'var(--accent)',color:'#fff',border:'none',borderRadius:12}}>+ Thêm ô</button>
  </div>
}

// ══════ RULES ══════
function RulesScreen({ onBack, teams }: { onBack: () => void; teams: Team[] }) {
  return <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#f0f2f8,#fff)',padding:36,maxWidth:840,margin:'0 auto'}}>
    <button onClick={onBack} className="btn-hover" style={{padding:'12px 22px',fontSize:15,fontWeight:700,background:'#f1f5f9',color:'var(--sub)',border:'none',borderRadius:12,marginBottom:28}}>← Quay lại</button>
    <h1 style={{fontSize:40,fontWeight:900,textAlign:'center',marginBottom:36}}>📖 LUẬT CHƠI</h1>
    {[
      {i:'🎯',t:'Mục tiêu',d:'Đội có điểm cao nhất khi hết 30 câu hỏi thắng!'},
      {i:'🎮',t:'Cách chơi',d:`${teams.length} đội luân phiên. Mỗi lượt = 1 câu hỏi.\n• ĐÚNG: +5đ × hệ số vòng + lật 2 thẻ\n• SAI: Quay vòng quay Hình phạt`},
    ].map((s,i) => <div key={i} style={{background:'#fff',padding:28,borderRadius:22,marginBottom:18,boxShadow:'var(--shadow)',animation:`fadeUp .5s ease ${i*.1}s both`}}>
      <h3 style={{fontSize:22,fontWeight:800,color:'var(--accent)',marginBottom:10}}>{s.i} {s.t}</h3>
      <p style={{fontSize:16,color:'var(--sub)',lineHeight:1.8,whiteSpace:'pre-line'}}>{s.d}</p>
    </div>)}
    <div style={{background:'linear-gradient(135deg,#6c5ce710,#a855f710)',padding:30,borderRadius:22,marginBottom:18,border:'2px solid #6c5ce730'}}>
      <h3 style={{fontSize:22,fontWeight:800,color:'var(--accent)',marginBottom:10}}>🃏 Luật lật thẻ ĐẶC BIỆT</h3>
      <p style={{fontSize:16,color:'var(--text)',lineHeight:1.8,marginBottom:18}}>
        ⚠️ Thẻ lật lên <strong>KHÔNG BAO GIỜ úp lại!</strong><br/>
        • Thẻ được <strong>đánh số</strong> để dễ nhớ vị trí.<br/>
        • 2 thẻ cùng loại (cùng hình) = KHỚP → nhận thưởng/phạt.<br/>
        • Nếu không khớp, vẫn check với thẻ đã lật trước → có thể khớp!<br/>
        • <strong>Bất kỳ 2 thẻ 💣 nào</strong> đều khớp nhau (không cần cùng cặp).<br/>
        • <strong>Bất kỳ 2 thẻ 🎰 nào</strong> đều khớp nhau (không cần cùng cặp).
      </p>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:14}}>
        {[{e:'🎴',n:'Thẻ thường',d:`+10đ × hệ số\n+ Quay thưởng`,c:'#00b894'},
          {e:'💣',n:'Bom (4 thẻ)',d:`-30đ × hệ số\nLuôn active`,c:'#e74c3c'},
          {e:'🎰',n:'Nổ Hủ (6 thẻ)',d:`+100đ × hệ số\nLuôn active`,c:'#f39c12'}
        ].map((c,i) => <div key={i} style={{background:'#fff',padding:22,borderRadius:18,textAlign:'center',border:`2px solid ${c.c}25`}}>
          <div style={{fontSize:44,marginBottom:8}}>{c.e}</div>
          <div style={{fontSize:16,fontWeight:800,color:c.c}}>{c.n}</div>
          <div style={{fontSize:13,color:'var(--sub)',whiteSpace:'pre-line',marginTop:6}}>{c.d}</div>
        </div>)}
      </div>
    </div>
    <div style={{background:'#fff',padding:28,borderRadius:22,marginBottom:18,boxShadow:'var(--shadow)'}}>
      <h3 style={{fontSize:22,fontWeight:800,marginBottom:16}}>🔥 Hệ số nhân</h3>
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
        {[1,2,3].map(r=><div key={r} style={{padding:'16px 20px',borderRadius:14,background:'#f8fafc',textAlign:'center'}}>
          <span style={{padding:'6px 16px',borderRadius:10,background:r===1?'#00b894':r===2?'#fdcb6e':'#ff6b6b',color:r===2?'#2d3436':'#fff',fontSize:14,fontWeight:800}}>Vòng {r}</span>
          <div style={{fontSize:28,fontWeight:900,color:r===3?'#e74c3c':r===2?'#e17055':'#00b894',marginTop:8}}>×{RC[r].mult}</div>
          <div style={{fontSize:13,color:'var(--sub)',marginTop:4}}>⏱️ {RC[r].timer}s</div>
        </div>)}
      </div>
    </div>
  </div>
}

// ══════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════
export default function App() {
  const [loaded, setLoaded] = useState(false)
  const [screen, setScreen] = useState<string>('welcome')
  const [cfg, setCfg] = useState<GameConfig>({ ...DEF_CFG })
  const [teams, setTeams] = useState<Team[]>([])
  const [tidx, setTidx] = useState(0)
  const [round, setRound] = useState(1)
  const [qIdx, setQIdx] = useState(0)
  const [phase, setPhase] = useState('start')
  const [timer, setTimer] = useState(0)
  const [timerOn, setTimerOn] = useState(false)
  const [cards, setCards] = useState<CardData[]>([])
  const [faceUp, setFaceUp] = useState<Set<number>>(new Set())
  const [matched, setMatched] = useState<Set<number>>(new Set())
  const [picks, setPicks] = useState<number[]>([])
  const [toast, setToast] = useState<{msg:string;type:string}|null>(null)
  const [showAns, setShowAns] = useState(false)
  const [modal, setModal] = useState<any>(null)
  const [overlay, setOverlay] = useState('')
  const [floats, setFloats] = useState<{val:number;color:string;id:number}[]>([])
  const [cardAnim, setCardAnim] = useState<Record<number,string>>({})
  const [usedMusic, setUsedMusic] = useState<Set<number>>(new Set())
  const [showMusicAns, setShowMusicAns] = useState(false)
  const tRef = useRef<any>(null)
  const bgRef = useRef<HTMLAudioElement|null>(null)

  const team = teams[tidx] || teams[0]
  const rc = RC[round] || RC[1]
  const q = cfg.questions[qIdx]
  const mult = rc.mult
  const mp = (base: number) => base * mult

  useEffect(() => {
    try {
      // Clear stale data from old versions
      const ver = LS.get('version')
      if (ver !== 3) {
        LS.del('gameState'); LS.del('config')
        LS.set('version', 3)
      }
      const saved = LS.get('config')
      if (saved && saved.teams && saved.questions) setCfg(saved)
      const gs = LS.get('gameState')
      // Validate: cards must have matchKey (new format)
      if (gs && gs.cards && gs.cards[0]?.matchKey && gs.qIdx < (saved||DEF_CFG).questions.length) {
        setTeams(gs.teams); setTidx(gs.tidx); setRound(gs.round); setQIdx(gs.qIdx)
        setPhase(gs.phase); setCards(gs.cards); setFaceUp(new Set(gs.faceUp||[])); setMatched(new Set(gs.matched||[]))
        setScreen('game')
      } else {
        LS.del('gameState') // discard incompatible save
      }
    } catch (e) {
      console.error('Load error, resetting:', e)
      LS.del('gameState'); LS.del('config')
    }
    setLoaded(true)
  }, [])

  const saveState = useCallback(() => {
    if (screen==='game') LS.set('gameState',{teams,tidx,round,qIdx,phase,cards,faceUp:[...faceUp],matched:[...matched]})
  },[screen,teams,tidx,round,qIdx,phase,cards,faceUp,matched])
  useEffect(()=>{if(loaded)saveState()},[saveState,loaded])
  useEffect(()=>{if(loaded)LS.set('config',cfg)},[cfg,loaded])

  useEffect(()=>{
    if(timerOn&&timer>0){tRef.current=setTimeout(()=>setTimer(t=>t-1),1000);return()=>clearTimeout(tRef.current)}
    if(timerOn&&timer===0){setTimerOn(false);doWrong()}
  },[timerOn,timer])

  useEffect(()=>{if(floats.length>0){const t=setTimeout(()=>setFloats([]),2000);return()=>clearTimeout(t)}},[floats])

  useEffect(()=>{
    if(screen==='game'&&cfg.bgMusic){
      if(!bgRef.current){bgRef.current=new Audio(cfg.bgMusic);bgRef.current.loop=true;bgRef.current.volume=0.25}
      bgRef.current.play().catch(()=>{})
    } else { bgRef.current?.pause() }
    return ()=>{bgRef.current?.pause()}
  },[screen,cfg.bgMusic])

  const addPts = (tid: number, pts: number) => setTeams(ts=>ts.map(t=>t.id===tid?{...t,score:t.score+pts}:t))
  const notify = (msg: string, type: string) => setToast({msg,type})
  const showFloat = (val: number, color='#00b894') => setFloats([{val,color,id:Date.now()}])

  const startGame = () => {
    const t = cfg.teams.map(x=>({...x,score:0}))
    setTeams(t);setTidx(0);setRound(1);setQIdx(0);setPhase('start')
    setCards(buildCards());setFaceUp(new Set());setMatched(new Set());setPicks([]);setCardAnim({});setUsedMusic(new Set())
    setScreen('game')
  }
  const resumeGame = () => {
    const gs = LS.get('gameState')
    if(gs&&gs.cards&&gs.cards[0]?.matchKey&&gs.qIdx<cfg.questions.length){
      setTeams(gs.teams);setTidx(gs.tidx);setRound(gs.round);setQIdx(gs.qIdx);setPhase(gs.phase)
      setCards(gs.cards);setFaceUp(new Set(gs.faceUp||[]));setMatched(new Set(gs.matched||[]));setScreen('game')
    } else startGame()
  }

  const doCorrect = () => {setTimerOn(false);const pts=mp(5);addPts(team.id,pts);notify(`✅ CHÍNH XÁC! +${pts}đ`,'success');showFloat(pts);setShowAns(true);setPhase('correct')}
  const doWrong = () => {setTimerOn(false);notify('❌ SAI RỒI!','error');setShowAns(true);setPhase('wrong')}
  const doSkip = () => {setTimerOn(false);setShowAns(true);setPhase('skip')}

  const goFlip = () => {setShowAns(false);const fd=cards.filter(c=>!faceUp.has(c.id)&&!matched.has(c.id)).length;if(fd>=2){setPhase('flip');setPicks([])}else endTurn()}
  const goPenalty = () => {setShowAns(false);setPhase('penalty')}
  const goNext = () => {setShowAns(false);endTurn()}

  // ══════ CARD MATCHING LOGIC (FIXED) ══════
  const clickCard = (cid: number) => {
    if(faceUp.has(cid)||matched.has(cid)||picks.length>=2) return
    const np = [...picks, cid]; setPicks(np)
    const nf = new Set(faceUp); nf.add(cid); setFaceUp(nf)

    if(np.length === 2) {
      const c1 = cards.find(c=>c.id===np[0])!
      const c2 = cards.find(c=>c.id===np[1])!

      setTimeout(() => {
        // Check direct match: same matchKey
        if(c1.matchKey === c2.matchKey) {
          const nm = new Set(matched); nm.add(c1.id); nm.add(c2.id); setMatched(nm)
          resolveMatch(c1, [c1.id, c2.id])
        } else {
          // Check BOTH cards against all previously face-up unmatched cards
          const prevUp = [...nf].filter(id => !matched.has(id) && id !== c1.id && id !== c2.id)
          
          let match1: CardData | null = null // match for c1
          let match2: CardData | null = null // match for c2
          
          for(const fid of prevUp) {
            const fc = cards.find(c=>c.id===fid)!
            if(!match1 && fc.matchKey === c1.matchKey) match1 = fc
            if(!match2 && fc.matchKey === c2.matchKey && fc.id !== match1?.id) match2 = fc
          }
          
          if(match1 && match2) {
            // BOTH cards match different previous cards! Score both, endTurn once.
            const nm = new Set(matched)
            nm.add(match1.id); nm.add(c1.id); nm.add(match2.id); nm.add(c2.id)
            setMatched(nm)
            // Score first match
            const pts1 = scorePts(c1)
            addPts(team.id, pts1)
            animateCard(c1, [match1.id, c1.id])
            if(c1.kind==='jackpot') fireConfetti()
            if(c1.kind==='bomb') fireBomb()
            // Score second match after delay
            setTimeout(() => {
              const pts2 = scorePts(c2)
              addPts(team.id, pts2)
              animateCard(c2, [match2!.id, c2.id])
              if(c2.kind==='jackpot') fireConfetti()
              if(c2.kind==='bomb') fireBomb()
              // Show combined result
              const totalPts = pts1 + pts2
              const hasSpecial = c1.kind!=='normal' || c2.kind!=='normal'
              if(hasSpecial) {
                setSpecialFX({type: (c1.kind==='jackpot'||c2.kind==='jackpot') ? 'jackpot' : 'bomb', pts: totalPts})
              }
              notify(`🎯 COMBO x2! ${totalPts>0?'+':''}${totalPts}đ`, totalPts>0?'gold':'bomb')
              showFloat(totalPts, totalPts>0?'#f39c12':'#e74c3c')
            }, 1200)
            // EndTurn once after everything
            setTimeout(() => endTurn(), 4000)
          } else if(match1) {
            // Only c1 matches a previous card
            const nm = new Set(matched); nm.add(match1.id); nm.add(c1.id); setMatched(nm)
            resolveMatch(c1, [match1.id, c1.id])
          } else if(match2) {
            // Only c2 matches a previous card
            const nm = new Set(matched); nm.add(match2.id); nm.add(c2.id); setMatched(nm)
            resolveMatch(c2, [match2.id, c2.id])
          } else {
            notify('Chưa khớp! Thẻ vẫn ngửa.','info')
            setTimeout(()=>endTurn(),1600)
          }
        }
        setPicks([])
      }, 900)
    }
  }

  // Helpers for card scoring
  const scorePts = (card: CardData): number => {
    if(card.kind==='jackpot') return mp(100)
    if(card.kind==='bomb') return mp(-30)
    return mp(10)
  }
  const animateCard = (card: CardData, ids: number[]) => {
    if(card.kind==='jackpot') setCardAnim(prev=>{const n={...prev};ids.forEach(id=>n[id]='jackpotGlow 1.5s ease infinite');return n})
    else if(card.kind==='bomb') setCardAnim(prev=>{const n={...prev};ids.forEach(id=>n[id]='bombExplode .8s ease');return n})
    else setCardAnim(prev=>{const n={...prev};ids.forEach(id=>n[id]='scalePop .5s ease');return n})
  }

  // Special effect overlays
  const [specialFX, setSpecialFX] = useState<{type:'jackpot'|'bomb';pts:number}|null>(null)
  useEffect(()=>{if(specialFX){const t=setTimeout(()=>setSpecialFX(null),3000);return()=>clearTimeout(t)}},[specialFX])

  const resolveMatch = (card: CardData, ids: number[]) => {
    if(card.kind==='jackpot') {
      // ALWAYS active — nổ hủ luôn là nổ hủ!
      const pts=mp(100)
      addPts(team.id,pts)
      setSpecialFX({type:'jackpot',pts})
      setCardAnim(prev=>{const n={...prev};ids.forEach(id=>n[id]='jackpotGlow 1.5s ease infinite');return n})
      fireConfetti();setTimeout(()=>fireConfetti(),400);setTimeout(()=>fireConfetti(),800)
      setTimeout(()=>endTurn(),3500)
    } else if(card.kind==='bomb') {
      // ALWAYS active — bom luôn là bom!
      const pts=mp(-30)
      addPts(team.id,pts)
      setSpecialFX({type:'bomb',pts})
      setCardAnim(prev=>{const n={...prev};ids.forEach(id=>n[id]='bombExplode .8s ease');return n})
      fireBomb();setTimeout(()=>fireBomb(),400)
      setTimeout(()=>endTurn(),3500)
    } else {
      const pts=mp(10);addPts(team.id,pts);notify(`🎴 GHÉP ĐÚNG! +${pts}đ`,'success');showFloat(pts)
      setCardAnim(prev=>{const n={...prev};ids.forEach(id=>n[id]='scalePop .5s ease');return n})
      setTimeout(()=>setPhase('reward'),1800)
    }
  }

  // ══════ WHEELS ══════
  const onReward = (it: WheelItem) => {
    setTimeout(()=>{
      if(it.type==='pts'){const pts=mp(it.value);addPts(team.id,pts);notify(`+${pts}đ!`,'success');showFloat(pts);setTimeout(()=>endTurn(),1600)}
      else if(it.type==='none'){notify('Rất tiếc!','info');setTimeout(()=>endTurn(),1600)}
      else {setTimeout(()=>endTurn(),1600)}
    },900)
  }
  const onPenalty = (it: WheelItem) => {
    setTimeout(()=>{
      if(it.type==='pts'){const pts=mp(it.value);addPts(team.id,pts);notify(`${pts}đ!`,'error');showFloat(pts,'#ff6b6b');setTimeout(()=>endTurn(),1600)}
      else if(it.type==='none'){notify('🎉 Thoát phạt!','success');setTimeout(()=>endTurn(),1600)}
      else if(it.type==='give'){setModal({k:'give',v:mp(it.value)})}
      else if(it.type==='quiz'){openChallenge(false,mp(it.value))}
      else if(it.type==='music'){openMusic(mp(it.value))}
    },900)
  }

  const openChallenge = (isR: boolean, val: number) => {
    const pool=cfg.challengeQs.filter(c=>c.q)
    if(!pool.length){notify('Chưa có câu hỏi phạt!','info');setTimeout(()=>endTurn(),1000);return}
    setModal({k:'quiz',q:pool[Math.floor(Math.random()*pool.length)],rw:isR,v:val})
  }

  // Music: random without repeat
  const openMusic = (val: number) => {
    const pool=cfg.musicQs.filter((m,i)=>(m.url||m.title)&&!usedMusic.has(i))
    if(!pool.length){
      // Reset if all used
      setUsedMusic(new Set())
      const allPool=cfg.musicQs.filter(m=>m.url||m.title)
      if(!allPool.length){notify('Chưa có nhạc!','info');setTimeout(()=>endTurn(),1000);return}
      const pick=allPool[Math.floor(Math.random()*allPool.length)]
      const idx=cfg.musicQs.indexOf(pick)
      setUsedMusic(new Set([idx]))
      setShowMusicAns(false)
      setModal({k:'music',q:pick,v:val})
      return
    }
    const pickIdx=Math.floor(Math.random()*pool.length)
    const pick=pool[pickIdx]
    const realIdx=cfg.musicQs.indexOf(pick)
    setUsedMusic(prev=>new Set(prev).add(realIdx))
    setShowMusicAns(false)
    setModal({k:'music',q:pick,v:val})
  }

  const mOk = () => {
    if(modal.k==='quiz'||modal.k==='music'){
      if(modal.rw){addPts(team.id,Math.abs(modal.v));notify(`+${Math.abs(modal.v)}đ!`,'success');showFloat(Math.abs(modal.v))}
      else notify('Thoát phạt!','success')
    }
    setModal(null);setShowMusicAns(false);setTimeout(()=>endTurn(),1000)
  }
  const mFail = () => {
    if(modal.k==='quiz'||modal.k==='music'){
      if(!modal.rw){addPts(team.id,modal.v);notify(`${modal.v}đ!`,'error');showFloat(modal.v,'#ff6b6b')}
      else notify('Tiếc!','info')
    }
    setModal(null);setShowMusicAns(false);setTimeout(()=>endTurn(),1000)
  }
  const mSkip = () => {setModal(null);setShowMusicAns(false);setTimeout(()=>endTurn(),800)}
  const giveTeam = (tid: number) => {
    addPts(tid,modal.v);const t=teams.find(x=>x.id===tid)!
    notify(`🎁 ${t.name} +${modal.v}đ!`,'info');showFloat(modal.v,'#fdcb6e')
    setModal(null);setTimeout(()=>endTurn(),1500)
  }

  const endTurn = () => {
    const n=qIdx+1
    if(n>=cfg.questions.length){LS.del('gameState');bgRef.current?.pause();setScreen('over');return}
    const nq=cfg.questions[n]
    if(nq.round!==round){
      setRound(nq.round);setOverlay(`VÒNG ${nq.round}: ${RC[nq.round].name.toUpperCase()}`);setPhase('trans')
      setQIdx(n);setTidx((tidx+1)%teams.length)
      setTimeout(()=>{setOverlay('');setPhase('start')},3500)
    } else {setQIdx(n);setTidx((tidx+1)%teams.length);setPhase('start')}
    setPicks([]);setShowAns(false)
  }

  // ══════ RENDER ══════
  if(!loaded) return <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',fontSize:24,fontWeight:700}}>Đang tải...</div>

  if(screen==='welcome') return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(160deg,#e8e0f0,#d6e4f7,#ddf5ee)',padding:36}}>
      <div className="animate-bounce" style={{marginBottom:28}}><span style={{fontSize:96,filter:'drop-shadow(0 6px 18px rgba(0,0,0,.12))'}}>🧠</span></div>
      <h1 style={{fontSize:60,fontWeight:900,background:'linear-gradient(135deg,#6c5ce7,#a855f7,#fd79a8)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',textAlign:'center',lineHeight:1.1,marginBottom:10}}>Memory Quiz<br/>Showdown</h1>
      <p style={{fontSize:17,color:'var(--sub)',marginBottom:44,fontWeight:600}}>Ôn tập Quản trị học — Chương 6</p>
      <div style={{display:'flex',flexDirection:'column',gap:16,width:'100%',maxWidth:420}}>
        <button onClick={startGame} className="btn-hover" style={{padding:'22px',fontSize:24,fontWeight:900,background:'linear-gradient(135deg,#6c5ce7,#a855f7)',color:'#fff',border:'none',borderRadius:20,boxShadow:'0 12px 44px rgba(108,92,231,.35)'}}>▶ CHƠI MỚI</button>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
          <button onClick={resumeGame} className="btn-hover" style={{padding:'18px',fontSize:17,fontWeight:700,background:'#fff',color:'var(--sub)',border:'2px solid #e2e8f0',borderRadius:16}}>↻ Tiếp tục</button>
          <button onClick={()=>setScreen('rules')} className="btn-hover" style={{padding:'18px',fontSize:17,fontWeight:700,background:'#fff',color:'var(--sub)',border:'2px solid #e2e8f0',borderRadius:16}}>📖 Luật chơi</button>
        </div>
        <button onClick={()=>setScreen('settings')} className="btn-hover" style={{padding:'18px',fontSize:17,fontWeight:700,background:'var(--text)',color:'#fff',border:'none',borderRadius:16}}>⚙️ Cài đặt (MC)</button>
      </div>
      <div style={{display:'flex',gap:14,marginTop:32,background:'#fff',padding:'16px 32px',borderRadius:18,boxShadow:'var(--shadow)'}}>
        {cfg.teams.map(t=><span key={t.id} style={{display:'flex',alignItems:'center',gap:8}}><span style={{width:14,height:14,borderRadius:'50%',background:t.color}}/><span style={{fontWeight:700,fontSize:15}}>{t.name}</span></span>)}
      </div>
    </div>
  )

  if(screen==='rules') return <RulesScreen onBack={()=>setScreen('welcome')} teams={cfg.teams}/>
  if(screen==='settings') return <SettingsScreen cfg={cfg} setCfg={setCfg} onBack={()=>setScreen('welcome')}/>

  if(screen==='over'){
    const sorted=[...teams].sort((a,b)=>b.score-a.score)
    return <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'linear-gradient(160deg,#fef9c3,#fde68a)',padding:36}}>
      <span style={{fontSize:100,animation:'bounce 2s infinite'}}>🏆</span>
      <h1 style={{fontSize:52,fontWeight:900,margin:'16px 0'}} className="animate-fadeUp">KẾT THÚC!</h1>
      <h2 style={{fontSize:34,fontWeight:800,color:'#92400e',marginBottom:40}} className="animate-fadeUp">🎉 {sorted[0].name} CHIẾN THẮNG!</h2>
      <div style={{display:'flex',gap:28,marginBottom:44,flexWrap:'wrap',justifyContent:'center'}}>
        {sorted.map((t,i)=><div key={t.id} style={{padding:'28px 40px',background:'#fff',borderRadius:26,boxShadow:'var(--shadow-lg)',textAlign:'center',border:i===0?'4px solid #f39c12':'2px solid #e2e8f0',transform:i===0?'scale(1.12)':'scale(1)',animation:`scaleIn .5s ease ${i*.15}s both`}}>
          <div style={{fontSize:44}}>{['🥇','🥈','🥉'][i]}</div>
          <div style={{fontSize:22,fontWeight:800,color:t.color,marginTop:8}}>{t.name}</div>
          <div style={{fontSize:44,fontWeight:900}}>{t.score}đ</div>
        </div>)}
      </div>
      <button onClick={()=>{LS.del('gameState');setScreen('welcome')}} className="btn-hover" style={{padding:'18px 56px',fontSize:22,fontWeight:800,background:'var(--accent)',color:'#fff',border:'none',borderRadius:18}}>🔄 Về trang chủ</button>
    </div>
  }

  // ══════ GAME SCREEN ══════
  const ansText = () => {if(!q)return '';if(q.type==='mc')return `${['A','B','C','D'][q.answer]}. ${(q.options||[])[q.answer]}`;if(q.type==='tf')return q.answer?'ĐÚNG ✅':'SAI ❌';return q.answer}

  const renderQ = () => {
    if(!q) return null
    return <div style={{width:'100%',maxWidth:1100,margin:'0 auto'}} className="animate-fadeUp">
      <div style={{background:'#fff',borderRadius:22,padding:'44px 52px',marginBottom:24,boxShadow:'var(--shadow)',border:'2px solid #e2e8f0',textAlign:'center'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,marginBottom:20}}>
          <span style={{fontSize:16,fontWeight:700,color:'var(--accent)',background:'#6c5ce715',padding:'6px 20px',borderRadius:10}}>{q.type==='mc'?'Trắc nghiệm':q.type==='tf'?'Đúng / Sai':'Tự luận'}</span>
          <MultBadge m={mult}/>
        </div>
        <p style={{fontSize:38,fontWeight:800,color:'var(--text)',lineHeight:1.45}}>{q.text}</p>
      </div>
      {phase==='wait'&&<>
        {q.type==='mc'&&<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:18,maxWidth:1100,margin:'0 auto'}}>
          {(q.options||[]).map((o,i)=><button key={i} onClick={()=>i===q.answer?doCorrect():doWrong()} className="btn-hover" style={{padding:'28px 32px',fontSize:26,fontWeight:700,background:'#fff',color:'var(--text)',border:'2px solid #e2e8f0',borderRadius:20,textAlign:'center'}}>
            <span style={{color:'var(--accent)',marginRight:14,fontWeight:900,fontSize:28}}>{['A','B','C','D'][i]}.</span>{o}</button>)}
        </div>}
        {q.type==='tf'&&<div style={{display:'flex',gap:20,justifyContent:'center'}}>
          <button onClick={()=>q.answer===true?doCorrect():doWrong()} className="btn-hover" style={{padding:'24px 72px',fontSize:28,fontWeight:800,background:'var(--green)',color:'#fff',border:'none',borderRadius:20}}>✅ ĐÚNG</button>
          <button onClick={()=>q.answer===false?doCorrect():doWrong()} className="btn-hover" style={{padding:'24px 72px',fontSize:28,fontWeight:800,background:'var(--red)',color:'#fff',border:'none',borderRadius:20}}>❌ SAI</button>
        </div>}
        {q.type==='open'&&<div style={{display:'flex',gap:20,justifyContent:'center'}}>
          <button onClick={doCorrect} className="btn-hover" style={{padding:'20px 52px',fontSize:22,fontWeight:800,background:'var(--green)',color:'#fff',border:'none',borderRadius:16}}>✅ Đúng</button>
          <button onClick={doWrong} className="btn-hover" style={{padding:'20px 52px',fontSize:22,fontWeight:800,background:'var(--red)',color:'#fff',border:'none',borderRadius:16}}>❌ Sai</button>
        </div>}
      </>}
      {showAns&&<div style={{background:'#f0fdf4',border:'2px solid var(--green)',borderRadius:18,padding:'24px 36px',textAlign:'center',marginTop:20,animation:'scaleIn .3s ease'}}>
        <p style={{fontSize:16,color:'var(--green)',fontWeight:700}}>ĐÁP ÁN:</p>
        <p style={{fontSize:32,fontWeight:900,color:'var(--text)'}}>{ansText()}</p></div>}
    </div>
  }

  const renderStage = () => {
    switch(phase) {
      case 'start': return <div style={{textAlign:'center',padding:48}} className="animate-fadeUp">
        <p style={{fontSize:20,color:'var(--sub)',marginBottom:14}}>Lượt tiếp theo</p>
        <div style={{fontSize:48,fontWeight:900,color:team.color,marginBottom:10,animation:'scaleIn .5s cubic-bezier(.34,1.56,.64,1)'}}>🎯 {team.name}</div>
        <MultBadge m={mult}/>
        <div style={{marginTop:32}}><button onClick={()=>setPhase('showQ')} className="btn-hover" style={{padding:'20px 60px',fontSize:24,fontWeight:800,background:team.color,color:'#fff',border:'none',borderRadius:18,boxShadow:`0 8px 32px ${team.color}40`}}>📋 Hiện câu hỏi</button></div>
      </div>
      case 'showQ': return <div style={{padding:24,textAlign:'center'}}>{renderQ()}
        <div style={{marginTop:20,display:'flex',gap:14,justifyContent:'center'}}>
          <button onClick={()=>{setTimer(rc.timer);setTimerOn(true);setPhase('wait')}} className="btn-hover animate-glow" style={{padding:'18px 52px',fontSize:22,fontWeight:800,background:'linear-gradient(135deg,#6c5ce7,#a855f7)',color:'#fff',border:'none',borderRadius:18}}>⏱️ Bắt đầu</button>
          <button onClick={doSkip} className="btn-hover" style={{padding:'14px 28px',fontSize:15,fontWeight:700,background:'#f1f5f9',color:'var(--sub)',border:'none',borderRadius:14}}>⏭️ Bỏ qua</button>
        </div></div>
      case 'wait': return <div style={{padding:24}}>{renderQ()}<div style={{textAlign:'center',marginTop:14}}><button onClick={doSkip} className="btn-hover" style={{padding:'10px 24px',fontSize:14,fontWeight:700,background:'#f1f5f9',color:'var(--sub)',border:'none',borderRadius:12}}>⏭️ Bỏ qua</button></div></div>
      case 'correct': return <div style={{padding:24,textAlign:'center'}}>{renderQ()}<button onClick={goFlip} className="btn-hover animate-pulse" style={{marginTop:20,padding:'20px 60px',fontSize:24,fontWeight:800,background:'var(--green)',color:'#fff',border:'none',borderRadius:18}}>🃏 Lật thẻ!</button></div>
      case 'wrong': return <div style={{padding:24,textAlign:'center'}}>{renderQ()}<button onClick={goPenalty} className="btn-hover" style={{marginTop:20,padding:'20px 60px',fontSize:24,fontWeight:800,background:'var(--red)',color:'#fff',border:'none',borderRadius:18,animation:'shake .5s ease'}}>🎰 Vòng quay Phạt</button></div>
      case 'skip': return <div style={{padding:24,textAlign:'center'}}>{renderQ()}<button onClick={goNext} className="btn-hover" style={{marginTop:20,padding:'16px 48px',fontSize:20,fontWeight:700,background:'#f1f5f9',color:'var(--sub)',border:'none',borderRadius:16}}>➡️ Tiếp</button></div>
      case 'flip': {
        const fd=cards.filter(c=>!faceUp.has(c.id)&&!matched.has(c.id)).length
        return <div style={{padding:16}} className="animate-fadeUp">
          <div style={{textAlign:'center',marginBottom:16}}>
            <span style={{fontSize:24,fontWeight:800,color:team.color,background:`${team.color}10`,padding:'12px 32px',borderRadius:16,border:`2px solid ${team.color}25`}}>🃏 {team.name} — Chọn 2 thẻ! ({fd} úp) <MultBadge m={mult}/></span>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,maxWidth:1100,margin:'0 auto'}}>
            {cards.map(c=><MemCard key={c.id} card={c} isUp={faceUp.has(c.id)} isMatch={matched.has(c.id)} onClick={()=>clickCard(c.id)} anim={cardAnim[c.id]}/>)}
          </div>
          <div style={{textAlign:'center',marginTop:16}}><button onClick={()=>{setPicks([]);endTurn()}} className="btn-hover" style={{padding:'10px 24px',fontSize:14,fontWeight:700,background:'#f1f5f9',color:'var(--sub)',border:'none',borderRadius:12}}>⏭️ Bỏ qua</button></div>
        </div>
      }
      case 'reward': return <div style={{padding:20}}><SpinWheel items={cfg.rewardWheel} onResult={onReward} title="🎰 VÒNG QUAY MAY MẮN"/></div>
      case 'penalty': return <div style={{padding:20}}><SpinWheel items={cfg.penaltyWheel} onResult={onPenalty} title="⚡ VÒNG QUAY HÌNH PHẠT"/></div>
      default: return null
    }
  }

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)',display:'flex',flexDirection:'column'}}>
      {toast&&<Toast msg={toast.msg} type={toast.type} onDone={()=>setToast(null)}/>}
      {floats.map(f=><FloatPts key={f.id} val={f.val} color={f.color}/>)}

      {/* SPECIAL FX — Jackpot / Bomb full-screen animation */}
      {specialFX && specialFX.type==='jackpot' && (
        <div style={{position:'fixed',inset:0,zIndex:9996,display:'flex',alignItems:'center',justifyContent:'center',
          background:'radial-gradient(circle,rgba(253,203,110,.3) 0%,rgba(243,156,18,.15) 50%,transparent 70%)',
          animation:'fadeIn .3s ease',pointerEvents:'none'}}>
          <div style={{textAlign:'center',animation:'scaleIn .6s cubic-bezier(.34,1.56,.64,1)'}}>
            <div style={{fontSize:120,animation:'bounce 0.6s ease',filter:'drop-shadow(0 0 40px rgba(243,156,18,.8))'}}>🎰</div>
            <div style={{fontSize:64,fontWeight:900,color:'#f39c12',textShadow:'0 0 30px rgba(243,156,18,.6), 0 4px 16px rgba(0,0,0,.3)',
              animation:'jackpotGlow 1s ease infinite',marginTop:8}}>NỔ HỦ!</div>
            <div style={{fontSize:72,fontWeight:900,color:'#fff',textShadow:'0 0 40px rgba(243,156,18,.8), 0 6px 20px rgba(0,0,0,.4)',
              animation:'scalePop .8s cubic-bezier(.34,1.56,.64,1) .3s both',marginTop:4}}>+{specialFX.pts}đ</div>
          </div>
        </div>
      )}
      {specialFX && specialFX.type==='bomb' && (
        <div style={{position:'fixed',inset:0,zIndex:9996,display:'flex',alignItems:'center',justifyContent:'center',
          background:'radial-gradient(circle,rgba(231,76,60,.3) 0%,rgba(192,57,43,.15) 50%,transparent 70%)',
          animation:'fadeIn .3s ease',pointerEvents:'none'}}>
          <div style={{textAlign:'center',animation:'shake .6s ease'}}>
            <div style={{fontSize:120,animation:'bombExplode .8s ease',filter:'drop-shadow(0 0 40px rgba(231,76,60,.8))'}}>💣</div>
            <div style={{fontSize:64,fontWeight:900,color:'#e74c3c',textShadow:'0 0 30px rgba(231,76,60,.6), 0 4px 16px rgba(0,0,0,.3)',
              marginTop:8}}>BOM!</div>
            <div style={{fontSize:72,fontWeight:900,color:'#fff',textShadow:'0 0 40px rgba(231,76,60,.8), 0 6px 20px rgba(0,0,0,.4)',
              animation:'scalePop .8s cubic-bezier(.34,1.56,.64,1) .3s both',marginTop:4}}>{specialFX.pts}đ</div>
          </div>
        </div>
      )}

      {/* Quiz modal */}
      {modal?.k==='quiz'&&<Modal>
        <h3 style={{fontSize:28,fontWeight:900,color:modal.rw?'var(--green)':'var(--red)',marginBottom:18}}>{modal.rw?'🎯 BONUS':'⚡ CÂU HỎI PHẠT'}</h3>
        <p style={{fontSize:24,fontWeight:800,color:'var(--text)',marginBottom:24}}>{modal.q.q}</p>
        <p style={{fontSize:13,color:'var(--mute)',marginBottom:28}}>{modal.rw?`Đúng: +${Math.abs(modal.v)}đ`:`Đúng: thoát | Sai: ${modal.v}đ`}</p>
        <div style={{display:'flex',gap:14,justifyContent:'center'}}>
          <button onClick={mOk} className="btn-hover" style={{padding:'16px 36px',fontSize:19,fontWeight:800,background:'var(--green)',color:'#fff',border:'none',borderRadius:16}}>✅ Đúng</button>
          <button onClick={mFail} className="btn-hover" style={{padding:'16px 36px',fontSize:19,fontWeight:800,background:'var(--red)',color:'#fff',border:'none',borderRadius:16}}>❌ Sai</button>
          <button onClick={mSkip} className="btn-hover" style={{padding:'16px 28px',fontSize:16,fontWeight:700,background:'#f1f5f9',color:'var(--sub)',border:'none',borderRadius:14}}>⏭️</button>
        </div>
      </Modal>}

      {/* Music modal — answer HIDDEN until reveal */}
      {modal?.k==='music'&&<Modal>
        <h3 style={{fontSize:30,fontWeight:900,color:'var(--pink)',marginBottom:18}}>🎵 ĐOÁN NHẠC</h3>
        {modal.q.url && <audio controls src={modal.q.url} style={{width:'100%',marginBottom:16}}/>}
        {!modal.q.url && <p style={{fontSize:15,color:'var(--mute)',marginBottom:16}}>MC tự phát nhạc bên ngoài</p>}
        {/* Answer hidden — reveal button */}
        {!showMusicAns ? (
          <button onClick={()=>setShowMusicAns(true)} className="btn-hover" style={{padding:'10px 28px',fontSize:14,fontWeight:700,background:'#f1f5f9',color:'var(--accent)',border:'2px solid var(--accent)',borderRadius:12,marginBottom:20}}>👁️ Khui đáp án</button>
        ) : (
          <div style={{background:'#fef3c7',padding:'12px 24px',borderRadius:12,marginBottom:20,animation:'scaleIn .3s ease'}}>
            <p style={{fontSize:13,color:'#92400e',fontWeight:600}}>ĐÁP ÁN:</p>
            <p style={{fontSize:20,fontWeight:800,color:'#2d3436'}}>{modal.q.title || '(Chưa nhập)'}</p>
          </div>
        )}
        <p style={{fontSize:12,color:'var(--mute)',marginBottom:24}}>Đúng: thoát phạt | Sai: {modal.v}đ</p>
        <div style={{display:'flex',gap:14,justifyContent:'center'}}>
          <button onClick={mOk} className="btn-hover" style={{padding:'16px 36px',fontSize:19,fontWeight:800,background:'var(--green)',color:'#fff',border:'none',borderRadius:16}}>✅ Đúng</button>
          <button onClick={mFail} className="btn-hover" style={{padding:'16px 36px',fontSize:19,fontWeight:800,background:'var(--red)',color:'#fff',border:'none',borderRadius:16}}>❌ Sai</button>
          <button onClick={mSkip} className="btn-hover" style={{padding:'16px 28px',fontSize:16,fontWeight:700,background:'#f1f5f9',color:'var(--sub)',border:'none',borderRadius:14}}>⏭️</button>
        </div>
      </Modal>}

      {modal?.k==='give'&&<Modal>
        <h3 style={{fontSize:26,fontWeight:900,color:'#f39c12',marginBottom:28}}>🎁 Tặng {modal.v}đ cho đội nào?</h3>
        <div style={{display:'flex',gap:16,justifyContent:'center'}}>
          {teams.filter(t=>t.id!==team.id).map(t=><button key={t.id} onClick={()=>giveTeam(t.id)} className="btn-hover" style={{padding:'18px 36px',fontSize:20,fontWeight:800,background:t.color,color:'#fff',border:'none',borderRadius:16}}>{t.name}</button>)}
        </div>
      </Modal>}

      {phase==='trans'&&overlay&&<Overlay bg="linear-gradient(135deg,rgba(108,92,231,.95),rgba(168,85,247,.95))">
        <div style={{textAlign:'center',color:'#fff'}}>
          <div style={{fontSize:80,marginBottom:24,animation:'bounce 1s infinite'}}>🔥</div>
          <h1 style={{fontSize:56,fontWeight:900,textShadow:'0 4px 20px rgba(0,0,0,.3)',marginBottom:14}}>{overlay}</h1>
          <div style={{fontSize:40,fontWeight:900,animation:'multPop .6s ease .3s both'}}>×{RC[cfg.questions[qIdx]?.round||round]?.mult||mult} ĐIỂM</div>
          <p style={{fontSize:20,opacity:.8,marginTop:18}}>Chuẩn bị...</p>
        </div>
      </Overlay>}

      {/* HEADER */}
      <div style={{background:'rgba(255,255,255,.92)',backdropFilter:'blur(16px)',borderBottom:'2px solid #e2e8f0',padding:'14px 28px',display:'flex',alignItems:'center',justifyContent:'space-between',boxShadow:'0 2px 14px rgba(0,0,0,.04)',position:'sticky',top:0,zIndex:100}}>
        <div style={{display:'flex',alignItems:'center',gap:16}}>
          <button onClick={()=>{if(confirm('Về trang chủ?')){saveState();bgRef.current?.pause();setScreen('welcome')}}} className="btn-hover" style={{background:'none',border:'none',fontSize:24,padding:4}}>🏠</button>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8}}>
              <span style={{fontSize:16,fontWeight:800,color:'var(--accent)'}}>Vòng {round}: {rc.name}</span>
              <MultBadge m={mult}/>
            </div>
            <div style={{fontSize:13,color:'var(--mute)',fontWeight:600}}>Câu {qIdx+1}/{cfg.questions.length}</div>
          </div>
        </div>
        <div style={{fontSize:56,fontWeight:900,fontVariantNumeric:'tabular-nums',color:timerOn?(timer<=5?'var(--red)':'var(--text)'):'var(--mute)',minWidth:90,textAlign:'center',animation:timerOn&&timer<=5?'timerPulse .5s infinite':'none'}}>{timerOn?timer:'--'}</div>
        <div style={{display:'flex',alignItems:'center',gap:10,padding:'10px 22px',background:`${team.color}10`,borderRadius:16,border:`2px solid ${team.color}30`}}>
          <div style={{width:16,height:16,borderRadius:'50%',background:team.color,boxShadow:`0 0 12px ${team.color}`}}/>
          <span style={{fontSize:18,fontWeight:800,color:team.color}}>{team.name}</span>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,overflow:'auto',padding:'16px 28px'}}>{renderStage()}</div>

      {/* FOOTER */}
      <div style={{background:'rgba(255,255,255,.92)',backdropFilter:'blur(16px)',borderTop:'2px solid #e2e8f0',padding:'12px 24px',display:'flex',justifyContent:'center',gap:18,flexWrap:'wrap'}}>
        {teams.map(t=><div key={t.id} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 20px',borderRadius:18,background:t.id===team.id?`${t.color}08`:'transparent',border:t.id===team.id?`3px solid ${t.color}`:'2px solid #e2e8f0',transition:'all .4s cubic-bezier(.34,1.56,.64,1)',transform:t.id===team.id?'scale(1.06)':'scale(1)'}}>
          <div>
            <div style={{fontSize:14,fontWeight:800,color:t.color}}>{t.name}</div>
            <div style={{fontSize:32,fontWeight:900,fontVariantNumeric:'tabular-nums'}}>{t.score}đ</div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:4}}>
            <button onClick={()=>addPts(t.id,5)} className="btn-hover" style={{width:34,height:30,fontSize:18,fontWeight:900,background:'var(--green)',color:'#fff',border:'none',borderRadius:8}}>+</button>
            <button onClick={()=>addPts(t.id,-5)} className="btn-hover" style={{width:34,height:30,fontSize:18,fontWeight:900,background:'var(--red)',color:'#fff',border:'none',borderRadius:8}}>−</button>
          </div>
        </div>)}
      </div>
    </div>
  )
}
