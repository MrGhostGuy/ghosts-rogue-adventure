(function(){
var C=document.getElementById('gc'),X=C.getContext('2d'),W=240,H=282;
var state='title',frame=0,keys={};
var camX=0,camY=0;
var TITLE="Ghost's Rogue Adventure";
// Game constants
var MAX_LVL=999,ARENA_W=800,ARENA_H=800;
var RARITY=['Common','Uncommon','Rare','Epic','Legendary'];
var RARITY_CLR=['#aaa','#0f0','#08f','#c0f','#fa0'];
var RARITY_MULT=[1,1.3,1.7,2.2,3];
var RARITY_CHANCE=[0.45,0.28,0.15,0.08,0.04];
// Player state
var p={x:400,y:400,r:8,hp:100,maxHp:100,sh:0,maxSh:30,spd:1.8,dmg:1,dodge:0,
lvl:1,xp:0,xpReq:20,upgPts:0,perkPts:0,lives:2,magnet:40,
guns:[null,null],curGun:0,fireTimer:0,invT:0,crit:0.05,critMult:1.5,armor:0,hpRegen:0,luck:0,reloadSpd:0};

// Weapon definitions
var GUNS=[
{name:'Revolver',dmg:12,rate:22,reload:45,mag:6,spread:0.05,bullets:1,spd:5,color:'#fa0',snd:'bang'},
{name:'Shotgun',dmg:6,rate:30,reload:55,mag:4,spread:0.3,bullets:5,spd:4.5,color:'#f80',snd:'boom'},
{name:'SMG',dmg:5,rate:6,reload:40,mag:25,spread:0.12,bullets:1,spd:6,color:'#ff0',snd:'tat'},
{name:'Sniper',dmg:35,rate:50,reload:60,mag:3,spread:0.01,bullets:1,spd:9,color:'#0ff',snd:'crack'},
{name:'Grenade L.',dmg:25,rate:40,reload:50,mag:3,spread:0.08,bullets:1,spd:3,color:'#f44',snd:'thud',explode:1},
{name:'Lightning',dmg:8,rate:10,reload:35,mag:15,spread:0.15,bullets:1,spd:7,color:'#44f',snd:'zap',chain:1},
{name:'Plasma',dmg:15,rate:16,reload:42,mag:8,spread:0.06,bullets:1,spd:5.5,color:'#f0f',snd:'pew'},
{name:'Minigun',dmg:4,rate:3,reload:70,mag:60,spread:0.18,bullets:1,spd:6,color:'#ff8',snd:'brrt'},
{name:'Crossbow',dmg:20,rate:35,reload:30,mag:1,spread:0.02,bullets:1,spd:7,color:'#0f8',snd:'twng',pierce:1},
{name:'Flamethrower',dmg:3,rate:3,reload:50,mag:40,spread:0.25,bullets:3,spd:3,color:'#f60',snd:'woosh',burn:1}
];

// Game arrays and state
var enemies=[],bullets=[],xpOrbs=[],drops=[],chests=[],explosions=[],dmgNums=[],particles=[];
var round=1,enemiesLeft=0,roundClear=true,roundTimer=0,waveSpawned=false;
var joy={active:false,sx:0,sy:0,cx:0,cy:0,dx:0,dy:0};
var swapBtn={x:205,y:252,r:18};
var nearItem=null,upgradeUI=false,perkUI=false,pauseGame=false;
var curUpgradeOpts=[];
var perks=[],selectedPerks=[];
var PERK_LIST=[
{name:'Magnetism+',desc:'XP range +30%',fn:function(){p.magnet*=1.3}},
{name:'Fire Aura',desc:'Burn nearby foes',fn:function(){perks.push('fire')}},
{name:'Lightning',desc:'Chain zap on kill',fn:function(){perks.push('lightning')}},
{name:'Vampirism',desc:'Heal 2% on kill',fn:function(){perks.push('vamp')}},
{name:'Thick Skin',desc:'Max HP +25',fn:function(){p.maxHp+=25;p.hp+=25}},
{name:'Quick Reload',desc:'Reload 20% faster',fn:function(){perks.push('quickReload')}},
{name:'Piercing',desc:'Bullets pierce +1',fn:function(){perks.push('pierce')}},
{name:'Shield Regen',desc:'Shield regens slowly',fn:function(){perks.push('shieldRegen')}},
{name:'Explosive Rounds',desc:'Bullets explode on hit',fn:function(){perks.push('explosive')}},
{name:'Freeze Aura',desc:'Slow nearby enemies',fn:function(){perks.push('freezeAura')}},
{name:'Berserker',desc:'More DMG at low HP',fn:function(){perks.push('berserker')}},
{name:'Double XP',desc:'Gain 2x XP orbs',fn:function(){perks.push('doubleXP')}},
{name:'Extra Life',desc:'+1 extra life',fn:function(){p.lives++;}},
{name:'Glass Cannon',desc:'+50% DMG, -20% HP',fn:function(){p.dmg*=1.5;p.maxHp=Math.round(p.maxHp*0.8);p.hp=Math.min(p.hp,p.maxHp);}},
{name:'Treasure Hunter',desc:'More chests spawn',fn:function(){perks.push('treasure')}},
{name:'Thorns',desc:'Reflect 30% DMG taken',fn:function(){perks.push('thorns')}},
{name:'Second Wind',desc:'Heal 30% on level up',fn:function(){perks.push('secondWind')}},
{name:'Juggernaut',desc:'+30 HP, -10% SPD',fn:function(){p.maxHp+=30;p.hp+=30;p.spd*=0.9;}},
{name:'Swift Strike',desc:'+15% fire rate',fn:function(){perks.push('swiftStrike')}},
{name:'Corrosive Rounds',desc:'Bullets corrode armor',fn:function(){perks.push('corrodeRounds')}},
{name:'Shield Burst',desc:'Explode when shield breaks',fn:function(){perks.push('shieldBurst')}},
{name:'Lucky Crits',desc:'+10% crit chance',fn:function(){p.crit=Math.min((p.crit||0.05)+0.1,0.6);}},
{name:'Adrenaline',desc:'Speed up after kill',fn:function(){perks.push('adrenaline')}}
];

// Helper functions
function dist(a,b){return Math.sqrt((a.x-b.x)*(a.x-b.x)+(a.y-b.y)*(a.y-b.y))}
function rng(a,b){return Math.random()*(b-a)+a}
function ri(a,b){return Math.floor(rng(a,b+1))}
function pickRarity(){var r=Math.random(),s=0;for(var i=0;i<5;i++){s+=RARITY_CHANCE[i];if(r<s)return i;}return 0;}
function makeGun(lvl){var base=GUNS[ri(0,GUNS.length-1)],rar=pickRarity();
var g={name:base.name,dmg:Math.round(base.dmg*(1+lvl*0.04)*RARITY_MULT[rar]),
rate:Math.max(2,Math.round(base.rate*(1-rar*0.05))),reload:Math.max(15,Math.round(base.reload*(1-rar*0.06))),
mag:base.mag+ri(0,rar*2),spread:base.spread,bullets:base.bullets,spd:base.spd+rar*0.3,
color:base.color,snd:base.snd,rarity:rar,ammo:base.mag+ri(0,rar*2),reloading:0};
if(base.explode)g.explode=1;if(base.chain)g.chain=1;if(base.pierce)g.pierce=1;if(base.burn)g.burn=1;
if(rar>=2&&Math.random()<0.3){var elems=["Freezing","Lightning","Fire","Corrosion"];var elemClrs=["#0ff","#ff0","#f40","#0f0"];var ei=ri(0,elems.length-1);g.element=elems[ei];g.elemColor=elemClrs[ei];g.name=g.element+" "+g.name;if(g.element==="Freezing"){g.slow=0.5;g.slowDur=120;}if(g.element==="Lightning"){g.chain=1;g.chainDmg=Math.round(g.dmg*0.4);}if(g.element==="Fire"){g.burn=1;g.burnDmg=Math.round(g.dmg*0.2);}if(g.element==="Corrosion"){g.corrode=1;g.corrodeMult=1.15;}}
if(rar>=2&&Math.random()<0.4){var bonuses=["Fast Reload","Rapid Fire","Piercing","Big Mag","High Velocity"];var bi=ri(0,bonuses.length-1);g.bonus=bonuses[bi];if(g.bonus==="Fast Reload"){g.reload=Math.max(8,Math.round(g.reload*0.6));}if(g.bonus==="Rapid Fire"){g.rate=Math.max(1,Math.round(g.rate*0.6));}if(g.bonus==="Piercing"){g.pierce=1;}if(g.bonus==="Big Mag"){g.mag=Math.round(g.mag*1.8);g.ammo=g.mag;}if(g.bonus==="High Velocity"){g.spd=g.spd*1.5;g.dmg=Math.round(g.dmg*1.2);}}
return g;}
function giveStartGun(){var base=GUNS[0];p.guns[0]={name:base.name,dmg:base.dmg,rate:base.rate,reload:base.reload,mag:base.mag,spread:base.spread,bullets:base.bullets,spd:base.spd,color:base.color,snd:base.snd,ammo:base.mag,reloading:0,rarity:0};}

// Enemy spawning
function spawnEnemy(type,x,y){
var hp=10+round*3+(type==='fast'?-2:type==='toxic'?5:type==='tank'?40+round*8:type==='ghost'?-4:type==='splitter'?15+round*4:type==='splitling'?-5:type==='mini'?80+round*10:type==='boss'?300+round*20:0);
hp*=(1+Math.floor(round/2)*0.15);
var spd=type==='fast'?1.2:type==='boss'?0.5:type==='mini'?0.7:type==='tank'?0.35:type==='ghost'?0.9:type==='splitter'?0.55:type==='splitling'?1.0:0.6+round*0.01;
var r=type==='boss'?18:type==='mini'?12:type==='tank'?10:type==='toxic'?7:type==='splitter'?8:type==='splitling'?4:type==='ghost'?6:6;
var clr=type==='fast'?'#f44':type==='toxic'?'#0f0':type==='mini'?'#f80':type==='boss'?'#f00':type==='tank'?'#80f':type==='ghost'?'#0ff':type==='splitter'?'#ff0':type==='splitling'?'#cc0':'#e44';
var dmg=type==='boss'?15:type==='mini'?8:type==='tank'?10:type==='ghost'?4:type==='splitter'?6:type==='splitling'?3:5;
enemies.push({x:x,y:y,hp:hp,maxHp:hp,spd:spd,r:r,type:type,color:clr,dmg:dmg,
atkTimer:0,poisonTimer:0,flash:0,armor:type==='tank'?0.5:0,phase:type==='ghost'?1:0,teleTimer:type==='ghost'?ri(60,120):0});}
function spawnWave(){
var count=5+round*2+ri(0,round);
for(var i=0;i<count;i++){
var ang=rng(0,Math.PI*2),d=rng(150,300);
var ex=p.x+Math.cos(ang)*d,ey=p.y+Math.sin(ang)*d;
ex=Math.max(20,Math.min(ARENA_W-20,ex));ey=Math.max(20,Math.min(ARENA_H-20,ey));
var r=Math.random();
var type=r<0.07&&round>3?'fast':r<0.12&&round>5?'toxic':r<0.18&&round>4?'ghost':r<0.24&&round>7?'tank':r<0.30&&round>8?'splitter':'basic';
spawnEnemy(type,ex,ey);}
if(round%5===0&&round<20){var a=rng(0,Math.PI*2);spawnEnemy('mini',p.x+Math.cos(a)*200,p.y+Math.sin(a)*200);}
if(round===20){spawnEnemy('boss',ARENA_W/2,100);}
enemiesLeft=enemies.length;waveSpawned=true;}

// Touch input - virtual joystick
var touches={};
function getTouch(e){var r=C.getBoundingClientRect();var t=e.changedTouches||[{clientX:e.clientX,clientY:e.clientY,identifier:0}];
var out=[];for(var i=0;i<t.length;i++){out.push({x:(t[i].clientX-r.left)*(W/r.width),y:(t[i].clientY-r.top)*(H/r.height),id:t[i].identifier});}return out;}
C.addEventListener('touchstart',function(e){e.preventDefault();var ts=getTouch(e);
for(var i=0;i<ts.length;i++){var t=ts[i];
if(state==='play'&&!upgradeUI&&!perkUI){
if(t.x<120&&t.y>180){joy.active=true;joy.sx=t.x;joy.sy=t.y;joy.cx=t.x;joy.cy=t.y;joy.id=t.id;}
else if(dist(t,swapBtn)<25){swapGun();}
else{handleUITap(t);}}
else{handleUITap(t);}}},{passive:false});
C.addEventListener('touchmove',function(e){e.preventDefault();var ts=getTouch(e);
for(var i=0;i<ts.length;i++){if(joy.active&&ts[i].id===joy.id){
joy.cx=ts[i].x;joy.cy=ts[i].y;
var dx=joy.cx-joy.sx,dy=joy.cy-joy.sy,d=Math.sqrt(dx*dx+dy*dy);
if(d>25){dx=dx/d*25;dy=dy/d*25;joy.cx=joy.sx+dx;joy.cy=joy.sy+dy;}
joy.dx=dx/25;joy.dy=dy/25;}}},{passive:false});
C.addEventListener('touchend',function(e){e.preventDefault();var ts=getTouch(e);
for(var i=0;i<ts.length;i++){if(joy.active&&ts[i].id===joy.id){joy.active=false;joy.dx=0;joy.dy=0;}}},{passive:false});

// Mouse fallback for testing
C.addEventListener('mousedown',function(e){var r=C.getBoundingClientRect();
var t={x:(e.clientX-r.left)*(W/r.width),y:(e.clientY-r.top)*(H/r.height)};
if(state==='play'&&!upgradeUI&&!perkUI){
if(t.x<120&&t.y>180){joy.active=true;joy.sx=t.x;joy.sy=t.y;joy.cx=t.x;joy.cy=t.y;}
else if(dist(t,swapBtn)<25){swapGun();}
else{handleUITap(t);}}else{handleUITap(t);}});
C.addEventListener('mousemove',function(e){if(!joy.active)return;var r=C.getBoundingClientRect();
var mx=(e.clientX-r.left)*(W/r.width),my=(e.clientY-r.top)*(H/r.height);
joy.cx=mx;joy.cy=my;var dx=joy.cx-joy.sx,dy=joy.cy-joy.sy,d=Math.sqrt(dx*dx+dy*dy);
if(d>25){dx=dx/d*25;dy=dy/d*25;}joy.dx=dx/25;joy.dy=dy/25;});
C.addEventListener('mouseup',function(){joy.active=false;joy.dx=0;joy.dy=0;});
function swapGun(){if(p.guns[1]){p.curGun=p.curGun===0?1:0;}}

// UI tap handler
function handleUITap(t){
if(state==='title'){state='play';resetGame();return;}
if(state==='gameover'){state='title';return;}
if(state==='victory'){state='title';return;}
if(upgradeUI){
var opts=curUpgradeOpts;
for(var i=0;i<opts.length;i++){var by=100+i*35;
if(t.x>30&&t.x<210&&t.y>by&&t.y<by+28){
var uid=opts[i].id;
if(uid==='hp'){p.maxHp+=8;p.hp=Math.min(p.hp+8,p.maxHp);}
else if(uid==='spd'){p.spd+=0.08;}
else if(uid==='dodge'){p.dodge=Math.min(p.dodge+0.02,0.4);}
else if(uid==='dmg'){p.dmg+=0.5;}
else if(uid==='shield'){p.maxSh+=5;p.sh=Math.min(p.sh+5,p.maxSh);}
else if(uid==='crit'){p.crit=Math.min((p.crit||0.05)+0.03,0.5);}
else if(uid==='critdmg'){p.critMult=(p.critMult||1.5)+0.2;}
else if(uid==='armor'){p.armor=Math.min((p.armor||0)+0.05,0.5);}
else if(uid==='magnet'){p.magnet+=15;}
else if(uid==='reload'){p.reloadSpd=Math.min((p.reloadSpd||0)+0.1,0.5);}
else if(uid==='hpregen'){p.hpRegen=(p.hpRegen||0)+0.3;}
else if(uid==='luck'){p.luck=Math.min((p.luck||0)+0.03,0.3);}
p.upgPts--;curUpgradeOpts=[];if(p.upgPts<=0)upgradeUI=false;return;}}return;}
if(perkUI){
for(var i=0;i<3&&i<selectedPerks.length;i++){var by=90+i*50;
if(t.x>20&&t.x<220&&t.y>by&&t.y<by+40){
selectedPerks[i].fn();perkUI=false;return;}}return;}
if(nearItem&&state==='play'){pickupItem();return;}
if(state==='play'&&t.x>180&&t.y<30){pauseGame=!pauseGame;return;}}

// Item pickup
function pickupItem(){if(!nearItem)return;
if(nearItem.type==='weapon'){
var slot=p.guns[1]?p.curGun:(p.guns[0]?1:0);
var old=p.guns[slot];p.guns[slot]=nearItem.gun;
if(old){nearItem.gun=old;}else{drops.splice(drops.indexOf(nearItem),1);}
nearItem=null;return;}
if(nearItem.type==='health'){p.hp=Math.min(p.hp+nearItem.val,p.maxHp);drops.splice(drops.indexOf(nearItem),1);nearItem=null;return;}
                     }
// Chest opening
function openChest(c){var g=makeGun(round);drops.push({x:c.x,y:c.y,type:'weapon',gun:g,glow:0});
if(Math.random()<0.5){if(Math.random()<0.6){drops.push({x:c.x+ri(-20,20),y:c.y+ri(-20,20),type:'health',val:Math.round(p.maxHp*0.3),glow:0});}else{var bg=makeGun(round);drops.push({x:c.x+ri(-20,20),y:c.y+ri(-20,20),type:'weapon',gun:bg,glow:0});}}
chests.splice(chests.indexOf(c),1);}
// Reset game
function resetGame(){
p.x=ARENA_W/2;p.y=ARENA_H/2;p.hp=100;p.maxHp=100;p.sh=0;p.maxSh=30;
p.spd=1.8;p.dmg=1;p.dodge=0;p.lvl=1;p.xp=0;p.xpReq=20;p.upgPts=0;p.perkPts=0;
p.lives=2;p.magnet=40;p.curGun=0;p.fireTimer=0;p.invT=0;p.guns=[null,null];
giveStartGun();round=1;enemies=[];bullets=[];xpOrbs=[];drops=[];chests=[];
explosions=[];dmgNums=[];particles=[];perks=[];roundClear=true;roundTimer=60;
waveSpawned=false;upgradeUI=false;perkUI=false;pauseGame=false;}

// Player update
function updatePlayer(){
if(p.invT>0)p.invT--;
// Movement via joystick
if(joy.active||(joy.dx!==0||joy.dy!==0)){
p.x+=joy.dx*p.spd;p.y+=joy.dy*p.spd;
p.x=Math.max(p.r,Math.min(ARENA_W-p.r,p.x));
p.y=Math.max(p.r,Math.min(ARENA_H-p.r,p.y));}
// XP magnet
for(var i=xpOrbs.length-1;i>=0;i--){var o=xpOrbs[i];
var d=dist(p,o);if(d<p.magnet){var a=Math.atan2(p.y-o.y,p.x-o.x);
o.x+=Math.cos(a)*3;o.y+=Math.sin(a)*3;}
if(d<10){var xpVal=o.val;if(perks.indexOf('doubleXP')>=0)xpVal*=2;p.xp+=xpVal;xpOrbs.splice(i,1);checkLevelUp();}}
// Check nearby items
nearItem=null;
for(var i=0;i<drops.length;i++){if(dist(p,drops[i])<25){nearItem=drops[i];break;}}
for(var i=0;i<chests.length;i++){if(dist(p,chests[i])<25){openChest(chests[i]);break;}}
// Shield regen perk
if(perks.indexOf('shieldRegen')>=0&&frame%60===0&&p.sh<p.maxSh){p.sh=Math.min(p.sh+1,p.maxSh);}
if((p.hpRegen||0)>0&&frame%60===0&&p.hp<p.maxHp){p.hp=Math.min(p.hp+p.hpRegen,p.maxHp);}
// Auto-shoot
autoShoot();}

// Auto-shoot at nearest enemy
function autoShoot(){
var gun=p.guns[p.curGun];if(!gun)return;
if(gun.reloading>0){gun.reloading--;if(gun.reloading<=0)gun.ammo=gun.mag;return;}
if(gun.ammo<=0){gun.reloading=gun.reload;if(perks.indexOf('quickReload')>=0)gun.reloading=Math.floor(gun.reloading*0.8);
if((p.reloadSpd||0)>0)gun.reloading=Math.floor(gun.reloading*(1-p.reloadSpd));return;}
p.fireTimer--;if(p.fireTimer>0)return;
var nearest=null,nd=999;
for(var i=0;i<enemies.length;i++){var d=dist(p,enemies[i]);if(d<nd){nd=d;nearest=enemies[i];}}
if(!nearest||nd>180)return;
var ang=Math.atan2(nearest.y-p.y,nearest.x-p.x);
for(var b=0;b<gun.bullets;b++){
var a=ang+rng(-gun.spread,gun.spread);
bullets.push({x:p.x,y:p.y,vx:Math.cos(a)*gun.spd,vy:Math.sin(a)*gun.spd,
dmg:Math.round(gun.dmg*p.dmg*(perks.indexOf('berserker')>=0&&p.hp<p.maxHp*0.4?1.5:1)),life:60,pierce:gun.pierce?2:1,
explode:gun.explode||0,chain:gun.chain||0,burn:gun.burn||0,
color:gun.color,r:gun.explode?3:2});}
gun.ammo--;p.fireTimer=perks.indexOf('swiftStrike')>=0?Math.floor(gun.rate*0.85):gun.rate;}

// Level up
function checkLevelUp(){
while(p.xp>=p.xpReq&&p.lvl<MAX_LVL){
p.xp-=p.xpReq;p.lvl++;p.xpReq=Math.floor(20*Math.pow(1.12,p.lvl-1)+3*(p.lvl-1));
p.maxHp+=4;p.hp=Math.min(p.hp+4,p.maxHp);if(perks.indexOf('secondWind')>=0){p.hp=Math.min(p.hp+Math.round(p.maxHp*0.3),p.maxHp);}
p.maxSh+=2;p.sh=Math.min(p.sh+2,p.maxSh);
p.dmg+=0.01;p.upgPts++;
if(p.lvl%5===0){p.perkPts++;showPerkUI();}
if(p.upgPts>0)upgradeUI=true;}}
function showPerkUI(){
selectedPerks=[];var pool=PERK_LIST.slice();
for(var i=0;i<3&&pool.length>0;i++){var idx=ri(0,pool.length-1);selectedPerks.push(pool[idx]);pool.splice(idx,1);}
perkUI=true;}
// Bullet update
function updateBullets(){
for(var i=bullets.length-1;i>=0;i--){var b=bullets[i];
b.x+=b.vx;b.y+=b.vy;b.life--;
if(b.life<=0||b.x<0||b.x>ARENA_W||b.y<0||b.y>ARENA_H){bullets.splice(i,1);continue;}
for(var j=enemies.length-1;j>=0;j--){var e=enemies[j];
if(dist(b,e)<e.r+b.r){
hitEnemy(e,b.dmg,b);b.pierce--;if(b.pierce<=0){
if(b.explode){addExplosion(b.x,b.y,30,b.dmg);}
bullets.splice(i,1);}break;}}}}

// Hit enemy
function hitEnemy(e,dmg,b){
if(e.phase&&Math.random()<0.3){dmgNums.push({x:e.x,y:e.y-e.r,val:'PHASE',life:25,color:'#0ff'});return;}
if(e.armor>0){dmg=Math.max(1,Math.round(dmg*(1-e.armor)));}
var isCrit=Math.random()<(p.crit||0.05);if(isCrit){dmg=Math.round(dmg*(p.critMult||1.5));dmgNums.push({x:e.x,y:e.y-e.r-8,val:'CRIT!',life:20,color:'#ff0'});}
if(p.armor&&p.armor>0){}
e.hp-=dmg;e.flash=6;
if(perks.indexOf('explosive')>=0&&b){for(var ei=0;ei<enemies.length;ei++){var ee=enemies[ei];if(ee!==e&&dist(e,ee)<35){hitEnemy(ee,Math.round(dmg*0.4),null);}}}

if(gun&&gun.slow){e.slowT=gun.slowDur||120;e.slowMult=gun.slow||0.5;}
if((gun&&gun.corrode)||(b&&b.corrode)){e.corrodeMult=(e.corrodeMult||1)*((gun&&gun.corrodeMult)||((b&&b.corrodeMult)||1.15));}
if(gun&&gun.burn&&gun.burnDmg){e.burnT=180;e.burnDmg=gun.burnDmg;}
dmgNums.push({x:e.x,y:e.y-e.r,val:dmg,life:30,color:'#fff'});
if(b&&b.burn){e.burnT=120;}
if(b&&b.chain&&enemies.length>1){
var nearest=null,nd=999;
for(var k=0;k<enemies.length;k++){if(enemies[k]!==e){var dd=dist(e,enemies[k]);if(dd<80&&dd<nd){nd=dd;nearest=enemies[k];}}}
if(nearest){hitEnemy(nearest,Math.floor(dmg*0.5),null);
particles.push({x:e.x,y:e.y,x2:nearest.x,y2:nearest.y,life:8,color:'#44f'});}}
if(e.hp<=0){killEnemy(e);}}
function killEnemy(e){
var idx=enemies.indexOf(e);if(idx>=0)enemies.splice(idx,1);
if(e.type==='splitter'){for(var si=0;si<2;si++){var sa=rng(0,Math.PI*2);spawnEnemy('splitling',e.x+Math.cos(sa)*15,e.y+Math.sin(sa)*15);}}
xpOrbs.push({x:e.x,y:e.y,val:e.type==='boss'?50:e.type==='mini'?20:5+round});
if(Math.random()<0.08+(p.luck||0)){drops.push({x:e.x,y:e.y,type:'health',val:Math.round(p.maxHp*0.2),glow:0});}
var wdc=e.type==='boss'?0.25:e.type==='mini'?0.15:0.08;if(Math.random()<wdc){var dg=makeGun(round);drops.push({x:e.x,y:e.y,type:'weapon',gun:dg,glow:0});}
var cdc=e.type==='boss'?0.20:0.05;if(Math.random()<cdc){chests.push({x:e.x,y:e.y,glow:0});}
if(perks.indexOf('vamp')>=0){p.hp=Math.min(p.hp+Math.round(p.maxHp*0.02),p.maxHp);}
if(perks.indexOf('lightning')>=0){var chainDmg=Math.round(p.dmg*2);var chainRange=80;for(var li=0;li<enemies.length&&li<3;li++){var le=enemies[li];if(le&&dist({x:e.x,y:e.y},le)<chainRange){hitEnemy(le,chainDmg,null);dmgNums.push({x:le.x,y:le.y-le.r,val:chainDmg,life:20,color:'#4af'});}}}
if(perks.indexOf('adrenaline')>=0){p.adrenalineT=120;}
for(var i=0;i<3;i++){particles.push({x:e.x,y:e.y,vx:rng(-2,2),vy:rng(-2,2),life:15,color:e.color,r:2});}}

// Explosions
function addExplosion(x,y,r,dmg){explosions.push({x:x,y:y,r:0,maxR:r,dmg:dmg,life:12});
for(var i=0;i<enemies.length;i++){if(dist({x:x,y:y},enemies[i])<r+enemies[i].r){hitEnemy(enemies[i],dmg,null);}}}
// Enemy update
function updateEnemies(){
for(var i=enemies.length-1;i>=0;i--){var e=enemies[i];
if(e.flash>0)e.flash--;
if(e.burnT&&e.burnT>0){e.burnT--;if(frame%20===0){e.hp-=2;dmgNums.push({x:e.x,y:e.y-5,val:2,life:20,color:'#f80'});
if(e.hp<=0){killEnemy(e);continue;}}}
var a=Math.atan2(p.y-e.y,p.x-e.x);
e.x+=Math.cos(a)*e.spd;e.y+=Math.sin(a)*e.spd;
e.x=Math.max(e.r,Math.min(ARENA_W-e.r,e.x));
e.y=Math.max(e.r,Math.min(ARENA_H-e.r,e.y));
// Toxic trail
if(e.type==='toxic'&&frame%30===0){particles.push({x:e.x,y:e.y,vx:0,vy:0,life:90,color:'#0a0',r:8,poison:1});}
// Ghost teleport
if(e.type==='ghost'){e.teleTimer--;if(e.teleTimer<=0){var ta=rng(0,Math.PI*2),td=rng(30,60);e.x+=Math.cos(ta)*td;e.y+=Math.sin(ta)*td;e.x=Math.max(e.r,Math.min(ARENA_W-e.r,e.x));e.y=Math.max(e.r,Math.min(ARENA_H-e.r,e.y));e.teleTimer=ri(50,100);for(var ti=0;ti<5;ti++){particles.push({x:e.x,y:e.y,vx:rng(-1,1),vy:rng(-1,1),life:15,color:'#0ff',r:2});}}}
// Tank stomp
if(e.type==='tank'&&dist(e,p)<e.r+p.r+5&&frame%60===0){for(var si=0;si<8;si++){particles.push({x:e.x,y:e.y,vx:Math.cos(si*0.785)*2,vy:Math.sin(si*0.785)*2,life:20,color:'#80f',r:3});}}
// Hit player
if(dist(e,p)<e.r+p.r&&p.invT<=0){
if(Math.random()<p.dodge){dmgNums.push({x:p.x,y:p.y-12,val:'DODGE',life:25,color:'#0ff'});continue;}
damagePlayer(e.dmg);}
// Fire aura perk
if(perks.indexOf('fire')>=0&&dist(e,p)<40){if(frame%30===0){hitEnemy(e,3,null);}}
if(perks.indexOf('freezeAura')>=0&&dist(e,p)<50){e.slowT=Math.max(e.slowT||0,30);e.slowMult=0.5;}}}

// Damage player
function damagePlayer(dmg){
if(p.sh>0){var absorbed=Math.min(p.sh,dmg);p.sh-=absorbed;dmg-=absorbed;}
p.hp-=dmg;p.invT=30;
dmgNums.push({x:p.x,y:p.y-15,val:dmg,life:25,color:'#f44'});
if(p.hp<=0){
if(p.lives>1){p.lives--;p.hp=p.maxHp;p.sh=p.maxSh;p.invT=90;
dmgNums.push({x:p.x,y:p.y-25,val:'REVIVE!',life:50,color:'#0f0'});}
else{state='gameover';}}}
// Poison pools damage
function checkPoison(){
for(var i=particles.length-1;i>=0;i--){var pp=particles[i];
if(pp.poison&&dist(p,pp)<pp.r&&p.invT<=0&&frame%20===0){damagePlayer(2);}}}
// Round management
function updateRound(){
if(enemies.length===0&&waveSpawned){
roundClear=true;waveSpawned=false;roundTimer=90;
if(round%2===0&&Math.random()<(perks.indexOf('treasure')>=0?0.95:0.8)){
chests.push({x:rng(50,ARENA_W-50),y:rng(50,ARENA_H-50),glow:0});}
if(round===20){state='victory';return;}}
if(roundClear){roundTimer--;if(roundTimer<=0){round++;roundClear=false;spawnWave();}}}

// Update particles, effects
function updateEffects(){
for(var i=particles.length-1;i>=0;i--){var pp=particles[i];
if(pp.vx!==undefined){pp.x+=pp.vx;pp.y+=pp.vy;}pp.life--;if(pp.life<=0)particles.splice(i,1);}
for(var i=explosions.length-1;i>=0;i--){var ex=explosions[i];
ex.r=ex.maxR*(1-ex.life/12);ex.life--;if(ex.life<=0)explosions.splice(i,1);}
for(var i=dmgNums.length-1;i>=0;i--){dmgNums[i].y-=0.5;dmgNums[i].life--;if(dmgNums[i].life<=0)dmgNums.splice(i,1);}
for(var i=drops.length-1;i>=0;i--){drops[i].glow=(drops[i].glow+0.05)%(Math.PI*2);}
for(var i=chests.length-1;i>=0;i--){chests[i].glow=(chests[i].glow+0.03)%(Math.PI*2);}}
// Main update
function update(){
if(state!=='play'||pauseGame||upgradeUI||perkUI)return;
frame++;updatePlayer();updateBullets();updateEnemies();checkPoison();updateRound();updateEffects();
camX=p.x-W/2;camY=p.y-H/2;
camX=Math.max(0,Math.min(ARENA_W-W,camX));
camY=Math.max(0,Math.min(ARENA_H-H,camY));}

// Drawing functions
function drawArena(){
X.fillStyle='#1a1a2e';X.fillRect(0,0,W,H);
// Grid
X.strokeStyle='#252540';X.lineWidth=1;
var gs=40;
for(var gx=(-camX%gs);gx<W;gx+=gs){X.beginPath();X.moveTo(gx,0);X.lineTo(gx,H);X.stroke();}
for(var gy=(-camY%gs);gy<H;gy+=gs){X.beginPath();X.moveTo(0,gy);X.lineTo(W,gy);X.stroke();}
// Arena border
X.strokeStyle='#FE5000';X.lineWidth=2;
X.strokeRect(-camX,-camY,ARENA_W,ARENA_H);}
// Draw ghost player
function drawPlayer(){
var sx=p.x-camX,sy=p.y-camY;
if(p.invT>0&&frame%4<2)return;
X.save();X.translate(sx,sy);
// Ghost body - sheet ghost from above
X.fillStyle='#e8e8f0';X.beginPath();
X.arc(0,-2,8,Math.PI,0);X.lineTo(8,4);
X.lineTo(5,2);X.lineTo(3,6);X.lineTo(0,3);X.lineTo(-3,6);X.lineTo(-5,2);X.lineTo(-8,4);
X.closePath();X.fill();X.strokeStyle='#bbb';X.lineWidth=0.5;X.stroke();

// 3D glasses - red and blue lenses
X.fillStyle='#333';X.fillRect(-7,-5,14,3);
X.fillStyle='#e00';X.fillRect(-7,-5,6,3);
X.fillStyle='#00e';X.fillRect(1,-5,6,3);
X.strokeStyle='#222';X.lineWidth=0.5;X.strokeRect(-7,-5,6,3);X.strokeRect(1,-5,6,3);
X.restore();}
// Draw enemies
function drawEnemies(){
for(var i=0;i<enemies.length;i++){var e=enemies[i];
var sx=e.x-camX,sy=e.y-camY;
if(sx<-20||sx>W+20||sy<-20||sy>H+20)continue;
X.fillStyle=e.flash>0?'#fff':e.color;
if(e.type==='ghost'){X.globalAlpha=0.4+Math.sin(frame*0.15)*0.3;}
if(e.type==='tank'){X.save();X.strokeStyle='#60c';X.lineWidth=2;X.beginPath();X.arc(sx,sy,e.r+3,0,Math.PI*2);X.stroke();X.restore();}
if(e.type==='boss'){X.beginPath();X.arc(sx,sy,e.r,0,Math.PI*2);X.fill();
X.fillStyle='#800';X.beginPath();X.arc(sx-5,sy-4,3,0,Math.PI*2);X.fill();
X.beginPath();X.arc(sx+5,sy-4,3,0,Math.PI*2);X.fill();
X.fillStyle='#ff0';X.beginPath();X.arc(sx-5,sy-4,1.5,0,Math.PI*2);X.fill();
X.beginPath();X.arc(sx+5,sy-4,1.5,0,Math.PI*2);X.fill();}
else{X.beginPath();X.arc(sx,sy,e.r,0,Math.PI*2);X.fill();}
// HP bar
if(e.hp<e.maxHp){var bw=e.r*2;X.fillStyle='#400';X.fillRect(sx-bw/2,sy-e.r-5,bw,3);
X.fillStyle='#f00';X.fillRect(sx-bw/2,sy-e.r-5,bw*(e.hp/e.maxHp),3);}
X.globalAlpha=1;}}

// Draw bullets
function drawBullets(){
for(var i=0;i<bullets.length;i++){var b=bullets[i];
var sx=b.x-camX,sy=b.y-camY;
X.fillStyle=b.color;X.beginPath();X.arc(sx,sy,b.r,0,Math.PI*2);X.fill();}}
// Draw XP orbs
function drawXP(){
for(var i=0;i<xpOrbs.length;i++){var o=xpOrbs[i];
var sx=o.x-camX,sy=o.y-camY;
X.fillStyle='#48f';X.globalAlpha=0.8;X.beginPath();X.arc(sx,sy,3,0,Math.PI*2);X.fill();X.globalAlpha=1;}}
// Draw drops
function drawDrops(){
for(var i=0;i<drops.length;i++){var d=drops[i];
var sx=d.x-camX,sy=d.y-camY;
var glow=0.5+Math.sin(d.glow)*0.3;
if(d.type==='weapon'){
X.fillStyle=RARITY_CLR[d.gun.rarity];X.globalAlpha=glow;
X.fillRect(sx-8,sy-5,16,10);X.globalAlpha=1;
X.strokeStyle=RARITY_CLR[d.gun.rarity];X.strokeRect(sx-8,sy-5,16,10);
X.fillStyle='#fff';X.font='6px sans-serif';X.fillText(d.gun.name.substr(0,6),sx-7,sy+3);}
else if(d.type==='health'){X.fillStyle='#f44';X.globalAlpha=glow;
X.fillRect(sx-3,sy-5,6,10);X.fillRect(sx-5,sy-3,10,6);X.globalAlpha=1;}
else{X.fillStyle='#48f';X.globalAlpha=glow;X.beginPath();X.arc(sx,sy,5,0,Math.PI*2);X.fill();X.globalAlpha=1;}}}

// Draw chests
function drawChests(){
for(var i=0;i<chests.length;i++){var c=chests[i];
var sx=c.x-camX,sy=c.y-camY;var glow=0.6+Math.sin(c.glow)*0.4;
X.fillStyle='#a60';X.globalAlpha=glow;X.fillRect(sx-7,sy-5,14,10);
X.fillStyle='#fc0';X.fillRect(sx-2,sy-2,4,4);X.globalAlpha=1;
X.strokeStyle='#840';X.strokeRect(sx-7,sy-5,14,10);}}
// Draw particles and explosions
function drawEffects(){
for(var i=0;i<particles.length;i++){var pp=particles[i];
if(pp.x2!==undefined){X.strokeStyle=pp.color;X.lineWidth=2;X.globalAlpha=pp.life/8;
X.beginPath();X.moveTo(pp.x-camX,pp.y-camY);X.lineTo(pp.x2-camX,pp.y2-camY);X.stroke();X.globalAlpha=1;}
else if(pp.poison){X.fillStyle=pp.color;X.globalAlpha=pp.life/90*0.3;
X.beginPath();X.arc(pp.x-camX,pp.y-camY,pp.r,0,Math.PI*2);X.fill();X.globalAlpha=1;}
else{X.fillStyle=pp.color;X.globalAlpha=pp.life/15;
X.beginPath();X.arc(pp.x-camX,pp.y-camY,pp.r||1,0,Math.PI*2);X.fill();X.globalAlpha=1;}}
for(var i=0;i<explosions.length;i++){var ex=explosions[i];
X.strokeStyle='#fa0';X.lineWidth=2;X.globalAlpha=ex.life/12;
X.beginPath();X.arc(ex.x-camX,ex.y-camY,ex.r,0,Math.PI*2);X.stroke();X.globalAlpha=1;}}

// Draw damage numbers
function drawDmgNums(){
for(var i=0;i<dmgNums.length;i++){var d=dmgNums[i];
X.fillStyle=d.color;X.globalAlpha=d.life/30;X.font='bold 8px sans-serif';
X.fillText(''+d.val,d.x-camX-5,d.y-camY);X.globalAlpha=1;}}
// Draw HUD
function drawHUD(){
// Health bar
X.fillStyle='#400';X.fillRect(4,4,80,8);
X.fillStyle='#f00';X.fillRect(4,4,80*(p.hp/p.maxHp),8);
X.strokeStyle='#800';X.strokeRect(4,4,80,8);
X.fillStyle='#fff';X.font='6px sans-serif';X.fillText('HP:'+Math.ceil(p.hp)+'/'+p.maxHp,6,11);
// Shield bar
X.fillStyle='#004';X.fillRect(4,14,80,6);
X.fillStyle='#48f';X.fillRect(4,14,80*(p.sh/p.maxSh),6);
// XP bar
X.fillStyle='#220';X.fillRect(4,22,80,5);
X.fillStyle='#ff0';X.fillRect(4,22,80*(p.xp/p.xpReq),5);
// Level
X.fillStyle='#fff';X.font='bold 7px sans-serif';
X.fillText('Lv.'+p.lvl,88,11);
// Round
X.fillText('R:'+round,88,20);
// Lives
X.fillStyle=p.lives>1?'#0f0':'#f44';X.fillText('x'+p.lives,88,28);

// Weapon info
var gun=p.guns[p.curGun];
if(gun){
X.fillStyle=RARITY_CLR[gun.rarity];X.font='bold 7px sans-serif';
X.fillText(gun.name,130,10);
X.fillStyle='#fff';X.font='6px sans-serif';
X.fillText(RARITY[gun.rarity]+' DMG:'+gun.dmg,130,19);
if(gun.element){X.fillStyle=gun.elemColor||'#fff';X.fillText(gun.element,130,33);}
if(gun.bonus){X.fillStyle='#ff0';X.fillText(gun.bonus,130,gun.element?45:33);}
X.fillText('Ammo:'+gun.ammo+'/'+gun.mag,130,27);
if(gun.reloading>0){X.fillStyle='#fa0';X.fillText('RELOADING',130,35);}}
// Second gun indicator
if(p.guns[1]){var g2=p.guns[p.curGun===0?1:0];
X.fillStyle='#666';X.font='5px sans-serif';X.fillText('['+g2.name+']',130,42);}
// Pause button
X.fillStyle='#888';X.font='8px sans-serif';X.fillText('||',225,12);
// Interaction prompt
if(nearItem){X.fillStyle='#FE5000';X.font='bold 8px sans-serif';
var txt=nearItem.type==='weapon'?'TAP: Switch':'TAP: Pick Up';
X.fillText(txt,W/2-25,H/2+30);}
// Round clear text
if(roundClear&&roundTimer>0){X.fillStyle='#FE5000';X.font='bold 10px sans-serif';
X.textAlign='center';X.fillText('ROUND '+round+' CLEAR!',W/2,H/2-20);X.textAlign='left';}
}

// Draw joystick
function drawJoystick(){
if(!joy.active){
X.globalAlpha=0.3;X.strokeStyle='#fff';X.lineWidth=1;
X.beginPath();X.arc(45,248,22,0,Math.PI*2);X.stroke();
X.beginPath();X.arc(45,248,6,0,Math.PI*2);X.fill();X.globalAlpha=1;return;}
X.globalAlpha=0.4;X.strokeStyle='#FE5000';X.lineWidth=2;
X.beginPath();X.arc(joy.sx,joy.sy,25,0,Math.PI*2);X.stroke();
X.fillStyle='#FE5000';X.beginPath();X.arc(joy.cx,joy.cy,8,0,Math.PI*2);X.fill();
X.globalAlpha=1;}
// Draw swap button with circular arrows
function drawSwapBtn(){
if(!p.guns[1])return;
X.globalAlpha=0.4;X.strokeStyle='#FE5000';X.lineWidth=2;
X.beginPath();X.arc(swapBtn.x,swapBtn.y,swapBtn.r,0,Math.PI*2);X.stroke();
// Circular arrows
X.lineWidth=1.5;
X.beginPath();X.arc(swapBtn.x,swapBtn.y,9,0.3,2.5);X.stroke();
X.beginPath();X.arc(swapBtn.x,swapBtn.y,9,3.4,5.6);X.stroke();
// Arrow heads
var ax=swapBtn.x+9*Math.cos(2.5),ay=swapBtn.y+9*Math.sin(2.5);
X.beginPath();X.moveTo(ax,ay);X.lineTo(ax+4,ay-1);X.lineTo(ax+1,ay+3);X.fill();
ax=swapBtn.x+9*Math.cos(5.6);ay=swapBtn.y+9*Math.sin(5.6);
X.beginPath();X.moveTo(ax,ay);X.lineTo(ax-4,ay+1);X.lineTo(ax-1,ay-3);X.fill();
X.globalAlpha=1;}

// Title screen
function drawTitle(){
X.fillStyle='#0a0a1a';X.fillRect(0,0,W,H);
// Ghost logo
X.save();X.translate(W/2,100);
X.fillStyle='#e8e8f0';X.beginPath();X.arc(0,-4,20,Math.PI,0);
X.lineTo(20,10);X.lineTo(13,6);X.lineTo(8,14);X.lineTo(0,8);X.lineTo(-8,14);X.lineTo(-13,6);X.lineTo(-20,10);
X.closePath();X.fill();X.strokeStyle='#bbb';X.lineWidth=1;X.stroke();
// 3D glasses on logo
X.fillStyle='#333';X.fillRect(-16,-10,32,7);
X.fillStyle='#e00';X.fillRect(-16,-10,14,7);X.fillStyle='#00e';X.fillRect(2,-10,14,7);
X.strokeStyle='#222';X.lineWidth=0.5;X.strokeRect(-16,-10,14,7);X.strokeRect(2,-10,14,7);
X.restore();
// Title
X.fillStyle='#FE5000';X.font='bold 14px sans-serif';X.textAlign='center';
X.fillText("Ghost's Rogue",W/2,155);X.fillText('Adventure',W/2,172);
X.fillStyle='#fff';X.font='9px sans-serif';
X.fillText('TAP TO START',W/2,210);
X.fillStyle='#888';X.font='7px sans-serif';
X.fillText('Created by Jeff Hollaway',W/2,250);
X.fillText('[GhostLegacyX]',W/2,262);
X.textAlign='left';}

// Game over screen
function drawGameOver(){
X.fillStyle='rgba(0,0,0,0.8)';X.fillRect(0,0,W,H);
X.fillStyle='#f44';X.font='bold 16px sans-serif';X.textAlign='center';
X.fillText('GAME OVER',W/2,80);
X.fillStyle='#fff';X.font='10px sans-serif';
X.fillText("Ghost's Rogue Adventure",W/2,110);
X.fillText('Round: '+round,W/2,140);X.fillText('Level: '+p.lvl,W/2,158);
X.fillStyle='#FE5000';X.font='9px sans-serif';X.fillText('TAP TO RESTART',W/2,200);
X.fillStyle='#888';X.font='7px sans-serif';X.fillText('Created by Jeff Hollaway [GhostLegacyX]',W/2,260);
X.textAlign='left';}
// Victory screen
function drawVictory(){
X.fillStyle='rgba(0,0,0,0.8)';X.fillRect(0,0,W,H);
X.fillStyle='#fa0';X.font='bold 16px sans-serif';X.textAlign='center';
X.fillText('VICTORY!',W/2,70);
X.fillStyle='#FE5000';X.font='10px sans-serif';
X.fillText("Ghost's Rogue Adventure",W/2,95);
X.fillStyle='#fff';X.font='9px sans-serif';
X.fillText('Boss Defeated!',W/2,125);
X.fillText('Level: '+p.lvl,W/2,145);
X.fillStyle='#FE5000';X.fillText('TAP TO CONTINUE',W/2,200);
X.fillStyle='#888';X.font='7px sans-serif';X.fillText('Created by Jeff Hollaway [GhostLegacyX]',W/2,260);
X.textAlign='left';}

// Upgrade UI
function drawUpgradeUI(){
X.fillStyle='rgba(0,0,0,0.85)';X.fillRect(0,0,W,H);
X.fillStyle='#FE5000';X.font='bold 11px sans-serif';X.textAlign='center';
X.fillText('LEVEL UP!',W/2,50);
X.fillStyle='#fff';X.font='8px sans-serif';
X.fillText('Choose an upgrade ('+p.upgPts+' pts)',W/2,70);
var allUpgrades=[{n:'+ MAX HP',d:'+8 HP',c:'#f44',id:'hp'},{n:'+ SPEED',d:'+0.08 SPD',c:'#4f4',id:'spd'},
{n:'+ DODGE',d:'+2% Dodge',c:'#4ff',id:'dodge'},{n:'+ DAMAGE',d:'+0.5 DMG',c:'#fa0',id:'dmg'},
{n:'+ SHIELD',d:'+5 Shield',c:'#48f',id:'shield'},{n:'+ CRIT %',d:'+3% Crit',c:'#ff0',id:'crit'},
{n:'+ CRIT DMG',d:'+0.2x Crit',c:'#f80',id:'critdmg'},{n:'+ ARMOR',d:'+5% Reduce',c:'#888',id:'armor'},
{n:'+ MAGNET',d:'+15 Range',c:'#af0',id:'magnet'},{n:'+ RELOAD',d:'+10% Reload',c:'#0af',id:'reload'},
{n:'+ HP REGEN',d:'+0.3/s Heal',c:'#f4a',id:'hpregen'},{n:'+ LUCK',d:'+3% Luck',c:'#ff0',id:'luck'}];
if(!curUpgradeOpts||curUpgradeOpts.length===0){var pool=allUpgrades.slice();curUpgradeOpts=[];for(var ui=0;ui<4&&pool.length>0;ui++){var uidx=ri(0,pool.length-1);curUpgradeOpts.push(pool[uidx]);pool.splice(uidx,1);}}
var opts=curUpgradeOpts;
for(var i=0;i<opts.length;i++){var by=100+i*35;
X.fillStyle='#222';X.fillRect(30,by,180,28);
X.strokeStyle=opts[i].c;X.strokeRect(30,by,180,28);
X.fillStyle=opts[i].c;X.font='bold 8px sans-serif';X.fillText(opts[i].n,W/2,by+12);
X.fillStyle='#aaa';X.font='7px sans-serif';X.fillText(opts[i].d,W/2,by+23);}
X.textAlign='left';}
// Perk UI
function drawPerkUI(){
X.fillStyle='rgba(0,0,0,0.85)';X.fillRect(0,0,W,H);
X.fillStyle='#FE5000';X.font='bold 11px sans-serif';X.textAlign='center';
X.fillText('CHOOSE A PERK!',W/2,60);
for(var i=0;i<selectedPerks.length;i++){var by=90+i*50;
X.fillStyle='#222';X.fillRect(20,by,200,40);X.strokeStyle='#FE5000';X.strokeRect(20,by,200,40);
X.fillStyle='#fff';X.font='bold 8px sans-serif';X.fillText(selectedPerks[i].name,W/2,by+16);
X.fillStyle='#aaa';X.font='7px sans-serif';X.fillText(selectedPerks[i].desc,W/2,by+32);}
X.textAlign='left';}

// Pause screen
function drawPause(){
X.fillStyle='rgba(0,0,0,0.7)';X.fillRect(0,0,W,H);
X.fillStyle='#FE5000';X.font='bold 14px sans-serif';X.textAlign='center';
X.fillText("Ghost's Rogue Adventure",W/2,100);
X.fillStyle='#fff';X.font='bold 12px sans-serif';
X.fillText('PAUSED',W/2,140);
X.fillStyle='#aaa';X.font='8px sans-serif';
X.fillText('Tap to resume',W/2,170);
X.textAlign='left';}
// Near item weapon popup
function drawItemPopup(){
if(!nearItem||nearItem.type!=='weapon')return;
var g=nearItem.gun;var sx=nearItem.x-camX,sy=nearItem.y-camY-20;
X.fillStyle='rgba(0,0,0,0.8)';X.fillRect(sx-35,sy-28,70,26);
X.strokeStyle=RARITY_CLR[g.rarity];X.strokeRect(sx-35,sy-28,70,26);
X.fillStyle=RARITY_CLR[g.rarity];X.font='bold 6px sans-serif';X.textAlign='center';
X.fillText(RARITY[g.rarity]+' '+g.name,sx,sy-18);
X.fillStyle='#fff';X.font='5px sans-serif';
X.fillText('DMG:'+g.dmg+' Rate:'+g.rate+' Mag:'+g.mag,sx,sy-8);
X.textAlign='left';}

// Main draw
function draw(){
if(state==='title'){drawTitle();return;}
if(state==='gameover'){drawGameOver();return;}
if(state==='victory'){drawVictory();return;}
// Play state
drawArena();
drawXP();drawDrops();drawChests();drawEffects();drawBullets();drawEnemies();
drawPlayer();drawDmgNums();drawItemPopup();
drawHUD();drawJoystick();drawSwapBtn();
if(upgradeUI)drawUpgradeUI();
if(perkUI)drawPerkUI();
if(pauseGame)drawPause();}
// Game loop
function gameLoop(){update();draw();requestAnimationFrame(gameLoop);}
gameLoop();
})();
