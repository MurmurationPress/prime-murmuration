export class ThermodynamicField {
  constructor(width,height,config,geography,cols=45,rows=80) {
    this.width=width; this.height=height; this.cols=cols; this.rows=rows;
    this.config=config;
    this.values=new Float32Array(cols*rows); this.scratch=new Float32Array(cols*rows);
    this.supports=new Float32Array(cols*rows);
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++)this.supports[y*cols+x]=geography.sampleSupport((x+.5)/cols*width,(y+.5)/rows*height);
  }
  deposit(agent,cost) {
    const x=Math.max(0,Math.min(this.cols-1,Math.floor(agent.x/this.width*this.cols)));
    const y=Math.max(0,Math.min(this.rows-1,Math.floor(agent.y/this.height*this.rows)));
    this.values[y*this.cols+x]+=cost*this.config.thermodynamicGain;
  }
  update() {
    const c=this.cols,r=this.rows,v=this.values,s=this.scratch;
    for(let y=0;y<r;y++) for(let x=0;x<c;x++) {
      const i=y*c+x;
      let sum=v[i]*3, n=3;
      if(x){sum+=v[i-1];n++;} if(x<c-1){sum+=v[i+1];n++;}
      if(y){sum+=v[i-c];n++;} if(y<r-1){sum+=v[i+c];n++;}
      const habitatDecay=.86+.14*this.supports[i];
      s[i]=sum/n*this.config.thermodynamicDecay*habitatDecay;
    }
    this.values=s; this.scratch=v;
  }
  reset(){ this.values.fill(0); this.scratch.fill(0); }
}
