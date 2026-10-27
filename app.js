// 前測 1.1 問卷主程式（第 4 版：五類分頁、UEQ-S 實用面量表、D1 各類整體評分）。
// 題目、影片與送出方式都在這個檔案裡；資料要送到哪裡，請改 config.js 裡的 SURVEY_ENDPOINT。

const P = {
  P1: {name:"語音",       desc:"聲音唸出要放的位置", sound:true},
  P2: {name:"文字",       desc:"畫面顯示「放到 B3」"},
  P3: {name:"圖片",       desc:"顯示標記目標格子的示意圖"},
  P4: {name:"動畫",       desc:"示意面板中的積木移動到目標格子"},
  P5: {name:"影片",       desc:"播放第一人稱的操作影片"},
  P6: {name:"示範 3D",    desc:"目標格子上出現半透明積木"},
  P7: {name:"虛擬手示範", desc:"半透明的手示範拿起並放置積木"},
  P8: {name:"虛擬教師",   desc:"虛擬角色用手指向目標格子"},
  P9: {name:"高亮",       desc:"目標格子發光"},
  P10:{name:"箭頭",       desc:"箭頭指向目標格子"},
  P11:{name:"路徑線",     desc:"一條線從積木延伸到目標格子"},
  P12:{name:"空間音效",   desc:"聲音從目標格子的位置發出", sound:true},
  P13:{name:"觸覺回饋",   desc:"手靠近正確格子時，控制器會震動"}
};
// 五類提示，依固定順序呈現（不隨機）
const CATS = [
  {id:"C1", name:"語音",     desc:"用聲音說明要放的位置",   cues:["P1"]},
  {id:"C2", name:"傳統方式", desc:"常見的媒體形式",         cues:["P2","P3","P4","P5"]},
  {id:"C3", name:"過程演示", desc:"在場景中示範怎麼做",     cues:["P7","P11"]},
  {id:"C4", name:"結果演示", desc:"直接顯示目標或放好後的樣子", cues:["P6","P8","P9","P10"]},
  {id:"C5", name:"自行探索", desc:"一開始自己找，靠聲音或震動確認", cues:["P12","P13"]}
];
const catById = Object.fromEntries(CATS.map(c=>[c.id,c]));
const file = id => String(id.slice(1)).padStart(2,"0");
const vsrc = id => `videos/p${file(id)}.mp4`;
const tsrc = id => `thumbs/p${file(id)}.jpg`;

// UEQ-S 實用面（Schrepp, Hinderks, & Thomaschewski, 2017）：7 點語意差異，左負右正，原始分數 1～7
const U = [
  {k:"U1", l:"妨礙的",     r:"支持的"},
  {k:"U2", l:"複雜的",     r:"簡單的"},
  {k:"U3", l:"沒效率的",   r:"有效率的"},
  {k:"U4", l:"令人困惑的", r:"清楚的"}
];
const A = [
  {k:"A1", t:"您的年齡", o:["18–22 歲","23–26 歲","27 歲以上"]},
  {k:"A2", t:"您的系所領域", o:["設計","工程","理學","商管","人文社會","其他"]},
  {k:"A3", t:"您使用過 VR 頭戴式顯示器的次數", o:["從未使用","1–5 次","6 次以上"]},
  {k:"A4", t:"您玩電玩遊戲的頻率", o:["幾乎不玩","每月幾次","每週幾次","幾乎每天"]},
  {k:"A5", t:"您是否玩過有操作教學的 VR 或 3D 遊戲", o:["是","否","不確定"]}
];

const ENDPOINT = (window.SURVEY_ENDPOINT || "").trim();
const DRAFT_KEY = "pretest11-v4-draft", DONE_KEY = "pretest11-v2-done";

