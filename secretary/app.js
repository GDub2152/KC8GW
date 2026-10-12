const STORAGE_KEY="tboparcSecretaryHelperV1";
const $=id=>document.getElementById(id);
const scalarIds=["treasurerBalance","treasurerNotes","totalPresent","meetingType","meetingDate","scheduledTime","location","callTime","calledBy","quorum","priorMinutesAction","priorMinutesMeeting","priorMotionBy","priorSecondBy","priorYes","priorNo","priorNotes","reportsMotionBy","reportsSecondBy","reportsYes","reportsNo","presentation","adjournTime","adjournMotionBy","adjournSecondBy","adjournYes","adjournNo","secretaryName","secretaryCallsign"];
let state={attendance:[],reports:[],oldBusiness:[],newBusiness:[],announcements:[],attachments:[]};
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
    state.oldBusiness=data.oldBusiness||[];state.newBusiness=data.newBusiness||[];state.announcements=data.announcements||[];state.attachments=data.attachments||[];
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
        ${["President","Vice President","Secretary","Treasurer","Sergeant at Arms","Trustee1","Trustee2","Repeater/License Trustee","Director-at-Large","Other Officer"].map(x=>`<option ${p.role===x?"selected":""}>${x}</option>`).join("")}
      </select></label>
      <button class="danger small" data-remove-att="${p.id}">Remove</button>
    </div>`;
    root.appendChild(card);
  });
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

const ATTACH_DB="tboparcSecretaryAttachmentsV1";
const ATTACH_STORE="files";
function openAttachmentDb(){
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(ATTACH_DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(ATTACH_STORE))req.result.createObjectStore(ATTACH_STORE,{keyPath:"id"})};
    req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error);
  });
}
async function storeAttachment(meta,file){
  const db=await openAttachmentDb();
  await new Promise((resolve,reject)=>{const tx=db.transaction(ATTACH_STORE,"readwrite");tx.objectStore(ATTACH_STORE).put({id:meta.id,blob:file});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
}
async function getAttachment(id){
  const db=await openAttachmentDb();
  const rec=await new Promise((resolve,reject)=>{const req=db.transaction(ATTACH_STORE).objectStore(ATTACH_STORE).get(id);req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)});db.close();return rec?.blob||null;
}
async function deleteAttachmentFile(id){
  const db=await openAttachmentDb();
  await new Promise((resolve,reject)=>{const tx=db.transaction(ATTACH_STORE,"readwrite");tx.objectStore(ATTACH_STORE).delete(id);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
}
async function clearAttachmentFiles(){
  const db=await openAttachmentDb();
  await new Promise((resolve,reject)=>{const tx=db.transaction(ATTACH_STORE,"readwrite");tx.objectStore(ATTACH_STORE).clear();tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error)});db.close();
}
function formatBytes(n){if(n<1024)return `${n} B`;if(n<1048576)return `${(n/1024).toFixed(1)} KB`;return `${(n/1048576).toFixed(1)} MB`}
function renderAttachments(){
  const root=$("attachmentList");if(!root)return;root.innerHTML="";
  if(!state.attachments.length){root.innerHTML='<div class="entry-card">No attachments added.</div>';return}
  state.attachments.forEach(a=>{
    const card=document.createElement("div");card.className="entry-card attachment-row";
    card.innerHTML=`<div class="attachment-meta"><div class="attachment-name">${esc(a.name)}</div><div class="attachment-details">${esc(a.type||"File")} · ${formatBytes(a.size||0)}</div></div><button class="secondary small" data-download-attachment="${a.id}">Download</button><button class="danger small" data-remove-attachment="${a.id}">Remove</button>`;
    root.appendChild(card);
  });
}

function renderAll(){renderAttendance();renderReports();["oldBusiness","newBusiness","announcements"].forEach(renderItems);renderAttachments();refreshPreview()}

document.addEventListener("input",e=>{
  if(scalarIds.includes(e.target.id)) scheduleSave();
  const att=e.target.dataset.att;if(att){const p=state.attendance.find(x=>x.id===att);if(p){p[e.target.dataset.field]=e.target.value;scheduleSave()}}
  const rep=e.target.dataset.report;if(rep){const r=state.reports.find(x=>x.id===rep);if(r){r[e.target.dataset.field]=e.target.value;scheduleSave()}}
  const kind=e.target.dataset.itemKind;if(kind){const it=state[kind].find(x=>x.id===e.target.dataset.itemId);if(it){it.text=e.target.value;scheduleSave()}}
});
document.addEventListener("change",e=>{if(scalarIds.includes(e.target.id))scheduleSave()});


$("attachmentInput").onchange=async e=>{
  const files=[...(e.target.files||[])];if(!files.length)return;
  for(const file of files){
    const meta={id:uid(),name:file.name,type:file.type||"File",size:file.size,addedAt:new Date().toISOString()};
    try{await storeAttachment(meta,file);state.attachments.push(meta)}catch(err){alert(`Could not store ${file.name} on this device.`)}
  }
  e.target.value="";renderAttachments();scheduleSave();refreshPreview();
};

$("addPersonBtn").onclick=()=>{state.attendance.push({id:uid(),name:"",callsign:"",role:"President"});renderAttendance();scheduleSave()};
$("addReportBtn").onclick=()=>{state.reports.push({id:uid(),title:"",text:""});renderReports();scheduleSave()};
document.querySelectorAll("[data-add-item]").forEach(b=>b.onclick=()=>{const k=b.dataset.addItem;state[k].push({id:uid(),text:""});renderItems(k);scheduleSave()});
document.addEventListener("click",async e=>{
  if(e.target.dataset.downloadAttachment){const a=state.attachments.find(x=>x.id===e.target.dataset.downloadAttachment);if(a){const blob=await getAttachment(a.id);if(blob){const link=document.createElement("a");link.href=URL.createObjectURL(blob);link.download=a.name;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}else alert("The attachment file is not available on this device.")}}
  if(e.target.dataset.removeAttachment){const id=e.target.dataset.removeAttachment;await deleteAttachmentFile(id).catch(()=>{});state.attachments=state.attachments.filter(x=>x.id!==id);renderAttachments();scheduleSave();refreshPreview()}
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
  const officers=state.attendance.filter(p=>true);
  const generalCount=String(val("totalPresent")||"0").trim();
  let prior="";
  if(val("priorMinutesAction")||val("priorMotionBy")){
    prior=`<p>${esc(val("priorMinutesAction")||"Previous meeting minutes were addressed")}${val("priorMinutesMeeting")?` for the ${esc(val("priorMinutesMeeting"))}`:""}. ${val("priorMotionBy")?`A motion was made by ${esc(val("priorMotionBy"))}`:""}${val("priorSecondBy")?` and seconded by ${esc(val("priorSecondBy"))}`:""}.${voteSentence(val("priorYes"),val("priorNo"))}</p>${val("priorNotes")?`<p>${esc(val("priorNotes"))}</p>`:""}`;
  } else prior="<p>No entry recorded.</p>";

  const treasuryBalance=val("treasurerBalance");
  const treasuryNotes=val("treasurerNotes");
  const treasuryReport=(treasuryBalance!==""||treasuryNotes.trim())?`<p><strong>Treasurer's Report</strong><br>${treasuryBalance!==""?`Account balance: ${Number(treasuryBalance).toLocaleString("en-US",{style:"currency",currency:"USD"})}<br>`:""}${treasuryNotes.trim()?esc(treasuryNotes).replace(/\n/g,"<br>"):""}</p>`:"";
  let reports=state.reports.length?state.reports.map(r=>`<p><strong>${esc(r.title||"Report")}</strong><br>${esc(r.text||"")}</p>`).join(""):"<p>None recorded.</p>";
  reports=treasuryReport+reports;
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
    <p>There were ${esc(generalCount)} people present at the meeting.</p>

    <div class="section-title">Attachments:</div>
    ${state.attachments.length?`<ul>${state.attachments.map(a=>`<li>${esc(a.name)}</li>`).join("")}</ul>`:"<p>None.</p>"}

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

