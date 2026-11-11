/* Rendering + dialogs. Event delegation via data-a attributes. */
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const mmss=ms=>{const s=Math.ceil(ms/1e3);return pad(Math.floor(s/60))+':'+pad(s%60)};
const clock=ts=>{const d=new Date(ts);return pad(d.getHours())+':'+pad(d.getMinutes())};
const VIEWS=[['roulette','Roulette'],['tasks','Tasks'],['cats','Categories'],['leisure','Leisure'],['chaos','Chaos'],['stats','Stats'],['settings','Settings']];
let view='roulette';
function toast(m){const t=$('#toast');t.textContent=m;t.className='on';clearTimeout(toast.t);toast.t=setTimeout(()=>t.className='',2600)}
function beep(f=660,d=.15){if(!S.settings.sound)return;try{const c=new(window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.frequency.value=f;o.type='square';g.gain.value=.04;o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d)}catch(e){}}
function notify(t,b){beep(880,.3);if(S.settings.notify&&window.Notification&&Notification.permission==='granted')try{new Notification(t,{body:b})}catch(e){}}
function form(title,fields,v,cb){const d=$('#dlg');
 d.innerHTML=`<form method="dialog"><h2>${esc(title)}</h2>${fields.map(f=>{const val=v[f.k];let i;
  if(f.t==='textarea')i=`<textarea name="${f.k}" rows="2">${esc(val)}</textarea>`;
  else if(f.t==='select')i=`<select name="${f.k}">${f.o.map(([a,b])=>`<option value="${esc(a)}"${a==val?' selected':''}>${esc(b)}</option>`).join('')}</select>`;
  else if(f.t==='check')i=`<input type="checkbox" name="${f.k}"${val?' checked':''}>`;
  else i=`<input name="${f.k}" type="${f.t||'text'}" value="${esc(val)}"${f.step?` step="${f.step}"`:''}${f.min!=null?` min="${f.min}"`:''}${f.req?' required':''}>`;
  return`<label class="${f.t==='check'?'chk':''}"><span>${esc(f.l)}</span>${i}</label>`}).join('')}
  <div class="row"><button type="button" data-a="close">Cancel</button><button class="pri" value="ok">Save</button></div></form>`;
 d.querySelector('form').onsubmit=e=>{e.preventDefault();const o={};for(const f of fields){const el=d.querySelector(`[name=${f.k}]`);o[f.k]=f.t==='check'?el.checked:f.t==='number'?(el.value===''?0:Number(el.value)):el.value}d.close();cb(o)};
 d.showModal()}
const catOpts=()=>S.categories.map(c=>[c.id,c.name]);
const TF=()=>[{k:'title',l:'Title',req:1},{k:'desc',l:'Description',t:'textarea'},{k:'catId',l:'Category',t:'select',o:catOpts()},
 {k:'priority',l:'Priority (1-5)',t:'number',min:1,step:1},{k:'weight',l:'Selection weight',t:'number',min:.1,step:.1},
 {k:'dur',l:'Duration in minutes (0 = default)',t:'number',min:0},{k:'deadline',l:'Deadline',t:'date'},
 {k:'diff',l:'Difficulty',t:'select',o:[['easy','Easy'],['normal','Normal'],['hard','Hard']]},{k:'crit',l:'Completion criteria',t:'textarea'},
 {k:'active',l:'Active',t:'check'},{k:'available',l:'Available right now',t:'check'}];
const CF=[{k:'name',l:'Name',req:1},{k:'desc',l:'Description',t:'textarea'},{k:'weight',l:'Weight',t:'number',min:.1,step:.1},{k:'priority',l:'Priority (1-5)',t:'number',min:1,step:1},{k:'enabled',l:'Enabled',t:'check'}];
const LF=[{k:'title',l:'Title',req:1},{k:'desc',l:'Description',t:'textarea'},{k:'type',l:'Type'},{k:'dur',l:'Duration in minutes',t:'number',min:1},{k:'notes',l:'Notes',t:'textarea'},{k:'active',l:'Enabled',t:'check'}];
const SET=[['Work',[['work','Default work interval (min)','number'],['useTaskDur','Use per-task durations','check'],['randDur','Randomize durations','check'],['randMin','Random min (min)','number'],['randMax','Random max (min)','number'],['maxDaily','Daily interval limit (soft)','number']]],
 ['Breaks',[['breakMin','Short break (min)','number'],['breakEvery','Break after every N work intervals','number']]],
 ['Rewards',[['leisureEvery','Successful intervals per leisure','number'],['leisureMin','Leisure duration (min)','number'],['resetOnReward','Reward resets counter','check'],['bonusOn','Bonus rewards','check'],['bonusEvery','Bonus every N successes','number'],['bonusMin','Bonus extra minutes','number'],['bonusHard','Hard task completion also grants bonus','check']]],
 ['Chaos defaults',[['chaosDraws','Default draws','number'],['chaosMinutes','Default time limit (min, 0 = none)','number']]],
 ['XP',[['xpBase','XP, normal task','number'],['xpHard','XP, hard task','number'],['xpPrio','Extra XP, priority 4-5','number']]],
 ['Preferences',[['sound','Sound effects','check'],['notify','Browser notifications','check'],['accent','Accent','select',[['amber','Amber'],['teal','Teal'],['violet','Violet']]]]]];
