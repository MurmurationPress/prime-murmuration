import { Boid } from './boid.js';
import { CoherenceEcology } from './coherence.js';
import { flock, migrationField, steerToward } from './forces.js';
import { GeographyField } from './geography.js';
import { PressureEvent } from './pressure.js';
import { Random } from './random.js';
import { SpatialGrid } from './spatial-grid.js';
import { ThermodynamicField } from './thermodynamics.js';

export class Simulation {
  constructor(config){ this.configure(config); }
  configure(config){
    this.config=config; this.width=config.width; this.height=config.height; this.time=0;
    this.random=new Random(Number(config.seed)); this.grid=new SpatialGrid(config.neighbourRadius);
    this.geography=new GeographyField(this.width,this.height,config);
    this.coherenceEcology=new CoherenceEcology(config,this.random);
    this.pressure=new PressureEvent(config,this.width,this.height);
    this.thermodynamics=new ThermodynamicField(this.width,this.height,config,this.geography);
    this.agents=[]; this.populate();
  }
  populate(){
    if(this.config.scene==='global'){this.populateGlobal();return;}
    const regions=[
      [.39,.31,1], [.55,.46,1.12], [.48,.59,.9],
      [.64,.64,1.08], [.22,.53,.82], [.79,.69,.28],
    ];
    while(this.agents.length<this.config.agentCount){
      const connector=this.random.next()<.28;
      let roll=this.random.range(0,regions.reduce((sum,r)=>sum+r[2],0)),region=regions[0];
      for(const candidate of regions){roll-=candidate[2];if(roll<=0){region=candidate;break;}}
      let x,y,populationLikelihood,tries=0;
      do {
        x=connector?this.random.range(this.width*.08,this.width*.9):region[0]*this.width+this.random.gaussian()*this.width*.075;
        y=connector?this.random.range(this.height*.16,this.height*.84):region[1]*this.height+this.random.gaussian()*this.height*.065;
        const ll=this.geography.provider.unproject(x,y,this.width,this.height);
        // Population influences likelihood without making low-density habitat empty.
        populationLikelihood=connector
          ?.08+Math.min(.88,this.geography.sample(x,y)*1.65)
          :.28+.72*Math.pow(this.geography.provider.populationDensity(ll.lon,ll.lat),.62);
        tries++;
      } while(this.random.next()>populationLikelihood&&tries<14);
      const angle=this.random.range(0,Math.PI*2);
      const mobility=connector?this.random.range(.72,1):this.random.next();
      this.agents.push(new Boid(x,y,angle,this.random.range(.3,this.config.maxSpeed),this.random.next(),mobility));
    }
  }
  populateGlobal(){
    while(this.agents.length<this.config.agentCount){
      const connector=this.random.next()<.28;
      const {x,y}=this.geography.spawn(this.random,connector);
      const angle=this.random.range(0,Math.PI*2),mobility=connector?this.random.range(.72,1):this.random.next();
      this.agents.push(new Boid(x,y,angle,this.random.range(.3,this.config.maxSpeed),this.random.next(),mobility));
    }
  }
  step(dt=1/30){
    this.time+=dt; this.grid.rebuild(this.agents);
    for(const agent of this.agents){
      const habitat=this.geography.sampleSupport(agent.x,agent.y);agent.landSupport=habitat;
      const coherenceCondition=this.coherenceEcology.sample(agent.x,agent.y,this.time);
      agent.salience=coherenceCondition.salience;
      const local=flock(agent,this.grid.nearby(agent.x,agent.y),this.config,coherenceCondition.dynamics*(1-agent.mobility*.12)*(.48+habitat*.52));
      agent.density=local.density; agent.apply(local);
      agent.apply(migrationField(agent,this.time,this.config));
      const g=this.geography.gradient(agent.x,agent.y);
      const geographicScale=this.config.maxForce*(agent.escapeBias<.08?.18:1.1);
      agent.apply({x:g.x*geographicScale*this.config.geographicForceGain,y:g.y*geographicScale*this.config.geographicForceGain});
      const seaDrag=(1-habitat)*this.config.seaResistance*this.config.maxForce;
      agent.apply({x:-agent.vx*seaDrag,y:-agent.vy*seaDrag});
      const pressure=this.pressure.force(agent,this.time); agent.apply(pressure);
      const margin=this.config.boundaryMargin;
      if(agent.x<margin||agent.x>this.width-margin||agent.y<margin||agent.y>this.height-margin){
        const dx=this.config.localBoundary?(agent.x<margin?1:agent.x>this.width-margin?-1:0):this.width*.47-agent.x;
        const dy=this.config.localBoundary?(agent.y<margin?1:agent.y>this.height-margin?-1:0):this.height*.5-agent.y;
        const home=steerToward(dx,dy,agent.vx,agent.vy,this.config.maxSpeed,this.config.maxForce*.42);
        agent.apply(home);
      }
      const acceleration=agent.update(this.config);
      const regionalShift=Math.abs(this.geography.sample(agent.x,agent.y)-this.geography.sample(agent.x-agent.vx*8,agent.y-agent.vy*8));
      const seaCost=(1-habitat)*Math.hypot(agent.vx,agent.vy)*this.config.seaMovementCost;
      agent.cost=acceleration*this.config.thermodynamicAccelerationCost*9 + Math.min(agent.density,2)*this.config.thermodynamicDensityCost + pressure.exposure*this.config.thermodynamicPressureCost + regionalShift*3 + seaCost;
      this.thermodynamics.deposit(agent,agent.cost);
    }
    this.thermodynamics.update();
  }
  reset(config=this.config){ this.configure(config); }
}
