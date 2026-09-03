const STORAGE_KEY="tboparcSecretaryHelperV1";
const $=id=>document.getElementById(id);
const scalarIds=["meetingType","meetingDate","scheduledTime","location","callTime","calledBy","quorum","priorMinutesAction","priorMinutesMeeting","priorMotionBy","priorSecondBy","priorYes","priorNo","priorNotes","reportsMotionBy","reportsSecondBy","reportsYes","reportsNo","presentation","adjournTime","adjournMotionBy","adjournSecondBy","adjournYes","adjournNo","secretaryName","secretaryCallsign"];
let state={attendance:[],reports:[],oldBusiness:[],newBusiness:[],announcements:[]};
let saveTimer;

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function esc(s=""){return String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]))}
function val(id){const el=$(id); return el.type==="checkbox"?el.checked:el.value}
function setVal(id,v){const el=$(id); if(!el)return; if(el.type==="checkbox")el.checked=!!v; else el.value=v??""}
function scheduleSave(){ $("saveState").textContent="Saving…"; clearTimeout(saveTimer); saveTimer=setTimeout(save,350)}
function save(){
  const scalars={}; scalarIds.forEach(id=>scalars[id]=val(id));
  localStorage.setItem(STORAGE_KEY,JSON.stringify({...state,scalars}));
  $("saveState").textContent="Saved";
}
function load(){
  const raw=localStorage.getItem(STORAGE_KEY);
  if(!raw){seedDate();renderAll();return}
  try{
    const data=JSON.parse(raw); state.attendance=data.attendance||[];state.reports=data.reports||[];
    state.oldBusiness=data.oldBusiness||[];state.newBusiness=data.newBusiness||[];state.announcements=data.announcements||[];
    Object.entries(data.scalars||{}).forEach(([k,v])=>setVal(k,v));
  }catch(e){seedDate()}
  renderAll();
}
function seedDate(){ if(!$("meetingDate").value) $("meetingDate").value=new Date().toISOString().slice(0,10) }

function renderAttendance(){
  const root=$("attendanceList");root.innerHTML="";
  state.attendance.forEach((p,i)=>{
    const card=document.createElement("div");card.className="entry-card";
    card.innerHTML=`<div class="row">
      <label>Name<input data-att="${p.id}" data-field="name" value="${esc(p.name)}" placeholder="Name"></label>
      <label>Callsign<input data-att="${p.id}" data-field="callsign" value="${esc(p.callsign)}" placeholder="Optional"></label>
      <label>Role<select data-att="${p.id}" data-field="role">
        ${["Member","President","Vice President","Secretary","Treasurer","Trustee1","Trustee2","Repeater/License Trustee","Director-at-Large","Guest","Other"].map(x=>`<option ${p.role===x?"selected":""}>${x}</option>`).join("")}
      </select></label>
      <button class="danger small" data-remove-att="${p.id}">Remove</button>
    </div>`;
    root.appendChild(card);
  });
  $("attendanceCount").textContent=state.attendance.length;
}
function renderReports(){
  const root=$("reportList");root.innerHTML="";
  state.reports.forEach(r=>{
    const card=document.createElement("div");card.className="entry-card";
    card.innerHTML=`<div class="row single">
      <label>Report heading<input data-report="${r.id}" data-field="title" value="${esc(r.title)}" placeholder="Treasury, Secretary, President, etc."></label>
      <button class="danger small" data-remove-report="${r.id}">Remove</button>
    </div>
    <textarea rows="4" data-report="${r.id}" data-field="text" placeholder="Report details">${esc(r.text)}</textarea>`;
    root.appendChild(card);
  });
}
function renderItems(kind){
  const root=$(kind+"List");root.innerHTML="";
  state[kind].forEach((it,idx)=>{
    const card=document.createElement("div");card.className="entry-card";
    card.innerHTML=`<div class="row single">
      <label>Item ${idx+1}<textarea rows="4" data-item-kind="${kind}" data-item-id="${it.id}" placeholder="Enter details">${esc(it.text)}</textarea></label>
      <button class="danger small" data-remove-kind="${kind}" data-remove-id="${it.id}">Remove</button>
    </div>`;
    root.appendChild(card);
  });
}
function renderAll(){renderAttendance();renderReports();["oldBusiness","newBusiness","announcements"].forEach(renderItems);refreshPreview()}