// 語意差異題的版面（只在這個版本用到，所以放在這裡）
document.head.insertAdjacentHTML("beforeend", `<style>
.cue h3{margin:0;font-size:19px;display:flex;gap:8px;align-items:baseline}
.cue h3 .qno{font-size:14px}
.ueq{display:flex;flex-direction:column;gap:6px;width:100%;padding:10px 0;border-top:1px solid var(--line)}
.sd-lead + .ueq{border-top:0}
.sd-ends{display:flex;justify-content:space-between;font-weight:500;font-size:15px}
.sd-row{display:grid;width:100%;grid-template-columns:repeat(7,1fr);gap:4px}
.sd-row label{position:relative}
.sd-row input{position:absolute;opacity:0;inset:0;margin:0;cursor:pointer}
.sd-row span{display:flex;align-items:center;justify-content:center;height:40px;border:1px solid var(--line);border-radius:8px;background:var(--surface);
  font-family:var(--font-mono);font-size:14px;color:var(--muted)}
.sd-row input:checked+span{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.sd-row input:focus-visible+span{outline:2px solid var(--mark);outline-offset:2px}
.howto{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:12px 16px;font-size:14px;color:var(--muted)}
.catopt{display:flex;flex-direction:column;gap:10px}
.catrate{display:flex;flex-direction:column;gap:6px;border:1px solid var(--line);border-radius:12px;padding:14px 16px;background:var(--surface)}
.catrate .cn{font-weight:700}
.catrate .cd{font-size:14px;color:var(--muted)}
.catrate .thumbs{display:flex;gap:6px;flex-wrap:wrap;margin:4px 0}
.catrate .thumbs img{width:72px;height:auto;border-radius:4px;border:1px solid var(--line)}
.catopt button{display:flex;gap:12px;align-items:flex-start;width:100%;text-align:left;font:inherit;color:var(--ink);border:2px solid var(--line);border-radius:12px;padding:12px 14px;background:var(--surface);cursor:pointer}
.catopt button.on{border-color:var(--accent)}
.catopt button:focus-visible{outline:2px solid var(--mark);outline-offset:2px}
.catopt .rk{width:32px;height:32px;flex:none;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;border:1.5px dashed var(--line);color:var(--muted)}
.catopt button.on .rk{background:var(--accent);border:0;color:var(--accent-ink)}
.catopt .cn{font-weight:700}
.catopt .cd{font-size:14px;color:var(--muted)}
.catopt .thumbs{display:flex;gap:6px;flex-wrap:wrap;margin-top:6px}
.catopt .thumbs img{width:72px;height:auto;border-radius:4px;border:1px solid var(--line)}
</style>`);

// 問卷名稱（不用「桌面」，避免被誤解為電腦桌面）
document.title = "VR 物件操作提示偏好問卷";
document.querySelector(".bar-title").textContent = "VR 物件操作提示偏好問卷（前測 1.1）";

const rid = () => "R" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
const fresh = () => ({id:rid(), consent:false, profile:{}, ratings:{}, watched:{}, catRatings:{}, best:null, why:"", other:"",
  startedAt:new Date().toISOString(), pageTimes:{}, step:0});

let S;
try { S = JSON.parse(localStorage.getItem(DRAFT_KEY)) || fresh(); } catch(e){ S = fresh(); }
const saveDraft = () => { try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(S)); }catch(e){} };
let alreadyDone = false;
try { alreadyDone = !!localStorage.getItem(DONE_KEY); } catch(e){}

let step = S.step || 0, pageStart = Date.now(), sendState = "idle";
const pages = ["intro","profile",...CATS.map(c=>"c:"+c.id),"final","done"];
if(step >= pages.length) step = 0;
const pageEl = document.getElementById("page");
const esc = s => String(s ?? "").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function chips(k,opts){
  return `<div class="choices">${opts.map((o,i)=>`<label class="chip"><input type="radio" name="${k}" id="${k}-${i}" value="${esc(o)}" ${S.profile[k]===o?"checked":""}><span>${esc(o)}</span></label>`).join("")}</div>`;
}
function sd(pid,it){
  const name=`${pid}_${it.k}`, cur=S.ratings[pid]?.[it.k];
  return `<div class="ueq" role="radiogroup" aria-label="${it.l} 到 ${it.r}">
    <div class="sd-ends"><span>${it.l}</span><span>${it.r}</span></div>
    <div class="sd-row">${[1,2,3,4,5,6,7].map(v=>`<label><input type="radio" name="${name}" id="${name}-${v}" value="${v}" aria-label="${it.l}－${it.r}，第 ${v} 格" ${cur==v?"checked":""}><span>${v}</span></label>`).join("")}</div>
  </div>`;
}
function nav(next="下一步", back=true){
  return `<p class="err" id="err" hidden></p>
  <div class="nav">${back&&step>0?`<button type="button" class="btn" id="prev">上一步</button>`:""}<button type="button" class="btn primary" id="next">${next}</button></div>`;
}

