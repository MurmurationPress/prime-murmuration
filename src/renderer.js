import { COASTLINES, LAND_POLYGONS, geographyMask, infrastructureWeight, populationDensity, continentalWeight, project, unproject } from './geography.js';

export class Renderer {
  constructor(p,simulation,config){
    this.p=p; this.simulation=simulation; this.config=config;
    this.trails=p.createGraphics(config.width,config.height); this.trails.pixelDensity(1); this.trails.clear();
    this.densityLayer=p.createGraphics(config.width,config.height);this.densityLayer.pixelDensity(1);
    this.thermoLayer=p.createGraphics(config.width,config.height);this.thermoLayer.pixelDensity(1);
    this.densityCols=45;this.densityRows=80;this.densityValues=new Float32Array(this.densityCols*this.densityRows);
    this.debug={geography:false,population:false,thermo:false,pressure:false};this.cleanMode=false;
  }
  reset(simulation,config){ this.simulation=simulation;this.config=config;this.trails.clear();this.densityLayer.clear();this.thermoLayer.clear(); }
  render(){
    const p=this.p,c=this.config,sim=this.simulation;
    // Sea is a cool blue-black; land is drawn separately as dark slate.
    p.background(3,10,18);
    this.drawMap(p,false);
    if(!this.cleanMode&&this.debug.geography) this.drawGeography();
    if(!this.cleanMode&&this.debug.population) this.drawPopulation();
    if(!this.cleanMode&&this.debug.thermo) this.drawThermodynamics(p,.75);
    else this.drawThermodynamics(p,.34);
    this.drawCollectiveDensity();
    this.fadeTrails();
    this.drawAgents(this.trails);
    p.blendMode(p.ADD); p.image(this.trails,0,0); p.blendMode(p.BLEND);
    this.drawCoastlineOverlay();
    if(!this.cleanMode&&this.debug.pressure) this.drawPressure();
    if(this.config.showStatusLine&&(!this.cleanMode||this.config.showStatusInCleanMode))this.drawReadout();
  }
  fadeTrails(){
    const context=this.trails.drawingContext;
    context.save();context.globalCompositeOperation='destination-out';
    const erosion=1-Math.exp(-1/Math.max(1,this.config.trailLength));
    context.fillStyle=`rgba(0,0,0,${erosion})`;
    context.fillRect(0,0,this.config.width,this.config.height);context.restore();
  }
  drawMap(g,strong){
    g.noStroke();g.fill(strong?22:17,strong?30:25,strong?36:31,strong?245:232);
    for(const land of LAND_POLYGONS){
      g.beginShape();for(const [lon,lat] of land){const point=project(lon,lat,this.config.width,this.config.height);g.vertex(point.x,point.y);}g.endShape(g.CLOSE);
    }
    g.noFill();g.stroke(strong?105:72,strong?143:108,strong?156:120,strong?205:164);g.strokeWeight(strong?1.4:.86);
    for(let index=0;index<COASTLINES.length;index++){
      const coast=COASTLINES[index];
      g.beginShape(); for(const [lon,lat] of coast){const pt=project(lon,lat,this.config.width,this.config.height);g.vertex(pt.x,pt.y);}
      if(index===2)g.endShape();else g.endShape(g.CLOSE);
    }
  }
  drawCoastlineOverlay(){
    const p=this.p;p.noFill();p.stroke(76,112,125,122);p.strokeWeight(.72);
    for(let index=0;index<COASTLINES.length;index++){
      p.beginShape();
      for(const [lon,lat] of COASTLINES[index]){const point=project(lon,lat,this.config.width,this.config.height);p.vertex(point.x,point.y);}
      if(index===2)p.endShape();else p.endShape(p.CLOSE);
    }
  }
  drawAgents(g){
    g.blendMode(g.ADD); g.noStroke();
    for(const a of this.simulation.agents){
      const coherent=Math.max(0,a.coherence), energy=Math.min(1,a.cost*.75), salience=a.salience||0;
      const habitat=.16+(a.landSupport??1)*.84;
      const alpha=(6+coherent*9+salience*4+energy*6)*this.config.trailOpacity*habitat;
      g.fill(78+energy*58,136+coherent*42,164+coherent*48,alpha*this.config.glowIntensity);
      const size=.46+coherent*.4+salience*.14+energy*.22;
      g.circle(a.x,a.y,size*2);
    }
    g.blendMode(g.BLEND);
  }
  drawCollectiveDensity(){
    const p=this.p,g=this.densityLayer,values=this.densityValues,cols=this.densityCols,rows=this.densityRows;
    values.fill(0);
    for(const agent of this.simulation.agents){
      const x=Math.max(0,Math.min(cols-1,Math.floor(agent.x/this.config.width*cols)));
      const y=Math.max(0,Math.min(rows-1,Math.floor(agent.y/this.config.height*rows)));
      const habitat=.14+(agent.landSupport??1)*.86;
      values[y*cols+x]+=(.3+Math.max(0,agent.coherence)*.7)*habitat;
    }
    const cw=this.config.width/cols,ch=this.config.height/rows;g.clear();g.noStroke();g.blendMode(g.ADD);
    for(let i=0;i<values.length;i++){
      const density=Math.min(1,values[i]/8);if(density<.06)continue;
      const x=((i%cols)+.5)*cw,y=(Math.floor(i/cols)+.5)*ch;
      const alpha=Math.pow(density,.85)*10*this.config.densityGlowGain;
      g.fill(48,103+density*24,128+density*32,alpha);g.circle(x,y,Math.max(cw,ch)*(1.7+density*.7));
    }
    g.blendMode(g.BLEND);
    const context=p.drawingContext;context.save();context.filter='blur(9px)';p.blendMode(p.ADD);p.image(g,0,0);p.blendMode(p.BLEND);context.restore();
  }
  drawThermodynamics(g,strength){
    const f=this.simulation.thermodynamics,layer=this.thermoLayer,cw=this.config.width/f.cols,ch=this.config.height/f.rows;
    layer.clear();layer.noStroke();layer.blendMode(layer.ADD);
    for(let i=0;i<f.values.length;i++){
      const value=Math.min(1,f.values[i]*.005); if(value<.008) continue;
      const x=((i%f.cols)+.5)*cw,y=(Math.floor(i/f.cols)+.5)*ch;
      layer.fill(73+value*48,38+value*30,94+value*55,value*20*strength);
      layer.circle(x,y,Math.max(cw,ch)*2.5);
    }
    layer.blendMode(layer.BLEND);
    const context=g.drawingContext;context.save();context.filter='blur(11px)';g.blendMode(g.ADD);g.image(layer,0,0);g.blendMode(g.BLEND);context.restore();
  }
  drawGeography(){
    const p=this.p,step=12;p.noStroke();
    for(let y=0;y<this.config.height;y+=step)for(let x=0;x<this.config.width;x+=step){
      const ll=unproject(x,y,this.config.width,this.config.height);
      const w=geographyMask(ll.lon,ll.lat)*.3+infrastructureWeight(ll.lon,ll.lat)*.25+populationDensity(ll.lon,ll.lat)*.38+continentalWeight(ll.lon,ll.lat)*.07;
      p.fill(35,115,115,w*50);p.rect(x,y,step,step);
    }
    this.drawMap(p,true);
  }
  drawPopulation(){
    const p=this.p,step=10;p.noStroke();p.blendMode(p.ADD);
    for(let y=0;y<this.config.height;y+=step)for(let x=0;x<this.config.width;x+=step){
      const ll=unproject(x,y,this.config.width,this.config.height);
      const density=populationDensity(ll.lon,ll.lat);
      if(density<.025)continue;
      p.fill(50,132,150,Math.pow(density,.7)*72);p.rect(x,y,step,step);
    }
    p.blendMode(p.BLEND);this.drawMap(p,true);
  }
  drawPressure(){
    const p=this.p,pressure=this.simulation.pressure,geometry=pressure.geometryAt(this.simulation.time);if(!geometry)return;
    p.noFill();p.stroke(188,92,104,100*geometry.phase);p.strokeWeight(1);
    for(let i=1;i<=3;i++)p.circle(geometry.x,geometry.y,geometry.radius*2*i/3);
  }
  drawReadout(){
    const p=this.p,time=this.simulation.time%this.config.duration,pressure=this.simulation.pressure.strengthAt(this.simulation.time);
    p.noStroke();p.fill(122,151,160,90);p.textFont('monospace');p.textSize(7);p.textAlign(p.LEFT,p.BOTTOM);
    p.text(`FIELD 01 / FIELD-07  F${String(Math.floor(this.simulation.time*this.config.fps)).padStart(3,'0')}  T+${time.toFixed(2)}  PRESSURE: ${pressure>.01?'APPLIED':'NULL'}`,14,this.config.height-14);
  }
}
