/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.canvas.WorkspaceRenderer

import type {WorkspaceSvg} from '../../workspace_svg.js';

/**
 * A workspace renderer that uses Canvas to render the entire workspace.
 */
export class WorkspaceRenderer {
  private workspace: WorkspaceSvg;
  private canvasElement: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private scale: number = 1;
  private scrollX: number = 0;
  private scrollY: number = 0;
  private lastTimestamp: number = 0;
  private animationFrameId: number | null = null;

  /**
   * @param workspace The workspace to render.
   */
  constructor(workspace: WorkspaceSvg) {
    this.workspace = workspace;

    // Create canvas element
    this.canvasElement = document.createElement('canvas');
    this.ctx = this.canvasElement.getContext('2d')!;

    // Set canvas properties
    this.canvasElement.className = 'blocklyWorkspaceCanvas';
    this.canvasElement.style.position = 'absolute';
    this.canvasElement.style.top = '0';
    this.canvasElement.style.left = '0';
    this.canvasElement.style.zIndex = '0';

    // Append to workspace container
    const svgGroup = workspace.getSvgGroup();
    if (svgGroup.parentElement) {
      svgGroup.parentElement.insertBefore(this.canvasElement, svgGroup);
    }

    // Initialize
    this.updateCanvasSize();
    this.updateScale();
    this.updateScroll();

    // Start animation loop
    this.startAnimationLoop();
  }

  /**
   * Update the canvas size to match the workspace.
   */
  updateCanvasSize() {
    const metrics = this.workspace.getMetrics();
    if (metrics) {
      this.canvasElement.width = metrics.viewWidth;
      this.canvasElement.height = metrics.viewHeight;
    }
  }

  /**
   * Update the scale factor.
   */
  updateScale() {
    this.scale = this.workspace.getScale();
  }

  /**
   * Update the scroll position.
   */
  updateScroll() {
    this.scrollX = this.workspace.scrollX;
    this.scrollY = this.workspace.scrollY;
  }

  /**
   * Start the animation loop for continuous rendering.
   */
  startAnimationLoop() {
    const animate = (timestamp: number) => {
      if (this.lastTimestamp === 0) {
        this.lastTimestamp = timestamp;
      }

      const deltaTime = timestamp - this.lastTimestamp;
      this.lastTimestamp = timestamp;

      // Render workspace
      this.render(deltaTime);

      // Continue animation loop
      this.animationFrameId = requestAnimationFrame(animate);
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Render the workspace.
   *
   * @param deltaTime Time since last render in milliseconds.
   */
  render(_deltaTime: number) {
    if (!this.ctx) return;

    // Clear canvas
    this.ctx.clearRect(
      0,
      0,
      this.canvasElement.width,
      this.canvasElement.height,
    );

    // Save context state
    this.ctx.save();

    // Apply scale and scroll transformations
    this.ctx.scale(this.scale, this.scale);
    this.ctx.translate(-this.scrollX, -this.scrollY);

    // Render all blocks
    this.renderBlocks();

    // Restore context state
    this.ctx.restore();
  }

  /**
   * Render all blocks in the workspace.
   */
  renderBlocks() {
    if (!this.ctx) return;

    const blocks = this.workspace.getAllBlocks(false);

    for (const block of blocks) {
      // For each block, get its Canvas path object and render it
      const pathObject = (block as any).pathObject;
      if (pathObject && pathObject.getCanvas) {
        const blockCanvas = pathObject.getCanvas();
        if (blockCanvas) {
          // Get block position
          const pos = block.getRelativeToSurfaceXY();

          // Draw the block canvas onto the workspace canvas
          this.ctx.drawImage(blockCanvas, pos.x, pos.y);
        }
      }
    }
  }

  /**
   * Handle workspace resize.
   */
  onResize() {
    this.updateCanvasSize();
  }

  /**
   * Handle scale change.
   */
  onScaleChange() {
    this.updateScale();
  }

  /**
   * Handle scroll change.
   */
  onScrollChange() {
    this.updateScroll();
  }

  /**
   * Dispose of the workspace renderer.
   */
  dispose() {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.canvasElement.parentElement) {
      this.canvasElement.parentElement.removeChild(this.canvasElement);
    }
  }
}