function inp(grp,[k,l,t,o]){const v=S.settings[k];return`<label class="${t==='check'?'chk':''}"><span>${l}</span>`+(t==='check'?`<input type="checkbox" data-s="${k}"${v?' checked':''}>`:t==='select'?`<select data-s="${k}">${o.map(([a,b])=>`<option value="${a}"${a===v?' selected':''}>${b}</option>`).join('')}</select>`:`<input type="number" data-s="${k}" value="${v}" min="0" step="1">`)+'</label>'}
const ICON={completed:'✓',failed:'✗',abandoned:'⊘','ended-early':'›'};
function timeline(){const s=S.session,out=[];
 const past=S.history.filter(h=>h.sid===s.id).slice(-6);
 for(const h of past)out.push(`<li class="ev ${h.kind} ${h.outcome}"><time>${clock(h.ts)}</time><div><b>${ICON[h.outcome]||''} ${h.kind==='break'?'Short break':esc(h.title)}</b><small>${h.kind==='work'?h.outcome.toUpperCase()+(h.xp?' +'+h.xp+' XP':''):h.kind==='leisure'?(h.bonus?'BONUS ':'')+'LEISURE':''}${h.chaos?' · chaos':''}</small></div></li>`);
 out.push(cur(s));
 for(const p of predict()){const label=p.k==='work'?'????????????????':p.k==='break'?'Short break':p.bonus?'✦ BONUS EXPECTED':'★ LEISURE EXPECTED';
  out.push(`<li class="ev next ${p.k}${p.k==='work'?' mystery':''}"><time>~${clock(p.at)}</time><div><b>${label}</b></div></li>`)}
 return`<ol class="tl">${out.join('')}</ol>`}
function cur(s){const c=s.cur,ph=s.phase;
 if(ph==='empty')return`<li class="ev now"><time>now</time><div class="card"><b>The pool is empty</b><p>No enabled task is available. Add or enable a task, then draw again.</p><button class="pri" data-a="redraw">Draw again</button></div></li>`;
 const label={ready:'NEXT MISSION · ready',work:'CURRENT MISSION',await:'TIME IS UP',break:'SHORT BREAK',leisure:c.bonus?'BONUS REWARD':'LEISURE REWARD'}[ph];
 let btn='';
 if(ph==='ready')btn=`<button class="pri big" data-a="startwork">Start ${c.dur} min</button>`;
 if(ph==='work')btn=`<div class="row"><button data-a="pause">${s.run?'Pause':'Resume'}</button></div><div class="row out"><button data-a="o-completed">Completed</button><button data-a="o-failed">Failed</button><button data-a="o-abandoned">Abandoned</button></div>`;
 if(ph==='await')btn=`<p>How did it go?</p><div class="row out"><button class="pri" data-a="o-completed">Completed</button><button data-a="o-failed">Failed</button><button data-a="o-abandoned">Abandoned</button></div>`;
 if(ph==='break'||ph==='leisure')btn=`<div class="row"><button data-a="pause">${s.run?'Pause':'Resume'}</button><button data-a="rest-end">End early</button></div>`;
 return`<li class="ev now ${ph}"><time>${clock(Date.now())}</time><div class="card"><small>${label}${c.chaos?' · chaos draw':''}</small>
 <div class="clock" id="clock">${mmss(T.left(s))}</div><h2>${esc(c.title)}</h2>
 ${c.kind==='work'?`<small>${esc(c.cat)} · ${c.diff} · priority ${c.prio}</small>`:c.cat?`<small>${esc(c.cat)}</small>`:''}
 ${c.desc?`<p>${esc(c.desc)}</p>`:''}${c.crit?`<p class="crit">Done when: ${esc(c.crit)}</p>`:''}${c.notes?`<p>${esc(c.notes)}</p>`:''}${btn}</div></li>`}
