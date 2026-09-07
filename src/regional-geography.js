const GB = [[-5.7,50.05],[-5,50.15],[-4.2,50.35],[-3.5,50.2],[-3,50.45],[-2,50.55],[-1.2,50.75],[0,50.75],[1,51],[1.45,51.35],[1.65,51.8],[1.3,52.15],[1.75,52.75],[1.55,53.2],[.5,53.45],[-.2,53.65],[-.8,53.75],[-1.1,54.05],[-.6,54.5],[-1.3,55],[-1.6,55.6],[-2.1,55.9],[-1.8,56.4],[-2.6,56.65],[-2.8,57.1],[-3,57.7],[-3.8,58.55],[-4.6,58.65],[-5.2,58.45],[-5.8,57.85],[-5.3,57.3],[-5.8,57],[-5,56.6],[-5.5,56.2],[-4.8,55.9],[-5,55.4],[-4.6,54.9],[-3.6,54.6],[-3,54.1],[-3.2,53.5],[-4.4,53.4],[-4.8,52.9],[-4.2,52.6],[-4.1,52.2],[-4.7,52],[-5.2,51.7],[-4.7,51.2],[-5.7,50.05]];
const IRELAND = [[-10.5,51.45],[-9.8,51.45],[-9.3,51.6],[-8.5,51.55],[-7.8,51.75],[-6.3,52.05],[-6,52.7],[-6.15,53.35],[-6.05,54],[-6.55,54.25],[-7.05,55.05],[-8,55.2],[-8.6,55.15],[-8.2,54.65],[-9,54.15],[-9.8,54.3],[-10.15,53.6],[-9.7,53.3],[-10.25,52.9],[-9.8,52.6],[-10.5,51.45]];
const EUROPE = [[-5.2,48.2],[-4.8,48.5],[-4.2,48.6],[-3.2,48.8],[-2,49.2],[-1,49.7],[.2,49.9],[1.5,50.1],[2.5,51.1],[3.3,51.4],[4.1,51.2],[4.5,51.8],[4.7,52.9],[5.5,53.4],[7,53.6]];
const EUROPE_LAND = [...EUROPE,[7,47.8],[-5.2,47.8]];
export const COASTLINES = [GB, IRELAND, EUROPE];
export const LAND_POLYGONS = [GB, IRELAND, EUROPE_LAND];

