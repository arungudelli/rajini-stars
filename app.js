'use strict';
const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d', { alpha: false });
const progress = document.querySelector('#progress');
const timeLabel = document.querySelector('#time');
const pauseButton = document.querySelector('#pause');
const message = document.querySelector('#message');
const music = document.querySelector('#music');
const soundButton = document.querySelector('#sound');
const DURATION = 20;
const PORTRAIT_START = 7.25;
let soundEnabled = false;
const BREAKUP_STAR_COUNT = 150;
const PORTRAIT_COLUMNS = 176;
const PORTRAIT_WAVES = 3;
const AMBIENT_STAR_COUNT = 160;
let width = 0, height = 0, dpr = 1, particles = [], ambient = [], carriers = [], openingStars = [];
let elapsed = 0, playing = false, lastFrame = 0, ready = false;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed = 172;
function random(){seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;return seed / 4294967296;}
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const smooth = v => {v=clamp(v);return v*v*(3-2*v);};
function silverStar(x,y,r,alpha,rotation=0,yaw=0){
  // Keep all five broad arms readable, even while the metal face turns.
  const squash=.72+.28*Math.abs(Math.cos(yaw));
  const vertices=[];
  for(let i=0;i<10;i++){
    const angle=-Math.PI/2+i*Math.PI/5,rad=i%2?r*.49:r;
    const px=Math.cos(angle)*rad*squash,py=Math.sin(angle)*rad;
    const sx=x+px*Math.cos(rotation)-py*Math.sin(rotation);
    const sy=y+px*Math.sin(rotation)+py*Math.cos(rotation);
    vertices.push([sx,sy]);
  }
  function outline(dx=0,dy=0){
    ctx.beginPath();vertices.forEach(([vx,vy],i)=>{if(i===0)ctx.moveTo(vx+dx,vy+dy);else ctx.lineTo(vx+dx,vy+dy);});ctx.closePath();
  }
  // A dark offset edge provides thickness behind the raised silver face.
  outline(r*.08,r*.12);ctx.fillStyle=`rgba(85,98,118,${alpha})`;ctx.fill();
  if(r<3){outline();ctx.fillStyle=`rgba(235,242,253,${alpha})`;ctx.fill();return;}
  const ridgeX=x-r*.07,ridgeY=y-r*.05;
  for(let i=0;i<10;i++){
    const a=vertices[i],b=vertices[(i+1)%10];
    const light=clamp(.74+.22*Math.cos(i*Math.PI/5+yaw)+(i%2===0?.12:-.14),.38,1);
    const value=Math.round(light*255);
    ctx.fillStyle=`rgba(${value},${Math.min(255,value+5)},${Math.min(255,value+13)},${alpha})`;
    ctx.beginPath();ctx.moveTo(ridgeX,ridgeY);ctx.lineTo(...a);ctx.lineTo(...b);ctx.closePath();ctx.fill();
  }
  outline();ctx.strokeStyle=`rgba(248,252,255,${alpha*.7})`;ctx.lineWidth=Math.max(.35,r*.015);ctx.stroke();
}
function resize(){
  width = innerWidth; height = innerHeight; dpr = Math.min(devicePixelRatio || 1, 2);
  canvas.width = Math.round(width*dpr);canvas.height = Math.round(height*dpr);
  ctx.setTransform(dpr,0,0,dpr,0,0);
}
addEventListener('resize',resize); resize();
function portraitRect(){
  const availableH = Math.max(160,height-170);
  // Crop the source's empty margins so the portrait fills the stage on phones too.
  const scale = Math.min(width*.87/1160,availableH/760);
  return {x:width/2-850*scale,y:72+(availableH-760*scale)/2-150*scale,scale};
}
function buildParticles(img){
  buildOpeningLetter();
  const sample = document.createElement('canvas');sample.width=680;sample.height=Math.round(680*img.height/img.width);
  const s = sample.getContext('2d',{willReadFrequently:true});s.drawImage(img,0,0,sample.width,sample.height);
  const pixels=s.getImageData(0,0,sample.width,sample.height).data;
  const candidates=[];
  for(let y=0;y<sample.height;y++)for(let x=0;x<sample.width;x++){
    const value=pixels[(y*sample.width+x)*4];
    if(value>58 && random()<.68)candidates.push({x:x/sample.width*img.width,y:y/sample.height*img.height,light:value/255});
  }
  // Bound rendering cost; retain all facial regions through uniform sampling.
  const stride=Math.max(1,candidates.length/6500);
  for(let i=0;i<candidates.length;i+=stride){
    const p=candidates[Math.floor(i)];
    particles.push({...p,depth:random(),phase:random()*Math.PI*2,
      size:.45+random()*.7,star:random()<.045});
  }
  // One upward sweep per occupied column. Each star keeps its x coordinate.
  const columns=new Map();
  for(const p of particles){
    const column=Math.floor(p.x/img.width*PORTRAIT_COLUMNS);
    if(!columns.has(column))columns.set(column,{x:(column+.5)/PORTRAIT_COLUMNS*img.width,y:p.y,
      phase:random()*6.28,delay:.2+random()*4.7,travel:2+random()*1.1,size:1+random()*.9});
    columns.get(column).y=Math.min(columns.get(column).y,p.y);
    p.column=column;
  }
  carriers=[...columns.values()];
  for(const p of particles){
    const c=columns.get(p.column);
    const rise=clamp((900-p.y)/Math.max(1,900-c.y));
    // Light the drawing only as the star passes its height in this column.
    p.reveal=c.delay+c.travel*(1-(1-rise)**(1/1.5));
  }
  // Successive stars follow each vertical lane, creating fuller rising streams.
  for(const column of columns.values())for(let wave=1;wave<PORTRAIT_WAVES;wave++){
    carriers.push({...column,delay:column.delay+wave*.65,
      phase:column.phase+wave*1.7,size:column.size*(.7+random()*.25),
      travel:column.travel*(.9+random()*.2)});
  }
  for(let i=0;i<AMBIENT_STAR_COUNT;i++)ambient.push({x:random(),y:random(),phase:random()*6.28,
    size:.8+random()*1.3,birth:random()*5.8,life:1+random()*1.5});
}
function buildOpeningLetter(){
  const letter=document.createElement('canvas');letter.width=360;letter.height=400;
  const pen=letter.getContext('2d',{willReadFrequently:true});
  pen.fillStyle='#fff';pen.font='bold 340px Georgia, serif';pen.textAlign='center';pen.textBaseline='middle';
  pen.fillText('R',180,216);
  const mask=pen.getImageData(0,0,360,400).data;
  for(let y=0;y<400;y+=5)for(let x=0;x<360;x+=5){
    if(mask[(y*360+x)*4+3]<128)continue;
    openingStars.push({x:(x-180)/340,y:(y-200)/340,
      landing:random(),depth:random(),spreadY:random(),phase:random()*6.28,size:.75+random()*.8,
      burstDelay:random()*.22});
  }
  // Keep the initial readable, but only release a small number of distinct stars.
  for(let i=0;i<Math.min(BREAKUP_STAR_COUNT,openingStars.length);i++){
    openingStars[Math.floor(i*openingStars.length/BREAKUP_STAR_COUNT)].fragment=true;
  }
}
function drawOpening(t,rect){
  const size=Math.min(width*.52,(height-180)*.65,310);
  const centerY=72+(Math.max(160,height-170))/2;
  // The large foreground star recedes into the screen, then vanishes before R.
  if(t<2.45){
    const travel=clamp(t/2.3);
    const intensity=smooth(t/.12)*(1-smooth((t-2.12)/.33));
    const nearRadius=Math.min(width*.4,height*.46,280);
    const radius=nearRadius/(1+34*travel**2.1);
    const halo=ctx.createRadialGradient(width/2,centerY,0,width/2,centerY,radius*3);
    halo.addColorStop(0,`rgba(240,248,255,${intensity*.22})`);
    halo.addColorStop(.2,`rgba(220,235,255,${intensity*.05})`);halo.addColorStop(1,'rgba(220,235,255,0)');
    ctx.fillStyle=halo;ctx.fillRect(width/2-radius*3,centerY-radius*3,radius*6,radius*6);
    silverStar(width/2,centerY,radius,intensity,-.18+travel*.3,Math.sin(travel*Math.PI)*.55);
  }
  t-=2.45;
  if(t<0||t>7.3)return;
  const grow=1;
  const appear=smooth(t/.2),fade=1-smooth((t-4.8)/2.5);
  const fieldTop=78,fieldHeight=Math.max(120,height-210);
  for(const p of openingStars){
    const burst=clamp((t-1.6-p.burstDelay)/2.6);
    const scatter=1-(1-burst)**3;
    const turn=smooth((t-1.15)/.45);
    const px=p.x*size*grow,py=p.y*size*grow;
    const perspective=1/(1+p.x*turn*.45);
    const targetX=width/2+(px*Math.cos(turn*.65)-py*Math.sin(turn*.18))*perspective;
    const targetY=centerY+(py*Math.cos(turn*.18)+px*Math.sin(turn*.18))*perspective;
    const assembly=smooth((t-p.burstDelay)/.9);
    // The same small set of stars expands from the vanished star into R first.
    const startX=p.fragment?width/2+(targetX-width/2)*assembly:targetX;
    const startY=p.fragment?centerY+(targetY-centerY)*assembly:targetY;
    // Expand the letter into a two-dimensional field across the entire stage.
    const endX=width*(.025+p.landing*.95),endY=fieldTop+p.spreadY*fieldHeight;
    const x=startX+(endX-startX)*scatter;
    const drift=Math.max(0,t-4.4)*(8+p.depth*12);
    const y=startY+(endY-startY)*scatter-drift;
    const fragmentFade=p.fragment?1:1-smooth(scatter/.3);
    const letterDetail=p.fragment?1:smooth((t-.55-p.burstDelay)/.4);
    const alpha=appear*fade*fragmentFade*letterDetail*(.72+.28*Math.sin(t*3+p.phase)**2);
    if(alpha<.01)continue;
    const r=p.size*(1+scatter*.3);
    if(p.fragment&&(scatter>.02||assembly<1)){
      const starSize=scatter>.02?r*(1+scatter*(1.3+p.depth)):r*(1+2.3*(1-assembly));
      silverStar(x,y,starSize,alpha,t*.4+p.phase,t*.65+p.phase);
    }else{ctx.fillStyle=`rgba(247,250,255,${alpha})`;ctx.fillRect(x,y,r,r);}
    if(p.fragment&&assembly>0&&assembly<1){
      const tail=(1-assembly)*.1;
      ctx.strokeStyle=`rgba(235,245,255,${alpha*.45})`;ctx.lineWidth=.6;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-(targetX-width/2)*tail,y-(targetY-centerY)*tail);ctx.stroke();
    }
    if(burst>0&&burst<1&&p.depth>.45){
      const earlier=clamp((t-.025-1.6-p.burstDelay)/2.6);
      const tail=scatter-(1-(1-earlier)**3);
      ctx.strokeStyle=`rgba(240,248,255,${alpha*.4})`;ctx.lineWidth=.7;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-(endX-startX)*tail,y-(endY-startY)*tail);ctx.stroke();
    }
  }
}
function draw(t, shimmerTime = t){
  ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
  const rect=portraitRect();
  drawOpening(t,rect);
  t=Math.max(0,t-PORTRAIT_START);
  const settle=smooth((t-6)/3);
  const baseline=rect.y+900*rect.scale;
  // Loose sparks launch from a shallow band beneath the shoulders, never the sky.
  for(const p of ambient){
    const age=(t-p.birth)/p.life;
    if(age<=0||age>=1)continue;
    const alpha=Math.sin(age*Math.PI)*(1-settle)*(.4+.5*p.y);
    const x=width*(.08+p.x*.84);
    const y=baseline+10-age*(45+p.y*height*.38);
    const r=p.size*(.6+.5*Math.sin(t*5+p.phase)**2);
    ctx.fillStyle=`rgba(242,246,255,${alpha})`;ctx.fillRect(x,y,r,r);
    if(p.y>.75){ctx.strokeStyle=`rgba(242,246,255,${alpha*.7})`;ctx.beginPath();ctx.moveTo(x-2*r,y);ctx.lineTo(x+2*r,y);ctx.moveTo(x,y-2*r);ctx.lineTo(x,y+2*r);ctx.stroke();}
  }
  for(const c of carriers){
    const u=(t-c.delay)/c.travel;
    if(u<=0||u>=1)continue;
    const e=1-(1-u)**1.5;
    const tx=rect.x+c.x*rect.scale,ty=rect.y+c.y*rect.scale;
    const x=tx;
    const y=baseline+(ty-baseline)*e;
    const alpha=smooth(u/.12)*(1-smooth((u-.9)/.1));
    const r=c.size*(.85+.15*Math.sin(t*6+c.phase));
    const tailLength=14+32*(1-u);
    const tail=ctx.createLinearGradient(x,y,x,y+tailLength);
    tail.addColorStop(0,`rgba(245,248,255,${alpha*.6})`);tail.addColorStop(1,'rgba(245,248,255,0)');
    ctx.strokeStyle=tail;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+tailLength);ctx.stroke();
    silverStar(x,y,r*2.3,alpha,c.phase,t*.7+c.phase);
  }
  ctx.lineWidth=.55;
  for(const p of particles){
    const reveal=smooth((t-p.reveal)/.65);
    if(reveal<=0)continue;
    const x=rect.x+p.x*rect.scale,y=rect.y+p.y*rect.scale;
    const twinkle=.8+.2*Math.sin(shimmerTime*(1.3+p.depth)+p.phase)**2;
    const alpha=reveal*twinkle*(.55+.45*p.light);
    const radius=Math.max(.9,p.size*(1+rect.scale*.6));
    // Fine stationary threads retain the original title-card texture.
    const thread=(p.depth<.22?4+10*p.depth:0)*rect.scale;
    if(thread>.5){
      const tail=ctx.createLinearGradient(x,y,x,y+thread);
      tail.addColorStop(0,`rgba(235,242,255,${alpha*.65})`);tail.addColorStop(1,'rgba(235,242,255,0)');
      ctx.strokeStyle=tail;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+thread);ctx.stroke();
    }
    ctx.fillStyle=`rgba(242,246,255,${alpha})`;ctx.fillRect(x,y,radius,radius);
    if(p.star){
      const pulse=(.5+.5*Math.sin(shimmerTime*2+p.phase))**8;
      const r=radius+2.8*pulse;
      ctx.strokeStyle=`rgba(245,248,255,${alpha*(.3+.6*pulse)})`;
      ctx.beginPath();ctx.moveTo(x-r,y);ctx.lineTo(x+r,y);ctx.moveTo(x,y-r);ctx.lineTo(x,y+r);ctx.stroke();
      if(pulse>.2){const glow=ctx.createRadialGradient(x,y,0,x,y,7);glow.addColorStop(0,`rgba(215,230,255,${pulse*.2})`);glow.addColorStop(1,'rgba(215,230,255,0)');ctx.fillStyle=glow;ctx.fillRect(x-7,y-7,14,14);}
    }
  }
}
function syncControls(){progress.value=elapsed;timeLabel.value=`00:${String(Math.floor(elapsed)).padStart(2,'0')} / 00:${DURATION}`;pauseButton.textContent=playing?'Pause':elapsed>=DURATION?'Play again':'Play';}
function frame(now){
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.06):0;lastFrame=now;
  if(ready){
    if(playing){
      elapsed=Math.min(DURATION,soundEnabled&&!music.paused?music.currentTime:elapsed+dt);
      if(elapsed>=DURATION){playing=false;music.pause();}
    }
    music.volume=.85*(1-smooth((elapsed-19)/1));
    draw(elapsed,elapsed>=DURATION&&!reducedMotion?now/1000:elapsed);syncControls();
  }
  requestAnimationFrame(frame);
}
async function startPlayback(){
  if(!ready)return;
  if(elapsed>=DURATION)elapsed=0;
  if(soundEnabled){
    music.currentTime=Math.min(elapsed,Number.isFinite(music.duration)?Math.max(0,music.duration-.05):elapsed);
    try{await music.play();}catch{playing=false;message.textContent='Click Play with sound again to allow audio playback.';message.hidden=false;return;}
  }
  playing=true;lastFrame=0;syncControls();
}
function replay(){if(!ready)return;elapsed=0;music.pause();startPlayback();}
document.querySelector('#replay').addEventListener('click',replay);
pauseButton.addEventListener('click',()=>{if(!ready)return;if(playing){playing=false;music.pause();syncControls();}else startPlayback();});
progress.addEventListener('input',()=>{if(!ready)return;elapsed=Number(progress.value);playing=false;music.pause();if(soundEnabled&&Number.isFinite(music.duration))music.currentTime=Math.min(elapsed,music.duration);syncControls();});
soundButton.addEventListener('click',()=>{
  if(!ready)return;
  if(!soundEnabled){soundEnabled=true;music.muted=false;elapsed=0;playing=false;message.hidden=true;startPlayback();}
  else music.muted=!music.muted;
  soundButton.textContent=music.muted?'Unmute':'Mute';soundButton.setAttribute('aria-pressed',String(!music.muted));
});
music.addEventListener('ended',()=>{if(soundEnabled){elapsed=DURATION;playing=false;syncControls();}});
music.addEventListener('error',()=>{soundEnabled=false;music.pause();soundButton.textContent='Audio unavailable';soundButton.disabled=true;message.textContent='Music could not load. The animation can still play.';message.hidden=false;});
document.querySelector('#fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message.textContent='Fullscreen is unavailable in this preview.';message.hidden=false;setTimeout(()=>message.hidden=true,3000);}
});
document.addEventListener('visibilitychange',()=>{lastFrame=0;});
const img=new Image();
img.onload=()=>{try{buildParticles(img);ready=true;message.hidden=true;elapsed=reducedMotion?DURATION:0;playing=!reducedMotion;syncControls();}catch(error){message.textContent='Unable to read the portrait. Open this page through the local preview server.';console.error(error);}};
img.onerror=()=>{message.textContent='Portrait could not load. Check that portrait.png is beside index.html.';};
img.src='portrait.png';
requestAnimationFrame(frame);

