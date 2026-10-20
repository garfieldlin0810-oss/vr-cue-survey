// 前測 1.1 問卷主程式。題目、影片與送出方式都在這個檔案裡；
// 資料要送到哪裡，請改 config.js 裡的 SURVEY_ENDPOINT。

const P = [
  {id:"P1", name:"語音",       desc:"聲音唸出要放的位置", sound:true},
  {id:"P2", name:"文字",       desc:"畫面顯示「放到 B3」"},
  {id:"P3", name:"圖片",       desc:"顯示標記目標格子的示意圖"},
  {id:"P4", name:"動畫",       desc:"示意面板中的積木移動到目標格子"},
  {id:"P5", name:"影片",       desc:"播放第一人稱的操作影片"},
  {id:"P6", name:"示範 3D",    desc:"目標格子上出現半透明積木"},
  {id:"P7", name:"虛擬手示範", desc:"半透明的手示範拿起並放置積木"},
  {id:"P8", name:"虛擬教師",   desc:"虛擬角色用手指向目標格子"},
  {id:"P9", name:"高亮",       desc:"目標格子發光"},
  {id:"P10",name:"箭頭",       desc:"箭頭指向目標格子"},
  {id:"P11",name:"路徑線",     desc:"一條線從積木延伸到目標格子"},
  {id:"P12",name:"空間音效",   desc:"聲音從目標格子的位置發出", sound:true},
  {id:"P13",name:"觸覺回饋",   desc:"手靠近正確格子時，控制器會震動"}
];
const byId = Object.fromEntries(P.map(p=>[p.id,p]));
const file = id => String(id.slice(1)).padStart(2,"0");
const vsrc = id => `videos/p${file(id)}.mp4`;
const tsrc = id => `thumbs/p${file(id)}.jpg`;

const B = [
  {k:"B1", t:"這個提示很容易被我注意到。"},
  {k:"B2", t:"我能很快看懂這個提示的意思。"},
  {k:"B3", t:"這個提示讓我清楚知道要把積木放到哪一格。"},
  {k:"B4", t:"這個提示會干擾我操作。", reverse:true},
  {k:"B5", t:"如果在 VR 中操作，我會想使用這種提示。"}
];
const SCALE = ["非常不同意","不同意","普通","同意","非常同意"];
const A = [
  {k:"A1", t:"您的年齡", o:["18–22 歲","23–26 歲","27 歲以上"]},
  {k:"A2", t:"您的系所領域", o:["設計","工程","理學","商管","人文社會","其他"]},
  {k:"A3", t:"您使用過 VR 頭戴式顯示器的次數", o:["從未使用","1–5 次","6 次以上"]},
  {k:"A4", t:"您玩電玩遊戲的頻率", o:["幾乎不玩","每月幾次","每週幾次","幾乎每天"]},
  {k:"A5", t:"您是否玩過有操作教學的 VR 或 3D 遊戲", o:["是","否","不確定"]}
];

const ENDPOINT = (window.SURVEY_ENDPOINT || "").trim();
const DRAFT_KEY = "pretest11-draft", DONE_KEY = "pretest11-done";

function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const rid = () => "R" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2,6).toUpperCase();
const fresh = () => ({id:rid(), consent:false, order:shuffle(P.map(p=>p.id)), profile:{}, ratings:{}, watched:{},
  top3:[], worst:null, C3:"", C4:"", startedAt:new Date().toISOString(), pageTimes:{}, step:0});

// 重新整理頁面時接續作答
let S;
try { S = JSON.parse(localStorage.getItem(DRAFT_KEY)) || fresh(); } catch(e){ S = fresh(); }
const saveDraft = () => { try{ localStorage.setItem(DRAFT_KEY, JSON.stringify(S)); }catch(e){} };
let alreadyDone = false;
try { alreadyDone = !!localStorage.getItem(DONE_KEY); } catch(e){}

let step = S.step || 0, pageStart = Date.now(), sendState = "idle";
const pages = () => ["intro","profile",...S.order.map(id=>"p:"+id),"rank","done"];
const pageEl = document.getElementById("page");
const esc = s => String(s ?? "").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function chips(k,opts){
  return `<div class="choices">${opts.map((o,i)=>`<label class="chip"><input type="radio" name="${k}" id="${k}-${i}" value="${esc(o)}" ${S.profile[k]===o?"checked":""}><span>${esc(o)}</span></label>`).join("")}</div>`;
}
function likert(pid,item){
  const name=`${pid}_${item.k}`, cur=S.ratings[pid]?.[item.k];
  return `<fieldset class="q"><legend><span class="qno">${item.k}</span>${esc(item.t)}<span class="req">*</span></legend>
  <div class="likert">${SCALE.map((s,i)=>`<label><input type="radio" name="${name}" id="${name}-${i+1}" value="${i+1}" ${cur==i+1?"checked":""}><span><b>${i+1}</b><small>${s}</small></span></label>`).join("")}</div></fieldset>`;
}
function nav(next="下一步", back=true){
  return `<p class="err" id="err" hidden></p>
  <div class="nav">${back&&step>0?`<button type="button" class="btn" id="prev">上一步</button>`:""}<button type="button" class="btn primary" id="next">${next}</button></div>`;
}