function render(){
  const p = pages[step];
  const cIdx = p.startsWith("c:") ? CATS.findIndex(c=>c.id===p.slice(2))+1 : 0;
  document.getElementById("stepLabel").textContent =
    p==="intro"?"說明":p==="profile"?"基本資料":p==="final"?"最後一題":p==="done"?"完成":`第 ${cIdx} 類 / 共 ${CATS.length} 類`;
  document.getElementById("trackFill").style.width = `${step/(pages.length-1)*100}%`;
  let h="";
  if(p==="intro"){
    h=`<span class="eyebrow">第一部分 · 填答說明</span>
    <h1>VR 物件操作提示偏好問卷</h1>
    ${alreadyDone?`<p class="note">這台裝置已經填過一次問卷，謝謝您！除非研究者請您重填，否則不需要再填。</p>`:""}
    ${ENDPOINT?"":`<p class="note">預覽模式：尚未設定資料接收網址，作答不會送出。</p>`}
    <div class="consent">
      <p>您好，我是大同大學數位媒體設計系碩士班的研究生。本問卷想了解：在虛擬實境（VR）中操作物件時，哪一類提示方式最能幫助使用者完成任務。</p>
      <p><b>任務情境</b>：想像您戴著 VR 頭戴式顯示器，桌上有一塊格狀底板和一塊紅色積木。系統會用提示告訴您，要把積木放到哪一格。</p>
      <p>接下來會依序介紹 5 類提示，共 13 段約 10 秒的影片。每段影片看完後，請依照您的第一印象回答 4 題。部分影片含有聲音，<b>建議配戴耳機</b>。</p>
      <p>答案沒有對錯，所有資料僅供學術研究使用，以匿名方式處理，您可以隨時停止填答。</p>
      <div class="meta"><span>預估時間</span><b>約 11 分鐘</b><span>內容</span><b>基本資料 5 題、13 段影片各 4 題、最後 3 題（含 5 類整體評分）</b></div>
      <label class="check"><input type="checkbox" id="consent" ${S.consent?"checked":""}><span>我已閱讀上述說明，同意參與本問卷</span></label>
    </div>
    ${nav("開始填答",false)}`;
  }
  if(p==="profile"){
    h=`<span class="eyebrow">第二部分</span><h2>基本資料</h2>
    ${A.map(q=>`<fieldset class="q"><legend><span class="qno">${q.k}</span>${q.t}<span class="req">*</span></legend>${chips(q.k,q.o)}</fieldset>`).join("")}
    ${nav()}`;
  }
  if(p.startsWith("c:")){
    const C=catById[p.slice(2)];
    h=`<span class="eyebrow">第三部分 · 第 ${cIdx} 類 / 共 ${CATS.length} 類</span>
    <h2>${C.name}</h2>
    <p class="lead">${C.desc}。本類共 ${C.cues.length} 段影片。</p>
    <p class="howto">每段影片看完後，請在每一列兩個相反的形容詞之間，依照您的第一印象點選一格：越靠近哪一邊，代表越符合那個形容詞；中間的 4 代表普通。</p>
    ${C.cues.map((id,i)=>{
      const T=P[id], seen=!!S.watched[id];
      return `<section class="cue">
        <h3><span class="qno">${cIdx}-${i+1}</span>${T.name}</h3>
        <div class="video"><video id="vid-${id}" data-id="${id}" src="${vsrc(id)}" poster="${tsrc(id)}" controls playsinline preload="metadata"></video></div>
        <div class="vcap"><span class="small">${T.desc}${T.sound?`　<span class="sound">含聲音，請開啟音量</span>`:""}</span>
          <span class="vstatus ${seen?"done":""}" id="vs-${id}">${seen?"已看完，可重播":"請先完整看完影片再作答"}</span></div>
        <div id="qs-${id}" class="${seen?"":"locked"}"><p class="small sd-lead">我覺得這個提示是……</p>${U.map(it=>sd(id,it)).join("")}</div>
      </section>`;}).join("")}
    ${nav()}`;
  }
  if(p==="final"){
    h=`<span class="eyebrow">第四部分</span><h2>最後三題</h2>
    <fieldset class="q"><legend><span class="qno">D1</span>請針對以下 5 類提示，各做一次整體評分。<span class="req">*</span></legend>
      <p class="howto">請回想同一類的影片，在每一列兩個相反的形容詞之間，依照您對這一類的整體印象點選一格。</p>
      ${CATS.map((c,ci)=>`<div class="catrate">
        <div><span class="qno">C${ci+1}</span><span class="cn">${c.name}</span>　<span class="cd">${c.cues.map(id=>P[id].name).join("、")}</span></div>
        <div class="thumbs">${c.cues.map(id=>`<img src="${tsrc(id)}" alt="">`).join("")}</div>
        <p class="small sd-lead">我覺得這一類提示整體來說是……</p>${U.map(it=>sd(c.id,it)).join("")}
      </div>`).join("")}</fieldset>
    <fieldset class="q"><legend><span class="qno">D2</span>您覺得哪一類最能幫助您完成任務？為什麼？<span class="req">*</span></legend>
      <div class="choices">${CATS.map(c=>`<label class="chip"><input type="radio" name="best" id="best-${c.id}" value="${c.id}" ${S.best===c.id?"checked":""}><span>${c.name}</span></label>`).join("")}</div>
      <textarea id="why" placeholder="請寫下原因，例如：一眼就知道要放哪一格，也不會擋住積木">${esc(S.why)}</textarea></fieldset>
    <fieldset class="q"><legend><span class="qno">D3</span>您覺得還有哪些提示方式或組合，可以幫助您完成這個任務？（選填）</legend>
      <textarea id="other" placeholder="例如：高亮加上語音">${esc(S.other)}</textarea></fieldset>
    ${nav("送出問卷")}`;
  }
  if(p==="done"){
    const ok = sendState==="sent";
    h=`<span class="eyebrow">完成</span><h1>${ok?"感謝您的填答":"還差一步"}</h1>
    <p class="lead">${ok?"您的回覆已經送出，可以關閉這個頁面了。"
      : ENDPOINT?"回覆沒有送出成功，可能是網路不穩。請按「重新送出」；如果一直失敗，請按「複製作答資料」並傳給研究者。"
      : "預覽模式：尚未設定資料接收網址，作答沒有送出。"}</p>
    ${ok?"":`<div class="nav">${ENDPOINT?`<button type="button" class="btn primary" id="resend">重新送出</button>`:""}<button type="button" class="btn" id="copy">複製作答資料</button></div><p class="small" id="copyMsg" hidden></p>`}
    ${ok?"":`<p class="small"><button type="button" class="linkbtn" id="restart">清除並重新填答</button></p>`}`;
  }
  pageEl.innerHTML=h;
  window.scrollTo(0,0);
  pageStart=Date.now();
  bind(p);
}