function vRoulette(){const s=S.session,st=stats();
 const head=`<header class="hud"><span>Level ${st.lvl}</span><span>${st.xp} XP</span><span>${S.ctr.cnt}/${S.settings.leisureEvery} to leisure</span></header>`;
 if(!s)return head+`<section class="hero"><h1>Let the wheel decide.</h1><p>You set the rules. ROULETTE picks what happens next, and keeps upcoming missions hidden.</p><button class="pri big" data-a="newsession">Start session</button></section>`;
 return head+(s.notice?`<p class="note">${esc(s.notice)}</p>`:'')+timeline()+`<div class="row end"><button data-a="endsession">End session</button></div>`}
function vTasks(){return`<div class="bar"><h1>Task pool</h1><div class="row"><button class="pri" data-a="task-new">New task</button><button data-a="rm-ex">Remove examples</button></div></div>
 ${S.tasks.length?'':'<p class="empty">No tasks yet. Create one to feed the roulette.</p>'}
 <ul class="list">${S.tasks.map(t=>{const c=find('categories',t.catId);return`<li class="${t.active?'':'off'}"><div><b>${esc(t.title)}${t.example?' <em>example</em>':''}</b><small>${esc(c?c.name:'(no category)')} · P${t.priority} · w${t.weight} · ${t.dur||S.settings.work} min · ${t.diff}${t.deadline?' · due '+t.deadline:''}${t.available===false?' · unavailable':''}</small><small>picked ${t.selections} · done ${t.completions} · failed ${t.failures} · abandoned ${t.abandons}</small></div>
  <div class="row"><button data-a="task-tog" data-id="${t.id}">${t.active?'Disable':'Enable'}</button><button data-a="task-edit" data-id="${t.id}">Edit</button><button data-a="task-del" data-id="${t.id}">Delete</button></div></li>`}).join('')}</ul>`}
function vCats(){return`<div class="bar"><h1>Categories</h1><button class="pri" data-a="cat-new">New category</button></div><ul class="list">${S.categories.map(c=>`<li class="${c.enabled?'':'off'}"><div><b>${esc(c.name)}</b><small>weight ${c.weight} · priority ${c.priority} · picked ${c.selections} · done ${c.completed} · last ${c.lastSelected?new Date(c.lastSelected).toLocaleDateString():'never'}</small>${c.desc?`<small>${esc(c.desc)}</small>`:''}</div><div class="row"><button data-a="cat-tog" data-id="${c.id}">${c.enabled?'Disable':'Enable'}</button><button data-a="cat-edit" data-id="${c.id}">Edit</button><button data-a="cat-del" data-id="${c.id}">Delete</button></div></li>`).join('')}</ul>`}
function vLeisure(){return`<div class="bar"><h1>Leisure pool</h1><button class="pri" data-a="leis-new">New reward</button></div>${S.leisure.length?'':'<p class="empty">Empty pool. Rewards stay banked until you add something.</p>'}<ul class="list">${S.leisure.map(l=>`<li class="${l.active?'':'off'}"><div><b>${esc(l.title)}${l.example?' <em>example</em>':''}</b><small>${esc(l.type)} · ${l.dur} min</small></div><div class="row"><button data-a="leis-tog" data-id="${l.id}">${l.active?'Disable':'Enable'}</button><button data-a="leis-edit" data-id="${l.id}">Edit</button><button data-a="leis-del" data-id="${l.id}">Delete</button></div></li>`).join('')}</ul>`}
const MODS=[['allowRepeat','Allow repetition'],['noBalance','Disable category balancing'],['ignoreWeights','Ignore task weights'],['ignorePriority','Ignore priority'],['ignoreNeglect','Ignore neglect'],['includeLeisure','Include leisure'],['randDur','Randomized intervals']];
function vChaos(){const c=S.chaos,m=c.mods||{};
 return`<div class="bar"><h1>Chaos control</h1></div><p>${c.on?`<b>Chaos is active.</b> ${c.left} draw(s) left${c.endAt?' · until '+clock(c.endAt):''}.`:'Chaos temporarily bends the scheduling rules. Progress, rewards and hard constraints are never touched.'}</p>
 <div class="form" id="chaosform">${MODS.map(([k,l])=>`<label class="chk"><span>${l}</span><input type="checkbox" data-m="${k}"${m[k]?' checked':''}></label>`).join('')}
 <label><span>Duration in draws</span><input type="number" id="cd" min="1" value="${c.draws||S.settings.chaosDraws}"></label>
 <label><span>Time limit in minutes (0 = none)</span><input type="number" id="cm" min="0" value="${c.minutes||S.settings.chaosMinutes}"></label></div>
 <div class="row"><button data-a="chaos-full">Full chaos</button>${c.on?'<button class="pri" data-a="chaos-off">Deactivate</button>':'<button class="pri" data-a="chaos-on">Activate</button>'}</div>`}