document.addEventListener("input",e=>{
  if(scalarIds.includes(e.target.id)) scheduleSave();
  const att=e.target.dataset.att;if(att){const p=state.attendance.find(x=>x.id===att);if(p){p[e.target.dataset.field]=e.target.value;scheduleSave()}}
  const rep=e.target.dataset.report;if(rep){const r=state.reports.find(x=>x.id===rep);if(r){r[e.target.dataset.field]=e.target.value;scheduleSave()}}
  const kind=e.target.dataset.itemKind;if(kind){const it=state[kind].find(x=>x.id===e.target.dataset.itemId);if(it){it.text=e.target.value;scheduleSave()}}
});
document.addEventListener("change",e=>{if(scalarIds.includes(e.target.id))scheduleSave()});

$("addPersonBtn").onclick=()=>{state.attendance.push({id:uid(),name:"",callsign:"",role:"Member"});renderAttendance();scheduleSave()};
$("addReportBtn").onclick=()=>{state.reports.push({id:uid(),title:"",text:""});renderReports();scheduleSave()};
document.querySelectorAll("[data-add-item]").forEach(b=>b.onclick=()=>{const k=b.dataset.addItem;state[k].push({id:uid(),text:""});renderItems(k);scheduleSave()});
document.addEventListener("click",e=>{
  if(e.target.dataset.removeAtt){state.attendance=state.attendance.filter(x=>x.id!==e.target.dataset.removeAtt);renderAttendance();scheduleSave()}
  if(e.target.dataset.removeReport){state.reports=state.reports.filter(x=>x.id!==e.target.dataset.removeReport);renderReports();scheduleSave()}
  if(e.target.dataset.removeKind){const k=e.target.dataset.removeKind;state[k]=state[k].filter(x=>x.id!==e.target.dataset.removeId);renderItems(k);scheduleSave()}
});
document.querySelectorAll(".steps button").forEach(btn=>btn.onclick=()=>{
  document.querySelectorAll(".steps button").forEach(b=>b.classList.toggle("active",b===btn));
  document.querySelectorAll(".panel").forEach(p=>p.classList.toggle("active",p.id===btn.dataset.target));
  if(btn.dataset.target==="preview") refreshPreview();
  window.scrollTo({top:0,behavior:"smooth"});
});

