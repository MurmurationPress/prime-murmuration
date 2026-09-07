import { makeConfig } from './config.js';
import { Simulation } from './simulation.js';
import { Renderer } from './renderer.js';

// A staged, seeded dissolve: identical local visual language, then the larger
// ecology. Each simulation keeps its own clock; the global scene evolves from F0.
export class Book3Reveal {
  constructor(p,config) {
    const regional={...makeConfig('subtle'),seed:config.seed};
    this.simulation=new Simulation(regional);
    this.surface=p.createGraphics(config.width,config.height);this.surface.pixelDensity(1);
    this.renderer=new Renderer(this.surface,this.simulation,regional,p);this.renderer.cleanMode=true;
  }
  step(dt){if(this.simulation.time<5)this.simulation.step(dt);}
  render(p,time){
    if(time>=5)return;
    this.renderer.render();
    // Local -> regional (full original canvas) -> planetary field.
    const localZoom=1.22-.22*Math.min(1,time/2.5);
    const alpha=time<3?1:Math.max(0,1-(time-3)/2);
    p.push();p.tint(255,255*alpha);
    const w=this.surface.width*localZoom,h=this.surface.height*localZoom;
    p.image(this.surface,(this.surface.width-w)/2,(this.surface.height-h)/2,w,h);p.pop();
  }
  dispose(){
    for(const layer of [this.renderer.trails,this.renderer.densityLayer,this.renderer.thermoLayer,this.renderer.glowLayer,this.surface])layer.remove();
  }
}
