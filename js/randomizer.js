/* Weighted selection. score = catW × catPrio × taskPrio × taskW × taskNeglect × catNeglect × deadline (each clamped). */
(function(root){
const DAY=864e5,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const CFG={neglectRate:.3,neglectMax:3,catNeglectRate:.2,catNeglectMax:2.5,repeatPenalty:.3,maxScore:200};
function neglect(last,created,now,rate,max){return clamp(1+((now-(last||created||now))/DAY)*rate,1,max)}
function deadlineFactor(dl,now){if(!dl)return 1;const d=(new Date(dl+'T23:59:59').getTime()-now)/DAY;if(d<0)return 2.5;if(d>7)return 1;return 1+clamp((7-d)/7,0,1)*1.5}
function eligible(t,cat){return !!(t&&t.active&&t.available!==false&&cat&&cat.enabled)}
function scoreTask(t,cat,x){const m=x.mods||{},now=x.now||Date.now();
 let s=m.ignoreWeights?1:(cat.weight*t.weight);
 if(!m.ignorePriority)s*=(t.priority/3)*((cat.priority||3)/3);
 if(!m.ignoreNeglect){s*=neglect(t.lastSelected,t.created,now,CFG.neglectRate,CFG.neglectMax);
  if(!m.noBalance)s*=neglect(cat.lastSelected,cat.created,now,CFG.catNeglectRate,CFG.catNeglectMax)}
 s*=deadlineFactor(t.deadline,now);
 if(!m.allowRepeat&&x.lastTaskId===t.id)s*=CFG.repeatPenalty;
 return clamp(s,0.01,CFG.maxScore)}
function scoreAll(tasks,cats,x){const o=[];for(const t of tasks){const c=cats.find(c=>c.id===t.catId);if(eligible(t,c))o.push({task:t,score:scoreTask(t,c,x)})}return o}
function pick(items,rng){if(!items.length)return null;rng=rng||Math.random;const tot=items.reduce((a,i)=>a+i.score,0);let r=rng()*tot;for(const i of items){if((r-=i.score)<0)return i}return items[items.length-1]}
const API={CFG,neglect,deadlineFactor,eligible,scoreTask,scoreAll,pick};
if(typeof module!=='undefined')module.exports=API;else root.R=API})(this);
