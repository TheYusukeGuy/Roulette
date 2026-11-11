const A={
 nav:d=>setView(d.id),newsession:()=>startSession(),endsession:()=>confirm('End this session? History and XP are kept.')&&endSession(),
 startwork:startWork,pause:pauseResume,redraw:()=>{drawNext();save()},'rest-end':()=>finishRest(true),
 close:()=>$('#dlg').close(),
 'task-new':()=>{if(!S.categories.length)return toast('Create a category first.');form('New task',TF(),{catId:S.categories[0].id,priority:3,weight:1,dur:0,diff:'normal',active:true,available:true},o=>{S.tasks.push({...o,id:uid(),created:Date.now(),lastSelected:0,lastCompleted:0,selections:0,completions:0,failures:0,abandons:0});save()})},
 'task-edit':d=>{const t=find('tasks',d.id);form('Edit task',TF(),t,o=>{Object.assign(t,o);save()})},
 'task-del':d=>{if(confirm('Delete this task? History keeps its name.')){S.tasks=S.tasks.filter(t=>t.id!==d.id);if(S.session&&S.session.cur&&S.session.cur.id===d.id&&S.session.phase==='ready')drawNext();save()}},
 'task-tog':d=>{const t=find('tasks',d.id);t.active=!t.active;save()},
 'cat-new':()=>form('New category',CF,{weight:3,priority:3,enabled:true},o=>{S.categories.push({...o,id:uid(),lastSelected:0,selections:0,completed:0,created:Date.now()});save()}),
 'cat-edit':d=>{const c=find('categories',d.id);form('Edit category',CF,c,o=>{Object.assign(c,o);save()})},
 'cat-del':d=>{const n=S.tasks.filter(t=>t.catId===d.id).length;if(confirm('Delete category'+(n?' and its '+n+' task(s)':'')+'?')){S.tasks=S.tasks.filter(t=>t.catId!==d.id);S.categories=S.categories.filter(c=>c.id!==d.id);save()}},
 'cat-tog':d=>{const c=find('categories',d.id);c.enabled=!c.enabled;save()},
 'leis-new':()=>form('New reward',LF,{type:'Leisure',dur:30,active:true},o=>{S.leisure.push({...o,id:uid()});save()}),
 'leis-edit':d=>{const l=find('leisure',d.id);form('Edit reward',LF,l,o=>{Object.assign(l,o);save()})},
 'leis-del':d=>{if(confirm('Delete this reward?')){S.leisure=S.leisure.filter(l=>l.id!==d.id);save()}},
 'leis-tog':d=>{const l=find('leisure',d.id);l.active=!l.active;save()},
 'chaos-on':()=>{const m={};document.querySelectorAll('[data-m]').forEach(e=>m[e.dataset.m]=e.checked);startChaos(m,+$('#cd').value,+$('#cm').value);toast('Chaos active.');beep(200,.4)},
 'chaos-off':()=>{endChaos();toast('Chaos ended. Normal rules restored.')},
 'chaos-full':()=>{document.querySelectorAll('[data-m]').forEach(e=>e.checked=true)},
 export:()=>Store.exportJSON(S),import:()=>$('#file').click(),
 reset:()=>{if(confirm('Erase ALL data? A backup copy is kept in this browser.')){resetAll();toast('Data reset.')}},
 'rm-ex':()=>{removeExamples();toast('Examples removed.')}};
document.addEventListener('click',e=>{const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
 if(a.startsWith('o-'))outcome(a.slice(2));else if(A[a])A[a](b.dataset);if(a==='chaos-full')return;if(!listenersRan)render()});
let listenersRan=false;
document.addEventListener('change',e=>{const t=e.target;
 if(t.id==='file'){const f=t.files[0];if(!f)return;f.text().then(x=>{let o;try{o=JSON.parse(x)}catch(_){return toast('Import failed: not valid JSON. Nothing changed.')}
  const err=importData(o);toast(err?'Import failed: '+err+' Nothing changed.':'Backup restored.')});t.value='';return}
 if(t.dataset.s){const k=t.dataset.s;S.settings[k]=t.type==='checkbox'?t.checked:t.type==='number'?Math.max(0,Number(t.value)||0):t.value;
  if(k==='notify'&&t.checked&&window.Notification)Notification.requestPermission();save()}});
init();listeners.push(()=>{listenersRan=true;render();listenersRan=false});render();
setInterval(()=>{const r=onTick();if(r==='work')notify('Time is up','Record the outcome.');else if(r==='rest')notify('Break over','Your next mission is ready.');if(r)render();else tickUI()},500);
document.addEventListener('visibilitychange',()=>{if(!document.hidden){const r=onTick();if(r)render()}});
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
