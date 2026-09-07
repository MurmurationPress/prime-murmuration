import { DEFAULT_PRESET } from '../entry-config.js';
import { makeConfig, PRESETS } from './config.js';
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { Book3Reveal } from './sequence.js';
import { ExportManager } from './export.js';

const controls=[
  ['agentCount','Agents',500,5000,100],['maxSpeed','Max speed',.5,4,.05],['maxForce','Max force',.01,.15,.005],
  ['cohesionWeight','Cohesion',0,2,.02],['alignmentWeight','Alignment',0,2,.02],['separationWeight','Separation',0,2.5,.02],
  ['neighbourRadius','Neighbour radius',10,60,1],['interClusterMigrationWeight','Migration',0,1.2,.02],['centrePersistenceLimit','Centre tenure',.8,4,.1],
  ['trailLength','Trail length',1,30,1],['trailOpacity','Trail opacity',.1,1,.02],['densityGlowGain','Density glow',0,2,.02],['geographyWeight','Geography',0,.8,.01],
  ['corridorWeight','Global corridors',0,.65,.01],['infrastructureWeight','Infrastructure',0,.5,.01],
  ['populationWeight','Population density',0,.5,.01],['continentalWeight','Continental spill',0,.15,.005],['pressureStrength','Pressure strength',0,5,.05],['pressureRadius','Pressure radius',20,180,2],
  ['pressureRampIn','Pressure ramp in',.1,2,.05],['pressureHoldDuration','Pressure hold',.1,3,.05],['pressureRampOut','Pressure ramp out',.1,2,.05],['thermodynamicDecay','Thermo decay',.9,.995,.001],['thermodynamicGain','Thermo gain',0,2,.02],
];
const query=new URLSearchParams(location.search);
let config=makeConfig(query.get('preset')||DEFAULT_PRESET),simulation,renderer,exporter,reveal,sketch,paused=false;
if(query.has('seed')&&Number.isFinite(Number(query.get('seed'))))config.seed=Number(query.get('seed'));
if(query.get('reveal')==='0')config.reveal=false;
const $=id=>document.getElementById(id),status=message=>$('status').textContent=message;

new window.p5(p=>{
  p.setup=()=>{
    sketch=p;
    const canvas=p.createCanvas(config.width,config.height);canvas.parent('canvas-mount');p.pixelDensity(1);p.frameRate(config.fps);
    simulation=new Simulation(config);
    renderer=new Renderer(p,simulation,config);exporter=new ExportManager(canvas.elt,status,config);
    reveal=config.reveal?new Book3Reveal(p,config):null;
    setupControls();setupPointerPressure(canvas.elt);
    const previewFrame=Math.max(0,Math.min(config.duration*config.fps,Math.floor(Number(query.get('frame')))||0));
    if(query.has('frame')){
      for(let frame=0;frame<previewFrame;frame++){advance();render();}
      paused=true;$('play').textContent='Play';
    }
    if(query.has('frame')&&!previewFrame)render();
    // Useful to scripted exporters; all entry points use the same stepping path.
    window.murmuration={get config(){return config;},get simulation(){return simulation;},
      get renderer(){return renderer;},get exporter(){return exporter;},
      pause(){paused=true;},reset,
      frame(n){paused=true;reset(false);for(let i=0;i<n;i++){advance();render();}if(!n)render();},
      step(){advance();render();}};

  };
  p.draw=()=>{
    if(paused || exporter?.capturing)return;
    advance(true);render();
    if(exporter.frameExport)exporter.captureFrame();
  };
});