function validate(p){
  if(p==="intro") return S.consent || "請先勾選同意參與。";
  if(p==="profile") return A.every(q=>S.profile[q.k]) || "還有基本資料沒有填，請完成後再繼續。";
  if(p.startsWith("c:")){
    const C=catById[p.slice(2)];
    const unseen=C.cues.filter(id=>!S.watched[id]);
    if(unseen.length) return `請先完整看完「${unseen.map(id=>P[id].name).join("」「")}」的影片。`;
    const miss=C.cues.filter(id=>!U.every(it=>S.ratings[id]?.[it.k]));
    if(miss.length) return `「${miss.map(id=>P[id].name).join("」「")}」還有題目沒有作答。`;
  }
  if(p==="final"){
    const missC=CATS.filter(c=>!U.every(it=>S.catRatings[c.id]?.[it.k]));
    if(missC.length) return `D1「${missC.map(c=>c.name).join("」「")}」還有題目沒有作答。`;
    if(!S.best) return "D2 請選出最能幫助您完成任務的一類。";
    if(!S.why.trim()) return "D2 請簡單說明原因。";
  }
  return true;
}

function bind(p){
  const $=id=>document.getElementById(id);
  $("consent")?.addEventListener("change",e=>{S.consent=e.target.checked;saveDraft();});
  pageEl.querySelectorAll('input[type=radio]').forEach(inp=>inp.addEventListener("change",()=>{
    if(p==="profile") S.profile[inp.name]=inp.value;
    else if(inp.name==="best") S.best=inp.value;
    else { const [id,k]=inp.name.split("_"); const box = id.startsWith("C") ? S.catRatings : S.ratings; (box[id] ||= {})[k]=Number(inp.value); }
    saveDraft();
  }));
  pageEl.querySelectorAll("video").forEach(v=>{
    const id=v.dataset.id;
    // 同一頁一次只播一段，避免聲音重疊
    v.addEventListener("play",()=>pageEl.querySelectorAll("video").forEach(o=>{if(o!==v) o.pause();}));
    v.addEventListener("ended",()=>{
      S.watched[id]=true; saveDraft(); $("qs-"+id).classList.remove("locked");
      const st=$("vs-"+id); st.textContent="已看完，可重播"; st.classList.add("done");
    });
  });
  $("why")?.addEventListener("input",e=>{S.why=e.target.value;saveDraft();});
  $("other")?.addEventListener("input",e=>{S.other=e.target.value;saveDraft();});
  $("prev")?.addEventListener("click",()=>{step--;S.step=step;saveDraft();render();});
  $("next")?.addEventListener("click",async()=>{
    const ok=validate(p), err=$("err");
    if(ok!==true){err.textContent=ok;err.hidden=false;return;}
    S.pageTimes[p]=(S.pageTimes[p]||0)+Math.round((Date.now()-pageStart)/1000);
    if(p==="final"){ const b=$("next"); b.disabled=true; b.textContent="送出中…"; await submit(); }
    step++; S.step=step; saveDraft(); render();
  });
  $("resend")?.addEventListener("click",async e=>{e.target.disabled=true;e.target.textContent="送出中…";await submit();render();});
  $("restart")?.addEventListener("click",()=>{try{localStorage.removeItem(DRAFT_KEY);}catch(e){} S=fresh(); step=0; sendState="idle"; render();});
  $("copy")?.addEventListener("click",()=>{
    const msg=$("copyMsg"), data=JSON.stringify(row());
    const done=t=>{msg.textContent=t;msg.hidden=false;};
    try{navigator.clipboard.writeText(data).then(()=>done("已複製，請貼給研究者。"),()=>done("無法自動複製，請截圖本頁並聯絡研究者。"));}
    catch(e){done("無法自動複製，請截圖本頁並聯絡研究者。");}
  });
}

