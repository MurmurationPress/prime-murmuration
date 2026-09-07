import { regionalGeography } from './regional-geography.js';
import { globalGeography } from './global-geography.js';
// Keep the original named exports available for regional integrations.
export * from './regional-geography.js';
export function geographyProvider(mode='regional') {
  if(mode==='regional')return regionalGeography;
  if(mode==='global')return globalGeography;
  throw new Error(`Unknown geography mode: ${mode}`);
}

// The geographic layers are static during a run. Rasterising their composite once
// keeps the per-agent force loop inexpensive and makes a future real raster swap trivial.
export class GeographyField {
  constructor(width,height,config,cols=90,rows=160) {
    this.provider=geographyProvider(config.scene);
    this.width=width;this.height=height;this.cols=cols;this.rows=rows;
    this.values=new Float32Array(cols*rows);this.supports=new Float32Array(cols*rows);
    this.layers=Object.fromEntries(['population','infrastructure','corridor','connectivity'].map(key=>[key,new Float32Array(cols*rows)]));
    const methods={population:'populationDensity',infrastructure:'infrastructureWeight',corridor:'corridorWeight',connectivity:'connectivityWeight'};
    for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
      const px=(x+.5)/cols*width,py=(y+.5)/rows*height,ll=this.provider.unproject(px,py,width,height);
      this.values[y*cols+x]=this.provider.preferenceAt(px,py,width,height,config);this.supports[y*cols+x]=this.provider.habitatSupport(ll.lon,ll.lat,config);
      for(const [key,method] of Object.entries(methods))this.layers[key][y*cols+x]=this.provider[method]?.(ll.lon,ll.lat)||0;
    }
  }
  // Weighted cell sampling uses no geographic calculations during population or steps.
  spawn(random,connector=false) {
    if(connector&&!this.connectorWeights)this.connectorWeights=Float32Array.from(this.supports,(support,i)=>
      .2*support+.8*this.layers.corridor[i]*(1-support));
    const weights=connector?this.connectorWeights:this.values;
    if(!this.spawnTables)this.spawnTables=new Map();
    if(!this.spawnTables.has(weights)) {
      let sum=0;const cumulative=Float64Array.from(weights,w=>sum+=w*w);
      this.spawnTables.set(weights,{cumulative,sum});
    }
    const {cumulative,sum}=this.spawnTables.get(weights),roll=random.next()*sum;
    let lo=0,hi=cumulative.length-1;
    while(lo<hi){const mid=(lo+hi)>>1;if(cumulative[mid]<roll)lo=mid+1;else hi=mid;}
    return {x:(lo%this.cols+random.next())/this.cols*this.width,y:(Math.floor(lo/this.cols)+random.next())/this.rows*this.height};
  }
  sampleSupport(x,y) {
    const gx=Math.max(0,Math.min(this.cols-1,Math.floor(x/this.width*this.cols)));
    const gy=Math.max(0,Math.min(this.rows-1,Math.floor(y/this.height*this.rows)));
    return this.supports[gy*this.cols+gx];
  }
  sample(x,y) {
    const gx=Math.max(0,Math.min(this.cols-1,Math.floor(x/this.width*this.cols)));
    const gy=Math.max(0,Math.min(this.rows-1,Math.floor(y/this.height*this.rows)));
    return this.values[gy*this.cols+gx];
  }
  gradient(x,y) {
    const dx=this.width/this.cols,dy=this.height/this.rows;
    return {x:this.sample(x+dx,y)-this.sample(x-dx,y),y:this.sample(x,y+dy)-this.sample(x,y-dy)};
  }
}
