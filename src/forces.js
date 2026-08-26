export function limit(vector, maximum) {
  const mag = Math.hypot(vector.x, vector.y);
  if (mag > maximum && mag > 0) { vector.x = vector.x / mag * maximum; vector.y = vector.y / mag * maximum; }
  return vector;
}
export function steerToward(dx, dy, vx, vy, maxSpeed, maxForce) {
  const mag = Math.hypot(dx, dy) || 1;
  return limit({ x: dx / mag * maxSpeed - vx, y: dy / mag * maxSpeed - vy }, maxForce);
}
export function flock(agent, neighbours, config, modulation=1) {
  let count=0, close=0, cx=0, cy=0, ax=0, ay=0, sx=0, sy=0;
  const nr2=config.neighbourRadius**2, sr2=config.separationRadius**2;
  for (const other of neighbours) {
    if (other === agent) continue;
    const dx=other.x-agent.x, dy=other.y-agent.y, d2=dx*dx+dy*dy;
    if (d2 > nr2 || d2 === 0) continue;
    count++; cx+=other.x; cy+=other.y; ax+=other.vx; ay+=other.vy;
    if (d2 < sr2) { close++; sx-=dx/d2; sy-=dy/d2; }
  }
  let cohesion={x:0,y:0}, alignment={x:0,y:0}, separation={x:0,y:0};
  if (count) {
    cohesion=steerToward(cx/count-agent.x,cy/count-agent.y,agent.vx,agent.vy,config.maxSpeed,config.maxForce);
    alignment=steerToward(ax/count,ay/count,agent.vx,agent.vy,config.maxSpeed,config.maxForce);
    const avgMag=Math.hypot(ax/count,ay/count), ownMag=Math.hypot(agent.vx,agent.vy);
    agent.coherence = ownMag && avgMag ? Math.max(0,(agent.vx*(ax/count)+agent.vy*(ay/count))/(ownMag*avgMag)) : 0;
  } else agent.coherence *= .94;
  if (close) separation=steerToward(sx/close,sy/close,agent.vx,agent.vy,config.maxSpeed,config.maxForce*1.4);
  return {
    x: cohesion.x*config.cohesionWeight*modulation + alignment.x*config.alignmentWeight*modulation + separation.x*config.separationWeight,
    y: cohesion.y*config.cohesionWeight*modulation + alignment.y*config.alignmentWeight*modulation + separation.y*config.separationWeight,
    density: count / 18,
  };
}

// A continuous, time-varying vector field encourages exchange between densities.
// It contains no routes or destinations: nearby agents merely experience similar drift.
export function migrationField(agent,time,config) {
  const a=Math.sin(agent.y*.0105+time*.41)+Math.cos(agent.x*.008-time*.29)*.72;
  const b=Math.sin((agent.x+agent.y)*.0055-time*.23)*.45;
  const angle=a+b;
  const desired=steerToward(Math.cos(angle),Math.sin(angle),agent.vx,agent.vy,config.maxSpeed,config.maxForce);
  const exchange=.38+agent.mobility*.62;
  return {x:desired.x*config.interClusterMigrationWeight*exchange,y:desired.y*config.interClusterMigrationWeight*exchange};
}