export function project(lon, lat, width, height) {
  return { x: ((lon + 11) / 18) * width, y: ((60.5 - lat) / 12.5) * height };
}
export function unproject(x, y, width, height) {
  return { lon: (x / width) * 18 - 11, lat: 60.5 - (y / height) * 12.5 };
}
function inside(point, polygon) {
  let hit = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i], [xj, yj] = polygon[j];
    if ((yi > point.lat) !== (yj > point.lat) && point.lon < (xj - xi) * (point.lat - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
function gaussian(lon, lat, cx, cy, sx, sy) {
  const dx = (lon - cx) / sx, dy = (lat - cy) / sy;
  return Math.exp(-0.5 * (dx * dx + dy * dy));
}
export function isLand(lon,lat) {
  const point={lon,lat};
  return inside(point,GB)||inside(point,IRELAND)||inside(point,EUROPE_LAND);
}
function segmentDistance(lon,lat,a,b) {
  const scale=Math.cos(lat*Math.PI/180),px=lon*scale,py=lat,ax=a[0]*scale,ay=a[1],bx=b[0]*scale,by=b[1];
  const dx=bx-ax,dy=by-ay,length=dx*dx+dy*dy;
  const t=length?Math.max(0,Math.min(1,((px-ax)*dx+(py-ay)*dy)/length)):0;
  return Math.hypot(px-(ax+t*dx),py-(ay+t*dy));
}
export function habitatSupport(lon,lat) {
  if(isLand(lon,lat))return 1;
  let distance=Infinity;
  for(const coast of COASTLINES)for(let i=1;i<coast.length;i++)distance=Math.min(distance,segmentDistance(lon,lat,coast[i-1],coast[i]));
  // Near-shore water retains weak mobile/cable continuity; open ocean does not.
  return .055+.4*Math.exp(-.5*(distance/.52)**2);
}
export function geographyMask(lon, lat) {
  if (inside({ lon, lat }, GB) || inside({ lon, lat }, IRELAND)) return 1;
  return gaussian(lon, lat, -3, 54.5, 4.5, 4.8)*.18*habitatSupport(lon,lat);
}
export function infrastructureWeight(lon, lat) {
  const centres = [
    [-0.1,51.5,1.6],[-2.3,53.5,1.2],[-1.5,52.7,1.1],[-3.2,55.9,1.08],[-4.2,55.8,.93],[-3.65,55.9,.3],[-3.2,51.5,.75],[-1.6,54.9,.7],[-6.3,53.35,.65],[-1.2,50.9,.55]
  ];
  return Math.min(1, centres.reduce((sum, [x,y,w]) => sum + w * gaussian(lon,lat,x,y,1.05,.72), 0));
}
// Synthetic, replaceable population layer. The broad kernels deliberately avoid
// literal city-node rendering; overlapping settlements become continuous habitat.
export function populationDensity(lon, lat) {
  const settlements = [
    [-.13,51.51,1,.72,.52],[-2.24,53.48,.72,.62,.46],[-1.89,52.49,.62,.58,.43],
    [-1.55,53.8,.48,.48,.38],[-2.98,53.41,.43,.46,.36],[-1.47,53.38,.38,.44,.35],
    [-1.61,54.98,.34,.42,.34],[-2.59,51.45,.37,.43,.34],[-3.18,51.48,.3,.4,.32],
    [-3.19,55.95,.42,.5,.38],[-4.25,55.86,.45,.5,.38],[-1.14,52.64,.34,.42,.34],
    [-1.15,50.91,.27,.4,.3],[-.98,50.83,.24,.38,.28],[-.12,52.21,.24,.42,.31],
    [-6.26,53.35,.46,.54,.4],[-5.93,54.6,.27,.4,.31],[-8.47,51.9,.2,.42,.32],
  ];
  const urban=Math.min(1,settlements.reduce((sum,[x,y,w,sx,sy])=>sum+w*gaussian(lon,lat,x,y,sx,sy),0));
  // A low regional floor connects urban concentrations into corridors.
  const corridor=Math.max(
    gaussian(lon,lat,-1.7,52.7,2.25,1.75),
    gaussian(lon,lat,-3.1,55.5,1.65,1.25)*.62,
    gaussian(lon,lat,-7.2,53.3,1.55,1.45)*.48
  );
  return Math.min(1,urban*.82+corridor*.28);
}
export function continentalWeight(lon, lat) {
  return Math.max(
    gaussian(lon,lat,2.4,50.8,2.2,1),
    gaussian(lon,lat,4.4,51.7,1.7,1.1),
    gaussian(lon,lat,5.3,52.4,1.2,1.4)
  );
}
export function preferenceAt(x, y, width, height, config) {
  const { lon, lat } = unproject(x, y, width, height);
  const support=habitatSupport(lon,lat),humanSupport=.12+.88*support;
  return config.geographyWeight*geographyMask(lon,lat)
    + config.infrastructureWeight*infrastructureWeight(lon,lat)*humanSupport
    + config.populationWeight*Math.pow(populationDensity(lon,lat),.68)*humanSupport
    + config.continentalWeight*continentalWeight(lon,lat)*humanSupport;
}
export function geographyGradient(x, y, width, height, config) {
  const d = 4;
  return {
    x: preferenceAt(x + d,y,width,height,config) - preferenceAt(x - d,y,width,height,config),
    y: preferenceAt(x,y + d,width,height,config) - preferenceAt(x,y - d,width,height,config),
  };
}

export const regionalGeography = {
  id: 'regional', project, unproject, isLand, habitatSupport, populationDensity,
  infrastructureWeight, preferenceAt, geographyMask, continentalWeight,
  coastlines: COASTLINES, landPolygons: LAND_POLYGONS,
  openCoastlines: new Set([2]),
};
