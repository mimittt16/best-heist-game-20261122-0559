// Security cameras: wall-mounted, sweeping a cone back and forth. An EMP
// freezes them dark for a while; while dark they see nothing.
import { CAMERA } from './config.js';
import { hasLineOfSight } from './world.js';

export function createCamera(x, y, baseAngle, sweepArc) {
  return {
    x,
    y,
    baseAngle, // centre of the sweep, radians
    sweepArc, // total sweep width, radians
    phase: Math.random() * Math.PI * 2,
    angle: baseAngle,
    disabledTimer: 0,
  };
}

export function updateCamera(camera, dt) {
  if (camera.disabledTimer > 0) {
    camera.disabledTimer -= dt;
    return;
  }
  camera.phase += CAMERA.sweepSpeed * dt;
  camera.angle = camera.baseAngle + Math.sin(camera.phase) * (camera.sweepArc / 2);
}

export function disableCameras(cameras, seconds) {
  for (const c of cameras) c.disabledTimer = seconds;
}

export function cameraSees(camera, x, y, smokes) {
  if (camera.disabledTimer > 0) return false;
  const dx = x - camera.x;
  const dy = y - camera.y;
  const dist = Math.hypot(dx, dy);
  if (dist > CAMERA.range) return false;
  const targetAngle = Math.atan2(dy, dx);
  let diff = targetAngle - camera.angle;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  if (Math.abs(diff) > CAMERA.coneHalfAngle) return false;
  if (!hasLineOfSight(camera.x, camera.y, x, y)) return false;
  for (const s of smokes) {
    const mx = (camera.x + x) / 2;
    const my = (camera.y + y) / 2;
    const sdx = mx - s.x;
    const sdy = my - s.y;
    if (sdx * sdx + sdy * sdy < s.radius * s.radius) return false;
  }
  return true;
}
