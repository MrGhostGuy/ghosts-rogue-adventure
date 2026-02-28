$f = "app.js"
$c = Get-Content $f -Raw

# ===== CHANGE 1: Increase enemy count & HP after round 5-6 =====
# Enemy count: was count=5+round*2+ri(0,round) -> add exponential scaling after round 6
$c = $c.Replace(
  'var count=5+round*2+ri(0,round);',
  'var count=5+round*2+ri(0,round);if(round>6){count=Math.floor(count*Math.pow(1.25,round-6));}'
)

# Enemy HP scaling: was hp*=(1+Math.floor(round/2)*0.15) -> much steeper after round 6
$c = $c.Replace(
  'hp*=(1+Math.floor(round/2)*0.15);',
  'hp*=(1+Math.floor(round/2)*0.15);if(round>6){hp=Math.floor(hp*Math.pow(1.3,round-6));}'
)

# ===== CHANGE 2: Reduce drop frequency =====
# Health drops: 0.08 -> 0.02
$c = $c.Replace(
  'Math.random()<0.08+(p.luck||0)',
  'Math.random()<0.02+(p.luck||0)*0.3'
)

# Weapon drops from boss 0.25, mini 0.15, regular 0.08 -> 0.15, 0.08, 0.02
$c = $c.Replace(
  "wdc=e.type==='boss'?0.25:e.type==='mini'?0.15:0.08",
  "wdc=e.type==='boss'?0.15:e.type==='mini'?0.08:0.02"
)

# Chest drops from boss 0.20, regular 0.05 -> 0.10, 0.01
$c = $c.Replace(
  "cdc=e.type==='boss'?0.20:0.05",
  "cdc=e.type==='boss'?0.10:0.01"
)

# Reduce XP orb values: boss 50->30, mini 20->12, regular 5+round -> 3+Math.floor(round/2)
$c = $c.Replace(
  "xpOrbs.push({x:e.x,y:e.y,val:e.type==='boss'?50:e.type==='mini'?20:5+round",
  "xpOrbs.push({x:e.x,y:e.y,val:e.type==='boss'?30:e.type==='mini'?12:3+Math.floor(round/2)"
)

# ===== CHANGE 3: Steeper XP scaling curve =====
$c = $c.Replace(
  'p.xpReq=Math.floor(20*Math.pow(1.12,p.lvl-1)+3*(p.lvl-1));',
  'p.xpReq=Math.floor(30*Math.pow(1.25,p.lvl-1)+8*(p.lvl-1)*(p.lvl-1));'
)
# Also fix the initial xpReq in reset
$c = $c.Replace('xpReq:20,', 'xpReq:30,')

# ===== CHANGE 4: Perk every 5 levels (already p.lvl%5===0, verify) =====
# Already implemented as if(p.lvl%5===0) - no change needed

# ===== CHANGE 5: Make boss significantly harder =====
# Boss HP: 300+round*20 -> 800+round*50
$c = $c.Replace(
  "type==='boss'?300+round*20:0",
  "type==='boss'?800+round*50:0"
)
# Boss speed: 0.5 -> 0.8
$c = $c.Replace(
  "type==='boss'?0.5:type==='mini'",
  "type==='boss'?0.8:type==='mini'"
)
# Boss damage: 15 -> 25
$c = $c.Replace(
  "type==='boss'?15:type==='mini'?8",
  "type==='boss'?25:type==='mini'?8"
)
# Boss radius: 18 -> 22
$c = $c.Replace(
  "type==='boss'?18:type==='mini'?12",
  "type==='boss'?22:type==='mini'?12"
)

# ===== CHANGE 6: Add shooting enemy (bigger enemies shoot slow bullets) =====
# Add enemyBullets array to declarations
$c = $c.Replace(
  'var enemies=[],bullets=[],xpOrbs=[],drops=[],chests=[],explosions=[],dmgNums=[],particles=[];',
  'var enemies=[],bullets=[],xpOrbs=[],drops=[],chests=[],explosions=[],dmgNums=[],particles=[],enemyBullets=[];'
)

# Add enemyBullets=[] to reset
$c = $c.Replace(
  'round=1;enemies=[];bullets=[];xpOrbs=[];drops=[];chests=[];',
  'round=1;enemies=[];bullets=[];xpOrbs=[];drops=[];chests=[];enemyBullets=[];'
)

# Add shootTimer to enemy push (append after atkTimer:0)
$c = $c.Replace(
  'atkTimer:0,poisonTimer:0,',
  'atkTimer:0,shootTimer:0,poisonTimer:0,'
)

# Add shooting logic in updateEnemies - insert before the collision check
# Find the enemy movement line and add shooting after it
$old_move = "e.x+=Math.cos(a)*e.spd;e.y+=Math.sin(a)*e.spd;"
$shoot_logic = @"
e.x+=Math.cos(a)*e.spd;e.y+=Math.sin(a)*e.spd;
if((e.type==='boss'||e.type==='tank'||e.type==='mini')&&e.shootTimer<=0){var ba=Math.atan2(p.y-e.y,p.x-e.x);enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*1.5,vy:Math.sin(ba)*1.5,dmg:e.type==='boss'?12:e.type==='tank'?6:4,life:180,r:e.type==='boss'?5:3,color:e.type==='boss'?'#ff4444':'#ff8800'});e.shootTimer=e.type==='boss'?60:90;}else{e.shootTimer--;}
"@
$c = $c.Replace($old_move, $shoot_logic.Replace("`r`n","`n"))

# Add updateEnemyBullets function and call - insert before // Main update
$ebUpdate = @"
function updateEnemyBullets(){
for(var i=enemyBullets.length-1;i>=0;i--){var eb=enemyBullets[i];eb.x+=eb.vx;eb.y+=eb.vy;eb.life--;
if(eb.life<=0||eb.x<0||eb.x>ARENA_W||eb.y<0||eb.y>ARENA_H){enemyBullets.splice(i,1);continue;}
var dx=eb.x-p.x,dy=eb.y-p.y,dd=Math.sqrt(dx*dx+dy*dy);
if(dd<eb.r+p.r&&p.invT<=0){damagePlayer(eb.dmg);enemyBullets.splice(i,1);}}}
"@
$c = $c.Replace('// Main update', ($ebUpdate.Replace("`r`n","`n") + "`n// Main update"))

# Add updateEnemyBullets() to main update loop
$c = $c.Replace(
  'updateEnemies();checkPoison();',
  'updateEnemies();updateEnemyBullets();checkPoison();'
)

# Add drawEnemyBullets function before // Drawing functions... actually before function drawArena
$ebDraw = @"
function drawEnemyBullets(){
for(var i=0;i<enemyBullets.length;i++){var eb=enemyBullets[i];X.save();X.translate(eb.x-camX,eb.y-camY);
X.fillStyle=eb.color;X.shadowColor=eb.color;X.shadowBlur=8;X.beginPath();X.arc(0,0,eb.r,0,Math.PI*2);X.fill();
X.shadowBlur=0;X.restore();}}
"@
$c = $c.Replace('// Drawing functions', ($ebDraw.Replace("`r`n","`n") + "`n// Drawing functions"))

# Add drawEnemyBullets() to main draw loop
$c = $c.Replace(
  'drawBullets();drawEnemies();',
  'drawBullets();drawEnemyBullets();drawEnemies();'
)

# Write the modified content back
Set-Content $f -Value $c -NoNewline
Write-Host "All 6 balance changes applied successfully!"