function advance(loop=false){
  simulation.step(1/config.fps);reveal?.step(1/config.fps);
  if(loop&&!config.reveal&&simulation.time>=config.duration&&!exporter?.frameExport)simulation.time-=config.duration;
}
function render(){
  if(!reveal||simulation.time>=3)renderer.render();
  reveal?.render(sketch,simulation.time);
}
function setupControls(){
  const preset=$('preset');Object.keys(PRESETS).forEach(name=>preset.add(new Option(name,name)));preset.value=config.preset;
  const holder=$('sliders');
  for(const [key,label,min,max,step] of controls){
    const row=document.createElement('label'),title=document.createTextNode(label),box=document.createElement('div'),input=document.createElement('input'),value=document.createElement('span');
    input.type='range';input.min=min;input.max=max;input.step=step;input.value=config[key];value.textContent=format(input.value,step);
    input.addEventListener('input',()=>{config[key]=Number(input.value);value.textContent=format(input.value,step);});
    input.addEventListener('change',()=>{if(['agentCount','neighbourRadius','geographyWeight','populationWeight','infrastructureWeight','continentalWeight','connectivityWeight','corridorWeight'].includes(key))reset();});
    box.append(input,value);box.style.display='grid';box.style.gridTemplateColumns='1fr 40px';box.style.gap='5px';row.append(title,box);row.dataset.key=key;holder.append(row);
  }
  $('scene').value=config.scene;
  $('scene').addEventListener('change',()=>{config=makeConfig($('scene').value==='global'?'book3-global':'subtle');config.reveal=false;syncControls();reset();});
  $('seed').value=config.seed;
  preset.addEventListener('change',()=>{config=makeConfig(preset.value);syncControls();reset();});
  $('seed').addEventListener('change',()=>{config.seed=Number($('seed').value);reset();});
  $('play').addEventListener('click',togglePause);
  $('reset').addEventListener('click',reset);$('pressure').addEventListener('click',()=>triggerPressure());
  for(const key of ['habitat','infrastructure','corridor'])$('show-'+key).addEventListener('change',e=>{renderer.debug[key]=e.target.checked;render();});
  $('show-geography').addEventListener('change',e=>{renderer.debug.geography=e.target.checked;render();});
  $('show-population').addEventListener('change',e=>{renderer.debug.population=e.target.checked;render();});
  $('show-thermo').addEventListener('change',e=>{renderer.debug.thermo=e.target.checked;render();});
  $('show-pressure').addEventListener('change',e=>{renderer.debug.pressure=e.target.checked;render();});
  $('png').addEventListener('click',()=>exporter.png());$('frames').addEventListener('click',async()=>{await exporter.startFrames();if(exporter.frameExport){reset(false);paused=false;}});$('webm').addEventListener('click',()=>{if(!exporter.recorder){reset(false);paused=false;}exporter.toggleWebM();});
  $('panel-toggle').addEventListener('click',()=>toggleControls());
  document.addEventListener('keydown',handleKeyboard);
}
function togglePause(){paused=!paused;$('play').textContent=paused?'Play':'Pause';status(paused?'Paused':'Live / deterministic');}
function toggleControls(forceHidden){
  const panel=$('controls'),hidden=forceHidden??!panel.classList.contains('hidden');panel.classList.toggle('hidden',hidden);
  $('panel-toggle').textContent=hidden?'Show controls':'Hide controls';$('panel-toggle').setAttribute('aria-expanded',String(!hidden));$('panel-toggle').style.display=hidden?'none':'';renderer.cleanMode=hidden;
  if(hidden){for(const key of Object.keys(renderer.debug)){renderer.debug[key]=false;$(`show-${key}`).checked=false;}}
  render();
}
function triggerPressure(name){
  const applied=name?simulation.pressure.triggerPreset(name,simulation.time):(simulation.pressure.trigger(simulation.time),true);
  if(applied!==false)status(`Pressure: ${name||'default'} / F${Math.floor(simulation.time*config.fps)}`);
}
function handleKeyboard(event){
  if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  const presets=Object.fromEntries(Object.keys(config.pressurePresets).map((key,i)=>[String(i+1),key]));
  if(event.code==='Space'){event.preventDefault();togglePause();return;}
  if(presets[event.key]){triggerPressure(presets[event.key]);return;}
  switch(event.key.toLowerCase()){
    case 'h':toggleControls();break;
    case 'p':triggerPressure();break;
    case '0':simulation.pressure.clear();status('Pressure cleared');break;
    case 'r':reset();break;
  }
}
function setupPointerPressure(canvas){
  canvas.addEventListener('pointerdown',event=>{
    if($('controls').classList.contains('hidden'))return;
    const rect=canvas.getBoundingClientRect(),x=(event.clientX-rect.left)/rect.width*config.width,y=(event.clientY-rect.top)/rect.height*config.height;
    simulation.pressure.triggerAt(x,y,simulation.time);status(`Pressure: pointer / F${Math.floor(simulation.time*config.fps)}`);
  });
}
function format(value,step){return Number(step)<1?Number(value).toFixed(String(step).split('.')[1]?.length||2):String(Math.round(value));}
function syncControls(){$('scene').value=config.scene;$('preset').value=config.preset;for(const row of $('sliders').children){const key=row.dataset.key,input=row.querySelector('input'),value=row.querySelector('span');input.value=config[key];value.textContent=format(config[key],input.step);}$('seed').value=config.seed;}
function reset(renderFirst=true){reveal?.dispose();reveal=config.reveal?new Book3Reveal(sketch,config):null;simulation.reset(config);renderer.reset(simulation,config);exporter.config=config;status(`Reset / seed ${config.seed}`);if(renderFirst)render();}