// 一份問卷 = 試算表的一列，欄位順序固定
function row(){
  const r = {
    "問卷版本": "1.1-v4",
    "受測者編號": S.id,
    "送出時間": new Date().toISOString(),
    "開始時間": S.startedAt,
    "作答秒數": Object.values(S.pageTimes).reduce((a,b)=>a+b,0)
  };
  for(const q of A) r[q.k] = S.profile[q.k] ?? "";
  for(const C of CATS) for(const id of C.cues) for(const it of U) r[`${id}_${it.k}`] = S.ratings[id]?.[it.k] ?? "";
  // D1 各類整體評分：C1_Q1～C5_Q4（原始分數 1～7），再加每一類 4 題的平均
  CATS.forEach((c,ci)=>{
    const vals=U.map(it=>S.catRatings[c.id]?.[it.k]);
    U.forEach((it,qi)=>{ r[`C${ci+1}_Q${qi+1}`] = vals[qi] ?? ""; });
    r[`C${ci+1}_平均`] = vals.every(v=>typeof v==="number") ? Math.round(vals.reduce((a,b)=>a+b,0)/vals.length*100)/100 : "";
  });
  r["D2_最能幫助的類別"] = S.best ? catById[S.best].name : "";
  r["D2_原因"] = S.why.trim();
  r["D3_其他建議"] = S.other.trim();
  r["各頁秒數"] = JSON.stringify(S.pageTimes);
  r["螢幕寬度"] = window.innerWidth;
  return r;
}

async function submit(){
  if(!ENDPOINT){ sendState="preview"; return; }
  try{
    const res = await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(row())});
    const out = await res.json();
    if(out.ok){
      sendState="sent";
      try{ localStorage.removeItem(DRAFT_KEY); localStorage.setItem(DONE_KEY, S.id); }catch(e){}
    } else sendState="failed";
  }catch(e){ sendState="failed"; }
}

render();
