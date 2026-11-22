// Keyboard + mouse input. Tracks held keys, the mouse position in canvas
// pixels, and click-to-throw requests the player consumes.
export function createInput(canvas) {
  const input = {
    keys: new Set(),
    mouse: { x: 0, y: 0 },
    clickQueue: [], // {x, y} in canvas pixels, consumed by the player
    pressed: new Set(), // edge-triggered keys, consumed by the game
  };

  function canvasPoint(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  }

  window.addEventListener('keydown', (event) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
      event.preventDefault();
    }
    input.keys.add(event.key.toLowerCase());
    input.pressed.add(event.key.toLowerCase());
  });
  window.addEventListener('keyup', (event) => {
    input.keys.delete(event.key.toLowerCase());
  });
  canvas.addEventListener('mousemove', (event) => {
    input.mouse = canvasPoint(event.clientX, event.clientY);
  });
  canvas.addEventListener('mousedown', (event) => {
    input.clickQueue.push(canvasPoint(event.clientX, event.clientY));
  });
  window.addEventListener('blur', () => input.keys.clear());

  return input;
}

export function moveDirection(input) {
  let x = 0;
  let y = 0;
  if (input.keys.has('a') || input.keys.has('arrowleft')) x -= 1;
  if (input.keys.has('d') || input.keys.has('arrowright')) x += 1;
  if (input.keys.has('w') || input.keys.has('arrowup')) y -= 1;
  if (input.keys.has('s') || input.keys.has('arrowdown')) y += 1;
  if (x !== 0 && y !== 0) {
    const inv = 1 / Math.sqrt(2);
    x *= inv;
    y *= inv;
  }
  return { x, y };
}

export function isSneaking(input) {
  return input.keys.has('shift');
}

export function takePressed(input, key) {
  if (input.pressed.has(key)) {
    input.pressed.delete(key);
    return true;
  }
  return false;
}

export function clearPressed(input) {
  input.pressed.clear();
}
