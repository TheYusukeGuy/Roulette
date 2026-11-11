/* State, sessions, drawing, rewards, chaos, stats. All mutations go through here then save(). */
const uid=()=>Math.random().toString(36).slice(2,10);
const MIN=6e4;
const DEF_SET={work:40,useTaskDur:true,randDur:false,randMin:25,randMax:55,breakMin:10,breakEvery:1,leisureEvery:4,leisureMin:45,resetOnReward:true,
 bonusOn:true,bonusEvery:6,bonusMin:20,bonusHard:false,chaosDraws:4,chaosMinutes:0,maxDaily:6,sound:true,notify:false,accent:'amber',
 xpBase:10,xpHard:15,xpPrio:5};
function seed(){const now=Date.now();
 const cats=[['University',5],['Networking',5],['Cybersecurity',5],['Python / Programming',4],['Projects / GitHub',3],['Career / Internships',2],['Creative Projects',2]]
  .map(([name,weight])=>({id:uid(),name,desc:'',weight,priority:3,enabled:true,lastSelected:0,selections:0,completed:0,created:now}));
 const c=n=>cats.find(x=>x.name.startsWith(n)).id;
 const T=(t,cat,diff,priority)=>({id:uid(),title:t,desc:'Example task: edit or delete me.',catId:c(cat),priority,weight:1,dur:0,deadline:'',diff,crit:'You can explain what you did.',active:true,available:true,created:now,lastSelected:0,lastCompleted:0,selections:0,completions:0,failures:0,abandons:0,example:true});
 const L=(t,type,dur)=>({id:uid(),title:t,desc:'Example reward.',type,dur,notes:'',active:true,example:true});
 return{v:1,settings:{...DEF_SET},categories:cats,
  tasks:[T('Python exercises','Python','normal',3),T('Subnetting practice','Networking','normal',3),T('Capture-the-flag room','Cyber','hard',4),T('Review lecture notes','University','easy',3),T('Push a commit to a repo','Projects','normal',3),T('Polish CV bullet points','Career','easy',2),T('Sketch a project idea','Creative','easy',2)],
  leisure:[L('Watch one anime episode','Anime',25),L('Play a Steam game','Games',45),L('Browse Letterboxd','Film',30),L('Listen to an album','Music',40)],
  session:null,history:[],xp:0,ctr:{cnt:0,succ:0,sinceBreak:0,pendB:false},chaos:{on:false,left:0,endAt:0,draws:4,minutes:0,mods:{}}}}
let S;const listeners=[];
function save(){Store.save(S);listeners.forEach(f=>f())}
function init(){const l=Store.load();S=l&&!Store.validate(l)?l:seed();S.settings={...DEF_SET,...S.settings};S.ctr=S.ctr||{cnt:0,succ:0,sinceBreak:0,pendB:false};S.chaos=S.chaos||{on:false,mods:{}};if(!l)save()}
const find=(a,id)=>S[a].find(x=>x.id===id);
const chaosMods=()=>S.chaos.on?S.chaos.mods:{};
function chaosTick(){const c=S.chaos;if(c.on&&c.endAt&&Date.now()>c.endAt)endChaos()}
function endChaos(){S.chaos.on=false;S.chaos.left=0;S.chaos.endAt=0;save()}
function startChaos(mods,draws,minutes){S.chaos={...S.chaos,on:true,mods,left:Math.max(1,draws|0),draws,minutes,endAt:minutes>0?Date.now()+minutes*MIN:0};save()}
function workDur(t){const m=chaosMods(),st=S.settings;
 if(m.randDur||st.randDur)return Math.round(st.randMin+Math.random()*(st.randMax-st.randMin));
 return st.useTaskDur&&t&&t.dur>0?t.dur:st.work}