function render(){
  const pg = pages(), p = pg[step], nP = S.order.length;
  const pIdx = p.startsWith("p:") ? S.order.indexOf(p.slice(2))+1 : 0;
  document.getElementById("stepLabel").textContent =
    p==="intro"?"說明":p==="profile"?"基本資料":p==="rank"?"排序":p==="done"?"完成":`提示 ${pIdx} / ${nP}`;
  document.getElementById("trackFill").style.width = `${step/(pg.length-1)*100}%`;
  let h="";
  if(p==="intro"){
    h=`<span class="eyebrow">第一部分 · 填答說明</span>
    <h1>VR 桌面任務提示偏好問卷</h1>
    ${alreadyDone?`<p class="note">這台裝置已經填過一次問卷，謝謝您！除非研究者請您重填，否則不需要再填。</p>`:""}
    ${ENDPOINT?"":`<p class="note">預覽模式：尚未設定資料接收網址，作答不會送出。</p>`}
    <div class="consent">
      <p>您好，我是大同大學數位媒體設計系碩士班的研究生。本問卷想了解：在虛擬實境（VR）中進行桌面操作時，哪一種提示方式最能幫助使用者完成任務。</p>
      <p><b>任務情境</b>：想像您戴著 VR 頭戴式顯示器，桌上有一塊格狀底板和一塊紅色積木。系統會用提示告訴您，要把積木放到哪一格。</p>
      <p>接下來您會看到 13 段約 10 秒的影片，每段呈現一種提示方式。請在看完每段影片後，依照您的感受作答。部分影片含有聲音，<b>建議配戴耳機</b>。</p>
      <p>答案沒有對錯，所有資料僅供學術研究使用，以匿名方式處理，您可以隨時停止填答。</p>
      <div class="meta"><span>預估時間</span><b>約 15 分鐘</b><span>內容</span><b>基本資料 5 題、13 種提示各 5 題、排序與開放題 4 題</b></div>
      <label class="check"><input type="checkbox" id="consent" ${S.consent?"checked":""}><span>我已閱讀上述說明，同意參與本問卷</span></label>
    </div>
    ${nav("開始填答",false)}`;
  }
  if(p==="profile"){
    h=`<span class="eyebrow">第二部分</span><h2>基本資料</h2>
    ${A.map(q=>`<fieldset class="q"><legend><span class="qno">${q.k}</span>${q.t}<span class="req">*</span></legend>${chips(q.k,q.o)}</fieldset>`).join("")}
    ${nav()}`;
  }
  if(p.startsWith("p:")){
    const id=p.slice(2), T=byId[id], seen=!!S.watched[id];
    h=`<span class="eyebrow">第三部分 · 提示 ${pIdx} / ${nP}</span>
    <h2>${T.name}</h2>
    <div class="video"><video id="vid" src="${vsrc(id)}" poster="${tsrc(id)}" controls playsinline preload="auto"></video></div>
    <div class="vcap"><span class="small">${T.desc}${T.sound?`　<span class="sound">含聲音，請開啟音量</span>`:""}</span>
      <span class="vstatus ${seen?"done":""}" id="vstatus">${seen?"已看完，可重播":"請先完整看完影片再作答"}</span></div>
    <div id="qs" class="${seen?"":"locked"}">${B.map(it=>likert(id,it)).join("")}</div>
    ${nav()}`;
  }
  if(p==="rank"){
    const tile=(id,kind)=>{
      const r=S.top3.indexOf(id), w=S.worst===id;
      const on = kind==="top" ? r>=0 : w;
      const dis = kind==="worst" && S.top3.includes(id);
      const badge = kind==="top" ? (r>=0?`第 ${r+1}`:"") : (w?"最不喜歡":"");
      return `<button type="button" class="tile ${on?(kind==="top"?"sel":"worst"):""}" data-k="${kind}" data-id="${id}" aria-pressed="${on}" ${dis?"disabled":""}>
        ${badge?`<span class="badge">${badge}</span>`:""}<img src="${tsrc(id)}" alt=""><span class="tl"><b>${id}</b>${byId[id].name}</span></button>`;
    };
    const first = S.top3[0] ? `${S.top3[0]} ${byId[S.top3[0]].name}` : "第 1 名";
    h=`<span class="eyebrow">第四部分</span><h2>綜合排序與開放題</h2>
    <fieldset class="q"><legend><span class="qno">C1</span>在剛剛看到的 13 種提示中，請依序點選您最喜歡的前三名。<span class="req">*</span></legend>
      <p class="small">依點選順序成為第 1、2、3 名，再點一次可取消。</p>
      <div class="picked">${[0,1,2].map(i=>`<span>第 ${i+1} 名：${S.top3[i]?`${S.top3[i]} ${byId[S.top3[i]].name}`:"—"}</span>`).join("")}</div>
      <div class="grid">${S.order.map(id=>tile(id,"top")).join("")}</div></fieldset>
    <fieldset class="q"><legend><span class="qno">C2</span>您最不喜歡的是哪一種提示？<span class="req">*</span></legend>
      <div class="grid">${S.order.map(id=>tile(id,"worst")).join("")}</div></fieldset>
    <fieldset class="q"><legend><span class="qno">C3</span>為什麼最喜歡「${esc(first)}」？<span class="req">*</span></legend>
      <textarea id="C3" placeholder="例如：一眼就知道要放哪一格，也不會擋住積木">${esc(S.C3)}</textarea></fieldset>
    <fieldset class="q"><legend><span class="qno">C4</span>您覺得還有哪些提示方式或組合，可以幫助您完成這個任務？（選填）</legend>
      <textarea id="C4" placeholder="例如：高亮加上語音">${esc(S.C4)}</textarea></fieldset>
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
  if(p.startsWith("p:")){
    const id=p.slice(2);
    if(!S.watched[id]) return "請先完整看完影片。";
    return B.every(it=>S.ratings[id]?.[it.k]) || "還有題目沒有作答，請完成 B1～B5。";
  }
  if(p==="rank"){
    if(S.top3.length<3) return "C1 請選滿 3 個提示。";
    if(!S.worst) return "C2 請選出最不喜歡的提示。";
    if(!S.C3.trim()) return "C3 請簡單說明原因。";
  }
  return true;
}

function bind(p){
  const $=id=>document.getElementById(id);
  $("consent")?.addEventListener("change",e=>{S.consent=e.target.checked;saveDraft();});
  pageEl.querySelectorAll('input[type=radio]').forEach(inp=>inp.addEventListener("change",()=>{
    if(p==="profile") S.profile[inp.name]=inp.value;
    else { const [id,k]=inp.name.split("_"); (S.ratings[id] ||= {})[k]=Number(inp.value); }
    saveDraft();
  }));
  const v=$("vid");
  if(v){
    const id=p.slice(2);
    v.addEventListener("ended",()=>{
      S.watched[id]=true; saveDraft(); $("qs").classList.remove("locked");
      const st=$("vstatus"); st.textContent="已看完，可重播"; st.classList.add("done");
    });
  }
  pageEl.querySelectorAll(".tile").forEach(t=>t.addEventListener("click",()=>{
    const id=t.dataset.id;
    if(t.dataset.k==="top"){
      const i=S.top3.indexOf(id);
      if(i>=0) S.top3.splice(i,1); else if(S.top3.length<3){ S.top3.push(id); if(S.worst===id) S.worst=null; }
    } else S.worst = S.worst===id ? null : id;
    saveDraft();
    const y=window.scrollY; render(); window.scrollTo(0,y);
  }));
  $("C3")?.addEventListener("input",e=>{S.C3=e.target.value;saveDraft();});
  $("C4")?.addEventListener("input",e=>{S.C4=e.target.value;saveDraft();});
  $("prev")?.addEventListener("click",()=>{step--;S.step=step;saveDraft();render();});
  $("next")?.addEventListener("click",async()=>{
    const ok=validate(p), err=$("err");
    if(ok!==true){err.textContent=ok;err.hidden=false;return;}
    S.pageTimes[p]=(S.pageTimes[p]||0)+Math.round((Date.now()-pageStart)/1000);
    if(p==="rank"){ const b=$("next"); b.disabled=true; b.textContent="送出中…"; await submit(); }
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
    "受測者編號": S.id,
    "送出時間": new Date().toISOString(),
    "開始時間": S.startedAt,
    "作答秒數": Object.values(S.pageTimes).reduce((a,b)=>a+b,0)
  };
  for(const q of A) r[q.k] = S.profile[q.k] ?? "";
  for(const p of P) for(const it of B) r[`${p.id}_${it.k}`] = S.ratings[p.id]?.[it.k] ?? "";
  r["C1_第1名"]=S.top3[0]??""; r["C1_第2名"]=S.top3[1]??""; r["C1_第3名"]=S.top3[2]??"";
  r["C2_最不喜歡"]=S.worst??"";
  r["C3"]=S.C3.trim(); r["C4"]=S.C4.trim();
  r["提示順序"]=S.order.join(" ");
  r["各頁秒數"]=JSON.stringify(S.pageTimes);
  r["螢幕寬度"]=window.innerWidth;
  return r;
}

async function submit(){
  if(!ENDPOINT){ sendState="preview"; return; }
  try{
    // 用 text/plain 送出，Google Apps Script 不需要額外的跨網域設定
    const res = await fetch(ENDPOINT,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(row())});
    const out = await res.json();
    if(out.ok){
      sendState="sent";
      try{ localStorage.removeItem(DRAFT_KEY); localStorage.setItem(DONE_KEY, S.id); }catch(e){}
    } else sendState="failed";
  }catch(e){ sendState="failed"; }
}

render();
