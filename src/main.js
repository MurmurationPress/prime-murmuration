import { makeConfig, PRESETS } from './config.js';
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';
import { ExportManager } from './export.js';

const controls=[
  ['agentCount','Agents',500,5000,100],['maxSpeed','Max speed',.5,4,.05],['maxForce','Max force',.01,.15,.005],
  ['cohesionWeight','Cohesion',0,2,.02],['alignmentWeight','Alignment',0,2,.02],['separationWeight','Separation',0,2.5,.02],
  ['neighbourRadius','Neighbour radius',10,60,1],['interClusterMigrationWeight','Migration',0,1.2,.02],['centrePersistenceLimit','Centre tenure',.8,4,.1],
  ['trailLength','Trail length',1,30,1],['trailOpacity','Trail opacity',.1,1,.02],['densityGlowGain','Density glow',0,2,.02],['geographyWeight','Geography',0,.8,.01],
  ['populationWeight','Population density',0,.5,.01],['continentalWeight','Continental spill',0,.15,.005],['pressureStrength','Pressure strength',0,5,.05],['pressureRadius','Pressure radius',20,180,2],
  ['pressureRampIn','Pressure ramp in',.1,2,.05],['pressureHoldDuration','Pressure hold',.1,3,.05],['pressureRampOut','Pressure ramp out',.1,2,.05],['thermodynamicDecay','Thermo decay',.9,.995,.001],['thermodynamicGain','Thermo gain',0,2,.02],
];
let config=makeConfig(),simulation,renderer,exporter,paused=false;
const $=id=>document.getElementById(id),status=message=>$('status').textContent=message;

new window.p5(p=>{
  p.setup=()=>{
    const canvas=p.createCanvas(config.width,config.height);canvas.parent('canvas-mount');p.pixelDensity(1);p.frameRate(config.fps);
    simulation=new Simulation(config);
    const previewFrame=Math.max(0,Math.min(config.duration*config.fps,Number(new URLSearchParams(location.search).get('frame'))||0));
    if(previewFrame){for(let frame=0;frame<previewFrame;frame++)simulation.step(1/config.fps);paused=true;}
    renderer=new Renderer(p,simulation,config);exporter=new ExportManager(canvas.elt,status,config);setupControls();setupPointerPressure(canvas.elt);
    if(previewFrame)$('play').textContent='Play';
  };
  p.draw=()=>{
    const canAdvance=!exporter?.frameExport||!exporter.capturing;
    if(!paused&&canAdvance){simulation.step(1/config.fps);if(simulation.time>=config.duration&&!exporter.frameExport)simulation.time-=config.duration;}
    renderer.render();if(exporter.frameExport&&!paused)exporter.captureFrame();
  };
});

function setupControls(){
  const preset=$('preset');Object.keys(PRESETS).forEach(name=>preset.add(new Option(name,name)));preset.value=config.preset;
  const holder=$('sliders');
  for(const [key,label,min,max,step] of controls){
    const row=document.createElement('label'),title=document.createTextNode(label),box=document.createElement('div'),input=document.createElement('input'),value=document.createElement('span');
    input.type='range';input.min=min;input.max=max;input.step=step;input.value=config[key];value.textContent=format(input.value,step);
    input.addEventListener('input',()=>{config[key]=Number(input.value);value.textContent=format(input.value,step);});
    input.addEventListener('change',()=>{if(['agentCount','neighbourRadius'].includes(key))reset();});
    box.append(input,value);box.style.display='grid';box.style.gridTemplateColumns='1fr 40px';box.style.gap='5px';row.append(title,box);row.dataset.key=key;holder.append(row);
  }
  $('seed').value=config.seed;
  preset.addEventListener('change',()=>{config=makeConfig(preset.value);syncControls();reset();});
  $('seed').addEventListener('change',()=>{config.seed=Number($('seed').value);reset();});
  $('play').addEventListener('click',togglePause);
  $('reset').addEventListener('click',reset);$('pressure').addEventListener('click',()=>triggerPressure());
  $('show-geography').addEventListener('change',e=>renderer.debug.geography=e.target.checked);
  $('show-population').addEventListener('change',e=>renderer.debug.population=e.target.checked);
  $('show-thermo').addEventListener('change',e=>renderer.debug.thermo=e.target.checked);
  $('show-pressure').addEventListener('change',e=>renderer.debug.pressure=e.target.checked);
  $('png').addEventListener('click',()=>exporter.png());$('frames').addEventListener('click',()=>exporter.startFrames());$('webm').addEventListener('click',()=>exporter.toggleWebM());
  $('panel-toggle').addEventListener('click',()=>toggleControls());
  document.addEventListener('keydown',handleKeyboard);
}
function togglePause(){paused=!paused;$('play').textContent=paused?'Play':'Pause';status(paused?'Paused':'Live / deterministic');}
function toggleControls(forceHidden){
  const panel=$('controls'),hidden=forceHidden??!panel.classList.contains('hidden');panel.classList.toggle('hidden',hidden);
  $('panel-toggle').textContent=hidden?'Show controls':'Hide controls';$('panel-toggle').setAttribute('aria-expanded',String(!hidden));$('panel-toggle').style.display=hidden?'none':'';renderer.cleanMode=hidden;
  if(hidden){for(const key of ['geography','population','thermo','pressure']){renderer.debug[key]=false;$(`show-${key}`).checked=false;}}
}
function triggerPressure(name){
  const applied=name?simulation.pressure.triggerPreset(name,simulation.time):(simulation.pressure.trigger(simulation.time),true);
  if(applied!==false)status(`Pressure: ${name||'default'} / F${Math.floor(simulation.time*config.fps)}`);
}
function handleKeyboard(event){
  if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement?.tagName))return;
  const presets={'1':'southEngland','2':'midlands','3':'northEngland','4':'centralScotland','5':'london'};
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
function syncControls(){for(const row of $('sliders').children){const key=row.dataset.key,input=row.querySelector('input'),value=row.querySelector('span');input.value=config[key];value.textContent=format(config[key],input.step);}$('seed').value=config.seed;}
function reset(){simulation.reset(config);renderer.reset(simulation,config);exporter.config=config;status(`Reset / seed ${config.seed}`);}
