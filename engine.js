(function(root) {
  'use strict';
  const C = typeof module === 'object' && module.exports ? require('./config.js') : root.SurvivalConfig;
  const dist = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const resources = ['wood','stone','water','food','coin'];
  const circleRect = (x,y,r,b) => Math.hypot(Math.max(Math.abs(x-b.x)-b.size/2,0),Math.max(Math.abs(y-b.y)-b.size/2,0)) < r;
  class Spatial {
    constructor(size=160) { this.size=size; this.cells=new Map(); }
    add(o) { const key=Math.floor(o.x/this.size)+','+Math.floor(o.y/this.size); if(!this.cells.has(key))this.cells.set(key,[]);this.cells.get(key).push(o); }
    near(x,y,r) { const out=[];for(let a=Math.floor((x-r)/this.size);a<=Math.floor((x+r)/this.size);a++)for(let b=Math.floor((y-r)/this.size);b<=Math.floor((y+r)/this.size);b++){const cell=this.cells.get(a+','+b);if(cell)out.push(...cell);}return out; }
  }
  class Game {
    constructor(options={}) {
      const seed=(options.seed ?? Date.now())>>>0;
      this.s={version:C.version,seed,rng:seed||12345,nextId:1,time:0,day:1,phase:'day',remaining:options.dayDuration||C.timing.day,dayDuration:options.dayDuration||C.timing.day,nightDuration:options.nightDuration||C.timing.night,owners:[],buildings:[],nodes:[],monsters:[],projectiles:[],events:[],effects:[],bossDays:[],spawnQueue:[],spawnTimer:0,daySpawn:24,warned:false,over:false,testMode:!!options.testMode,runId:seed+'-'+Date.now()};
      this.input={x:0,y:0,gather:false,attack:false};this.dirty=true;this.frame=0;
      this.s.aiCount=options.aiCount===undefined ? 15+Math.floor(this.rand()*6) : clamp(Math.floor(options.aiCount),15,20);
      const spots=[];for(let row=0;row<5;row++)for(let col=0;col<5;col++)if(row!==2||col!==2)spots.push({x:600+col*900,y:520+row*740});
      for(let i=spots.length-1;i>0;i--){const j=Math.floor(this.rand()*(i+1));[spots[i],spots[j]]=[spots[j],spots[i]];}
      const player={x:2400,y:2000};
      for(let i=0;i<=this.s.aiCount;i++)this.addOwner(i,i===0?player:spots[i-1],i===0?options.name||'Người sống sót':C.names[i-1]);
      this.indexBuildings();
      for(const owner of this.s.owners){
        for(let j=0;j<13;j++){const angle=this.rand()*Math.PI*2,radius=185+this.rand()*300;this.addNode(['wood','stone','water','food'][j%4],clamp(owner.homeX+Math.cos(angle)*radius,45,C.world.width-45),clamp(owner.homeY+Math.sin(angle)*radius,45,C.world.height-45));}
        for(let j=0;j<3;j++)this.spawnRoamer(owner);
      }
      for(let i=0;i<140;i++)this.addNode(['wood','wood','stone','food','water'][i%5],60+this.rand()*(C.world.width-120),60+this.rand()*(C.world.height-120));
      this.reindex();this.emit('Chào mừng đến Vùng Tro Tàn. Săn quái để lấy Xu Quỷ rồi gia cố căn cứ.','info');
    }
    rand() { let t=this.s.rng+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);this.s.rng>>>=0;return ((t^t>>>14)>>>0)/4294967296; }
    id(prefix){return prefix+(this.s.nextId++);}
    emit(text,type='info'){this.s.events.push({id:this.id('e'),text,type,time:this.s.time});this.s.events=this.s.events.slice(-30);}
    fx(x,y,text,color='#e6b866'){this.s.effects.push({x,y,text,color,life:1});if(this.s.effects.length>100)this.s.effects.shift();}
    addOwner(id,p,name){
      const o={id,name:String(name).slice(0,24),color:C.colors[id],x:p.x,y:p.y+60,homeX:p.x,homeY:p.y,hp:C.actor.hp,maxHp:C.actor.hp,radius:12,resources:{...C.initial},alive:true,kills:0,bossKills:0,spent:0,damage:0,days:0,cooldown:0,gatherCd:0,decision:0,maintenance:0,starve:0,down:0,command:null,activity:'Chuẩn bị',path:[],pathTimer:0,walk:0};
      this.s.owners.push(o);this.addBuilding(id,'hq',p.x,p.y,true);this.addBuilding(id,'tower',p.x+65,p.y+55,true);
      // A small barricade leaves paths for daytime expeditions; players can close it with gates.
      for(const [x,y] of [[-64,-104],[-32,-104],[0,-104],[32,-104],[64,-104],[-104,-64],[-104,-32],[-104,0],[104,-64],[104,-32],[104,0]])this.addBuilding(id,'wall',p.x+x,p.y+y,true);
      this.addBuilding(id,'gate',p.x,p.y+112,true);
    }
    addNode(type,x,y){
      if(this.s.buildings.some(b=>circleRect(x,y,28,b)))return null;
      if(this.s.nodes.some(n=>Math.hypot(n.x-x,n.y-y)<45))return null;
      const max=type==='water'?150:90+Math.floor(this.rand()*70);const n={id:this.id('n'),type,x,y,radius:type==='wood'?20:16,amount:max,max,respawn:0,variation:this.rand()};this.s.nodes.push(n);return n;
    }
    addBuilding(owner,type,x,y,instant=false){const d=C.buildings[type];const b={id:this.id('b'),owner,type,x,y,size:d.size,level:1,hp:d.hp,maxHp:d.hp,buildLeft:instant?0:C.timing.construction,cooldown:0};this.s.buildings.push(b);this.dirty=true;return b;}
    owner(id){return this.s.owners.find(o=>o.id===id);}
    hq(id){return this.s.buildings.find(b=>b.owner===id&&b.type==='hq'&&b.hp>0);}
    buildingCost(type,level=1){const d=C.buildings[type];if(!d||level<1||level>5)return null;const scale=C.levels[level-1].cost;return {wood:Math.ceil(d.wood*scale),stone:Math.ceil(d.stone*scale),coin:Math.ceil(d.coin*scale)};}
    canAfford(o,cost){return !!o&&!!cost&&resources.every(k=>(o.resources[k]||0)>=(cost[k]||0));}
    pay(o,cost){if(!this.canAfford(o,cost))return false;for(const k of resources)o.resources[k]=Math.max(0,o.resources[k]-(cost[k]||0));o.spent+=cost.coin||0;return true;}
    costText(cost){return `${cost.wood||0} gỗ · ${cost.stone||0} đá · ${cost.coin||0} xu`;}
    placement(owner,type,x,y){
      const o=this.owner(owner),d=C.buildings[type];if(!o?.alive||!d||type==='hq')return {ok:false,reason:'Không thể xây công trình này.'};
      if(this.s.buildings.filter(b=>b.owner===owner&&b.hp>0).length>=C.limits.buildingsPerOwner)return {ok:false,reason:'Đã đủ 50 công trình cho căn cứ.'};
      if(x-d.size/2<0||y-d.size/2<0||x+d.size/2>C.world.width||y+d.size/2>C.world.height)return {ok:false,reason:'Ngoài bản đồ.'};
      if(Math.hypot(x-o.homeX,y-o.homeY)>C.world.buildRadius-d.size/2)return {ok:false,reason:'Ngoài vùng xây dựng căn cứ.'};
      const box={x,y,size:d.size};
      if(this.s.buildings.some(b=>b.hp>0&&Math.abs(x-b.x)<(d.size+b.size)/2+2&&Math.abs(y-b.y)<(d.size+b.size)/2+2))return {ok:false,reason:'Vị trí trùng công trình.'};
      if(this.s.nodes.some(n=>circleRect(n.x,n.y,n.radius+3,box)))return {ok:false,reason:'Vị trí có tài nguyên hoặc đang chờ tái sinh.'};
      if([...this.s.owners.filter(a=>a.alive&&!a.down),...this.s.monsters.filter(m=>m.hp>0)].some(a=>circleRect(a.x,a.y,a.radius+4,box)))return {ok:false,reason:'Có nhân vật hoặc quái ở đây.'};
      if(!this.canAfford(o,this.buildingCost(type)))return {ok:false,reason:'Thiếu tài nguyên: '+this.costText(this.buildingCost(type))};
      return {ok:true,reason:'Nhấp để xây · '+this.costText(this.buildingCost(type))};
    }
    build(owner,type,x,y){const v=this.placement(owner,type,x,y);if(!v.ok)return v;const o=this.owner(owner);if(!this.pay(o,this.buildingCost(type)))return {ok:false,reason:'Thiếu tài nguyên.'};const b=this.addBuilding(owner,type,x,y);o.path=[];return {ok:true,building:b,reason:'Đang xây '+C.buildings[type].name+' (3 giây).'};}
    upgrade(owner,id){const b=this.s.buildings.find(b=>b.id===id),o=this.owner(owner);if(!o?.alive||!b||b.owner!==owner||b.hp<=0||b.buildLeft>0)return {ok:false,reason:'Không thể nâng cấp.'};if(b.level>=5)return {ok:false,reason:'Đã đạt cấp tối đa.'};const cost=this.buildingCost(b.type,b.level+1);if(!this.pay(o,cost))return {ok:false,reason:'Thiếu tài nguyên: '+this.costText(cost)};b.level++;const max=C.buildings[b.type].hp*C.levels[b.level-1].hp;b.hp+=max-b.maxHp;b.maxHp=max;return {ok:true,reason:'Đã nâng cấp lên cấp '+b.level};}
    repairCost(b){const fraction=Math.min(0.35,(b.maxHp-b.hp)/b.maxHp);return {wood:Math.max(1,Math.ceil(C.buildings[b.type].wood*fraction)),stone:Math.max(1,Math.ceil(C.buildings[b.type].stone*fraction))};}
    repair(owner,id){const b=this.s.buildings.find(b=>b.id===id),o=this.owner(owner);if(!o?.alive||!b||b.owner!==owner||b.hp<=0||b.hp>=b.maxHp||b.buildLeft>0)return {ok:false,reason:'Công trình không cần sửa.'};const cost=this.repairCost(b);if(!this.pay(o,cost))return {ok:false,reason:'Thiếu gỗ hoặc đá để sửa.'};b.hp=Math.min(b.maxHp,b.hp+b.maxHp*0.35);return {ok:true,reason:'Đã sửa công trình.'};}
    indexBuildings(){this.buildGrid=new Spatial();for(const b of this.s.buildings)if(b.hp>0)this.buildGrid.add(b);this.dirty=false;this.navVersion=(this.navVersion||0)+1;}
    reindex(){if(this.dirty||!this.buildGrid)this.indexBuildings();this.mobGrid=new Spatial();for(const m of this.s.monsters)if(m.hp>0)this.mobGrid.add(m);}
    blockers(x,y,r,actor){return this.buildGrid.near(x,y,r+70).filter(b=>b.hp>0&&!(b.type==='gate'&&actor?.kind!=='monster'&&actor?.id===b.owner)&&circleRect(x,y,r,b));}
    clearLine(a,x,y,r,actor){const len=Math.hypot(x-a.x,y-a.y),steps=Math.ceil(len/18);for(let i=1;i<=steps;i++)if(this.blockers(a.x+(x-a.x)*i/steps,a.y+(y-a.y)*i/steps,r,actor).length)return false;return true;}
    findPath(actor,tx,ty){
      const cell=C.world.cell,sx=Math.floor(actor.x/cell),sy=Math.floor(actor.y/cell),gx=Math.floor(tx/cell),gy=Math.floor(ty/cell),width=Math.ceil(C.world.width/cell),height=Math.ceil(C.world.height/cell);
      if(Math.abs(sx-gx)+Math.abs(sy-gy)>65)return [];
      const key=(x,y)=>y*width+x;const start=key(sx,sy),goal=key(gx,gy);const open=[{x:sx,y:sy,g:0,f:0,k:start}],best=new Map([[start,0]]),closed=new Set(),previous=new Map();let nearest=open[0],nearestD=Infinity;
      for(let loops=0;open.length&&loops<420;loops++){
        let at=0;for(let i=1;i<open.length;i++)if(open[i].f<open[at].f)at=i;const cur=open.splice(at,1)[0];if(closed.has(cur.k))continue;closed.add(cur.k);const d=Math.abs(cur.x-gx)+Math.abs(cur.y-gy);if(d<nearestD){nearestD=d;nearest=cur;}if(cur.k===goal||d<=1){nearest=cur;break;}
        for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const x=cur.x+dx,y=cur.y+dy,k=key(x,y);if(x<0||y<0||x>=width||y>=height||closed.has(k)||this.blockers(x*cell+cell/2,y*cell+cell/2,actor.radius+3,actor).length)continue;const g=cur.g+1;if((best.get(k)??Infinity)<=g)continue;best.set(k,g);previous.set(k,cur.k);open.push({x,y,k,g,f:g+Math.abs(x-gx)+Math.abs(y-gy)});}
      }
      const path=[];let k=nearest.k;for(let n=0;k!==start&&n<100;n++){path.unshift({x:(k%width)*cell+cell/2,y:Math.floor(k/width)*cell+cell/2});k=previous.get(k);if(k===undefined)break;}return path;
    }
    move(a,tx,ty,speed,dt,navigate=true){
      if(!Number.isFinite(tx)||!Number.isFinite(ty))return;let dx=tx-a.x,dy=ty-a.y,d=Math.hypot(dx,dy);if(d<4)return;
      a.pathTimer=Math.max(0,(a.pathTimer||0)-dt);
      const blocked=!this.clearLine(a,tx,ty,a.radius,a);
      if(navigate&&blocked){if(a.pathTimer<=0||!a.path?.length){a.path=this.findPath(a,tx,ty);a.pathTimer=1.5;}if(a.path.length){const p=a.path[0];if(dist(a,p)<18)a.path.shift();if(a.path.length){dx=a.path[0].x-a.x;dy=a.path[0].y-a.y;d=Math.hypot(dx,dy);}}}else a.path=[];
      if(d<1)return;const step=Math.min(speed*dt,d),vx=dx/d*step,vy=dy/d*step;const ox=a.x,oy=a.y;
      if(!this.blockers(a.x+vx,a.y,a.radius,a).length)a.x=clamp(a.x+vx,a.radius,C.world.width-a.radius);
      if(!this.blockers(a.x,a.y+vy,a.radius,a).length)a.y=clamp(a.y+vy,a.radius,C.world.height-a.radius);
      a.walk=(a.walk||0)+Math.hypot(a.x-ox,a.y-oy)*0.1;
      // Monsters break the actual object in their way, even if the route search cannot reach the goal.
      if(a.kind==='monster'&&Math.hypot(a.x-ox,a.y-oy)<step*0.45){const bs=this.blockers(ox+dx/d*(a.radius+25),oy+dy/d*(a.radius+25),a.radius+7,a);if(bs.length)this.monsterHit(a,bs[0]);}
    }
    nearestMonster(a,range){let best=null,d=range;for(const m of this.mobGrid.near(a.x,a.y,range)){const v=dist(a,m);if(m.hp>0&&v<d){best=m;d=v;}}return best;}
    attack(o,target){if(o.cooldown>0||o.down||!o.alive||!target||target.hp<=0||dist(o,target)>C.actor.range+target.radius)return false;if(!this.clearLine(o,target.x,target.y,2,o))return false;o.cooldown=C.actor.cooldown;this.damageMonster(target,C.actor.damage,o.id);this.s.effects.push({x:o.x,y:o.y,tx:target.x,ty:target.y,text:'',color:o.color,life:0.14,slash:true});return true;}
    damageMonster(m,damage,owner){if(!m||m.hp<=0||m.rewarded)return false;m.hp=Math.max(0,m.hp-damage);const o=this.owner(owner);if(o)o.damage+=damage;if(m.hp<=0){m.rewarded=true;if(o){const reward=C.reward[m.type];o.resources.coin+=reward;o.kills++;this.fx(m.x,m.y,'+'+reward+' xu',o.color);if(m.type==='boss'){o.bossKills++;o.resources.wood+=70;o.resources.stone+=55;o.resources.water+=40;o.resources.food+=40;this.emit(o.name+' hạ gục boss! +180 Xu Quỷ và tài nguyên.','boss');}}}return true;}
    gather(o,n){if(!o.alive||o.down||o.gatherCd>0||!n||n.amount<=0||dist(o,n)>C.actor.gatherRange+n.radius)return false;o.gatherCd=C.actor.gatherCooldown;const amount=Math.min(n.amount,C.actor.gatherAmount);n.amount-=amount;o.resources[n.type]+=amount;this.fx(n.x,n.y,'+'+amount,o.color);if(n.amount<=0)n.respawn=C.timing.resourceRespawn;return true;}
    command(type,target){const o=this.owner(0);o.path=[];o.pathTimer=0;o.command=type==='move'?{type,x:target.x,y:target.y}:{type,id:target.id};}
    spawnMonster(type,x,y,targetOwner,roaming=false){
      if(this.s.monsters.filter(m=>m.hp>0).length>=C.limits.monsters)return null;
      const d=C.monsters[type],cycle=type==='boss'?1+Math.floor((this.s.day-1)/7)*0.5:1,hp=d.hp*(1+0.12*(this.s.day-1))*cycle;
      if(this.s.buildings.some(b=>b.hp>0&&circleRect(x,y,d.radius+6,b)))return null;
      const m={id:this.id('m'),kind:'monster',type,x,y,hp,maxHp:hp,radius:d.radius,speed:d.speed,damage:d.damage*(1+0.08*(this.s.day-1))*cycle,cooldown:0,targetOwner,roaming,homeX:x,homeY:y,think:0,path:[],pathTimer:0,walk:0,aoe:4,rewarded:false};this.s.monsters.push(m);return m;
    }
    spawnRoamer(o){for(let i=0;i<8;i++){const a=this.rand()*Math.PI*2,r=210+this.rand()*200,x=clamp(o.homeX+Math.cos(a)*r,25,C.world.width-25),y=clamp(o.homeY+Math.sin(a)*r,25,C.world.height-25);if(this.spawnMonster(this.rand()<0.12?'runner':'normal',x,y,o.id,true))break;}}
    edgeSpawn(owner,type){const o=this.owner(owner);if(!o?.alive)return;const distances=[o.homeX,C.world.width-o.homeX,o.homeY,C.world.height-o.homeY];let edge=distances.indexOf(Math.min(...distances));if(this.rand()<0.25)edge=Math.floor(this.rand()*4);const spread=(this.rand()-0.5)*800;let x,y;if(edge===0){x=50;y=clamp(o.homeY+spread,50,C.world.height-50);}if(edge===1){x=C.world.width-50;y=clamp(o.homeY+spread,50,C.world.height-50);}if(edge===2){y=50;x=clamp(o.homeX+spread,50,C.world.width-50);}if(edge===3){y=C.world.height-50;x=clamp(o.homeX+spread,50,C.world.width-50);}this.spawnMonster(type,x,y,owner);}
    startNight(){
      this.s.phase='night';this.s.remaining=this.s.nightDuration;this.s.spawnQueue=[];const alive=this.s.owners.filter(o=>o.alive),per=6+2*(this.s.day-1);
      for(let i=0;i<per;i++)for(const o of alive){const r=this.rand(),runner=Math.min(0.38,0.12+this.s.day*0.018),brute=Math.min(0.28,0.035*this.s.day);this.s.spawnQueue.push({owner:o.id,type:r<brute?'brute':r<brute+runner?'runner':'normal'});}this.s.spawnTimer=0;
      this.emit('Đêm '+this.s.day+' đã tới. '+alive.length+' căn cứ đang bị bao vây!','danger');
      if(this.s.day%7===0&&!this.s.bossDays.includes(this.s.day)){this.s.bossDays.push(this.s.day);const o=alive[Math.floor(this.rand()*alive.length)];if(o){this.s.spawnQueue.unshift({owner:o.id,type:'boss'});this.emit('BOSS XUẤT HIỆN — KẺ NUỐT BÌNH MINH đang tiến đến '+o.name+'!','boss');}}
    }
    startDay(){this.s.phase='day';this.s.day++;this.s.remaining=this.s.dayDuration;this.s.warned=false;this.s.daySpawn=1;for(const o of this.s.owners)if(o.alive)o.days=this.s.day-1;this.emit('Bình minh ngày '+this.s.day+'. Quái còn sống vẫn tiếp tục tấn công.','info');}
    monsterHit(m,target){if(m.cooldown>0||m.hp<=0||target.hp<=0)return;if(target.resources&&!this.clearLine(m,target.x,target.y,2,m)){const dx=target.x-m.x,dy=target.y-m.y,len=Math.hypot(dx,dy);const block=this.blockers(m.x+dx/len*(m.radius+25),m.y+dy/len*(m.radius+25),m.radius+4,m)[0];if(block)target=block;else return;}m.cooldown=C.monsters[m.type].cooldown;const amount=m.damage*(m.type==='brute'&&target.type?1.5:1);if(target.resources){target.hp=Math.max(0,target.hp-amount);if(target.hp<=0){target.down=10;target.command=null;target.path=[];if(target.id===0)this.emit('Bạn gục ngã. Hồi sinh tại Nhà chính sau 10 giây.','danger');}}else this.damageBuilding(target,amount);this.fx(target.x,target.y,'−'+Math.round(amount),'#ed887a');}
    damageBuilding(b,damage){if(b.hp<=0)return;b.hp=Math.max(0,b.hp-damage);if(b.owner===0&&this.s.time-(this.lastBaseAlert||-99)>12){this.lastBaseAlert=this.s.time;this.emit('Căn cứ đang bị tấn công!','danger');}if(b.hp<=0){this.dirty=true;if(b.type==='hq')this.eliminate(b.owner);}}
    eliminate(id){const o=this.owner(id);if(!o?.alive)return;o.alive=false;o.days=this.s.day-1;o.eliminatedAt=this.s.time;o.command=null;for(const b of this.s.buildings)if(b.owner===id)b.hp=0;this.dirty=true;this.emit(o.name+' đã mất Nhà chính và bị loại.','danger');if(id===0){this.s.over=true;this.s.playerScore=this.score(o);}}
    score(o){const levels=this.s.buildings.filter(b=>b.owner===o.id&&b.hp>0).reduce((sum,b)=>sum+b.level-1,0);return (o.alive?this.s.day-1:o.days)*C.score.day+o.kills*C.score.kill+o.bossKills*C.score.boss+levels*C.score.level;}
    leaderboard(){return this.s.owners.map(o=>({id:o.id,name:o.name,color:o.color,alive:o.alive,kills:o.kills,boss:o.bossKills,days:o.alive?this.s.day-1:o.days,score:this.score(o),hp:this.hq(o.id)?.hp||0})).sort((a,b)=>Number(b.alive)-Number(a.alive)||b.score-a.score||b.hp-a.hp||a.id-b.id);}
    ai(o,dt){
      o.decision-=dt;o.maintenance-=dt;const nearNight=this.s.phase==='night'||this.s.remaining<=C.timing.warning,home={x:o.homeX,y:o.homeY+62};
      if(o.decision<=0){o.decision=0.7+this.rand()*0.5;let enemy=this.nearestMonster(o,nearNight?320:600);
        if(o.hp<o.maxHp*0.32){o.command={type:'move',...home};o.activity='Rút lui';}
        else if(nearNight){if(enemy&&Math.hypot(enemy.x-o.homeX,enemy.y-o.homeY)<360){o.command={type:'monster',id:enemy.id};o.activity='Phòng thủ';}else{o.command={type:'move',...home};o.activity='Giữ căn cứ';}}
        else {
          let need=o.resources.water<40?'water':o.resources.food<40?'food':null;
          if(!need&&enemy&&(o.resources.coin<28||this.rand()<0.35)){o.command={type:'monster',id:enemy.id};o.activity='Săn quái';}
          else {if(!need)need=o.resources.wood<75?'wood':o.resources.stone<55?'stone':this.rand()<0.5?'wood':'stone';let best=null,d=Infinity;for(const n of this.s.nodes)if(n.type===need&&n.amount>0){const dd=dist(o,n);if(dd<d){best=n;d=dd;}}o.command=best?{type:'node',id:best.id}:null;o.activity='Thu '+({water:'nước',food:'lương thực',wood:'gỗ',stone:'đá'})[need];}
        }
      }
      if(o.maintenance<=0){o.maintenance=3+this.rand()*3;
        // AI pays exactly the same costs and placement rules as the player.
        const own=this.s.buildings.filter(b=>b.owner===o.id&&b.hp>0);const hurt=own.filter(b=>b.hp<b.maxHp*0.7&&b.buildLeft===0).sort((a,b)=>(a.type==='hq'?-1:1)-(b.type==='hq'?-1:1));
        if(hurt.length&&this.repair(o.id,hurt[0].id).ok)return;
        let type=!own.some(b=>b.type==='well')?'well':!own.some(b=>b.type==='farm')?'farm':own.filter(b=>b.type==='tower').length<4?'tower':!own.some(b=>b.type==='house')?'house':'wall';
        if(this.canAfford(o,this.buildingCost(type))&&own.length<C.limits.buildingsPerOwner){for(let tries=0;tries<18;tries++){const a=this.rand()*Math.PI*2,r=type==='wall'?145:85+this.rand()*110,x=Math.round((o.homeX+Math.cos(a)*r)/16)*16,y=Math.round((o.homeY+Math.sin(a)*r)/16)*16;if(this.build(o.id,type,x,y).ok)break;}}
        else {const target=own.filter(b=>['tower','hq','well','farm'].includes(b.type)&&b.level<5&&b.buildLeft===0).sort((a,b)=>a.level-b.level)[0];if(target)this.upgrade(o.id,target.id);}
      }
    }
    updateActor(o,dt){
      if(!o.alive)return;o.cooldown=Math.max(0,o.cooldown-dt);o.gatherCd=Math.max(0,o.gatherCd-dt);
      for(const type of ['water','food'])o.resources[type]=Math.max(0,o.resources[type]-C.actor.consumption*dt);
      const houses=this.s.buildings.filter(b=>b.owner===o.id&&b.hp>0&&b.buildLeft<=0&&b.type==='house').reduce((s,b)=>s+b.level,0);o.maxHp=C.actor.hp+20*houses;
      if(o.down>0){o.down-=dt;if(o.down<=0){const pos=this.safeSpawn(o);o.x=pos.x;o.y=pos.y;o.hp=o.maxHp*0.65;}return;}
      const fed=o.resources.water>0&&o.resources.food>0;if(!fed){o.starve+=dt;if(o.starve>C.actor.hungerGrace){o.hp=Math.max(1,o.hp-dt*1.8);}}else{o.starve=0;o.hp=Math.min(o.maxHp,o.hp+(0.35+houses*0.25+(Math.hypot(o.x-o.homeX,o.y-o.homeY)<140?0.8:0))*dt);}
      if(o.id>0)this.ai(o,dt);
      const speed=C.actor.speed*(fed?1:0.77),manual=o.id===0&&(this.input.x||this.input.y);
      if(manual){o.command=null;const len=Math.hypot(this.input.x,this.input.y);this.move(o,o.x+this.input.x/len*80,o.y+this.input.y/len*80,speed,dt,false);}
      else if(o.command){const cmd=o.command;if(cmd.type==='move'){this.move(o,cmd.x,cmd.y,speed,dt);if(Math.hypot(o.x-cmd.x,o.y-cmd.y)<8)o.command=null;}
        else if(cmd.type==='node'){const n=this.s.nodes.find(n=>n.id===cmd.id);if(!n||n.amount<=0)o.command=null;else if(dist(o,n)>C.actor.gatherRange+n.radius-4)this.move(o,n.x,n.y,speed,dt);else this.gather(o,n);}
        else if(cmd.type==='monster'){const m=this.s.monsters.find(m=>m.id===cmd.id&&m.hp>0);if(!m)o.command=null;else if(dist(o,m)>C.actor.range+m.radius-5)this.move(o,m.x,m.y,speed,dt);else this.attack(o,m);}}
      if(o.id===0&&this.input.gather){let n=null,d=100;for(const node of this.s.nodes)if(node.amount>0&&dist(o,node)<d){n=node;d=dist(o,node);}this.gather(o,n);}
      const m=this.nearestMonster(o,C.actor.range+40);if(m)this.attack(o,m);
      if(o.id===0&&this.input.attack&&!m&&o.cooldown<=0){o.cooldown=0.2;this.s.effects.push({x:o.x,y:o.y,tx:o.x+30,ty:o.y-20,text:'',color:o.color,life:0.12,slash:true});}
    }
    safeSpawn(o){for(let i=0;i<20;i++){const a=i*2.4,r=58+Math.floor(i/5)*20,p={x:o.homeX+Math.cos(a)*r,y:o.homeY+Math.sin(a)*r};if(!this.blockers(p.x,p.y,o.radius,o).length)return p;}return {x:o.homeX,y:o.homeY+160};}
    updateMonster(m,dt){
      if(m.hp<=0)return;m.cooldown=Math.max(0,m.cooldown-dt);m.think-=dt;
      if(!this.owner(m.targetOwner)?.alive){const alive=this.s.owners.filter(o=>o.alive);if(!alive.length)return;alive.sort((a,b)=>dist(m,{x:a.homeX,y:a.homeY})-dist(m,{x:b.homeX,y:b.homeY}));m.targetOwner=alive[0].id;m.path=[];}
      let o=this.owner(m.targetOwner),target=this.hq(o.id);if(!target)return;
      const closeActor=this.s.owners.filter(a=>a.alive&&!a.down&&dist(m,a)<(m.roaming?170:115)).sort((a,b)=>dist(m,a)-dist(m,b))[0];
      if(closeActor)target=closeActor;
      else if(m.roaming){if(m.think<=0){m.think=3+this.rand()*4;m.wanderX=clamp(m.homeX+(this.rand()-0.5)*200,25,C.world.width-25);m.wanderY=clamp(m.homeY+(this.rand()-0.5)*200,25,C.world.height-25);}this.move(m,m.wanderX??m.x,m.wanderY??m.y,m.speed*0.4,dt);return;}
      const range=target.resources?m.radius+target.radius+10:m.radius+target.size/2+10;
      if(dist(m,target)<range)this.monsterHit(m,target);else{
        // Prefer breaking a nearby barricade that directly blocks the route to the base.
        const dx=target.x-m.x,dy=target.y-m.y,len=Math.hypot(dx,dy),block=this.blockers(m.x+dx/len*(m.radius+24),m.y+dy/len*(m.radius+24),m.radius+3,m)[0];
        if(block&&dist(m,block)<m.radius+block.size/2+35)this.monsterHit(m,block);else this.move(m,target.x,target.y,m.speed,dt);
      }
      if(m.type==='boss'){m.aoe-=dt;if(m.aoe<=0){m.aoe=7;this.s.effects.push({x:m.x,y:m.y,radius:140,text:'',color:'#ef654a',life:0.7,aoe:true});for(const b of this.buildGrid.near(m.x,m.y,150))if(b.hp>0&&dist(m,b)<145)this.damageBuilding(b,m.damage*1.1);for(const a of this.s.owners)if(a.alive&&!a.down&&dist(m,a)<145){a.hp=Math.max(0,a.hp-m.damage*0.6);if(a.hp<=0)a.down=10;}}}
    }
    updateBuildings(dt){for(const b of this.s.buildings){if(b.hp<=0||!this.owner(b.owner)?.alive)continue;if(b.buildLeft>0){b.buildLeft=Math.max(0,b.buildLeft-dt);continue;}const o=this.owner(b.owner),level=C.levels[b.level-1];if(b.type==='well')o.resources.water+=level.production*dt;if(b.type==='farm')o.resources.food+=level.production*dt;if(b.type==='tower'){b.cooldown=Math.max(0,b.cooldown-dt);if(b.cooldown<=0){const m=this.nearestMonster(b,level.towerRange);if(m){b.cooldown=level.towerCooldown;if(this.s.projectiles.length<C.limits.projectiles)this.s.projectiles.push({id:this.id('p'),x:b.x,y:b.y-12,target:m.id,owner:b.owner,damage:level.towerDamage,life:2.4});}}}}}
    step(dt){
      if(this.s.over)return;dt=clamp(dt,0,0.1);this.s.time+=dt;this.s.remaining-=dt;this.frame++;if(this.s.remaining<=0){if(this.s.phase==='day')this.startNight();else this.startDay();}
      if(this.s.phase==='day'&&!this.s.warned&&this.s.remaining<=C.timing.warning){this.s.warned=true;this.emit(this.s.day%7===0?'Còn 20 giây! Đêm boss sắp tới — về căn cứ ngay!':'Còn 20 giây trước đêm. Hãy trở về căn cứ!','danger');}
      if(this.s.spawnQueue.length){this.s.spawnTimer-=dt;let n=0;while(this.s.spawnTimer<=0&&this.s.spawnQueue.length&&n++<5&&this.s.monsters.length<C.limits.monsters){const item=this.s.spawnQueue.shift();if(this.owner(item.owner)?.alive)this.edgeSpawn(item.owner,item.type);this.s.spawnTimer+=0.25;}}
      if(this.s.phase==='day'){this.s.daySpawn-=dt;if(this.s.daySpawn<=0){this.s.daySpawn=24;for(const o of this.s.owners)if(o.alive&&this.s.monsters.length<C.limits.monsters*0.65)this.spawnRoamer(o);}}
      for(const n of this.s.nodes)if(n.amount<=0){n.respawn-=dt;if(n.respawn<=0)n.amount=n.max;}
      this.reindex();for(const o of this.s.owners)this.updateActor(o,dt);this.updateBuildings(dt);
      for(const m of this.s.monsters)this.updateMonster(m,dt);
      for(const p of this.s.projectiles){p.life-=dt;const m=this.s.monsters.find(m=>m.id===p.target&&m.hp>0);if(!m){p.life=0;continue;}const d=dist(p,m),step=550*dt;if(d<=step+8){this.damageMonster(m,p.damage,p.owner);p.life=0;}else{p.x+=(m.x-p.x)/d*step;p.y+=(m.y-p.y)/d*step;}}
      this.s.projectiles=this.s.projectiles.filter(p=>p.life>0);this.s.monsters=this.s.monsters.filter(m=>m.hp>0);for(const e of this.s.effects)e.life-=dt;this.s.effects=this.s.effects.filter(e=>e.life>0);
      // Keep ruins for inspection until the next cleanup, with no active collision.
      if(this.frame%150===0)this.s.buildings=this.s.buildings.filter(b=>b.hp>0||b.type==='hq');
    }
    testNight7(){if(!this.s.testMode)return false;this.s.day=7;this.s.phase='day';this.s.remaining=0.05;this.emit('CHẾ ĐỘ KIỂM TRA: chuẩn bị đêm ngày 7. Kỷ lục ván này sẽ không được lưu.','boss');return true;}
    serialize(){const state=JSON.parse(JSON.stringify(this.s));state.effects=[];return JSON.stringify({format:'sinh-ton-h5',version:C.version,state});}
    static load(json){
      const data=typeof json==='string'?JSON.parse(json):json,s=data?.state;
      if(data?.format!=='sinh-ton-h5'||data.version!==C.version||!s||!Array.isArray(s.owners)||s.owners.length<16||s.owners.length>21||!Array.isArray(s.buildings)||!Array.isArray(s.nodes)||!Array.isArray(s.monsters)||!Array.isArray(s.projectiles)||!Array.isArray(s.bossDays)||!Array.isArray(s.spawnQueue)||!Array.isArray(s.events))throw new Error('Tệp lưu không đúng định dạng.');
      const finite=(n,min,max)=>typeof n==='number'&&Number.isFinite(n)&&n>=min&&n<=max;
      if(!finite(s.day,1,100000)||!Number.isInteger(s.day)||!finite(s.remaining,0,86400)||!['day','night'].includes(s.phase)||!finite(s.dayDuration,10,3600)||!finite(s.nightDuration,10,3600)||!finite(s.time,0,1e10)||!finite(s.nextId,1,1e10)||!finite(s.rng,0,4294967295))throw new Error('Trạng thái thời gian không hợp lệ.');
      if(s.monsters.length>C.limits.monsters||s.buildings.length>1100||s.nodes.length>2000||s.projectiles.length>C.limits.projectiles||s.spawnQueue.length>500000)throw new Error('Tệp vượt giới hạn thực thể.');
      const validPath=e=>Array.isArray(e.path)&&e.path.length<=100&&e.path.every(p=>finite(p.x,0,C.world.width+48)&&finite(p.y,0,C.world.height+48));
      const ids=new Set();for(const [i,o]of s.owners.entries()){if(o.id!==i||typeof o.name!=='string'||o.name.length>24||!finite(o.hp,0,100000)||!finite(o.maxHp,1,100000)||!finite(o.x,0,C.world.width)||!finite(o.y,0,C.world.height)||!finite(o.homeX,0,C.world.width)||!finite(o.homeY,0,C.world.height)||!o.resources||!resources.every(k=>finite(o.resources[k],0,1e12))||!validPath(o))throw new Error('Tài nguyên hoặc nhân vật không hợp lệ.');}
      for(const arr of [s.buildings,s.nodes,s.monsters,s.projectiles])for(const e of arr){if(typeof e.id!=='string'||ids.has(e.id)||!finite(e.x,0,C.world.width)||!finite(e.y,0,C.world.height))throw new Error('Thực thể không hợp lệ.');ids.add(e.id);}
      for(const b of s.buildings)if(!C.buildings[b.type]||!Number.isInteger(b.level)||b.level<1||b.level>5||!s.owners[b.owner]||!finite(b.hp,0,b.maxHp)||!finite(b.maxHp,1,1e6)||b.size!==C.buildings[b.type].size||!finite(b.buildLeft,0,C.timing.construction))throw new Error('Công trình không hợp lệ.');
      for(const n of s.nodes)if(!resources.slice(0,4).includes(n.type)||!finite(n.amount,0,n.max)||!finite(n.max,1,10000))throw new Error('Điểm tài nguyên không hợp lệ.');
      for(const m of s.monsters)if(!C.monsters[m.type]||!finite(m.hp,0,m.maxHp)||!finite(m.maxHp,1,1e9)||m.radius!==C.monsters[m.type].radius)throw new Error('Quái không hợp lệ.');
      const game=Object.create(Game.prototype);game.s=s;game.s.effects=[];game.input={x:0,y:0,gather:false,attack:false};game.dirty=true;game.frame=0;game.reindex();return game;
    }
  }
  Game.config=C;Game.distance=dist;Game.circleRect=circleRect;
  if(typeof module==='object'&&module.exports)module.exports=Game;else root.SurvivalGame=Game;
})(typeof globalThis!=='undefined'?globalThis:this);