function fmtDate(s){if(!s)return ""; const d=new Date(s+"T12:00:00");return d.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"})}
function normalizeTime(s){
  s=String(s||"").trim().replace(/\s+/g,"");
  let h,m;
  if(/^\d{3,4}$/.test(s)){m=Number(s.slice(-2));h=Number(s.slice(0,-2));}
  else {const match=s.match(/^(\d{1,2}):(\d{2})$/);if(!match)return "";h=Number(match[1]);m=Number(match[2]);}
  if(h<0||h>23||m<0||m>59)return "";
  return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}
function fmtTime(s){return normalizeTime(s)||String(s||"").trim()}
const timeEntryIds=["scheduledTime","callTime","adjournTime"];
timeEntryIds.forEach(id=>{
  $(id)?.addEventListener("blur",e=>{
    if(!e.target.value.trim())return;
    const normalized=normalizeTime(e.target.value);
    if(normalized){e.target.value=normalized;e.target.setCustomValidity("");scheduleSave();}
    else {e.target.setCustomValidity("Enter a valid 24-hour time such as 0730, 07:30, 1930, or 19:30.");e.target.reportValidity();}
  });
  $(id)?.addEventListener("input",e=>e.target.setCustomValidity(""));
});
function personLabel(p){return [p.name,p.callsign].filter(Boolean).join(", ")}
function voteSentence(yes,no){
  if(yes===""&&no==="") return "";
  return ` A vote was taken and the motion ${Number(no||0)>Number(yes||0)?"failed":"passed"} ${yes||0}Y to ${no||0}N.`;
}
function textOrNone(arr){return arr.length?`<ol>${arr.map(x=>`<li>${esc(x.text||"")}</li>`).join("")}</ol>`:"<p>None.</p>"}

function refreshPreview(){
  const officers=state.attendance.filter(p=>p.role!=="Member"&&p.role!=="Guest"&&p.role!=="Other");
  const generalCount=state.attendance.length;
  let prior="";
  if(val("priorMinutesAction")||val("priorMotionBy")){
    prior=`<p>${esc(val("priorMinutesAction")||"Previous meeting minutes were addressed")}${val("priorMinutesMeeting")?` for the ${esc(val("priorMinutesMeeting"))}`:""}. ${val("priorMotionBy")?`A motion was made by ${esc(val("priorMotionBy"))}`:""}${val("priorSecondBy")?` and seconded by ${esc(val("priorSecondBy"))}`:""}.${voteSentence(val("priorYes"),val("priorNo"))}</p>${val("priorNotes")?`<p>${esc(val("priorNotes"))}</p>`:""}`;
  } else prior="<p>No entry recorded.</p>";

  let reports=state.reports.length?state.reports.map(r=>`<p><strong>${esc(r.title||"Report")}</strong><br>${esc(r.text||"")}</p>`).join(""):"<p>None recorded.</p>";
  if(val("reportsMotionBy")||val("reportsSecondBy")) reports+=`<p>A motion was made to accept the officer reports${val("reportsMotionBy")?` by ${esc(val("reportsMotionBy"))}`:""}${val("reportsSecondBy")?` and seconded by ${esc(val("reportsSecondBy"))}`:""}.${voteSentence(val("reportsYes"),val("reportsNo"))}</p>`;

  const adj=(val("adjournTime")||val("adjournMotionBy"))?`<p>A motion to adjourn the meeting was made${val("adjournTime")?` at ${esc(fmtTime(val("adjournTime")))}`:""}${val("adjournMotionBy")?` by ${esc(val("adjournMotionBy"))}`:""}${val("adjournSecondBy")?` and seconded by ${esc(val("adjournSecondBy"))}`:""}.${voteSentence(val("adjournYes"),val("adjournNo"))}</p>`:"<p>No adjournment entry recorded.</p>";

  $("minutesPreview").innerHTML=`
    <h1>The Blowtorch of Parma Amateur Radio Club</h1>
    <h2>(TBOPARC)</h2>
    <h3>${esc(val("meetingType")||"Meeting")}</h3>
    <p style="text-align:center">${esc(fmtDate(val("meetingDate")))}${val("scheduledTime")?`<br>${esc(fmtTime(val("scheduledTime")))}`:""}${val("location")?`<br>${esc(val("location"))}`:""}</p>

    <div class="section-title">Board of Directors In Attendance:</div>
    ${officers.length?officers.map(p=>`<p>${esc(personLabel(p))}${p.role?`, ${esc(p.role)}`:""}</p>`).join(""):"<p>None recorded.</p>"}

    <div class="section-title">Call to Order:</div>
    <p>The meeting was opened${val("callTime")?` at ${esc(fmtTime(val("callTime")))}`:""}${val("calledBy")?` by ${esc(val("calledBy"))}`:""}.${val("quorum")?" A quorum was present.":""}</p>

    <div class="section-title">Reading and Approval of Past Meeting Minutes:</div>
    ${prior}

    <div class="section-title">Officer Reports:</div>
    ${reports}

    <div class="section-title">Old Business:</div>
    ${textOrNone(state.oldBusiness)}

    <div class="section-title">New Business:</div>
    ${textOrNone(state.newBusiness)}

    <div class="section-title">Announcements:</div>
    ${textOrNone(state.announcements)}

    <div class="section-title">Presentation:</div>
    <p>${esc(val("presentation")||"None recorded.")}</p>

    <div class="section-title">Motion to Adjourn:</div>
    ${adj}
    <p>There were ${generalCount} people present at the meeting.</p>

    <div class="section-title">Submitted by:</div>
    <p>${esc([val("secretaryName"),val("secretaryCallsign")].filter(Boolean).join(", ")||"Secretary")}<br>
    Secretary<br>The Blowtorch of Parma ARC</p>`;
}

$("refreshPreviewBtn").onclick=refreshPreview;
$("printBtn").onclick=()=>{refreshPreview();window.print()};
$("wordBtn").onclick=()=>{
  refreshPreview();
  const doc=`<!doctype html><html><head><meta charset="utf-8"><title>TBOPARC Minutes</title></head><body>${$("minutesPreview").innerHTML}</body></html>`;
  const blob=new Blob([doc],{type:"application/msword"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download=`TBOPARC-Minutes-${val("meetingDate")||"meeting"}.doc`;a.click();URL.revokeObjectURL(a.href);
};
$("exportJsonBtn").onclick=()=>{
  save();const blob=new Blob([localStorage.getItem(STORAGE_KEY)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`TBOPARC-Meeting-${val("meetingDate")||"backup"}.json`;a.click();URL.revokeObjectURL(a.href);
};
$("importJsonInput").onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{const text=await f.text();JSON.parse(text);localStorage.setItem(STORAGE_KEY,text);location.reload()}catch(err){alert("That backup file could not be read.")}
};
$("newMeetingBtn").onclick=()=>{
  if(!confirm("Start a new meeting? The current meeting will be cleared from this device. Export a backup first if you want to keep it."))return;
  localStorage.removeItem(STORAGE_KEY);
  location.reload();
};

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
load();
