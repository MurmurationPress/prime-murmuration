export class SpatialGrid {
  constructor(cellSize) { this.cellSize = cellSize; this.cells = new Map(); }
  rebuild(agents) {
    this.cells.clear();
    for (const agent of agents) {
      const key = this.key(agent.x, agent.y);
      let cell = this.cells.get(key);
      if (!cell) this.cells.set(key, cell = []);
      cell.push(agent);
    }
  }
  key(x,y) { return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`; }
  nearby(x,y) {
    const cx = Math.floor(x / this.cellSize), cy = Math.floor(y / this.cellSize), found = [];
    for (let oy=-1; oy<=1; oy++) for (let ox=-1; ox<=1; ox++) {
      const cell = this.cells.get(`${cx+ox},${cy+oy}`);
      if (cell) found.push(...cell);
    }
    return found;
  }
}