function enter(phase,cur,auto){const s=S.session;s.phase=phase;s.cur=cur;s.run=false;s.rem=cur.dur*MIN;if(auto)T.start(s,cur.dur*MIN)}
function chaosUsed(){const c=S.chaos;if(c.on&&--c.left<=0){c.on=false;c.endAt=0}}
function drawNext(){const s=S.session,m=chaosMods(),now=Date.now();s.notice='';
 if(m.includeLeisure){const L=S.leisure.filter(x=>x.active),n=R.scoreAll(S.tasks,S.categories,{now}).length;
  if(L.length&&Math.random()<L.length/(L.length+n)){const l=L[Math.floor(Math.random()*L.length)];chaosUsed();
   enter('leisure',{kind:'leisure',id:l.id,title:l.title,desc:l.desc,cat:l.type,dur:l.dur,notes:l.notes,chaos:true},true);return}}
 const pick=R.pick(R.scoreAll(S.tasks,S.categories,{now,mods:m,lastTaskId:s.lastTaskId}));
 if(!pick){s.phase='empty';s.cur=null;s.run=false;return}
 const t=pick.task,c=find('categories',t.catId),wasChaos=S.chaos.on;t.lastSelected=now;t.selections++;c.lastSelected=now;c.selections++;s.lastTaskId=t.id;chaosUsed();
 const today=S.history.filter(h=>h.kind==='work'&&new Date(h.ts).toDateString()===new Date().toDateString()).length;
 if(today>=S.settings.maxDaily)s.notice='Daily limit of '+S.settings.maxDaily+' intervals reached. You can keep going or end the session.';
 enter('ready',{kind:'work',id:t.id,title:t.title,desc:t.desc,cat:c.name,catId:c.id,diff:t.diff,crit:t.crit,dur:workDur(t),prio:t.priority,chaos:wasChaos})}
function startSession(){S.session={id:uid(),started:Date.now(),phase:'idle',cur:null,run:false,rem:0,endAt:0,notice:''};drawNext();save()}
function endSession(){S.session=null;save()}
function startWork(){const s=S.session;if(s&&s.phase==='ready'){T.start(s,s.cur.dur*MIN);s.phase='work';save()}}
function pauseResume(){const s=S.session;if(!s||!['work','break','leisure'].includes(s.phase))return;s.run?T.pause(s):T.resume(s);save()}
function elapsedMin(s){return Math.round((s.cur.dur*MIN-T.left(s))/MIN*10)/10}
function log(o){const s=S.session,h={id:uid(),sid:s.id,ts:Date.now(),kind:s.cur.kind,refId:s.cur.id,title:s.cur.title,cat:s.cur.cat,catId:s.cur.catId,outcome:o,mins:elapsedMin(s),xp:0,chaos:!!s.cur.chaos,bonus:!!s.cur.bonus};S.history.push(h);return h}
function outcome(o){const s=S.session;if(!s||!['work','await'].includes(s.phase))return;
 const st=S.settings,t=find('tasks',s.cur.id),c=find('categories',s.cur.catId),h=log(o);s.run=false;
 if(t){if(o==='completed'){t.completions++;t.lastCompleted=Date.now()}else if(o==='failed')t.failures++;else t.abandons++}
 if(o==='completed'){let xp=t&&t.diff==='hard'?st.xpHard:st.xpBase;if(t&&t.priority>=4)xp+=st.xpPrio;h.xp=xp;S.xp+=xp;if(c)c.completed++;
  const k=S.ctr;k.cnt++;k.succ++;if(st.bonusOn&&(k.succ%st.bonusEvery===0||(st.bonusHard&&t&&t.diff==='hard')))k.pendB=true}
 afterWork();save()}
