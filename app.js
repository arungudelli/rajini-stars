'use strict';
const canvas = document.querySelector('#scene');
const ctx = canvas.getContext('2d', { alpha: false });
const progress = document.querySelector('#progress');
const timeLabel = document.querySelector('#time');
const pauseButton = document.querySelector('#pause');
const message = document.querySelector('#message');
const DURATION = 12;
let width = 0, height = 0, dpr = 1, particles = [], ambient = [];
let elapsed = 0, playing = false, lastFrame = 0, ready = false;
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let seed = 172;
function random(){seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;return seed / 4294967296;}
const clamp = (v,a=0,b=1) => Math.max(a,Math.min(b,v));
const smooth = v => {v=clamp(v);return v*v*(3-2*v);};
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
    particles.push({...p,sx:random(),sy:random(),depth:random(),phase:random()*Math.PI*2,
      size:.45+random()*.7,delay:.35+random()*3.8,
      travel:2.7+random()*1.2+(1-p.y/img.height)*.9,arc:(random()-.5)*35,star:random()<.045});
  }
  for(let i=0;i<420;i++)ambient.push({x:random(),y:random(),phase:random()*6.28,
    size:.65+random()*1.4,birth:random()*4.8,life:1.2+random()*1.8,drift:(random()-.5)*90});
}
function draw(t, shimmerTime = t){
  ctx.fillStyle='#000';ctx.fillRect(0,0,width,height);
  const rect=portraitRect();
  const settle=smooth((t-6)/3);
  const baseline=rect.y+900*rect.scale;
  // Loose sparks launch from a shallow band beneath the shoulders, never the sky.
  for(const p of ambient){
    const age=(t-p.birth)/p.life;
    if(age<=0||age>=1)continue;
    const alpha=Math.sin(age*Math.PI)*(1-settle)*(.4+.5*p.y);
    const x=width*(.08+p.x*.84)+Math.sin(age*3+p.phase)*p.drift*age;
    const y=baseline+10-age*(45+p.y*height*.38);
    const r=p.size*(.6+.5*Math.sin(t*5+p.phase)**2);
    ctx.fillStyle=`rgba(242,246,255,${alpha})`;ctx.fillRect(x,y,r,r);
    if(p.y>.75){ctx.strokeStyle=`rgba(242,246,255,${alpha*.7})`;ctx.beginPath();ctx.moveTo(x-2*r,y);ctx.lineTo(x+2*r,y);ctx.moveTo(x,y-2*r);ctx.lineTo(x,y+2*r);ctx.stroke();}
  }
  ctx.lineWidth=.55;
  for(const p of particles){
    if(t<=p.delay)continue;
    const u=clamp((t-p.delay)/p.travel),e=smooth(u),loose=1-e;
    const tx=rect.x+p.x*rect.scale,ty=rect.y+p.y*rect.scale;
    const sx=tx+(p.sx-.5)*width*.22,sy=baseline+p.sy*24;
    const drift=Math.sin(t*1.4+p.phase)*loose*6;
    const x=sx+(tx-sx)*e+Math.sin(u*Math.PI)*p.arc+drift;
    const y=sy+(ty-sy)*e;
    const twinkle=.8+.2*Math.sin(shimmerTime*(1.3+p.depth)+p.phase)**2;
    const alpha=smooth((t-p.delay)/.25)*(.6+.4*e)*twinkle*(.55+.45*p.light);
    const radius=Math.max(.9,p.size*(1+rect.scale*.6));
    // Rising points leave tails below them; a few fine threads remain in the portrait.
    const velocity=6*u*(1-u)*(sy-ty)/p.travel;
    const thread=Math.min(38,velocity*.075)+(p.depth<.22?4+10*p.depth:0)*e*rect.scale;
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
function syncControls(){progress.value=elapsed;timeLabel.value=`00:${String(Math.floor(elapsed)).padStart(2,'0')} / 00:12`;pauseButton.textContent=playing?'Pause':elapsed>=DURATION?'Play again':'Play';}
function frame(now){
  const dt=lastFrame?Math.min((now-lastFrame)/1000,.06):0;lastFrame=now;
  if(ready){if(playing){elapsed=Math.min(DURATION,elapsed+dt);if(elapsed>=DURATION)playing=false;}draw(elapsed,elapsed>=DURATION&&!reducedMotion?now/1000:elapsed);syncControls();}
  requestAnimationFrame(frame);
}
function replay(){if(!ready)return;elapsed=0;playing=true;syncControls();}
document.querySelector('#replay').addEventListener('click',replay);
pauseButton.addEventListener('click',()=>{if(!ready)return;if(elapsed>=DURATION)elapsed=0;playing=!playing;syncControls();});
progress.addEventListener('input',()=>{if(!ready)return;elapsed=Number(progress.value);playing=false;syncControls();});
document.querySelector('#fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{message.textContent='Fullscreen is unavailable in this preview.';message.hidden=false;setTimeout(()=>message.hidden=true,3000);}
});
document.addEventListener('visibilitychange',()=>{lastFrame=0;});
const img=new Image();
img.onload=()=>{try{buildParticles(img);ready=true;message.hidden=true;elapsed=reducedMotion?DURATION:0;playing=!reducedMotion;syncControls();}catch(error){message.textContent='Unable to read the portrait. Open this page through the local preview server.';console.error(error);}};
img.onerror=()=>{message.textContent='Portrait could not load. Check that portrait.png is beside index.html.';};
img.src='portrait.png';
requestAnimationFrame(frame);

