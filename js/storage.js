const Store={KEY:'roulette.v1',
 load(){try{const r=localStorage.getItem(this.KEY);return r?JSON.parse(r):null}catch(e){return null}},
 save(s){try{localStorage.setItem(this.KEY,JSON.stringify(s))}catch(e){console.warn(e)}},
 validate(o){if(!o||typeof o!=='object')return'Not a ROULETTE backup.';
  for(const k of['tasks','categories','leisure','history'])if(!Array.isArray(o[k]))return'Missing list: '+k;
  if(typeof o.settings!=='object'||!o.settings)return'Missing settings.';
  if(o.tasks.some(t=>!t||!t.id||!t.title))return'Invalid task entry.';return null},
 backup(){try{const r=localStorage.getItem(this.KEY);if(r)localStorage.setItem(this.KEY+'.bak',r)}catch(e){}},
 exportJSON(s){const b=new Blob([JSON.stringify(s,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='roulette-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1e3)}};
