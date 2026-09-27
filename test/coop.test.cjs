const test=require('node:test'),assert=require('node:assert/strict');
const {initial,applyEvent,positions,rewards}=require('../server/coop-rules.cjs');
test('Two players can alternate every objective across all 26 cooperative missions',()=>{
 let s=initial(),now=100000;
 function go(target,extra={}){const [x,z]=positions[target];const result=applyEvent(s,{target,x,z,step:s.step,inTunnel:target==='rescue'||target==='tunnel-exit',...extra},now);s=result.state;return result;}
 go('ana');assert.equal(s.step,1);go('jose');assert(s.carrying);go('clara');go('miguel');
 for(const n of ['trash0','trash1','trash2'])go(n);assert.equal(s.step,4);go('photo');go('ana');go('jose');
 go('ivo');go('rosa');assert.equal(s.step,7);go('ivo');go('lenhador');const wallet=s.money;go('lenhador');assert.equal(s.money,wallet);go('lurdes');assert.equal(s.step,7,'Cannot deliver before cutting finishes');now+=10001;go('lurdes');
 for(const n of ['rita','dito','lia'])go(n);assert.equal(s.step,9);go('joaquim',{transport:'walk',bikeDistance:80});assert.equal(s.step,9);go('joaquim',{transport:'bike',bikeDistance:51});
 go('rita');for(const n of ['ana','clara','miguel'])go(n);assert.equal(s.step,11);go('ana');go('picnic-spot');for(const n of ['clara','miguel','rita'])go(n);go('rita');for(const n of ['ana','bia','caio'])go(n);assert.equal(s.step,14);
 go('mercado');go('hortifruti');go('lurdes');go('animal0');go('lost-ball');go('caio');go('signal-crossing');go('elisa');go('dito');go('miguel');go('mercado');assert.equal(s.step,24);go('secret-entrance');assert.equal(s.step,24);for(const n of ['miguel','ivo','davi'])go(n);go('secret-entrance');assert.equal(s.step,25);assert.equal(go('secret-entrance').effect.tunnel,true);go('rescue');assert.equal(s.step,26);assert(s.chapter2.rescued);const final=s.money;go('rescue');assert.equal(s.money,final,'No second rescue reward');assert(final>0);
});
test('Remote, wrong-dimension and stale actions cannot advance a mission',()=>{assert.throws(()=>applyEvent(initial(),{target:'ana',x:120,z:120,step:0}),/Aproxime/);assert.throws(()=>applyEvent(initial(),{target:'rescue',x:0,z:-31,step:0,inTunnel:false}),/outra área/);assert.throws(()=>applyEvent(initial(),{target:'ana',x:NaN,z:47,step:0}),/inválida/);const s=initial();s.step=1;const next=applyEvent(s,{target:'ana',x:-5,z:47,step:0});assert.equal(next.state.step,1);assert.equal(next.state.money,50);});
test('Mission rewards are added once when an old stage is replayed',()=>{const event={target:'ana',x:-5,z:47,step:0};const first=applyEvent(initial(),event);const again=applyEvent(first.state,event);assert.equal(first.state.money,50+rewards[0]);assert.equal(again.state.money,first.state.money);});
