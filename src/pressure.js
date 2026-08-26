export class PressureEvent {
  constructor(config, width, height) {
    this.config=config; this.width=width; this.height=height; this.active=null;this.automaticSuppressed=false;
    this.x=width*.56; this.y=height*.63;
  }
  settings(overrides={}) {
    return {
      x:overrides.x??this.x,y:overrides.y??this.y,
      radius:overrides.radius??this.config.pressureRadius,
      strength:overrides.strength??this.config.pressureStrength,
      rampIn:overrides.rampIn??this.config.pressureRampIn,
      holdDuration:overrides.holdDuration??this.config.pressureHoldDuration,
      rampOut:overrides.rampOut??this.config.pressureRampOut,
    };
  }
  trigger(time,overrides={}) { this.active={start:time,...this.settings(overrides)};this.x=this.active.x;this.y=this.active.y;this.automaticSuppressed=true; }
  triggerPreset(name,time) {
    const preset=this.config.pressurePresets[name];if(!preset)return false;
    this.trigger(time,{...preset,x:preset.centre[0]*this.width,y:preset.centre[1]*this.height});return true;
  }
  triggerAt(x,y,time) { this.trigger(time,{x,y}); }
  clear(){this.active=null;this.automaticSuppressed=true;}
  eventAt(time) {
    if(this.active)return this.active;
    if(!this.config.automaticPressure||this.automaticSuppressed)return null;
    return {start:this.config.pressureStart,...this.settings()};
  }
  strengthAt(time) {
    const event=this.eventAt(time);if(!event)return 0;
    const elapsed=time-event.start,total=event.rampIn+event.holdDuration+event.rampOut;
    if(elapsed<0||elapsed>total){if(this.active&&time>=event.start+total)this.active=null;return 0;}
    const rampIn=Math.min(1,elapsed/event.rampIn);
    const remaining=total-elapsed;
    const rampOut=Math.min(1,remaining/event.rampOut);
    return (rampIn*rampIn*(3-2*rampIn))*(rampOut*rampOut*(3-2*rampOut));
  }
  force(agent,time) {
    const event=this.eventAt(time),phase=this.strengthAt(time); if (!event||!phase) return {x:0,y:0,exposure:0};
    const dx=agent.x-event.x, dy=agent.y-event.y, radius=event.radius;
    const d=Math.hypot(dx,dy)||1, inner=Math.exp(-.5*(d/radius)**2)*phase;
    const boundary=Math.exp(-.5*((d-radius*1.08)/(radius*.3))**2)*phase;
    const tangent=agent.escapeBias > .5 ? 1 : -1;
    const scale=this.config.maxForce*event.strength;
    return {
      x:(dx/d*(inner*.78-boundary*.14)-dy/d*boundary*.58*tangent)*scale,
      y:(dy/d*(inner*.78-boundary*.14)+dx/d*boundary*.58*tangent)*scale,
      exposure:Math.max(inner,boundary*.8),
    };
  }
  geometryAt(time){const event=this.eventAt(time);return event&&this.strengthAt(time)>0?{...event,phase:this.strengthAt(time)}:null;}
}
