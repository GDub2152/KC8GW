const STORAGE_KEY='kc8gw_tboparc_minutes_draft_v1';
const PEOPLE_KEY='kc8gw_tboparc_people_directory_v1';
const OFFICER_SEED_KEY='kc8gw_tboparc_officer_group_seed_v14';
const CURRENT_OFFICERS=[
  {role:'President',name:'Leone Sirna',call:'KB8VBR'},
  {role:'Vice President',name:'Bill Beckman',call:'N8LXY'},
  {role:'Secretary',name:'Greg Williams',call:'KC8GW'},
  {role:'Treasurer',name:'Dale Martin',call:'KJ8DM'},
  {role:'Sargent at Arms',name:'Rick Rawlinson',call:'N8PPS'},
  {role:'Trustee #1',name:'Scott Foschke',call:'N8OND'},
  {role:'Trustee #2',name:'Mike Doerner',call:'W8NIN'},
  {role:'License Trustee',name:'Edward Rivers II',call:'W8IE'}
];
const $=id=>document.getElementById(id);
const fieldIds=['clubName','clubAbbr','meetingType','meetingDate','meetingTime','meetingLocation','callTime','presidingOfficer','quorum','attendanceCount','callNotes','previousMeetingDate','minutesMover','minutesSeconder','minutesYes','minutesNo','minutesAbstain','minutesNotes','treasurerName','treasuryBalance','treasurerReport','secretaryName','memberCount','secretaryReport','reportsMover','reportsSeconder','reportsYes','reportsNo','reportsAbstain','presentation','adjournTime','adjournMover','adjournSeconder','adjournYes','adjournNo','adjournAbstain','submittedName','submittedCall','submittedTitle','submittedClub'];

