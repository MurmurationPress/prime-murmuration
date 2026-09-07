import { WORLD_LAND } from '../data/world-land.js';

const clamp = value => Math.max(0, Math.min(1, value));
const radians = Math.PI / 180;
// Miller cylindrical: finite poles, recognisable coastlines, no implied hub.
// Fit the full world width inside the portrait; leave breathing room for the reveal.
export function project(lon, lat, width, height) {
  const scale = width * .94 / (2 * Math.PI);
  return { x: width / 2 + lon * radians * scale,
    y: height * .49 - 1.25 * Math.log(Math.tan(Math.PI / 4 + .4 * lat * radians)) * scale };
}
export function unproject(x, y, width, height) {
  const scale = width * .94 / (2 * Math.PI);
  return { lon: (x - width / 2) / scale / radians,
    lat: (Math.atan(Math.exp((height * .49 - y) / scale / 1.25)) - Math.PI / 4) / .4 / radians };
}
const polygons = WORLD_LAND.map(rings => ({ rings,
  bounds: rings[0].reduce((b, [x,y]) => [Math.min(b[0],x),Math.min(b[1],y),Math.max(b[2],x),Math.max(b[3],y)], [180,90,-180,-90]) }));
function inside(lon, lat, ring) {
  let hit = false;
  for (let i=0,j=ring.length-1;i<ring.length;j=i++) {
    const [x,y]=ring[i], [u,v]=ring[j];
    if ((y>lat)!==(v>lat) && lon<(u-x)*(lat-y)/(v-y)+x) hit=!hit;
  }
  return hit;
}
export function isLand(lon, lat) {
  return polygons.some(({rings,bounds:b}) => lon>=b[0] && lon<=b[2] && lat>=b[1] && lat<=b[3]
    && inside(lon,lat,rings[0]) && !rings.slice(1).some(r=>inside(lon,lat,r)));
}
// Broad, overlapping human/digital basins, not cities. Columns are longitude,
// latitude, east/west spread, north/south spread, population, infrastructure, connectivity.
export const BASINS = [
  [-115,37,15,11,.6,.85,.92],[-82,39,16,10,.8,1,.98],[-100,21,12,9,.65,.48,.65],
  [-73,4,11,13,.58,.4,.55],[-48,-20,14,12,.8,.65,.72],[-66,-35,12,9,.4,.42,.68],
  [8,49,18,10,.85,1,.98],[32,53,20,10,.5,.6,.75],
  [-1,10,16,10,.75,.42,.46],[31,1,12,15,.65,.4,.45],[27,-27,13,10,.48,.55,.65],
  [21,30,22,8,.5,.48,.57],[46,28,16,10,.5,.8,.78],
  [77,23,13,12,1,.85,.72],[115,32,15,12,1,1,.9],[137,37,9,10,.8,.95,.98],
  [105,8,15,14,.9,.8,.7],[126,-4,15,10,.5,.42,.57],
  [146,-29,13,12,.48,.8,.9],[117,-28,9,11,.26,.5,.86],[173,-40,6,8,.3,.5,.88],
];
function layer(lon,lat,column) {
  let total=0;
  for(const b of BASINS) {
    const dx=((lon-b[0]+540)%360-180)/b[2],dy=(lat-b[1])/b[3];
    total+=b[column]*Math.exp(-.5*(dx*dx+dy*dy));
  }
  return clamp(total);
}
export const populationDensity=(lon,lat)=>layer(lon,lat,4);
export const infrastructureWeight=(lon,lat)=>layer(lon,lat,5);
export const connectivityWeight=(lon,lat)=>layer(lon,lat,6);
// Synthetic continuity envelopes, deliberately not a telecom topology. Pacific
// paths are split at the dateline so they never cross the entire map by accident.
export const CORRIDORS = [
  [[-78,38],[-50,45],[-20,49],[0,50]],
  [[-47,-20],[-25,-10],[-10,5]],
  [[-80,25],[-72,9],[-48,-20]],
  [[8,45],[30,32],[43,12],[65,9],[78,18]],
  [[78,18],[96,6],[114,4],[139,35]],
  [[113,0],[132,-13],[151,-31],[173,-40]],
  [[32,-25],[48,-12],[65,3],[78,18]],
  [[-122,37],[-151,29],[-180,30]],[[180,30],[158,30],[139,35]],
];
export function corridorWeight(lon,lat) {
  let distance=Infinity;
  const scale=Math.max(.25,Math.cos(lat*radians));
  for(const path of CORRIDORS) for(let i=1;i<path.length;i++) {
    const [a,b]=[path[i-1],path[i]],dx=(b[0]-a[0])*scale,dy=b[1]-a[1];
    const px=(lon-a[0])*scale,py=lat-a[1];
    const t=clamp((px*dx+py*dy)/(dx*dx+dy*dy));
    distance=Math.min(distance,Math.hypot(px-t*dx,py-t*dy));
  }
  return Math.exp(-.5*(distance/2.8)**2);
}
export function habitatSupport(lon,lat,config={corridorWeight:.32}) {
  if(Math.abs(lon)>180 || Math.abs(lat)>85)return 0;
  if(isLand(lon,lat))return clamp(.3+.7*populationDensity(lon,lat));
  return clamp(.018 + config.corridorWeight*corridorWeight(lon,lat));
}
export function preferenceAt(x,y,width,height,config) {
  const {lon,lat}=unproject(x,y,width,height),support=habitatSupport(lon,lat,config);
  return clamp(support*(config.geographyWeight + config.populationWeight*populationDensity(lon,lat)
    + config.infrastructureWeight*infrastructureWeight(lon,lat) + config.connectivityWeight*connectivityWeight(lon,lat)));
}
export const globalGeography = {
  id:'global', project, unproject, isLand, habitatSupport, populationDensity,
  infrastructureWeight, connectivityWeight, corridorWeight, preferenceAt,
  landPolygons: WORLD_LAND.map(r=>r[0]), landHoles: WORLD_LAND.flatMap(r=>r.slice(1)),
  coastlines: WORLD_LAND.flat(), openCoastlines:new Set(),
};
