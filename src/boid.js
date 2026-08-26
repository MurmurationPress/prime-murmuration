import { limit } from './forces.js';
export class Boid {
  constructor(x,y,angle,speed,escapeBias,mobility=.5) {
    this.x=x; this.y=y; this.vx=Math.cos(angle)*speed; this.vy=Math.sin(angle)*speed;
    this.ax=0; this.ay=0; this.coherence=0; this.density=0; this.cost=0; this.escapeBias=escapeBias;this.mobility=mobility;
  }
  apply(force){ this.ax+=force.x; this.ay+=force.y; }
  update(config){
    const acceleration=Math.hypot(this.ax,this.ay);
    this.vx+=this.ax; this.vy+=this.ay;
    const v=limit({x:this.vx,y:this.vy},config.maxSpeed); this.vx=v.x; this.vy=v.y;
    this.x+=this.vx; this.y+=this.vy; this.ax=0; this.ay=0;
    return acceleration;
  }
}
