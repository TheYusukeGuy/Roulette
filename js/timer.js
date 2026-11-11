/* Timestamp-based timer: never counts ticks, so throttling/suspension can't drift it. */
(function(root){
const T={start:(s,ms,now)=>{s.rem=ms;s.endAt=(now??Date.now())+ms;s.run=true},
 left:(s,now)=>s.run?Math.max(0,s.endAt-(now??Date.now())):s.rem,
 pause:(s,now)=>{if(!s.run)return;s.rem=T.left(s,now);s.run=false},
 resume:(s,now)=>{if(s.run)return;s.endAt=(now??Date.now())+s.rem;s.run=true},
 done:(s,now)=>s.run&&(now??Date.now())>=s.endAt};
if(typeof module!=='undefined')module.exports=T;else root.T=T})(this);
