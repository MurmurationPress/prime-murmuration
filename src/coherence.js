// These are changing conditions for local rule expression, not attractors.
// They amplify neighbour-to-neighbour response but never exert positional force.
export class CoherenceEcology {
  constructor(config, random) {
    this.width=config.width; this.height=config.height;this.config=config;
    const count=Math.max(3,Math.min(6,config.coherenceDensityCount));
    const sites=[
      [.39,.31], // central Scotland
      [.55,.46], // north of England
      [.48,.59], // Wales / western Midlands
      [.64,.64], // south-east England
      [.22,.53], // Ireland
      [.79,.69], // continental spillover
    ];
    this.conditions=sites.slice(0,count).map(([x,y],index)=>({
      baseX:x*this.width, baseY:y*this.height,
      radius:config.coherenceDensityRadius*random.range(.82,1.18),
      phase:random.range(0,Math.PI*2),
      tempo:random.range(.43,.76),
      driftX:random.range(18,42), driftY:random.range(20,55),
      index,
    }));
  }
  sample(x,y,time) {
    let influence=0, strongest=0;
    for(const condition of this.conditions) {
      const position=this.position(condition,time);
      const dx=x-position.x,dy=y-position.y;
      const proximity=Math.exp(-.5*(dx*dx+dy*dy)/(condition.radius*condition.radius));
      // Dominance rotates through the field. Several neighbours remain active,
      // but no condition can retain peak importance beyond the configured limit.
      const cycle=time/this.config.centrePersistenceLimit;
      const current=cycle%this.conditions.length;
      const rawDistance=Math.abs(current-condition.index);
      const rankDistance=Math.min(rawDistance,this.conditions.length-rawDistance);
      const turnover=.16+.84*Math.exp(-.5*(rankDistance/1.08)**2);
      const pulse=turnover*(.72+.28*(.5+.5*Math.sin(time*condition.tempo+condition.phase)));
      const local=proximity*pulse;
      influence+=local; strongest=Math.max(strongest,local);
    }
    return {
      dynamics:1+Math.min(1.25,influence)*.3,
      salience:Math.min(1,strongest),
    };
  }
  position(condition,time) {
    return {
      x:condition.baseX+Math.sin(time*.19+condition.phase)*condition.driftX,
      y:condition.baseY+Math.cos(time*.16+condition.phase*1.3)*condition.driftY,
    };
  }
}
