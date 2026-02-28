f=open('app.js','r')
c=f.read()
f.close()
# 1a: Enemy count scaling after round 6
c=c.replace('var count=5+round*2+ri(0,round);','var count=5+round*2+ri(0,round);if(round>6){count=Math.floor(count*Math.pow(1.25,round-6));}')
# 1b: Enemy HP scaling after round 6
c=c.replace('hp*=(1+Math.floor(round/2)*0.15);','hp*=(1+Math.floor(round/2)*0.15);if(round>6){hp=Math.floor(hp*Math.pow(1.3,round-6));}')
# 2a: Reduce health drop rate 0.08 -> 0.02
c=c.replace('Math.random()<0.08+(p.luck||0)','Math.random()<0.02+(p.luck||0)*0.3')
# 2b: Reduce weapon drops
c=c.replace("wdc=e.type==='boss'?0.25:e.type==='mini'?0.15:0.08","wdc=e.type==='boss'?0.15:e.type==='mini'?0.08:0.02")
# 2c: Reduce chest drops
c=c.replace("cdc=e.type==='boss'?0.20:0.05","cdc=e.type==='boss'?0.10:0.01")
# 2d: Reduce XP orb values
c=c.replace("xpOrbs.push({x:e.x,y:e.y,val:e.type==='boss'?50:e.type==='mini'?20:5+round","xpOrbs.push({x:e.x,y:e.y,val:e.type==='boss'?30:e.type==='mini'?12:3+Math.floor(round/2)")
# 3: Steeper XP curve
c=c.replace('p.xpReq=Math.floor(20*Math.pow(1.12,p.lvl-1)+3*(p.lvl-1));','p.xpReq=Math.floor(30*Math.pow(1.25,p.lvl-1)+8*(p.lvl-1)*(p.lvl-1));')
c=c.replace('xpReq:20,','xpReq:30,')
# 5: Boss harder - HP, speed, dmg, radius
c=c.replace("type==='boss'?300+round*20:0","type==='boss'?800+round*50:0")
c=c.replace("type==='boss'?0.5:type==='mini'","type==='boss'?0.8:type==='mini'")
c=c.replace("type==='boss'?15:type==='mini'?8","type==='boss'?25:type==='mini'?8")
c=c.replace("type==='boss'?18:type==='mini'?12","type==='boss'?22:type==='mini'?12")
# 6a: Add enemyBullets array
c=c.replace('var enemies=[],bullets=[],xpOrbs=[],drops=[],chests=[],explosions=[],dmgNums=[],particles=[];','var enemies=[],bullets=[],xpOrbs=[],drops=[],chests=[],explosions=[],dmgNums=[],particles=[],enemyBullets=[];')
# 6b: Reset enemyBullets
c=c.replace('round=1;enemies=[];bullets=[];xpOrbs=[];drops=[];chests=[];','round=1;enemies=[];bullets=[];xpOrbs=[];drops=[];chests=[];enemyBullets=[];')
# 6c: Add shootTimer to enemy
c=c.replace('atkTimer:0,poisonTimer:0,','atkTimer:0,shootTimer:0,poisonTimer:0,')
# 6d: Add shooting logic in updateEnemies after movement
old='e.x+=Math.cos(a)*e.spd;e.y+=Math.sin(a)*e.spd;'
new="e.x+=Math.cos(a)*e.spd;e.y+=Math.sin(a)*e.spd;if((e.type==='boss'||e.type==='tank'||e.type==='mini')&&e.shootTimer<=0){var ba=Math.atan2(p.y-e.y,p.x-e.x);enemyBullets.push({x:e.x,y:e.y,vx:Math.cos(ba)*1.5,vy:Math.sin(ba)*1.5,dmg:e.type==='boss'?12:e.type==='tank'?6:4,life:180,r:e.type==='boss'?5:3,color:e.type==='boss'?'#ff4444':'#ff8800'});e.shootTimer=e.type==='boss'?60:90;}else{e.shootTimer--;}"
c=c.replace(old,new)
# 6e: Add updateEnemyBullets function before main update comment
ebFunc='function updateEnemyBullets(){for(var i=enemyBullets.length-1;i>=0;i--){var eb=enemyBullets[i];eb.x+=eb.vx;eb.y+=eb.vy;eb.life--;if(eb.life<=0||eb.x<0||eb.x>ARENA_W||eb.y<0||eb.y>ARENA_H){enemyBullets.splice(i,1);continue;}var dx=eb.x-p.x,dy=eb.y-p.y,dd=Math.sqrt(dx*dx+dy*dy);if(dd<eb.r+p.r&&p.invT<=0){damagePlayer(eb.dmg);enemyBullets.splice(i,1);}}}\n'
c=c.replace('// Main update',ebFunc+'// Main update')
# 6f: Call updateEnemyBullets in update loop
c=c.replace('updateEnemies();checkPoison();','updateEnemies();updateEnemyBullets();checkPoison();')
# 6g: Add drawEnemyBullets function
ebDraw="function drawEnemyBullets(){for(var i=0;i<enemyBullets.length;i++){var eb=enemyBullets[i];X.save();X.translate(eb.x-camX,eb.y-camY);X.fillStyle=eb.color;X.shadowColor=eb.color;X.shadowBlur=8;X.beginPath();X.arc(0,0,eb.r,0,Math.PI*2);X.fill();X.shadowBlur=0;X.restore();}}\n"
c=c.replace('// Drawing functions',ebDraw+'// Drawing functions')
# 6h: Call drawEnemyBullets in draw loop
c=c.replace('drawBullets();drawEnemies();','drawBullets();drawEnemyBullets();drawEnemies();')

# Write changes
f=open('app.js','w')
f.write(c)
f.close()
print('All 6 balance changes applied successfully!')
