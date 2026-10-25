(() => {
'use strict';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false});
const scoreEl=document.getElementById('score'),bestEl=document.getElementById('best'),sensorStatus=document.getElementById('sensor-status');
const startScreen=document.getElementById('start-screen'),gameOver=document.getElementById('game-over'),touchControls=document.getElementById('touch-controls');
const saveStatus=document.getElementById('save-status');
const cfg=window.POU_SUPABASE_CONFIG||{};
let supabaseClient=null;
if(window.supabase?.createClient && cfg.url && cfg.anonKey){try{supabaseClient=window.supabase.createClient(cfg.url,cfg.anonKey,{auth:{persistSession:false,autoRefreshToken:false}})}catch(e){console.warn('Supabase no configurado:',e)}}
const W=360,H=640,POOL=24,PARTICLES=30;
let dpr=1,scale=1,offsetX=0,offsetY=0,lastTime=0,elapsed=0,running=false,ended=false,score=0,best=Number(localStorage.getItem('pou-best')||0);
bestEl.textContent=best;
const player={x:180,y:480,vx:0,vy:0,r:19,squash:0,stretch:0};
const platforms=Array.from({length:POOL},(_,i)=>({x:0,y:0,w:0,h:9,active:false,type:0}));
const particles=Array.from({length:PARTICLES},()=>({x:0,y:0,vx:0,vy:0,life:0,max:1,size:2,active:false}));
let targetTilt=0,filteredTilt=0,lastSensorTime=0,sensorEnabled=false,touchDir=0,worldScroll=0;
function resize(){const r=canvas.getBoundingClientRect();dpr=Math.min(window.devicePixelRatio||1,1.6);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));scale=Math.min(canvas.width/W,canvas.height/H);offsetX=(canvas.width-W*scale)/2;offsetY=(canvas.height-H*scale)/2}
window.addEventListener('resize',resize,{passive:true});resize();
function rand(a,b){return a+Math.random()*(b-a)}
function reset(){score=0;elapsed=0;worldScroll=0;player.x=W/2;player.y=H*.67;player.vx=0;player.vy=-470;player.squash=0;player.stretch=0;platforms.forEach((p,i)=>{p.active=true;p.x=i===0?W/2-43:rand(8,W-72);p.y=i===0?H*.78:H-i*27;p.w=rand(54,82);p.type=i%5===0?1:0});platforms[0].x=W/2-43;platforms[0].y=H*.78;particles.forEach(p=>p.active=false);scoreEl.textContent='0';ended=false;running=true;lastTime=performance.now();startScreen.classList.add('hidden');gameOver.classList.add('hidden');requestAnimationFrame(loop)}
function emit(x,y,count=3){for(let n=0;n<count;n++){let p=particles.find(q=>!q.active);if(!p)p=particles[(Math.random()*PARTICLES)|0];p.x=x;p.y=y;p.vx=rand(-75,75);p.vy=rand(25,110);p.life=p.max=rand(.18,.42);p.size=rand(1.5,3.5);p.active=true}}
function update(dt){elapsed+=dt;filteredTilt+=(targetTilt-filteredTilt)*(1-Math.exp(-dt*7));const tilt=sensorEnabled?filteredTilt:touchDir;
player.vx+=tilt*1250*dt;player.vx*=Math.pow(.91,dt*60);player.vx=Math.max(-300,Math.min(300,player.vx));player.x+=player.vx*dt;
if(player.x<-player.r)player.x=W+player.r;else if(player.x>W+player.r)player.x=-player.r;
const oldY=player.y;player.vy+=1050*dt;player.y+=player.vy*dt;
if(player.vy< -100){player.stretch=Math.min(1,(-player.vy-100)/500);if(Math.random()<dt*18)emit(player.x,player.y+player.r,1)}else player.stretch=Math.max(0,player.stretch-dt*3);
player.squash=Math.max(0,player.squash-dt*5);
if(player.y<H*.42 && player.vy<0){const shift=H*.42-player.y;player.y=H*.42;worldScroll+=shift;score+=shift*.12;platforms.forEach(p=>p.y+=shift)}
for(const p of platforms){if(!p.active)continue;if(player.vy>0&&oldY+player.r<=p.y+3&&player.y+player.r>=p.y&&player.x+player.r*.65>p.x&&player.x-player.r*.65<p.x+p.w){player.y=p.y-player.r;player.vy=p.type===1?-680:-590;player.squash=1;player.stretch=0;emit(player.x,player.y+player.r,7)}if(p.y>H+20){p.y=-rand(15,65);p.x=rand(4,W-p.w-4);p.w=rand(52,82);p.type=Math.random()<.17?1:0}}
for(const p of particles){if(!p.active)continue;p.life-=dt;if(p.life<=0){p.active=false;continue}p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=100*dt}
if(player.y-player.r>H+5)finish();
scoreEl.textContent=Math.floor(score).toString()
}
function draw(){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#24224a';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.setTransform(scale,0,0,scale,offsetX,offsetY);
const grad=ctx.createLinearGradient(0,0,0,H);grad.addColorStop(0,'#302c61');grad.addColorStop(1,'#17162f');ctx.fillStyle=grad;ctx.fillRect(0,0,W,H);
for(let i=0;i<32;i++){const x=(i*71+19)%W,y=(i*97+elapsed*12)%H;ctx.fillStyle='#ffffff22';ctx.fillRect(x,y,2,2)}
for(const p of platforms){if(!p.active)continue;ctx.fillStyle=p.type?'#ff9d7d':'#76e3c0';ctx.beginPath();ctx.roundRect(p.x,p.y,p.w,p.h,5);ctx.fill();ctx.fillStyle='#ffffff55';ctx.fillRect(p.x+6,p.y+2,p.w-12,2)}
for(const p of particles){if(!p.active)continue;ctx.globalAlpha=Math.max(0,p.life/p.max);ctx.fillStyle='#ffd166';ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);ctx.fill()}ctx.globalAlpha=1;
drawPou(player.x,player.y,player.r,player.squash,player.stretch);ctx.setTransform(1,0,0,1,0,0)}
function drawPou(x,y,r,squash,stretch){const sx=1+squash*.1-stretch*.07,sy=1-squash*.15+stretch*.2;ctx.save();ctx.translate(offsetX+x*scale,offsetY+y*scale);ctx.scale(scale*sx,scale*sy);ctx.translate(0,(y-(y))*0);
const rr=r;ctx.fillStyle='#00000030';ctx.beginPath();ctx.ellipse(0,rr+5,rr*.8,4,0,0,Math.PI*2);ctx.fill();
const g=ctx.createLinearGradient(-rr,-rr,rr,rr);g.addColorStop(0,'#e8ad73');g.addColorStop(.65,'#b87547');g.addColorStop(1,'#874b31');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(-rr*.92,rr*.7);ctx.quadraticCurveTo(-rr*1.25,-rr*.55,-rr*.45,-rr*.95);ctx.quadraticCurveTo(0,-rr*1.14,rr*.45,-rr*.95);ctx.quadraticCurveTo(rr*1.25,-rr*.55,rr*.92,rr*.7);ctx.quadraticCurveTo(rr*.6,rr*1.12,0,rr*1.04);ctx.quadraticCurveTo(-rr*.6,rr*1.12,-rr*.92,rr*.7);ctx.fill();ctx.strokeStyle='#f4c28b';ctx.lineWidth=2;ctx.stroke();
ctx.fillStyle='#fff4d9';ctx.beginPath();ctx.ellipse(-rr*.34,-rr*.15,rr*.18,rr*.24,0,0,Math.PI*2);ctx.ellipse(rr*.34,-rr*.15,rr*.18,rr*.24,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#34232a';ctx.beginPath();ctx.arc(-rr*.31,-rr*.1,rr*.08,0,Math.PI*2);ctx.arc(rr*.37,-rr*.1,rr*.08,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#60352f';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,rr*.18,rr*.25,.15,Math.PI-.15);ctx.stroke();ctx.restore()}
function loop(now){if(!running)return;const dt=Math.min(.032,(now-lastTime)/1000||0);lastTime=now;update(dt);draw();if(running)requestAnimationFrame(loop)}
async function saveHighScore(value){const row={score:Math.max(0,Math.floor(value)),device_info:(navigator.userAgent||'unknown').slice(0,240)};try{if(supabaseClient){const {error}=await supabaseClient.from('highscores').insert(row);if(error)throw error;return {saved:true,remote:true}}const key='pou-highscores';const data=JSON.parse(localStorage.getItem(key)||'[]');data.push({...row,created_at:new Date().toISOString()});data.sort((a,b)=>b.score-a.score);localStorage.setItem(key,JSON.stringify(data.slice(0,20)));return {saved:true,remote:false}}catch(e){console.warn('No se pudo guardar el récord:',e);return {saved:false,remote:false}}}
window.saveHighScore=saveHighScore;
async function finish(){if(ended)return;ended=true;running=false;gameOver.classList.remove('hidden');document.getElementById('final-score').textContent=Math.floor(score);saveStatus.textContent='Guardando récord…';const value=Math.floor(score);if(value>best){best=value;localStorage.setItem('pou-best',String(best));bestEl.textContent=best}const result=await saveHighScore(value);saveStatus.textContent=result.saved?(result.remote?'Récord guardado en línea.':'Récord guardado en este teléfono.'):'No se pudo guardar el récord; puedes seguir jugando.'}
function activateTouch(){touchControls.classList.remove('hidden');sensorStatus.textContent=sensorEnabled?'Sensor de inclinación activo':'Controles táctiles activos';}
let sensorTimer=setTimeout(()=>{if(!sensorEnabled)activateTouch()},1000);
function orientation(e){if(typeof e.gamma!=='number'||Math.abs(e.gamma)<.1)return;lastSensorTime=performance.now();if(!sensorEnabled){sensorEnabled=true;touchControls.classList.add('hidden');sensorStatus.textContent='Inclina el teléfono para moverte';clearTimeout(sensorTimer)}targetTilt=Math.max(-1,Math.min(1,e.gamma/28))}
async function requestMotion(){if(typeof DeviceOrientationEvent==='undefined'){activateTouch();return}try{if(typeof DeviceOrientationEvent.requestPermission==='function'){const permission=await DeviceOrientationEvent.requestPermission();if(permission!=='granted'){activateTouch();return}}window.addEventListener('deviceorientation',orientation,true);setTimeout(()=>{if(!sensorEnabled)activateTouch()},1000)}catch(e){activateTouch()}}
function setDir(dir){touchDir=dir}
function bindHold(id,dir){const el=document.getElementById(id);const down=e=>{e.preventDefault();setDir(dir)};const up=e=>{e.preventDefault();if(touchDir===dir)touchDir=0};el.addEventListener('touchstart',down,{passive:false});el.addEventListener('touchend',up,{passive:false});el.addEventListener('touchcancel',up,{passive:false});el.addEventListener('pointerdown',down);el.addEventListener('pointerup',up);el.addEventListener('pointerleave',up)}
bindHold('left-btn',-1);bindHold('right-btn',1);
document.getElementById('start-btn').addEventListener('click',()=>{requestMotion();reset()});document.getElementById('restart-btn').addEventListener('click',()=>{requestMotion();reset()});
window.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='a')touchDir=-1;if(e.key==='ArrowRight'||e.key==='d')touchDir=1;if(e.key===' '&&!running)reset()});window.addEventListener('keyup',e=>{if(['ArrowLeft','a','ArrowRight','d'].includes(e.key))touchDir=0});
sensorStatus.textContent='Listo para jugar';draw();
})();