// Build a self-contained ZIP with the generated minutes and the original attachments.
function zipArchive(entries){
  const enc=new TextEncoder(), parts=[], central=[];
  let offset=0;
  const u16=n=>[n&255,(n>>>8)&255], u32=n=>[n&255,(n>>>8)&255,(n>>>16)&255,(n>>>24)&255];
  const crcTable=Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0});
  const crc32=data=>{let c=0xffffffff;for(const b of data)c=crcTable[(c^b)&255]^(c>>>8);return (c^0xffffffff)>>>0};
  for(const entry of entries){
    const name=enc.encode(entry.name), data=entry.data, crc=crc32(data);
    const local=new Uint8Array([...u32(0x04034b50),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...name]);
    parts.push(local,data);
    central.push(new Uint8Array([...u32(0x02014b50),...u16(20),...u16(20),...u16(0x0800),...u16(0),...u16(0),...u16(0),...u32(crc),...u32(data.length),...u32(data.length),...u16(name.length),...u16(0),...u16(0),...u16(0),...u16(0),...u32(0),...u32(offset),...name]));
    offset+=local.length+data.length;
  }
  const centralSize=central.reduce((n,p)=>n+p.length,0);
  const end=new Uint8Array([...u32(0x06054b50),...u16(0),...u16(0),...u16(entries.length),...u16(entries.length),...u32(centralSize),...u32(offset),...u16(0)]);
  return new Blob([...parts,...central,end],{type:"application/zip"});
}
function safeFileName(name){
  return String(name||"attachment").replace(/[\\/:*?"<>|\x00-\x1f]/g,"_").replace(/^\.+/,"_").slice(0,160)||"attachment";
}

// Offline PDF creation for text and images; preserves PDFs without alteration.
function pdfBytes(pages){
  const enc=new TextEncoder(),objects=[null],add=v=>(objects.push(v),objects.length-1);
  const font=add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageRefs=[], pageTree=add('');
  for(const pg of pages){
    let stream,resources=`<< /Font << /F1 ${font} 0 R >> >>`;
    if(pg.jpeg){
      const img=add({head:`<< /Type /XObject /Subtype /Image /Width ${pg.w} /Height ${pg.h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${pg.jpeg.length} >>`,bytes:pg.jpeg});
      resources=`<< /XObject << /Im1 ${img} 0 R >> >>`;
      const scale=Math.min(555/pg.w,735/pg.h),w=pg.w*scale,h=pg.h*scale;
      stream=`q ${w.toFixed(2)} 0 0 ${h.toFixed(2)} ${(612-w)/2} ${(792-h)/2} cm /Im1 Do Q`;
    }else{
      stream=pg.lines.map((line,i)=>`BT /F1 10 Tf 44 ${748-i*14} Td (${String(line).replace(/[^\x20-\x7e]/g,'?').replace(/[\\()]/g,'\\$&')}) Tj ET`).join('\n');
    }
    const streamData=enc.encode(stream),content=add({head:`<< /Length ${streamData.length} >>`,bytes:streamData});
    pageRefs.push(add(`<< /Type /Page /Parent ${pageTree} 0 R /MediaBox [0 0 612 792] /Resources ${resources} /Contents ${content} 0 R >>`));
  }
  objects[pageTree]=`<< /Type /Pages /Kids [${pageRefs.map(x=>x+' 0 R').join(' ')}] /Count ${pageRefs.length} >>`;
  const catalog=add(`<< /Type /Catalog /Pages ${pageTree} 0 R >>`);
  const parts=[enc.encode('%PDF-1.4\n')], offsets=[0];let length=parts[0].length;
  const push=b=>{parts.push(b);length+=b.length};
  for(let i=1;i<objects.length;i++){
    offsets[i]=length;push(enc.encode(`${i} 0 obj\n`));const obj=objects[i];
    if(typeof obj==='string')push(enc.encode(obj+'\n'));
    else{push(enc.encode(obj.head+'\nstream\n'));push(obj.bytes);push(enc.encode('\nendstream\n'))}
    push(enc.encode('endobj\n'));
  }
  const xref=length;push(enc.encode(`xref\n0 ${objects.length}\n0000000000 65535 f \n`));
  for(let i=1;i<objects.length;i++)push(enc.encode(String(offsets[i]).padStart(10,'0')+' 00000 n \n'));
  push(enc.encode(`trailer\n<< /Size ${objects.length} /Root ${catalog} 0 R >>\nstartxref\n${xref}\n%%EOF`));
  const output=new Uint8Array(length);let at=0;for(const b of parts){output.set(b,at);at+=b.length}return output;
}
function minutesPdf(){
  const text=$('minutesPreview').innerText.replace(/\r/g,'');const lines=[];
  for(const raw of text.split('\n')){
    if(!raw.trim()){lines.push('');continue}
    let line='';for(const word of raw.trim().split(/\s+/)){
      if((line+' '+word).length>92){lines.push(line);line=word}else line+=(line?' ':'')+word;
    }if(line)lines.push(line);
  }
  const pages=[];for(let i=0;i<lines.length;i+=49)pages.push({lines:lines.slice(i,i+49)});
  return pdfBytes(pages.length?pages:[{lines:['W8DRZ Meeting Minutes']}]);
}
async function imagePdf(blob){
  const url=URL.createObjectURL(blob);
  try{
    const img=new Image();img.src=url;await img.decode();
    const canvas=document.createElement('canvas');const scale=Math.min(1,2400/Math.max(img.naturalWidth,img.naturalHeight));
    canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(img,0,0,canvas.width,canvas.height);
    const jpeg=await new Promise(resolve=>canvas.toBlob(resolve,'image/jpeg',0.88));
    if(!jpeg)throw new Error('Image conversion failed');
    return pdfBytes([{jpeg:new Uint8Array(await jpeg.arrayBuffer()),w:canvas.width,h:canvas.height}]);
  }finally{URL.revokeObjectURL(url)}
}
$("downloadPackageBtn").onclick=async()=>{
  const button=$("downloadPackageBtn");button.disabled=true;button.textContent="Preparing ZIP…";
  try{
    refreshPreview();save();
    const enc=new TextEncoder();
    const date=val("meetingDate")||"meeting";
    const entries=[{name:"W8DRZ-Minutes-"+date+".pdf",data:minutesPdf()}];
    const missing=[],unsupported=[],used=new Set();
    for(const a of state.attachments){
      const blob=await getAttachment(a.id);
      if(!blob){missing.push(a.name);continue}
      let name=safeFileName(a.name),count=2;
      while(used.has(name.toLowerCase())){const dot=name.lastIndexOf(".");const base=dot>0?name.slice(0,dot):name,ext=dot>0?name.slice(dot):"";name=`${base}-${count++}${ext}`}
      used.add(name.toLowerCase());
      const ext=name.split('.').pop().toLowerCase();
      if(ext==='pdf'||blob.type==='application/pdf'){
        entries.push({name:"Attachments/"+name.replace(/\.[^.]+$/,'.pdf'),data:new Uint8Array(await blob.arrayBuffer())});
      }else if(blob.type.startsWith('image/')||['jpg','jpeg','png','webp','gif','bmp'].includes(ext)){
        try{entries.push({name:"Attachments/"+name.replace(/\.[^.]+$/, '')+'.pdf',data:await imagePdf(blob)})}
        catch(e){unsupported.push(name);entries.push({name:"Originals-needing-conversion/"+name,data:new Uint8Array(await blob.arrayBuffer())})}
      }else{
        unsupported.push(name);
        entries.push({name:"Originals-needing-conversion/"+name,data:new Uint8Array(await blob.arrayBuffer())});
      }
    }
    if(missing.length&&!confirm("These attachment files are unavailable on this device:\n"+missing.join("\n")+"\n\nDownload the remaining files?"))return;
    if(unsupported.length){
      const notice="The following files cannot be accurately converted to PDF in this offline browser tool. They will be preserved as originals in a separate folder:\n"+unsupported.join("\n")+"\n\nContinue?";
      if(!confirm(notice))return;
    }
    const zip=zipArchive(entries),url=URL.createObjectURL(zip),link=document.createElement("a");
    link.href=url;link.download="W8DRZ-Meeting-"+date+"-Complete.zip";document.body.appendChild(link);link.click();link.remove();
    setTimeout(()=>URL.revokeObjectURL(url),30000);
  }catch(err){alert("Could not prepare the meeting package: "+err.message)}
  finally{button.disabled=false;button.textContent="Download Minutes + Attachments (PDF ZIP)"}
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
  clearAttachmentFiles().finally(()=>location.reload());
};

if("serviceWorker" in navigator){window.addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}))}
load();
