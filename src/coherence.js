// These are changing conditions for local rule expression, not attractors.
// They amplify neighbour-to-neighbour response but never exert positional force.
export class CoherenceEcology {
  constructor(config, random) {
    this.width=config.width; this.height=config.height;this.config=config;
    const count=Math.max(3,Math.min(6,config.coherenceDensityCount));
    const sites=config.coherenceSites||[
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
  prepare(time) {
    if(this.cachedTime===time)return;
    this.cachedTime=time;
    this.prepared=this.conditions.map(condition=>{
      const position=this.position(condition,time),cycle=time/this.config.centrePersistenceLimit;
      const current=cycle%this.conditions.length,rawDistance=Math.abs(current-condition.index);
      const rankDistance=Math.min(rawDistance,this.conditions.length-rawDistance);
      const turnover=.16+.84*Math.exp(-.5*(rankDistance/1.08)**2);
      const pulse=turnover*(.72+.28*(.5+.5*Math.sin(time*condition.tempo+condition.phase)));
      return {position,pulse,radius:condition.radius};
    });
  }
  sample(x,y,time) {
    this.prepare(time);
    let influence=0,strongest=0;
    for(const {position,pulse,radius} of this.prepared){
      const dx=x-position.x,dy=y-position.y;
      const proximity=Math.exp(-.5*(dx*dx+dy*dy)/(radius*radius));
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
