const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const readJSON=(k,f)=>{try{return JSON.parse(localStorage.getItem(k)||JSON.stringify(f))}catch{return f}};
const S={
 provider:localStorage.novaProvider||'local',serverUrl:localStorage.novaServerUrl||'',key:localStorage.novaKey||'',model:localStorage.novaModel||'gemini-2.5-flash',
 conversationId:localStorage.novaConversationId||((crypto.randomUUID&&crypto.randomUUID())||String(Date.now())),messages:readJSON('novaMessages',[]),memory:readJSON('novaMemory',[]),notes:readJSON('novaNotes',[]),
 knowledge:readJSON('novaKnowledge',[]),tasks:readJSON('novaTasks',[]),activity:readJSON('novaActivity',[]),
 permissions:{web:false,github:false,email:false,calendar:false,automation:false,...readJSON('novaPermissions',{})},
 theme:localStorage.novaTheme||'dark',timers:readJSON('novaTimers',[]),busy:false
};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function save(){localStorage.novaServerUrl=S.serverUrl;localStorage.novaConversationId=S.conversationId;for(const k of ['messages','memory','notes','knowledge','tasks','activity','permissions','timers'])localStorage.setItem('nova'+k[0].toUpperCase()+k.slice(1),JSON.stringify(S[k]));localStorage.novaProvider=S.provider;localStorage.novaModel=S.model;localStorage.novaTheme=S.theme}
function log(action,detail=''){S.activity.unshift({time:new Date().toLocaleString(),action,detail});S.activity=S.activity.slice(0,300);save();renderActivity()}
function render(){renderMessages();renderMemory();renderKnowledge();renderTasks();renderActivity();renderHistory();renderPermissions();renderNotes();renderTimers();updateClock();applyTheme()}
function renderMessages(){const b=$('#messages');if(!b)return;b.innerHTML=S.messages.slice(-100).map(m=>'<div class="msg '+esc(m.role)+'">'+esc(m.text)+'</div>').join('');b.scrollTop=b.scrollHeight}
function renderMemory(){const x=$('#memories');if(!x)return;x.innerHTML=S.memory.map((m,i)=>'<div class="memory"><span>'+esc(m)+'</span><button data-forget="'+i+'">Forget</button></div>').join('');x.querySelectorAll('[data-forget]').forEach(b=>b.onclick=()=>{S.memory.splice(+b.dataset.forget,1);save();renderMemory();log('Memory forgotten')})}
function renderKnowledge(){const x=$('#knowledgeList');if(!x)return;x.innerHTML=S.knowledge.map((m,i)=>'<div class="memory"><span>'+esc(m)+'</span><button data-kdel="'+i+'">Delete</button></div>').join('');x.querySelectorAll('[data-kdel]').forEach(b=>b.onclick=()=>{S.knowledge.splice(+b.dataset.kdel,1);save();renderKnowledge();log('Knowledge deleted')})}
function renderTasks(){const x=$('#taskList');if(!x)return;x.innerHTML=S.tasks.map((t,i)=>'<div class="memory"><label><input type="checkbox" '+(t.done?'checked':'')+' data-tog="'+i+'"> <span>'+esc(t.text)+'</span></label><button data-tdel="'+i+'">Delete</button></div>').join('');x.querySelectorAll('[data-tog]').forEach(b=>b.onchange=()=>{S.tasks[+b.dataset.tog].done=b.checked;save();log('Task updated',S.tasks[+b.dataset.tog].text)});x.querySelectorAll('[data-tdel]').forEach(b=>b.onclick=()=>{S.tasks.splice(+b.dataset.tdel,1);save();renderTasks();log('Task deleted')})}
function renderNotes(){const x=$('#notesList');if(!x)return;x.innerHTML=S.notes.map((n,i)=>'<div class="memory"><span>'+esc(n)+'</span><button data-ndel="'+i+'">Delete</button></div>').join('');x.querySelectorAll('[data-ndel]').forEach(b=>b.onclick=()=>{S.notes.splice(+b.dataset.ndel,1);save();renderNotes();log('Note deleted')})}
function renderTimers(){const x=$('#timerList');if(!x)return;x.innerHTML=S.timers.map((t,i)=>'<div class="memory"><span>'+esc(t.label)+' — '+new Date(t.when).toLocaleString()+'</span><button data-tdel2="'+i+'">Cancel</button></div>').join('');x.querySelectorAll('[data-tdel2]').forEach(b=>b.onclick=()=>{clearTimeout(S.timers[+b.dataset.tdel2].id);S.timers.splice(+b.dataset.tdel2,1);save();renderTimers();log('Timer cancelled')})}
function renderActivity(){const x=$('#activityList');if(!x)return;x.innerHTML=S.activity.slice(0,120).map(a=>'<div class="memory">'+esc(a.time+' — '+a.action+(a.detail?' — '+a.detail:''))+'</div>').join('')}
function renderHistory(){const x=$('#historyList');if(!x)return;x.innerHTML=S.messages.length?'<p>'+S.messages.length+' messages in this conversation.</p><button id="historyExport">Export conversation</button>':'<p>No conversation yet.</p>';$('#historyExport')?.addEventListener('click',()=>download('nova-conversation.json',JSON.stringify(S.messages,null,2)))}
function renderPermissions(){const x=$('#permissionList');if(!x)return;x.innerHTML=Object.entries(S.permissions).map(([k,v])=>'<label class="memory"><span>'+esc(k)+'</span><input type="checkbox" data-perm="'+esc(k)+'" '+(v?'checked':'')+'></label>').join('');x.querySelectorAll('[data-perm]').forEach(b=>b.onchange=()=>{S.permissions[b.dataset.perm]=b.checked;save();log('Permission changed',b.dataset.perm+': '+b.checked)})}
function msg(role,text){S.messages.push({role,text,time:Date.now()});save();renderMessages();if(role==='nova'&&localStorage.novaAutoSpeak==='1')speak(text)}
function addMemory(v){v=String(v||'').trim();if(!v)return false;if(!S.memory.some(x=>x.toLowerCase()===v.toLowerCase())){S.memory.unshift(v);S.memory=S.memory.slice(0,200);save();renderMemory();log('Memory added',v);return true}return false}
function addTaskText(v){v=String(v||'').trim();if(!v)return false;if(!S.tasks.some(x=>x.text.toLowerCase()===v.toLowerCase()&&!x.done)){S.tasks.push({text:v,done:false,createdAt:Date.now()});save();renderTasks();log('Task added',v);return true}return false}
function completeTask(q){const n=String(q||'').trim().toLowerCase();const i=S.tasks.findIndex(x=>!x.done&&(x.text.toLowerCase()===n||x.text.toLowerCase().includes(n)));if(i<0)return false;S.tasks[i].done=true;S.tasks[i].completedAt=Date.now();save();renderTasks();log('Task completed',S.tasks[i].text);return S.tasks[i].text}
function download(name,data,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type}));a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function safeCalc(x){x=String(x||'').trim();if(!/^[0-9+\-*/().%\s]+$/.test(x))throw Error('Only arithmetic is allowed');return Function('"use strict";return ('+x+')')()}
function localBrain(t){
 const q=t.trim(), l=q.toLowerCase();
 if(/^remember(?: that)? /i.test(q)){const m=q.replace(/^remember(?: that)? /i,'').trim();if(m){S.memory.push(m);save();renderMemory();log('Memory added',m);return 'I’ll remember that: '+m}}
 if(/^forget (?:that )?/i.test(q)){const m=q.replace(/^forget (?:that )?/i,'').trim().toLowerCase();const before=S.memory.length;S.memory=S.memory.filter(x=>!x.toLowerCase().includes(m));save();renderMemory();return before===S.memory.length?'I could not find that memory.':'Forgot matching memory.'}
 if(/^(what do you know about me|what do you remember)/i.test(q))return S.memory.length?'Here’s what I remember:\n• '+S.memory.join('\n• '):'I don’t have any saved memories yet.';
 if(/^(list|show) (my )?tasks/i.test(q))return S.tasks.length?'Tasks:\n'+S.tasks.map((x,i)=>(i+1)+'. '+(x.done?'✓':'○')+' '+x.text).join('\n'):'You have no saved tasks.';
 if(/^(list|show) (my )?notes/i.test(q))return S.notes.length?'Notes:\n• '+S.notes.join('\n• '):'You have no saved notes.';
 if(/^clear (all )?memory/i.test(q)){S.memory=[];save();renderMemory();return 'All saved memory has been cleared.'}
 if(/^calculate /i.test(q))try{return String(safeCalc(q.slice(10)))}catch{return 'Invalid calculation.'}
 if(/what can you do|capabilities/i.test(q))return 'I can chat, remember context, use local tools, analyze images and CSVs, browse public GitHub repositories, search the Web panel, use voice, manage tasks and timers, create calendar files and email drafts, and keep an activity trail.';
 if(/who are you/i.test(q))return 'I’m Nova — your modular personal AI workspace.';
 if(/how do you work/i.test(q))return 'I use a local tool layer first, then a connected AI model when available. I keep workspace data in your browser unless you explicitly connect an external service.';
 if(/what time is it|current time/i.test(q))return 'It is '+new Date().toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})+'.';
 return 'I can handle local commands right now. Connect Gemini in Settings when you want full natural-language reasoning, planning and conversation.';
}
async function geminiText(t){
 const history=S.messages.slice(-31,-1).map(m=>({role:m.role==='user'?'user':'model',parts:[{text:m.text}]}));
 const contents=[...history,{role:'user',parts:[{text:t}]}];
 const system='You are Nova, a capable personal AI assistant. Be accurate, practical and concise. Never claim an action happened unless the app confirms it. Use remembered context when useful. Known memory:\n- '+S.memory.join('\n- ')+'\nKnown knowledge:\n- '+S.knowledge.join('\n- ');
 return geminiRequest({system_instruction:{parts:[{text:system}]},contents});
}
async function serverChat(t){
 const history=S.messages.slice(-31,-1).map(m=>({role:m.role==='user'?'user':'assistant',content:m.text}));
 const base=(S.serverUrl||'').replace(/\/$/,'');const r=await fetch((base||'')+'/api/chat',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({provider:S.provider,model:S.model,messages:[...history,{role:'user',content:t}],system:'You are Nova, a capable personal AI assistant. Be accurate and honest.'})});
 const j=await r.json();if(!r.ok)throw Error(j.error||'Server AI unavailable');return j.text||'No response.';
}
function toolRoute(q){
 const s=q.trim();
 if(/^calculate\\s+/i.test(s)) return {type:'calc',value:s.replace(/^calculate\\s+/i,'')};
 if(/^remember(?:\\s+that)?\\s+/i.test(s)) return {type:'memory',value:s.replace(/^remember(?:\\s+that)?\\s+/i,'')};
 if(/^forget (?:that )?/i.test(s)) return {type:'forget',value:s.replace(/^forget (?:that )?/i,'')};
 if(/^clear (?:all )?memory$/i.test(s)) return {type:'clearMemory'};
 if(/^(?:show|list) (?:my )?tasks$/i.test(s)) return {type:'listTasks'};
 if(/^(?:show|list) (?:my )?notes$/i.test(s)) return {type:'listNotes'};
 if(/^(?:complete|finish|done) (?:task[: ]?)(.+)$/i.test(s)) return {type:'completeTask',value:s.replace(/^(?:complete|finish|done) (?:task[: ]?)/i,'')};
 if(/^(?:add|create) (?:a )?task[: ]/i.test(s)) return {type:'task',value:s.replace(/^(?:add|create) (?:a )?task[: ]/i,'')};
 if(/^note[: ]/i.test(s)) return {type:'note',value:s.replace(/^note[: ]/i,'')};
 if(/^search(?: the)? web for /i.test(s)) return {type:'web',value:s.replace(/^search(?: the)? web for /i,'')};
 if(/^search github for /i.test(s)) return {type:'githubSearch',value:s.replace(/^search github for /i,'')};
 if(/^json(?: pretty)?[: ]/i.test(s)) return {type:'json',value:s.replace(/^json(?: pretty)?[: ]/i,'')};
 const tm=s.match(/^(?:set )?timer for (\\d+(?:\\.\\d+)?)\\s*(seconds?|secs?|minutes?|mins?|hours?|hrs?)(?:\\s+(?:for|to)\\s+(.+))?$/i);
 if(tm)return {type:'timer',minutes:tm[2].toLowerCase().startsWith('hour')||tm[2].toLowerCase().startsWith('hr')?Number(tm[1])*60:tm[2].toLowerCase().startsWith('sec')?Number(tm[1])/60:Number(tm[1]),label:tm[3]||'Nova timer'};
 if(/^(?:switch|set) (dark|light|day|night)(?: theme)?$/i.test(s))return {type:'theme',value:s.match(/(dark|light|day|night)/i)[1].toLowerCase()};
 return null;
}
async function send(t){
 t=String(t||'').trim();if(!t||S.busy)return;msg('user',t);const input=$('#input');if(input)input.value='';
 S.busy=true;$('#typing')?.classList.add('show');if($('#status'))$('#status').textContent='Thinking…';let r;
 try{
  const tr=toolRoute(t);
  if(tr?.type==='calc')r=String(safeCalc(tr.value));
  else if(tr?.type==='memory'){const m=tr.value.trim();r=addMemory(m)?'I’ll remember that: '+m:(m?'I already had that memory.':'Tell me what to remember.')}else if(tr?.type==='forget'){const m=tr.value.trim().toLowerCase(),before=S.memory.length;S.memory=S.memory.filter(x=>!x.toLowerCase().includes(m));save();renderMemory();r=before===S.memory.length?'I could not find that memory.':'Forgot matching memory.'}else if(tr?.type==='clearMemory'){S.memory=[];save();renderMemory();r='All saved memory has been cleared.'}else if(tr?.type==='listTasks'){r=S.tasks.length?'Tasks:\n'+S.tasks.map((x,i)=>(i+1)+'. '+(x.done?'✓':'○')+' '+x.text).join('\n'):'You have no tasks.'}else if(tr?.type==='listNotes'){r=S.notes.length?'Notes:\n• '+S.notes.join('\n• '):'You have no notes.'}else if(tr?.type==='completeTask'){const done=completeTask(tr.value);r=done?'Completed: '+done:'I could not find that task.'}
  else if(tr?.type==='web'){await webSearch(tr.value);r='I searched the Web panel for: '+tr.value}else if(tr?.type==='githubSearch'){const u='https://api.github.com/search/repositories?q='+encodeURIComponent(tr.value);const rr=await fetch(u);const jj=await rr.json();if(!rr.ok)throw Error(jj.message||'GitHub search failed');r=(jj.items||[]).slice(0,5).map(x=>x.full_name+' — ★'+x.stargazers_count+' — '+(x.description||'')).join('\n')||'No GitHub repositories found.';log('GitHub search',tr.value)}else if(tr?.type==='json'){try{r=JSON.stringify(JSON.parse(tr.value),null,2)}catch{r='That is not valid JSON.'}}
  else if(tr?.type==='task'){r=addTaskText(tr.value)?'Task added: '+tr.value:'That task is already on your list.'}
  else if(tr?.type==='note'){S.notes.push(tr.value);save();renderNotes();r='Note saved: '+tr.value;log('Note saved',tr.value)}
  else if(tr?.type==='timer'){const when=Date.now()+tr.minutes*60000,label=tr.label,timer={label,when,id:null};timer.id=setTimeout(()=>{alert('Nova: '+label);if('Notification'in window&&Notification.permission==='granted')new Notification('Nova timer',{body:label});S.timers=S.timers.filter(x=>x!==timer);save();renderTimers();log('Timer fired',label)},tr.minutes*60000);S.timers.push(timer);save();renderTimers();r='Timer set for '+tr.minutes+' minute(s): '+label;log('Timer created',label)}
  else if(tr?.type==='theme'){S.theme=(tr.value==='day'||tr.value==='light')?'light':'dark';save();applyTheme();r='Theme changed to '+S.theme;log('Theme changed',S.theme)}
  else if(S.provider==='gemini'&&S.key){try{r=await serverChat(t)}catch{r=await geminiText(t)}}
  else r=localBrain(t);
 }catch(e){r='Nova error: '+(e?.message||e)}
 msg('nova',r||'No response.');log('Conversation turn',t.slice(0,120));S.busy=false;$('#typing')?.classList.remove('show');updateProviderStatus();
}
function speak(t){if(!('speechSynthesis'in window)){alert('Speech output is unavailable.');return}speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.rate=Number($('#rate')?.value||1);speechSynthesis.speak(u);log('Speech output')}
function listen(){const R=window.SpeechRecognition||window.webkitSpeechRecognition;if(!R){alert('Speech recognition is unavailable in this browser.');return}const r=new R();r.lang='en-IN';r.interimResults=false;r.onresult=e=>{$('#input').value=e.results[0][0].transcript;send($('#input').value)};r.onerror=e=>alert('Voice input: '+e.error);r.start();log('Voice listening started')}
function updateProviderStatus(){const connected=S.provider==='gemini'&&!!S.key;if($('#status'))$('#status').textContent=connected?'Gemini connected':'Local mode';if($('#modelBadge'))$('#modelBadge').textContent=connected?S.model.toUpperCase():'LOCAL'}function applyTheme(){document.documentElement.dataset.theme=S.theme;updateProviderStatus()}
function updateClock(){if($('#clock'))$('#clock').textContent=new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}
function csvParse(s){const rows=[];let row=[],cell='',q=false;for(let i=0;i<s.length;i++){const c=s[i],n=s[i+1];if(c==='"'&&q&&n==='"'){cell+='"';i++;continue}if(c==='"'){q=!q;continue}if(c===','&&!q){row.push(cell);cell='';continue}if((c==='\\n'||c==='\\r')&&!q){if(c==='\\r'&&n==='\\n')i++;row.push(cell);if(row.some(v=>v!==''))rows.push(row);row=[];cell='';continue}cell+=c}if(cell||row.length){row.push(cell);rows.push(row)}return rows}
function csvReport(text){const rows=csvParse(text),head=rows.shift()||[],out=['Rows: '+rows.length,'Columns: '+head.length,'Headers: '+head.join(', ')];head.forEach((h,idx)=>{const vals=rows.map(r=>r[idx]).filter(v=>v!==undefined);const nums=vals.map(Number).filter(Number.isFinite);if(nums.length>1){const sum=nums.reduce((a,b)=>a+b,0);out.push(h+': numeric='+nums.length+', min='+Math.min(...nums)+', max='+Math.max(...nums)+', avg='+(sum/nums.length).toFixed(2))}});return out.join('\\n')}
async function analyzeImage(file){const b64=await new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result.split(',')[1]);fr.onerror=rej;fr.readAsDataURL(file)});if(!S.key)return'Image preview is working. Add a Gemini key to enable image reasoning.';const mime=file.type||'image/jpeg';return geminiRequest({contents:[{role:'user',parts:[{text:'Analyze this image carefully. Describe visible content, text if readable, layout, objects and any useful details. Do not invent unreadable text.'},{inline_data:{mime_type:mime,data:b64}}]}]})}
async function webSearch(q){if(!q.trim())return;$('#webOut').textContent='Searching…';try{const u='https://en.wikipedia.org/w/api.php?action=opensearch&search='+encodeURIComponent(q)+'&limit=8&namespace=0&format=json&origin=*';const r=await fetch(u);if(!r.ok)throw Error('Search failed');const j=await r.json();const items=(j[1]||[]).map((t,i)=>t+' — '+(j[3]?.[i]||'')).join('\\n');$('#webOut').textContent=items||'No results.';log('Web search',q)}catch(e){$('#webOut').textContent='Web search error: '+e.message}}
async function githubRepo(){const repo=$('#repo').value.trim();if(!repo)return alert('Enter owner/repository');$('#githubOut').textContent='Loading…';try{const r=await fetch('https://api.github.com/repos/'+repo);const j=await r.json();if(!r.ok)throw Error(j.message||'Repository not found');$('#githubOut').textContent=JSON.stringify({name:j.full_name,description:j.description,stars:j.stargazers_count,forks:j.forks_count,language:j.language,default_branch:j.default_branch,url:j.html_url},null,2);log('GitHub repository read',repo)}catch(e){$('#githubOut').textContent='GitHub error: '+e.message}}
async function githubContents(){const repo=$('#repo').value.trim(),path=($('#repoPath').value||'').trim();if(!repo)return alert('Enter owner/repository');$('#githubOut').textContent='Loading…';try{const r=await fetch('https://api.github.com/repos/'+repo+'/contents/'+path);const j=await r.json();if(!r.ok)throw Error(j.message||'Unable to read contents');if(Array.isArray(j)){$('#githubOut').textContent=j.map(x=>x.type+'  '+x.path).join('\\n')}else if(j.encoding==='base64'){$('#githubOut').textContent=decodeURIComponent(escape(atob(j.content.replace(/\\n/g,''))))}else $('#githubOut').textContent=j.download_url||j.html_url;log('GitHub contents read',repo+'/'+path)}catch(e){$('#githubOut').textContent='GitHub error: '+e.message}}
function addTask(){const v=$('#taskIn').value.trim();if(!v)return;S.tasks.push({text:v,done:false});$('#taskIn').value='';save();renderTasks();log('Task added',v)}
function setTimer(){const mins=Math.max(0,Number($('#timerMinutes').value));const label=$('#timerLabel').value.trim()||'Nova timer';if(!Number.isFinite(mins))return;const when=Date.now()+mins*60000;const timer={label,when,id:null};timer.id=setTimeout(()=>{alert('Nova: '+label);if('Notification'in window&&Notification.permission==='granted')new Notification('Nova timer',{body:label});S.timers=S.timers.filter(t=>t!==timer);save();renderTimers();log('Timer fired',label)},mins*60000);S.timers.push(timer);save();renderTimers();log('Timer created',label)}
function requestNotify(){if('Notification'in window)Notification.requestPermission().then(x=>log('Notification permission',x))}
function makeICS(){const title=$('#calTitle').value.trim()||'Nova event',start=new Date($('#calStart').value||Date.now()),end=new Date(start.getTime()+60*60000),fmt=d=>d.toISOString().replace(/[-:]/g,'').replace(/\\.\\d{3}/,'');const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nova//EN','BEGIN:VEVENT','UID:'+Date.now()+'@nova','DTSTAMP:'+fmt(new Date()),'DTSTART:'+fmt(start),'DTEND:'+fmt(end),'SUMMARY:'+title,'END:VEVENT','END:VCALENDAR'].join('\\r\\n');download('nova-event.ics',ics,'text/calendar');log('Calendar file generated',title)}
function makeMail(){const to=$('#mailTo').value.trim(),subject=$('#mailSubject').value.trim(),body=$('#mailBody').value;location.href='mailto:'+encodeURIComponent(to)+'?subject='+encodeURIComponent(subject)+'&body='+encodeURIComponent(body);log('Mail draft opened',to)}
function exportMemory(){download('nova-memory.json',JSON.stringify(S.memory,null,2))}
function fileRead(file){return new Promise((res,rej)=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=rej;fr.readAsText(file)})}
function stageFiles(files){const x=$('#fileList');if(!x)return;x.innerHTML='';[...files].forEach(f=>{const d=document.createElement('div');d.className='memory';d.textContent=f.name+' — '+Math.round(f.size/1024)+' KB';x.append(d)});log('Files staged',files.length+' file(s)')}
$('#form')?.addEventListener('submit',e=>{e.preventDefault();send($('#input').value)});
$('#new')?.addEventListener('click',()=>{S.messages=[];save();render();log('New conversation')});
$$('.jump').forEach(b=>b.addEventListener('click',()=>{$$('.nav').forEach(x=>x.classList.remove('active'));const v=b.dataset.v;$$('.view').forEach(x=>x.classList.remove('active'));$('#'+v)?.classList.add('active');$('#title').textContent=v==='settings'?'Settings':v}));
$$('.nav').forEach(b=>b.addEventListener('click',()=>{$$('.nav').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.view').forEach(x=>x.classList.remove('active'));$('#'+b.dataset.v)?.classList.add('active');$('#title').textContent=b.textContent.trim()}));
$$('[data-prompt]').forEach(b=>b.addEventListener('click',()=>send(b.dataset.prompt)));
$('#voice')?.addEventListener('click',listen);$('#voiceStart')?.addEventListener('click',listen);$('#voiceLast')?.addEventListener('click',()=>{const m=[...S.messages].reverse().find(x=>x.role==='nova');if(m)speak(m.text)});
$('#remember')?.addEventListener('click',()=>{const v=$('#memIn').value.trim();if(v){S.memory.push(v);$('#memIn').value='';save();renderMemory();log('Memory added',v)}});
$('#exportMemory')?.addEventListener('click',exportMemory);
$('#saveKnowledge')?.addEventListener('click',()=>{const v=$('#knowledgeIn').value.trim();if(v){S.knowledge.push(v);$('#knowledgeIn').value='';save();renderKnowledge();log('Knowledge added')}});
$('#calcBtn')?.addEventListener('click',()=>{try{$('#calcOut').textContent=safeCalc($('#calc').value);log('Calculation run')}catch(e){$('#calcOut').textContent=e.message}});
$('#noteBtn')?.addEventListener('click',()=>{const v=$('#note').value.trim();if(v){S.notes.push(v);$('#note').value='';save();renderNotes();log('Note saved',v)}});
$('#exportAll')?.addEventListener('click',()=>download('nova-workspace.json',JSON.stringify({...S,key:undefined},null,2)));
$('#importAll')?.addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const fr=new FileReader();fr.onload=()=>{try{const d=JSON.parse(fr.result);for(const k of ['messages','memory','notes','knowledge','tasks','activity','permissions'])if(d[k]!==undefined)S[k]=d[k];save();render();log('Workspace imported')}catch{alert('Invalid workspace file')}};fr.readAsText(f)});
$('#fileInput')?.addEventListener('change',e=>stageFiles(e.target.files));
$('#visionFile')?.addEventListener('change',async e=>{const f=e.target.files[0],x=$('#visionPreview');if(!f)return;x.innerHTML='';const im=new Image();im.src=URL.createObjectURL(f);im.style.maxWidth='100%';im.style.maxHeight='360px';im.style.borderRadius='14px';x.append(im);log('Image staged',f.name);if(S.provider==='gemini'&&S.key){x.insertAdjacentHTML('beforeend','<p>Analyzing with Nova…</p>');try{x.lastChild.textContent=await analyzeImage(f)}catch(err){x.lastChild.textContent='Vision error: '+err.message}}});
$('#analyzeCode')?.addEventListener('click',async()=>{const c=$('#codeIn').value;if(!c)return;let out='Local scan: '+c.split('\\n').length+' lines, '+c.length+' characters.';if(S.provider==='gemini'&&S.key)try{out+='\\n\\nAI review:\\n'+await geminiText('Review this code for bugs, security issues and improvements. Be concrete.\\n\\n'+c)}catch(e){out+='\\nAI review unavailable: '+e.message}$('#codeOut').textContent=out;log('Code analyzed locally')});
$('#addTask')?.addEventListener('click',addTask);
$('#clearHistory')?.addEventListener('click',()=>{if(confirm('Clear conversation?')){S.messages=[];save();render();log('Conversation cleared')}});
$('#save')?.addEventListener('click',()=>{S.provider=$('#provider').value;S.key=$('#key').value.trim();S.model=$('#model').value.trim()||'gemini-2.5-flash';S.serverUrl=$('#serverUrl').value.trim();localStorage.novaProvider=S.provider;localStorage.novaKey=S.key;localStorage.novaModel=S.model;updateProviderStatus();if($('#providerOut'))$('#providerOut').textContent=S.provider==='gemini'?(S.key?'Gemini key saved locally. Test the connection before chatting.':'Gemini selected — add your API key.'):'Local tools selected.';log('Provider settings changed',S.provider)});
$('#forget')?.addEventListener('click',()=>{$('#key').value='';S.key='';localStorage.removeItem('novaKey');updateProviderStatus();if($('#providerOut'))$('#providerOut').textContent='Gemini key removed from this browser.';log('Gemini key forgotten')});
$('#testGemini')?.addEventListener('click',async()=>{const out=$('#providerOut');if(out)out.textContent='Testing Gemini…';try{const r=await geminiRequest({contents:[{role:'user',parts:[{text:'Reply with exactly: Nova connection successful.'}]}]});if(out)out.textContent='✓ '+r;log('Gemini connection test passed')}catch(e){if(out)out.textContent='✕ Gemini test failed: '+e.message;log('Gemini connection test failed',e.message)}});
$('#resetPermissions')?.addEventListener('click',()=>{S.permissions={web:false,github:false,email:false,calendar:false,automation:false};save();renderPermissions();log('Permissions reset')});
$('#webSearch')?.addEventListener('click',()=>webSearch($('#webQuery').value));
$('#githubInfo')?.addEventListener('click',githubRepo);$('#githubContents')?.addEventListener('click',githubContents);
$('#timerBtn')?.addEventListener('click',setTimer);$('#notifyBtn')?.addEventListener('click',requestNotify);
$('#calendarBtn')?.addEventListener('click',makeICS);$('#mailBtn')?.addEventListener('click',makeMail);
$('#dataFile')?.addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;const t=await fileRead(f);$('#dataOut').textContent=f.name.toLowerCase().endsWith('.csv')?csvReport(t):'Loaded '+f.name+' ('+t.length+' characters). For JSON: '+(t.trim().startsWith('{')||t.trim().startsWith('[')?'valid JSON candidate':'text data');log('Data file analyzed',f.name)});
$$('[data-info]').forEach(b=>b.addEventListener('click',()=>alert('Nova adapter status: this panel is functional locally. External provider actions require credentials/permission; the app will not fake a successful external action.')));
$('#themeBtn')?.addEventListener('click',()=>{S.theme=S.theme==='dark'?'light':'dark';save();applyTheme();log('Theme changed',S.theme)});
$('#autoSpeak')?.addEventListener('change',e=>{localStorage.novaAutoSpeak=e.target.checked?'1':'0';log('Auto speech',String(e.target.checked))});
$('#runDiagnostics')?.addEventListener('click',runDiagnostics);
window.addEventListener('error',e=>{console.error(e.error||e.message);if($('#status'))$('#status').textContent='Error: '+(e.message||'runtime error')});
window.addEventListener('unhandledrejection',e=>{console.error(e.reason);if($('#status'))$('#status').textContent='Error: '+(e.reason?.message||e.reason||'unhandled rejection')});
function runDiagnostics(){
 const ids=['form','input','messages','historyList','memories','knowledgeList','webOut','visionPreview','fileList','calc','calcOut','notesList','dataOut','codeIn','codeOut','repo','githubOut','timerList','taskList','activityList','provider','key','model','permissionList'];
 const missing=ids.filter(id=>!document.getElementById(id));
 const checks=[
  ['DOM bindings',missing.length===0,missing.length?'Missing: '+missing.join(', '):'All required UI elements found'],
  ['Local storage',(()=>{try{localStorage.setItem('novaDiag','ok');localStorage.removeItem('novaDiag');return true}catch{return false}})(),'Browser storage available'],
  ['Calculator',(()=>{try{return safeCalc('17*29')===493}catch{return false}})(),'17*29 = 493'],
  ['CSV parser',csvParse('a,b\\n1,2').length===2,'CSV rows parsed'],
  ['Tool router',(()=>{try{return !!toolRoute('calculate 2+2')&&toolRoute('calculate 2+2').type==='calc'&&!!toolRoute('remember that x')&&toolRoute('remember that x').type==='memory'&&!!toolRoute('add task: x')&&toolRoute('add task: x').type==='task'}catch{return false}})(),'Natural-language local commands route correctly'],
  ['Theme router',(()=>{try{return toolRoute('set dark theme')?.type==='theme'&&toolRoute('set dark theme')?.value==='dark'}catch{return false}})(),'Theme command routes correctly'],
  ['Speech output','speechSynthesis' in window,'Browser speech synthesis available'],
  ['Speech input',!!(window.SpeechRecognition||window.webkitSpeechRecognition),'Browser speech recognition available'],
  ['Gemini configuration',!!S.key||S.provider==='local',S.key?'Gemini key configured':'Local mode selected']
 ];
 const passed=checks.filter(x=>x[1]).length;
 const failed=checks.length-passed+(missing.length?1:0);
 const detail=checks.map(x=>(x[1]?'PASS':'FAIL')+' — '+x[0]+' — '+x[2]).concat(missing.length?['FAIL — DOM bindings — '+missing.join(', ')]:[]);
 const box=$('#diagnosticsOut');if(box)box.textContent=detail.join('\\n')+'\\n\\n'+passed+'/'+checks.length+' core checks passed'+(missing.length?' (DOM check failed)':'');
 if($('#status'))$('#status').textContent=failed?'Diagnostics: '+failed+' issue(s)':'Diagnostics: all core checks passed';
 log('Diagnostics run',passed+'/'+checks.length+' core checks passed');
 return {passed,failed,detail};
}
function restoreTimers(){const now=Date.now();S.timers=S.timers.filter(t=>t.when>now);S.timers.forEach(t=>{t.id=setTimeout(()=>{alert('Nova: '+t.label);if('Notification'in window&&Notification.permission==='granted')new Notification('Nova timer',{body:t.label});S.timers=S.timers.filter(x=>x!==t);save();renderTimers();log('Timer fired',t.label)},Math.max(0,t.when-Date.now()))});save()}
applyTheme();restoreTimers();if($('#provider'))$('#provider').value=S.provider;if($('#key'))$('#key').value=S.key;if($('#model'))$('#model').value=S.model;if($('#autoSpeak'))$('#autoSpeak').checked=localStorage.novaAutoSpeak==='1';if($('#serverUrl'))$('#serverUrl').value=S.serverUrl;setInterval(updateClock,1000);render();updateProviderStatus();