/* Leisure overrides break. Normal+bonus due together => ONE leisure of leisureMin+bonusMin (no double counting). */
function afterWork(){const s=S.session,st=S.settings,k=S.ctr;
 const dueL=k.cnt>=st.leisureEvery,dueB=st.bonusOn&&k.pendB;
 if(dueL||dueB){const pool=S.leisure.filter(x=>x.active);
  if(pool.length){const l=pool[Math.floor(Math.random()*pool.length)];
   const dur=(dueL?st.leisureMin:0)+(dueB?st.bonusMin:0);
   if(dueL)k.cnt=st.resetOnReward?0:k.cnt-st.leisureEvery;if(dueB)k.pendB=false;k.sinceBreak=0;
   enter('leisure',{kind:'leisure',id:l.id,title:l.title,desc:l.desc,cat:l.type,dur,notes:l.notes,bonus:dueB},true);return}
  s.notice='Leisure is unlocked but your leisure pool is empty. Add or enable an activity; the reward stays banked.'}
 if(++k.sinceBreak>=st.breakEvery){k.sinceBreak=0;enter('break',{kind:'break',title:'Short break',cat:'',dur:st.breakMin},true)}else drawNext()}
function finishRest(early){const s=S.session;if(!s||!['break','leisure'].includes(s.phase))return;
 log(early?'ended-early':'completed');drawNext();save()}
function onTick(){const s=S.session;chaosTick();if(!s||!T.done(s))return false;
 s.run=false;s.rem=0;
 if(s.phase==='work'){s.phase='await';save();return'work'}
 finishRest(false);return'rest'}
function predict(){const s=S.session,st=S.settings;if(!s||!s.cur)return[];
 let t=Date.now()+T.left(s),cnt=S.ctr.cnt,sb=S.ctr.sinceBreak,succ=S.ctr.succ,pB=S.ctr.pendB;const out=[];
 const done=()=>{cnt++;succ++;if(st.bonusOn&&succ%st.bonusEvery===0)pB=true};
 let after=s.cur.kind==='work';if(after&&!S.ctr._x)done();
 while(out.length<6){
  if(after){const b=st.bonusOn&&pB,l=cnt>=st.leisureEvery;
   if(l||b){out.push({k:'leisure',at:t,bonus:b});t+=((l?st.leisureMin:0)+(b?st.bonusMin:0))*MIN;if(l)cnt=st.resetOnReward?0:cnt-st.leisureEvery;pB=false;sb=0}
   else if(++sb>=st.breakEvery){out.push({k:'break',at:t});t+=st.breakMin*MIN;sb=0}}
  out.push({k:'work',at:t});t+=st.work*MIN;done();after=true}
 return out}
function stats(){const H=S.history,w=H.filter(h=>h.kind==='work'),n=o=>w.filter(h=>h.outcome===o).length;
 const comp=n('completed'),fail=n('failed'),ab=n('abandoned'),lvl=Math.floor(Math.sqrt(S.xp/25))+1;
 const byCat=S.categories.map(c=>({name:c.name,sel:c.selections,done:c.completed,last:c.lastSelected,id:c.id}));
 const days=[...Array(7)].map((_,i)=>{const d=new Date(Date.now()-(6-i)*864e5),k=d.toDateString();return{label:d.toLocaleDateString(undefined,{weekday:'short'}),n:w.filter(h=>h.outcome==='completed'&&new Date(h.ts).toDateString()===k).length}});
 return{comp,fail,ab,lvl,cur:25*(lvl-1)**2,nxt:25*lvl**2,xp:S.xp,rate:w.length?Math.round(comp/w.length*100):0,
  workMin:Math.round(w.reduce((a,h)=>a+h.mins,0)),leisMin:Math.round(H.filter(h=>h.kind==='leisure').reduce((a,h)=>a+h.mins,0)),byCat,days}}
function importData(o){const err=Store.validate(o);if(err)return err;Store.backup();S={...seed(),...o,settings:{...DEF_SET,...o.settings}};save();return null}
function resetAll(){Store.backup();S=seed();save()}
function removeExamples(){S.tasks=S.tasks.filter(t=>!t.example);S.leisure=S.leisure.filter(l=>!l.example);save()}