function vStats(){const s=stats(),mx=Math.max(1,...s.days.map(d=>d.n)),tot=Math.max(1,...s.byCat.map(c=>c.sel)),neg=[...s.byCat].sort((a,b)=>a.last-b.last)[0];
 const top=[...s.byCat].sort((a,b)=>b.sel-a.sel)[0];
 return`<div class="bar"><h1>Statistics</h1></div><div class="grid"><div><b>Level ${s.lvl}</b><small>${s.xp} / ${s.nxt} XP</small><progress max="${s.nxt-s.cur}" value="${s.xp-s.cur}"></progress></div>
 <div><b>${s.comp}</b><small>completed</small></div><div><b>${s.fail}</b><small>failed</small></div><div><b>${s.ab}</b><small>abandoned</small></div>
 <div><b>${s.rate}%</b><small>completion rate</small></div><div><b>${s.workMin} min</b><small>worked</small></div><div><b>${s.leisMin} min</b><small>leisure</small></div>
 <div><b>${top&&top.sel?esc(top.name):'-'}</b><small>most selected</small></div><div><b>${neg?esc(neg.name):'-'}</b><small>most neglected</small></div></div>
 <h2>Last 7 days (completed)</h2><div class="bars">${s.days.map(d=>`<div><i style="height:${d.n/mx*100}%"></i><b>${d.n}</b><small>${d.label}</small></div>`).join('')}</div>
 <h2>Category distribution</h2><ul class="dist">${s.byCat.map(c=>`<li><span>${esc(c.name)}</span><i style="width:${c.sel/tot*100}%"></i><b>${c.sel} / ${c.done}</b></li>`).join('')}</ul>
 <h2>History</h2><ul class="list">${[...S.history].reverse().slice(0,40).map(h=>`<li><div><b>${esc(h.kind==='break'?'Short break':h.title)}</b><small>${new Date(h.ts).toLocaleString()} · ${h.kind} · ${h.outcome} · ${h.mins} min${h.xp?' · +'+h.xp+' XP':''}</small></div></li>`).join('')||'<li class="empty">No history yet.</li>'}</ul>`}
function vSettings(){return`<div class="bar"><h1>Settings</h1></div><div class="form">${SET.map(([g,f])=>`<h2>${g}</h2>${f.map(x=>inp(g,x)).join('')}`).join('')}</div>
 <h2>Data</h2><div class="row"><button data-a="export">Export JSON</button><button data-a="import">Import JSON</button><button data-a="reset">Reset all data</button></div><input type="file" id="file" accept="application/json" hidden>
 <p class="empty">Data lives in this browser only. Use export/import to move it between devices.</p>`}
const V={roulette:vRoulette,tasks:vTasks,cats:vCats,leisure:vLeisure,chaos:vChaos,stats:vStats,settings:vSettings};
function render(){const m=$('#main');if(document.activeElement&&document.activeElement.matches('[data-s],[data-m],#cd,#cm'))return;
 document.body.dataset.accent=S.settings.accent;document.body.classList.toggle('chaos',!!S.chaos.on);
 const cb=$('#chaosbar');cb.hidden=!S.chaos.on;if(S.chaos.on)cb.textContent='CHAOS ACTIVE · '+S.chaos.left+' draw'+(S.chaos.left===1?'':'s')+' left';
 $('#nav').innerHTML=VIEWS.map(([k,l])=>`<button data-a="nav" data-id="${k}"${k===view?' class="on"':''}>${l}</button>`).join('');
 m.innerHTML=V[view]();}
function setView(v){view=v;render();scrollTo(0,0)}
function tickUI(){const s=S.session,c=$('#clock');if(c&&s)c.textContent=mmss(T.left(s));if(s&&s.cur&&s.run)document.title=mmss(T.left(s))+' · ROULETTE';else document.title='ROULETTE'}
