// Guards: waypoint patrols, vision cones, and investigating noises.
// A guard never teleports: it walks its loop, turns to face its walk
// direction, and only leaves the loop to check a sound or a sighting.
import { GUARD } from './config.js';
import { hasLineOfSight } from './world.js';

export function createGuard(waypoints, startIndex = 0) {
  return {
    waypoints,
    waypointIndex: startIndex,
    x: waypoints[startIndex].x,
    y: waypoints[startIndex].y,
    angle: 0,
    mode: 'patrol', // patrol | investigate | look
    target: null,
    lookTimer: 0,
    pauseTimer: 0,
  };
}

function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

function turnToward(guard, targetAngle, dt) {
  let diff = targetAngle - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  const step = 4.5 * dt;
  guard.angle += Math.max(-step, Math.min(step, diff));
}

function walkToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  turnToward(guard, angleTo(guard.x, guard.y, tx, ty), dt);
  return dist - step < 2;
}

export function updateGuard(guard, dt) {
  if (guard.mode === 'patrol') {
    const wp = guard.waypoints[guard.waypointIndex];
    if (walkToward(guard, wp.x, wp.y, GUARD.walkSpeed, dt)) {
      guard.waypointIndex = (guard.waypointIndex + 1) % guard.waypoints.length;
    }
  } else if (guard.mode === 'investigate' && guard.target) {
    if (walkToward(guard, guard.target.x, guard.target.y, GUARD.investigateSpeed, dt)) {
      guard.mode = 'look';
      guard.lookTimer = GUARD.lookAroundSeconds;
    }
  } else if (guard.mode === 'look') {
    guard.lookTimer -= dt;
    guard.angle += 1.6 * dt; // scan the room while looking
    if (guard.lookTimer <= 0) {
      // Walk back to the nearest waypoint and resume the patrol.
      let best = 0;
      let bestDist = Infinity;
      guard.waypoints.forEach((wp, i) => {
        const d = Math.hypot(wp.x - guard.x, wp.y - guard.y);
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      guard.waypointIndex = best;
      guard.mode = 'patrol';
    }
  }
}

// Send a guard to check a point (coin clink or last seen position).
export function sendGuardTo(guard, x, y) {
  if (guard.mode === 'investigate') return;
  guard.mode = 'investigate';
  guard.target = { x, y };
}

// Is the point inside this guard's live vision cone?
export function guardSees(guard, x, y, smokes) {
  const dx = x - guard.x;
  const dy = y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD.coneRange) return false;
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - guard.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > GUARD.coneHalfAngle) return false;
  if (!hasLineOfSight(guard.x, guard.y, x, y)) return false;
  // Smoke hides the thief even inside the cone.
  for (const s of smokes) {
    const mx = (guard.x + x) / 2;
    const my = (guard.y + y) / 2;
    const sdx = mx - s.x;
    const sdy = my - s.y;
    if (sdx * sdx + sdy * sdy < s.radius * s.radius) return false;
  }
  return true;
}

// Touching a guard is an instant bust, cone or no cone.
export function guardTouches(guard, x, y, radius) {
  return Math.hypot(x - guard.x, y - guard.y) < GUARD.radius + radius;
}