function esc(s=''){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function nl2br(s=''){return esc(s).replace(/\n/g,'<br>')}
function fmtDate(v){if(!v)return ''; const d=new Date(v+'T12:00:00'); return new Intl.DateTimeFormat('en-US',{weekday:'long',day:'2-digit',month:'short',year:'numeric'}).format(d).replace(/, (\d{4})$/, '-$1').replace(/^([^,]+), /,'$1, ')}
function fmtLongDate(v){if(!v)return ''; const d=new Date(v+'T12:00:00'); return new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric'}).format(d)}
function fmtTime(v){if(!v)return ''; const [h,m]=v.split(':').map(Number); return new Intl.DateTimeFormat('en-US',{hour:'numeric',minute:'2-digit'}).format(new Date(2000,0,1,h,m)).toLowerCase()}
function voteText(y,n,a){const yy=y||'0', nn=n||'0', aa=a||'0'; return aa && Number(aa)>0 ? `${yy}Y to ${nn}N with ${aa} abstention${Number(aa)===1?'':'s'}`:`${yy}Y to ${nn}N`}
function person(name,call){return [name,call].filter(Boolean).join(' ')}
function normalizeCall(call=''){return String(call).trim().toUpperCase()}
function getPeople(){try{return JSON.parse(localStorage.getItem(PEOPLE_KEY)||'[]')}catch{return []}}
function setPeople(list){localStorage.setItem(PEOPLE_KEY,JSON.stringify(list));renderPeople()}
function combinedPerson(p){return [p.name,p.call].filter(Boolean).join(' ')}
function seedCurrentOfficers(){
  if(localStorage.getItem(OFFICER_SEED_KEY))return;
  let list=getPeople();
  CURRENT_OFFICERS.forEach(officer=>{
    const idx=list.findIndex(p=>normalizeCall(p.call)===officer.call || String(p.name||'').toLowerCase()===officer.name.toLowerCase());
    if(idx>=0) list[idx]={...list[idx],...officer}; else list.push({...officer});
  });
  list.sort((a,b)=>a.name.localeCompare(b.name));
  localStorage.setItem(PEOPLE_KEY,JSON.stringify(list));
  localStorage.setItem(OFFICER_SEED_KEY,'1');
}
function restoreCurrentOfficers(){
  let list=getPeople();
  CURRENT_OFFICERS.forEach(officer=>{
    const idx=list.findIndex(p=>normalizeCall(p.call)===officer.call || String(p.name||'').toLowerCase()===officer.name.toLowerCase());
    if(idx>=0) list[idx]={...list[idx],...officer}; else list.push({...officer});
  });
  list.sort((a,b)=>a.name.localeCompare(b.name)); setPeople(list);
  $('peopleStatus').textContent='Current officer group restored.';
}
function saveDirectoryPerson(name,call,{quiet=false}={}){
  name=String(name||'').trim(); call=normalizeCall(call);
  if(!name){if(!quiet)$('peopleStatus').textContent='Enter a name first.';return false}
  let list=getPeople();
  const idx=list.findIndex(p=>(call&&normalizeCall(p.call)===call)||p.name.toLowerCase()===name.toLowerCase());
  const existing=idx>=0?list[idx]:{};
  const entry={...existing,name,call};
  if(idx>=0)list[idx]=entry;else list.push(entry);
  list.sort((a,b)=>a.name.localeCompare(b.name)); setPeople(list);
  if(!quiet)$('peopleStatus').textContent=`Saved ${combinedPerson(entry)}.`;
  return true
}
function deleteDirectoryPerson(index){const list=getPeople();const p=list[index];if(!p)return;if(!confirm(`Delete ${combinedPerson(p)} from the saved names list?`))return;list.splice(index,1);setPeople(list);$('peopleStatus').textContent='Name deleted.'}
function renderPeople(){
  const list=getPeople();
  $('peopleCombinedList').innerHTML=list.map(p=>`<option value="${esc(combinedPerson(p))}"></option>`).join('');
  $('peopleNameList').innerHTML=list.map(p=>`<option value="${esc(p.name)}">${esc(p.call||'')}</option>`).join('');
  $('peopleList').innerHTML=list.length?list.map((p,i)=>`<div class="person-entry"><div><strong>${esc(p.name)}</strong><small>${esc([p.call,p.role].filter(Boolean).join(' • ')||'No callsign')}</small></div><button type="button" class="person-delete" data-person-index="${i}">Delete</button></div>`).join(''):'<div class="people-empty">No saved names yet. Add a person above or restore the current officer group.</div>';
  $('peopleList').querySelectorAll('.person-delete').forEach(b=>b.addEventListener('click',()=>deleteDirectoryPerson(Number(b.dataset.personIndex))));
}
function lookupPersonByName(name){const n=String(name||'').trim().toLowerCase();return getPeople().find(p=>p.name.toLowerCase()===n || combinedPerson(p).toLowerCase()===n)}
function learnPeopleFromForm(){
  rows('boardRows','.board-row').forEach(r=>{const name=r.querySelector('.board-name').value;const call=r.querySelector('.board-call').value;if(name.trim())saveDirectoryPerson(name,call,{quiet:true})});
  const sn=$('submittedName').value, sc=$('submittedCall').value;if(sn.trim())saveDirectoryPerson(sn,sc,{quiet:true});
}

function addBoardRow(data={}){const node=$('boardRowTemplate').content.firstElementChild.cloneNode(true);const nameEl=node.querySelector('.board-name'),callEl=node.querySelector('.board-call');nameEl.value=data.name||'';callEl.value=data.call||'';node.querySelector('.board-role').value=data.role||'';nameEl.addEventListener('change',()=>{const p=lookupPersonByName(nameEl.value);if(p){nameEl.value=p.name;if(!callEl.value.trim())callEl.value=p.call||'';const roleEl=node.querySelector('.board-role');if(!roleEl.value.trim())roleEl.value=p.role||'';}updatePreview()});wireRow(node);$('boardRows').appendChild(node)}
function addItemRow(containerId,text=''){const node=$('itemRowTemplate').content.firstElementChild.cloneNode(true);node.querySelector('.item-text').value=text;wireRow(node);$(containerId).appendChild(node)}
function wireRow(node){node.querySelectorAll('input,textarea').forEach(el=>el.addEventListener('input',updatePreview));node.querySelector('.remove-row').addEventListener('click',()=>{node.remove();updatePreview()})}
function rows(containerId,selector){return [...$(containerId).querySelectorAll(selector)]}
function collect(){const data={};fieldIds.forEach(id=>data[id]=$(id).value);data.board=rows('boardRows','.board-row').map(r=>({name:r.querySelector('.board-name').value,call:r.querySelector('.board-call').value,role:r.querySelector('.board-role').value}));['oldBusinessRows','newBusinessRows','announcementRows'].forEach(id=>data[id]=rows(id,'.item-text').map(x=>x.value).filter(x=>x.trim()));return data}
function load(data){fieldIds.forEach(id=>{if(data[id]!==undefined)$(id).value=data[id]});$('boardRows').innerHTML='';(data.board||[]).forEach(addBoardRow);['oldBusinessRows','newBusinessRows','announcementRows'].forEach(id=>{$(id).innerHTML='';(data[id]||[]).forEach(v=>addItemRow(id,v))});ensureStarterRows();updatePreview()}
function ensureStarterRows(){if(!$('boardRows').children.length)CURRENT_OFFICERS.forEach(addBoardRow);['oldBusinessRows','newBusinessRows','announcementRows'].forEach(id=>{if(!$(id).children.length)addItemRow(id,'')})}
function section(title,body){return `<section class="minutes-section"><h2>${esc(title)}:</h2>${body}</section>`}
function updatePreview(){const d=collect();const board=d.board.filter(x=>x.name||x.call||x.role).map(x=>`<li>${esc([x.name,x.call,x.role].filter(Boolean).join(', '))}</li>`).join('')||'<li class="empty-note">None listed.</li>';
const callText=`The meeting was opened${d.callTime?' at '+esc(fmtTime(d.callTime)):''}${d.presidingOfficer?' by '+esc(d.presidingOfficer):''}. The Secretary took attendance and there is a quorum ${esc(d.quorum||'present')}.${d.callNotes?'<br>'+nl2br(d.callNotes):''}`;
let previous=''; if(d.minutesNotes.trim()) previous=nl2br(d.minutesNotes); else if(d.minutesMover||d.minutesSeconder||d.previousMeetingDate){previous=`A motion to waive reading and accept the minutes of the ${esc(fmtLongDate(d.previousMeetingDate)||'previous')} membership meeting was made${d.minutesMover?' by '+esc(d.minutesMover):''}${d.minutesSeconder?' and seconded by '+esc(d.minutesSeconder):''}. A vote was taken and the motion passed ${esc(voteText(d.minutesYes,d.minutesNo,d.minutesAbstain))}.`}
const treasuryParts=[];if(d.treasuryBalance)treasuryParts.push(`reports $${Number(String(d.treasuryBalance).replace(/[$,]/g,'' )||0).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})} in the Club treasury`);if(d.treasurerReport)treasuryParts.push(d.treasurerReport.replace(/^./,c=>c.toLowerCase()));const treasury=`<p class="report-heading">Treasury</p><p>The Treasurer${d.treasurerName?' '+esc(d.treasurerName):''} ${treasuryParts.length?esc(treasuryParts.join(' and ')): 'gave the Treasurer\'s report'}.</p>`;
const secParts=[];if(d.secretaryReport)secParts.push(d.secretaryReport);if(d.memberCount)secParts.push(`${d.memberCount} current and active members`);if(d.attendanceCount)secParts.push(`${d.attendanceCount} people present at the meeting`);const secretary=`<p class="report-heading">Secretary</p><p>The Secretary${d.secretaryName?' '+esc(d.secretaryName):''} reports ${secParts.length?esc(secParts.join('. ')):'no report entered'}.</p>`;
let reportMotion='';if(d.reportsMover||d.reportsSeconder)reportMotion=`<p>A motion was made to accept the Treasurer’s and Secretary’s reports${d.reportsMover?' by '+esc(d.reportsMover):''}${d.reportsSeconder?' and seconded by '+esc(d.reportsSeconder):''}. A vote was taken and the motion passed ${esc(voteText(d.reportsYes,d.reportsNo,d.reportsAbstain))}.</p>`;
const items=(arr,numbered=false)=>arr.filter(Boolean).length?arr.filter(Boolean).map((x,i)=>`<p class="business-item">${numbered?'#'+(i+1)+'. ':''}${nl2br(x)}</p>`).join(''):'<p>None.</p>';
let adjourn='';if(d.adjournTime||d.adjournMover||d.adjournSeconder)adjourn=`A motion to adjourn the meeting${d.adjournTime?' was made at '+esc(fmtTime(d.adjournTime)): ' was made'}${d.adjournMover?' by '+esc(d.adjournMover):''}${d.adjournSeconder?' and seconded by '+esc(d.adjournSeconder):''}. A vote was taken and the motion passed ${esc(voteText(d.adjournYes,d.adjournNo,d.adjournAbstain))}.`;if(d.attendanceCount)adjourn+=`<br><br>There were ${esc(d.attendanceCount)} people present at the meeting${d.attendanceCount?' with the attendance list attached.':''}`;
const submitted=[person(d.submittedName,d.submittedCall),d.submittedTitle,d.submittedClub].filter(Boolean).map(esc).join('<br>');
$('minutesPreview').innerHTML=`
<div class="doc-title">${esc(d.clubName)}</div><div class="doc-abbr">(${esc(d.clubAbbr)})</div><div class="doc-type">${esc(d.meetingType)}</div>
<div class="doc-meta">${esc(fmtDate(d.meetingDate))}${d.meetingTime?'<br>'+esc(fmtTime(d.meetingTime)):''}${d.meetingLocation?'<br>'+esc(d.meetingLocation):''}</div>
${section('Board of Directors In Attendance',`<ul class="board-list">${board}</ul>`)}
${section('Call to Order',`<p>${callText}</p>`)}
${section('Reading and Approval of Past Meeting Minutes',`<p>${previous||'<span class="empty-note">No motion entered.</span>'}</p>`)}
${section('Officer Reports',treasury+secretary+reportMotion)}
${section('Old Business',items(d.oldBusinessRows))}
${section('New Business',items(d.newBusinessRows,true))}
${section('Announcements',items(d.announcementRows))}
${section('Presentation',`<p>${d.presentation?nl2br(d.presentation):'None.'}</p>`)}
${section('Motion to Adjourn',`<p>${adjourn||'<span class="empty-note">Not entered.</span>'}</p>`)}
${section('Submitted by',`<p class="submitted-lines">${submitted}</p>`)}
`}
function save(){learnPeopleFromForm();localStorage.setItem(STORAGE_KEY,JSON.stringify(collect()));$('saveStatus').textContent='Saved on this device at '+new Date().toLocaleTimeString([], {hour:'numeric',minute:'2-digit'})}
function newMeeting(){if(!confirm('Start a new meeting? Your current on-screen entries will be cleared. Save or export first if you need them.'))return;localStorage.removeItem(STORAGE_KEY);location.reload()}
function exportData(){const blob=new Blob([JSON.stringify(collect(),null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`TBOPARC-Minutes-${$('meetingDate').value||'draft'}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function importData(file){const r=new FileReader();r.onload=()=>{try{load(JSON.parse(r.result));save()}catch(e){alert('That backup file could not be read.')}};r.readAsText(file)}

$('addBoardBtn').addEventListener('click',()=>{addBoardRow();updatePreview()});document.querySelectorAll('.add-item').forEach(b=>b.addEventListener('click',()=>{addItemRow(b.dataset.add,'');updatePreview()}));fieldIds.forEach(id=>$(id).addEventListener('input',updatePreview));$('saveBtn').addEventListener('click',save);$('printBtn').addEventListener('click',()=>window.print());$('newMeetingBtn').addEventListener('click',newMeeting);$('exportBtn').addEventListener('click',exportData);$('importInput').addEventListener('change',e=>{if(e.target.files[0])importData(e.target.files[0]);e.target.value=''});

$('restoreOfficersBtn').addEventListener('click',restoreCurrentOfficers);
$('savePersonBtn').addEventListener('click',()=>{if(saveDirectoryPerson($('personName').value,$('personCall').value)){$('personName').value='';$('personCall').value=''}});$('personCall').addEventListener('keydown',e=>{if(e.key==='Enter')$('savePersonBtn').click()});seedCurrentOfficers();renderPeople();

const saved=localStorage.getItem(STORAGE_KEY);if(saved){try{load(JSON.parse(saved));$('saveStatus').textContent='Loaded saved draft from this device'}catch{ensureStarterRows();updatePreview()}}else{ensureStarterRows();const today=new Date();$('meetingDate').value=today.toISOString().slice(0,10);updatePreview()}
let autosaveTimer;document.addEventListener('input',()=>{clearTimeout(autosaveTimer);autosaveTimer=setTimeout(save,1200)});
