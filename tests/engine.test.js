'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),Game=require('../engine.js'),C=Game.config;
const tick=(g,seconds,dt=.1)=>{for(let t=0;t<seconds-1e-7;t+=dt)g.step(dt);};
const make=(options={})=>new Game({seed:5642,aiCount:15,...options});
test('random population stays within 15–20 real AI, with all six possible counts',()=>{
  const counts=new Set();for(let seed=1;seed<=80;seed++){const g=new Game({seed});assert.ok(g.s.aiCount>=15&&g.s.aiCount<=20);assert.equal(g.s.owners.length,g.s.aiCount+1);counts.add(g.s.aiCount);}assert.equal(counts.size,6);
  const g=make();for(const o of g.s.owners){assert.deepEqual(o.resources,C.initial);assert.equal(g.s.buildings.filter(b=>b.owner===o.id&&b.type==='hq').length,1);}assert.equal(new Set(g.s.owners.map(o=>o.homeX+','+o.homeY)).size,16);
});
test('construction is atomic, paid, collidable, and must finish before producing',()=>{
  const g=make(),o=g.owner(0);const original={...o.resources};let r=g.build(0,'farm',o.homeX+150,o.homeY+150);assert.equal(r.ok,false);assert.deepEqual(o.resources,original);
  o.resources.coin=1000;o.resources.wood=1000;o.resources.stone=1000;
  const spot=findSpot(g,'farm');r=g.build(0,'farm',spot.x,spot.y);assert.equal(r.ok,true);assert.equal(o.resources.coin,1000-C.buildings.farm.coin);const before={...o.resources};assert.equal(g.build(0,'farm',spot.x,spot.y).ok,false);assert.deepEqual(o.resources,before);
  const food=o.resources.food;g.updateBuildings(1);assert.equal(o.resources.food,food);g.updateBuildings(3);g.updateBuildings(1);assert.equal(o.resources.food,food+1.5);
  const b=r.building;o.resources.coin=10000;for(let i=2;i<=5;i++){assert.equal(g.upgrade(0,b.id).ok,true);assert.equal(b.level,i);}const res={...o.resources};assert.equal(g.upgrade(0,b.id).ok,false);assert.deepEqual(o.resources,res);
  b.hp=b.maxHp-1;assert.equal(g.repair(0,b.id).ok,true);assert.equal(b.hp,b.maxHp);assert.equal(g.repair(1,b.id).ok,false);
});
function findSpot(g,type){const o=g.owner(0);for(let x=-180;x<=180;x+=32)for(let y=-180;y<=180;y+=32)if(g.placement(0,type,o.homeX+x,o.homeY+y).ok)return {x:o.homeX+x,y:o.homeY+y};throw Error('No free build slot');}
test('invalid terrain, actor overlap and out-of-zone placement never spend resources',()=>{const g=make(),o=g.owner(0);o.resources.coin=1000;const before={...o.resources};assert.equal(g.build(0,'wall',o.x,o.y).ok,false);assert.equal(g.build(0,'wall',0,0).ok,false);assert.equal(g.build(0,'wall',o.homeX+400,o.homeY).ok,false);const n=g.s.nodes.find(n=>Math.hypot(n.x-o.homeX,n.y-o.homeY)<C.world.buildRadius-32);assert.ok(n);n.amount=0;assert.equal(g.build(0,'wall',n.x,n.y).ok,false);assert.deepEqual(o.resources,before);});
test('kill rewards belong to finisher and are paid exactly once',()=>{const g=make(),o=g.owner(0),ai=g.owner(1),m=g.s.monsters[0];g.damageMonster(m,2,0);assert.equal(o.resources.coin,0);g.damageMonster(m,999,1);assert.equal(ai.resources.coin,C.reward[m.type]);assert.equal(ai.kills,1);g.damageMonster(m,999,0);g.damageMonster(m,999,1);assert.equal(ai.resources.coin,C.reward[m.type]);assert.equal(o.resources.coin,0);});
test('gathering respects stock, range, cooldown and configured regeneration',()=>{const g=make(),o=g.owner(0),n=g.s.nodes[0];o.x=n.x;o.y=n.y;n.amount=3;const initial=o.resources[n.type];assert.equal(g.gather(o,n),true);assert.equal(o.resources[n.type],initial+3);assert.equal(n.amount,0);assert.equal(g.gather(o,n),false);assert.equal(n.respawn,C.timing.resourceRespawn);n.respawn=.05;g.step(.1);assert.equal(n.amount,n.max);});
test('walls block real movement; owner gates pass owners and block monsters',()=>{
  const g=make(),o=g.owner(0),wall=g.s.buildings.find(b=>b.owner===0&&b.type==='wall'),m=g.spawnMonster('normal',wall.x,wall.y-65,0,false);m.pathTimer=0;
  for(let i=0;i<60;i++)g.move(m,wall.x,wall.y+70,57,.1,false);assert.ok(m.y<wall.y);assert.ok(!Game.circleRect(m.x,m.y,m.radius,wall));assert.ok(wall.hp<wall.maxHp);
  const gate=g.s.buildings.find(b=>b.owner===0&&b.type==='gate');assert.equal(g.blockers(gate.x,gate.y,o.radius,o).some(b=>b.id===gate.id),false);assert.equal(g.blockers(gate.x,gate.y,m.radius,m).some(b=>b.id===gate.id),true);assert.equal(g.blockers(gate.x,gate.y,o.radius,g.owner(1)).some(b=>b.id===gate.id),true);
});
test('starter walls follow vertical sides and horizontal rows for every base',()=>{
  const g=make();for(const o of g.s.owners){
    const walls=g.s.buildings.filter(b=>b.owner===o.id&&b.type==='wall');
    for(const b of walls)assert.equal(g.wallOrientation(b),b.y===o.homeY-104?'horizontal':'vertical');
  }
});
test('wall previews follow nearby live friendly walls, including snapped offsets',()=>{
  const g=make(),o=g.owner(0),preview={owner:0,x:o.homeX,y:o.homeY+200,size:C.buildings.wall.size};
  const neighbor=g.addBuilding(0,'wall',preview.x+8,preview.y-48,true);
  assert.equal(g.wallOrientation(preview),'vertical');
  const built=g.addBuilding(0,'wall',preview.x,preview.y,true);
  assert.equal(g.wallOrientation(built),'vertical');
  neighbor.hp=0;assert.equal(g.wallOrientation(preview),'horizontal');
  neighbor.hp=1;neighbor.owner=1;assert.equal(g.wallOrientation(preview),'horizontal');
  neighbor.owner=0;neighbor.x=preview.x+48;neighbor.y=preview.y;
  assert.equal(g.wallOrientation(preview),'horizontal');
  preview.orientation='vertical';assert.equal(g.wallOrientation(preview),'vertical');
});
test('manual wall direction is paid once, survives saves and validates imported data',()=>{
  const g=make(),o=g.owner(0);o.resources={wood:1000,stone:1000,coin:1000,water:100,food:100};
  const spot=findSpot(g,'wall'),before={...o.resources};
  assert.equal(g.build(0,'wall',spot.x,spot.y,'diagonal').ok,false);assert.deepEqual(o.resources,before);
  const r=g.build(0,'wall',spot.x,spot.y,'vertical');assert.equal(r.ok,true);
  assert.equal(o.resources.coin,before.coin-C.buildings.wall.coin);
  assert.equal(g.wallOrientation(r.building),'vertical');
  const loaded=Game.load(g.serialize()),b=loaded.s.buildings.find(b=>b.id===r.building.id);
  assert.equal(b.orientation,'vertical');assert.equal(loaded.wallOrientation(b),'vertical');
  const bad=JSON.parse(g.serialize());bad.state.buildings.find(b=>b.id===r.building.id).orientation='diagonal';
  assert.throws(()=>Game.load(bad));
  const legacy=JSON.parse(g.serialize());for(const wall of legacy.state.buildings)delete wall.orientation;
  assert.doesNotThrow(()=>Game.load(legacy));
});
test('tower projectiles inflict configured damage and construction is inactive',()=>{
  const g=make(),o=g.owner(0),tower=g.s.buildings.find(b=>b.owner===0&&b.type==='tower');g.s.monsters=[];const m=g.spawnMonster('brute',tower.x+100,tower.y+40,0,true);m.speed=0;const before=m.hp;g.reindex();g.updateBuildings(.1);assert.equal(g.s.projectiles.length,1);assert.equal(g.s.projectiles[0].damage,C.levels[0].towerDamage);tick(g,.5);assert.ok(m.hp<before);
  tower.buildLeft=3;tower.cooldown=0;g.s.projectiles=[];g.updateBuildings(.1);assert.equal(g.s.projectiles.length,0);
});
test('night waves target every live base, scale by day, and preserve surviving monsters at dawn',()=>{const g=make();g.s.monsters=[];g.s.day=3;g.startNight();const count=g.s.spawnQueue.length;assert.equal(count,16*(6+2*2));assert.equal(new Set(g.s.spawnQueue.map(q=>q.owner)).size,16);const m=g.spawnMonster('brute',100,100,0,false);const id=m.id;g.startDay();assert.ok(g.s.monsters.some(m=>m.id===id));assert.equal(g.s.day,4);});
test('one shared boss on day 7, persists through dawn/save/load, no duplicate on same night',()=>{
  const g=make({testMode:true});g.s.monsters=[];assert.equal(g.testNight7(),true);g.step(.1);assert.equal(g.s.spawnQueue.filter(m=>m.type==='boss').length+g.s.monsters.filter(m=>m.type==='boss').length,1);tick(g,1);const boss=g.s.monsters.find(m=>m.type==='boss');assert.ok(boss);assert.equal(g.s.bossDays.filter(d=>d===7).length,1);
  const restored=Game.load(g.serialize());restored.startDay();assert.ok(restored.s.monsters.some(m=>m.id===boss.id));restored.s.day=7;restored.startNight();assert.equal(restored.s.spawnQueue.some(m=>m.type==='boss'),false);assert.equal(restored.s.monsters.filter(m=>m.type==='boss').length,1);assert.equal(make().testNight7(),false);
});
test('boss area attack damages nearby structures and gives one reward package',()=>{const g=make(),o=g.owner(0),hq=g.hq(0);g.s.monsters=[];const boss=g.spawnMonster('boss',hq.x-95,hq.y+85,0,false);assert.ok(boss);boss.aoe=0;const hp=hq.hp;g.updateMonster(boss,.1);assert.ok(hq.hp<hp);g.damageMonster(boss,1e6,0);assert.equal(o.bossKills,1);assert.equal(o.resources.coin,180);assert.equal(o.resources.wood,C.initial.wood+70);g.damageMonster(boss,1e6,0);assert.equal(o.bossKills,1);});
test('AI really moves, collects, fights, repairs, builds and pays the shared costs',()=>{
  const g=make(),ai=g.owner(1),x=ai.x,y=ai.y;const stock={...ai.resources};tick(g,24);assert.ok(Math.hypot(ai.x-x,ai.y-y)>10);assert.ok(ai.kills>0||g.s.owners.some(o=>o.id>0&&o.kills>0));assert.ok(g.s.owners.some(o=>o.id>0&&(o.resources.wood>stock.wood||o.resources.stone>stock.stone||o.resources.water>stock.water||o.resources.food>stock.food)));
  ai.resources={wood:1000,stone:1000,coin:1000,water:100,food:100};let hq=g.hq(ai.id);hq.hp-=600;ai.maintenance=0;g.ai(ai,.1);assert.ok(hq.hp>hq.maxHp-600);assert.ok(ai.resources.wood<1000);const count=g.s.buildings.filter(b=>b.owner===ai.id).length;ai.maintenance=0;g.ai(ai,.1);assert.ok(g.s.buildings.filter(b=>b.owner===ai.id).length>count);assert.ok(ai.resources.coin<1000);assert.ok(ai.spent>0);
});
test('save/load preserves resources, clock, actors, construction, queues, RNG and boss flags',()=>{const g=make();tick(g,2);const data=g.serialize(),loaded=Game.load(data);assert.deepEqual(JSON.parse(loaded.serialize()),JSON.parse(data));assert.equal(g.rand(),loaded.rand());const bad=JSON.parse(data);bad.state.owners[0].resources.coin=-1;assert.throws(()=>Game.load(bad));assert.throws(()=>Game.load('{"state":{}}'));});
test('starvation drains health, stocks never turn negative, HQ elimination ends player game',()=>{const g=make(),o=g.owner(0);o.resources.water=0;o.resources.food=0;g.s.monsters=[];tick(g,25);assert.ok(o.hp<o.maxHp);assert.ok(o.resources.food>=0&&o.resources.water>=0);g.damageBuilding(g.hq(0),1e6);assert.equal(o.alive,false);assert.equal(g.s.over,true);});
test('monster cap, entity cleanup, leaderboard order and long simulation invariants',()=>{
  const g=make({dayDuration:30,nightDuration:30});g.s.monsters=[];for(let i=0;i<300;i++)g.spawnMonster('normal',80+i,80,1,true);assert.equal(g.s.monsters.length,C.limits.monsters);
  g.s.monsters=[];tick(g,75);assert.ok(g.s.day>=2);assert.ok(g.s.monsters.length<=C.limits.monsters);for(const o of g.s.owners){for(const v of Object.values(o.resources))assert.ok(Number.isFinite(v)&&v>=0);assert.ok(Number.isFinite(o.x)&&Number.isFinite(o.y));}const ranks=g.leaderboard();assert.equal(ranks.length,16);for(let i=1;i<ranks.length;i++){assert.ok(Number(ranks[i-1].alive)>=Number(ranks[i].alive));if(ranks[i-1].alive===ranks[i].alive)assert.ok(ranks[i-1].score>=ranks[i].score);}
});
