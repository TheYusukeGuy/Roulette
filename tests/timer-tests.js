const T=require('../js/timer.js'),a=require('assert'),s={};
T.start(s,60000,1000);a.equal(T.left(s,31000),30000);a(!T.done(s,50000));a(T.done(s,61000));
T.pause(s,31000);a.equal(T.left(s,999999),30000,'paused value frozen');a(!T.done(s,999999));
T.resume(s,100000);a.equal(T.left(s,110000),20000,'resume continues');a(T.done(s,130000));
T.start(s,1000,0);a.equal(T.left(s,5e6),0,'throttled tab never negative');console.log('timer tests passed');
