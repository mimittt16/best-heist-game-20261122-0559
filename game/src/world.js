// The gallery room: walls, cover, loot spots and the exit. Every obstacle is
// a rectangle; `blocksSight` decides whether a vision cone can see past it
// (velvet ropes are waist-high: they block feet, not eyes).
import { ROOM } from './config.js';

export const OBSTACLES = [
  // Display cases along the top wall.
  { x: 180, y: 108, w: 150, h: 58, kind: 'case', blocksSight: true },
  { x: 560, y: 108, w: 150, h: 58, kind: 'case', blocksSight: true },
  { x: 748, y: 108, w: 148, h: 58, kind: 'case', blocksSight: true },
  // Display cases along the bottom.
  { x: 180, y: 508, w: 150, h: 58, kind: 'case', blocksSight: true },
  { x: 610, y: 508, w: 150, h: 58, kind: 'case', blocksSight: true },
  // Marble pillars.
  { x: 300, y: 292, w: 46, h: 46, kind: 'pillar', blocksSight: true },
  { x: 618, y: 292, w: 46, h: 46, kind: 'pillar', blocksSight: true },
  // Statues on plinths.
  { x: 428, y: 176, w: 64, h: 46, kind: 'statue', blocksSight: true },
  { x: 428, y: 424, w: 64, h: 46, kind: 'statue', blocksSight: true },
  // Velvet ropes: low cover, block movement only.
  { x: 150, y: 428, w: 200, h: 10, kind: 'rope', blocksSight: false },
  { x: 612, y: 428, w: 200, h: 10, kind: 'rope', blocksSight: false },
];

export const LOOT_SPOTS = [
  { id: 'sapphire', name: 'Star Sapphire', x: 822, y: 137, value: 500, main: true },
  { id: 'mask', name: 'Golden Mask', x: 255, y: 537, value: 200, main: false },
  { id: 'vase', name: 'Jade Vase', x: 685, y: 537, value: 150, main: false },
];

export const EXIT_DOOR = { x: 36, y: 606, w: 76, h: 26 };
export const SPAWN = { x: 74, y: 576 };

// Circle (px, py, radius) pushed out of every obstacle and the room walls.
export function collideCircle(pos, radius) {
  pos.x = Math.max(ROOM.x + radius, Math.min(ROOM.x + ROOM.width - radius, pos.x));
  pos.y = Math.max(ROOM.y + radius, Math.min(ROOM.y + ROOM.height - radius, pos.y));
  for (const o of OBSTACLES) {
    const cx = Math.max(o.x, Math.min(pos.x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(pos.y, o.y + o.h));
    const dx = pos.x - cx;
    const dy = pos.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < radius * radius) {
      if (d2 > 0.0001) {
        const d = Math.sqrt(d2);
        pos.x = cx + (dx / d) * radius;
        pos.y = cy + (dy / d) * radius;
      } else {
        pos.y = o.y - radius; // dead centre: push up out of the block
      }
    }
  }
}

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  if (Math.abs(dx) < 1e-9) {
    if (x1 < r.x || x1 > r.x + r.w) return false;
  } else {
    let t1 = (r.x - x1) / dx;
    let t2 = (r.x + r.w - x1) / dx;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  if (Math.abs(dy) < 1e-9) {
    if (y1 < r.y || y1 > r.y + r.h) return false;
  } else {
    let t1 = (r.y - y1) / dy;
    let t2 = (r.y + r.h - y1) / dy;
    if (t1 > t2) [t1, t2] = [t2, t1];
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// True when nothing sight-blocking stands between the two points.
export function hasLineOfSight(x1, y1, x2, y2) {
  for (const o of OBSTACLES) {
    if (!o.blocksSight) continue;
    if (segmentHitsRect(x1, y1, x2, y2, o)) return false;
  }
  return true;
}

// True when the point sits inside a smoke cloud (cones cannot see through).
export function insideSmoke(x, y, smokes) {
  for (const s of smokes) {
    const dx = x - s.x;
    const dy = y - s.y;
    if (dx * dx + dy * dy < s.radius * s.radius) return true;
  }
  return false;
}
