/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating JavaScript for canvas blocks.
 */

// Former goog.module ID: Blockly.JavaScript.canvas

import type {Block} from '../../core/block.js';
import type {JavascriptGenerator} from './javascript_generator.js';
import {Order} from './javascript_generator.js';

export function canvas_create(
  block: Block,
  generator: JavascriptGenerator
): string {
  const width = block.getFieldValue('WIDTH');
  const height = block.getFieldValue('HEIGHT');
  return `const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = ${width};
canvas.height = ${height};
canvas.style.border = '1px solid #ccc';
// 将画布添加到页面
const container = document.getElementById('canvas-container') || document.body;
container.innerHTML = '';
container.appendChild(canvas);
`;
}

export function canvas_draw_line(
  block: Block,
  generator: JavascriptGenerator
): string {
  const x1 = generator.valueToCode(block, 'X1', Order.NONE) || '0';
  const y1 = generator.valueToCode(block, 'Y1', Order.NONE) || '0';
  const x2 = generator.valueToCode(block, 'X2', Order.NONE) || '0';
  const y2 = generator.valueToCode(block, 'Y2', Order.NONE) || '0';
  return `ctx.beginPath();
ctx.moveTo(${x1}, ${y1});
ctx.lineTo(${x2}, ${y2});
ctx.stroke();
`;
}

export function canvas_draw_rect(
  block: Block,
  generator: JavascriptGenerator
): string {
  const x = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const y = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  const width = generator.valueToCode(block, 'WIDTH', Order.NONE) || '0';
  const height = generator.valueToCode(block, 'HEIGHT', Order.NONE) || '0';
  return `ctx.strokeRect(${x}, ${y}, ${width}, ${height});
`;
}

export function canvas_draw_circle(
  block: Block,
  generator: JavascriptGenerator
): string {
  const x = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const y = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  const radius = generator.valueToCode(block, 'RADIUS', Order.NONE) || '0';
  return `ctx.beginPath();
ctx.arc(${x}, ${y}, ${radius}, 0, Math.PI * 2);
ctx.stroke();
`;
}

export function canvas_draw_text(
  block: Block,
  generator: JavascriptGenerator
): string {
  const text = generator.valueToCode(block, 'TEXT', Order.NONE) || "''";
  const x = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const y = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return `ctx.strokeText(${text}, ${x}, ${y});
`;
}

export function canvas_set_fill_color(
  block: Block,
  generator: JavascriptGenerator
): string {
  const color = generator.quote_(block.getFieldValue('COLOR'));
  return `ctx.fillStyle = ${color};
`;
}

export function canvas_set_stroke_color(
  block: Block,
  generator: JavascriptGenerator
): string {
  const color = generator.quote_(block.getFieldValue('COLOR'));
  return `ctx.strokeStyle = ${color};
`;
}

export function canvas_set_line_width(
  block: Block,
  generator: JavascriptGenerator
): string {
  const width = block.getFieldValue('WIDTH');
  return `ctx.lineWidth = ${width};
`;
}

export function canvas_set_line_style(
  block: Block,
  generator: JavascriptGenerator
): string {
  const style = block.getFieldValue('STYLE');
  if (style === 'SOLID') {
    return `ctx.setLineDash([]);
`;
  } else {
    return `ctx.setLineDash([5, 5]);
`;
  }
}

export function canvas_set_font_size(
  block: Block,
  generator: JavascriptGenerator
): string {
  const size = block.getFieldValue('SIZE');
  return `ctx.font = '${size}px sans-serif';
`;
}

export function canvas_move_to(
  block: Block,
  generator: JavascriptGenerator
): string {
  const x = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const y = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return `ctx.beginPath();
ctx.moveTo(${x}, ${y});
`;
}

export function canvas_line_to(
  block: Block,
  generator: JavascriptGenerator
): string {
  const x = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const y = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return `ctx.lineTo(${x}, ${y});
`;
}

export function canvas_rotate(
  block: Block,
  generator: JavascriptGenerator
): string {
  const angle = generator.valueToCode(block, 'ANGLE', Order.NONE) || '0';
  return `ctx.rotate(${angle} * Math.PI / 180);
`;
}

export function canvas_clear(
  block: Block,
  generator: JavascriptGenerator
): string {
  return `ctx.clearRect(0, 0, canvas.width, canvas.height);
`;
}

export function canvas_save(
  block: Block,
  generator: JavascriptGenerator
): string {
  return `ctx.save();
`;
}

export function canvas_restore(
  block: Block,
  generator: JavascriptGenerator
): string {
  return `ctx.restore();
`;
}

export function canvas_load_image(
  block: Block,
  generator: JavascriptGenerator
): [string, Order] {
  const url = generator.valueToCode(block, 'URL', Order.NONE) || "''";
  const code = `(() => { const img = new Image(); img.src = ${url}; return img; })()`;
  return [code, Order.FUNCTION_CALL];
}

export function canvas_draw_image(
  block: Block,
  generator: JavascriptGenerator
): string {
  const image = generator.valueToCode(block, 'IMAGE', Order.NONE) || 'null';
  const x = generator.valueToCode(block, 'X', Order.NONE) || '0';
  const y = generator.valueToCode(block, 'Y', Order.NONE) || '0';
  return `${image}.onload = () => ctx.drawImage(${image}, ${x}, ${y});
`;
}

export function canvas_animation(
  block: Block,
  generator: JavascriptGenerator
): string {
  const fps = block.getFieldValue('FPS');
  const code = generator.statementToCode(block, 'CODE');
  const interval = 1000 / fps;
  return `let lastTime = 0;
function animateCanvas(timestamp) {
  if (timestamp - lastTime >= ${interval}) {
    ${code}
    lastTime = timestamp;
  }
  requestAnimationFrame(animateCanvas);
}
requestAnimationFrame(animateCanvas);
`;
}