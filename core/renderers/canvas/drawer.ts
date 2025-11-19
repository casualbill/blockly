/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.canvas.Drawer

import type {BlockSvg} from '../../block_svg.js';
import {Drawer as BaseDrawer} from '../common/drawer.js';
import type {RenderInfo} from '../common/info.js';

/**
 * An object that draws a block based on the given rendering information using Canvas.
 */
export class Drawer extends BaseDrawer {
  /**
   * @param block The block to render.
   * @param info An object containing all information needed to render this
   *     block.
   */
  constructor(block: BlockSvg, info: RenderInfo) {
    super(block, info);
  }

  /**
   * Draw the block to the workspace using Canvas.
   */
  override draw() {
    // First let the base class calculate all the rendering information
    this.drawOutline_();
    this.drawInternals_();
    this.updateConnectionHighlights();

    // Then render using Canvas
    this.renderToCanvas_();

    this.recordSizeOnBlock_();
  }

  /**
   * Render the block to Canvas.
   */
  protected renderToCanvas_() {
    const block = this.block_;
    const pathObject = block.pathObject as any;

    // Get the canvas context
    const canvas = pathObject.getCanvas();
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear previous drawing
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Set the path
    const fullPath = this.outlinePath_ + ' ' + this.inlinePath_;

    // Render the path using Canvas
    this.drawPath_(ctx, fullPath, this.info_.RTL);

    // Apply color
    ctx.fillStyle = block.pathObject.style.colourPrimary;
    ctx.strokeStyle = block.pathObject.style.colourTertiary;
    ctx.lineWidth = 2;

    ctx.fill();
    ctx.stroke();
  }

  /**
   * Draw an SVG path string to Canvas.
   *
   * @param ctx Canvas context.
   * @param pathString SVG path string.
   * @param rtl Whether to flip the path for RTL.
   */
  protected drawPath_(
    ctx: CanvasRenderingContext2D,
    pathString: string,
    rtl: boolean,
  ) {
    // Convert SVG path commands to Canvas commands
    const commands = this.parsePathString_(pathString);

    ctx.beginPath();

    for (const command of commands) {
      const {type, points} = command;

      if (rtl) {
        // Flip points for RTL
        for (let i = 0; i < points.length; i += 2) {
          points[i] = -points[i];
        }
      }

      switch (type) {
        case 'M':
          ctx.moveTo(points[0], points[1]);
          break;
        case 'm':
          ctx.moveTo(points[0], points[1]);
          break;
        case 'L':
          ctx.lineTo(points[0], points[1]);
          break;
        case 'l':
          ctx.lineTo(points[0], points[1]);
          break;
        case 'C':
          ctx.bezierCurveTo(
            points[0],
            points[1],
            points[2],
            points[3],
            points[4],
            points[5],
          );
          break;
        case 'c':
          ctx.bezierCurveTo(
            points[0],
            points[1],
            points[2],
            points[3],
            points[4],
            points[5],
          );
          break;
        case 'Z':
          ctx.closePath();
          break;
        case 'z':
          ctx.closePath();
          break;
        // Handle other path commands as needed
      }
    }
  }

  /**
   * Parse an SVG path string into commands.
   *
   * @param pathString SVG path string.
   * @returns Array of path commands.
   */
  protected parsePathString_(
    pathString: string,
  ): Array<{type: string; points: number[]}> {
    const commands: Array<{type: string; points: number[]}> = [];
    const regex = /([a-zA-Z])([^a-zA-Z]*)/g;
    let match;

    while ((match = regex.exec(pathString)) !== null) {
      const type = match[1];
      const pointString = match[2];
      const points = this.parsePoints_(pointString);

      commands.push({type, points});
    }

    return commands;
  }

  /**
   * Parse a string of points into an array of numbers.
   *
   * @param pointString String of points separated by spaces and commas.
   * @returns Array of numbers.
   */
  protected parsePoints_(pointString: string): number[] {
    const points: number[] = [];
    const regex = /[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g;
    let match;

    while ((match = regex.exec(pointString)) !== null) {
      points.push(parseFloat(match[0]));
    }

    return points;
  }
}
