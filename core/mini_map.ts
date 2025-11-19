/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object representing a mini map (thumbnail) for the workspace.
 *
 * @class
 */

import * as browserEvents from './browser_events.js';
import {ComponentManager} from './component_manager.js';
import * as Css from './css.js';
import type {IPositionable} from './interfaces/i_positionable.js';
import type {UiMetrics} from './metrics_manager.js';
import * as uiPosition from './positionable_helpers.js';
import * as dom from './utils/dom.js';
import {Rect} from './utils/rect.js';
import {Size} from './utils/size.js';
import {Svg} from './utils/svg.js';
import type {WorkspaceSvg} from './workspace_svg.js';
import type {BlockSvg} from './block_svg.js';
import type {Coordinate} from './utils/coordinate.js';

/**
 * Class for a mini map.
 */
export class MiniMap implements IPositionable {
  /**
   * The unique ID for this component that is used to register with the
   * ComponentManager.
   */
  id = 'miniMap';

  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   * Ex: [[node, name, func], [node, name, func]].
   */
  private boundEvents: browserEvents.Data[] = [];

  /** The SVG group containing the mini map. */
  private svgGroup: SVGElement | null = null;

  /** The SVG element containing the mini map view. */
  private miniMapSvg: SVGSVGElement | null = null;

  /** The SVG group containing the workspace preview. */
  private previewGroup: SVGGElement | null = null;

  /** The SVG rectangle representing the current viewport. */
  private viewportRect: SVGRectElement | null = null;

  /** The SVG group containing the toggle button. */
  private toggleButton: SVGGElement | null = null;

  /** The SVG group containing the zoom controls. */
  private zoomControls: SVGGElement | null = null;

  /** Width of the mini map. */
  private readonly WIDTH = 200;

  /** Height of the mini map. */
  private readonly HEIGHT = 150;

  /** Distance between mini map and top edge of workspace. */
  private readonly MARGIN_TOP = 20;

  /** Distance between mini map and right edge of workspace. */
  private readonly MARGIN_RIGHT = 20;

  /** Scale factor for the mini map (default 25%). */
  private scaleFactor = 0.25;

  /** Whether the mini map is expanded or collapsed. */
  private isExpanded = true;

  /** Left coordinate of the mini map. */
  private left = 0;

  /** Top coordinate of the mini map. */
  private top = 0;

  /** Whether this has been initialized. */
  private initialized = false;

  /** @param workspace The workspace to sit in. */
  constructor(private readonly workspace: WorkspaceSvg) {}

  /**
   * Create the mini map.
   *
   * @returns The mini map SVG group.
   */
  createDom(): SVGElement {
    this.svgGroup = dom.createSvgElement(Svg.G, {'class': 'blocklyMiniMap'});

    // Create mini map container
    this.miniMapSvg = dom.createSvgElement(Svg.SVG, {
      'width': this.WIDTH,
      'height': this.HEIGHT,
      'class': 'blocklyMiniMapSvg',
      'style': 'border: 1px solid #ccc; background-color: #f5f5f5;'
    }, this.svgGroup);

    // Create preview group
    this.previewGroup = dom.createSvgElement(Svg.G, {
      'class': 'blocklyMiniMapPreview',
      'transform': `scale(${this.scaleFactor})`
    }, this.miniMapSvg);

    // Create viewport rectangle
    this.viewportRect = dom.createSvgElement(Svg.RECT, {
      'class': 'blocklyMiniMapViewport',
      'fill': 'rgba(0, 150, 255, 0.3)',
      'stroke': '#0096ff',
      'stroke-width': 2
    }, this.miniMapSvg);

    // Create toggle button
    this.toggleButton = dom.createSvgElement(Svg.G, {
      'class': 'blocklyMiniMapToggle'
    }, this.svgGroup);

    // Create zoom in button
    const zoomInBtn = dom.createSvgElement(Svg.CIRCLE, {
      'class': 'blocklyMiniMapZoomIn',
      'cx': this.WIDTH - 20,
      'cy': 35,
      'r': 8,
      'fill': '#4285F4',
      'cursor': 'pointer'
    }, this.svgGroup);
    const zoomInText = dom.createSvgElement(Svg.TEXT, {
      'x': this.WIDTH - 20,
      'y': 39,
      'font-size': '12px',
      'text-anchor': 'middle',
      'fill': 'white',
      'cursor': 'pointer'
    }, this.svgGroup);
    zoomInText.textContent = '+';

    // Create zoom out button
    const zoomOutBtn = dom.createSvgElement(Svg.CIRCLE, {
      'class': 'blocklyMiniMapZoomOut',
      'cx': this.WIDTH - 20,
      'cy': 55,
      'r': 8,
      'fill': '#4285F4',
      'cursor': 'pointer'
    }, this.svgGroup);
    const zoomOutText = dom.createSvgElement(Svg.TEXT, {
      'x': this.WIDTH - 20,
      'y': 59,
      'font-size': '12px',
      'text-anchor': 'middle',
      'fill': 'white',
      'cursor': 'pointer'
    }, this.svgGroup);
    zoomOutText.textContent = '-';

    // Initialize event listeners
    this.initEventListeners();

    // Add zoom event listeners
    const zoomStep = 0.25;
    const minScale = 0.25;
    const maxScale = 4;

    const zoomInHandler = browserEvents.conditionalBind(
      zoomInBtn, 'click', this, () => {
        const newScale = Math.min(this.workspace.scale + zoomStep, maxScale);
        this.workspace.scale = newScale;
      });
    this.boundEvents.push(zoomInHandler);

    const zoomInTextHandler = browserEvents.conditionalBind(
      zoomInText, 'click', this, () => {
        const newScale = Math.min(this.workspace.scale + zoomStep, maxScale);
        this.workspace.scale = newScale;
      });
    this.boundEvents.push(zoomInTextHandler);

    const zoomOutHandler = browserEvents.conditionalBind(
      zoomOutBtn, 'click', this, () => {
        const newScale = Math.max(this.workspace.scale - zoomStep, minScale);
        this.workspace.scale = newScale;
      });
    this.boundEvents.push(zoomOutHandler);

    const zoomOutTextHandler = browserEvents.conditionalBind(
      zoomOutText, 'click', this, () => {
        const newScale = Math.max(this.workspace.scale - zoomStep, minScale);
        this.workspace.scale = newScale;
      });
    this.boundEvents.push(zoomOutTextHandler);

    return this.svgGroup;
  }

  /**
   * Initializes the mini map event listeners.
   */
  private initEventListeners(): void {
    // Click on mini map to scroll
    if (this.miniMapSvg) {
      const clickHandler = browserEvents.conditionalBind(
          this.miniMapSvg, 'click', this, (e: PointerEvent) => {
            this.handleMiniMapClick(e);
          });
      this.boundEvents.push(clickHandler);
    }

    // Drag viewport rectangle
    if (this.viewportRect) {
      let isDragging = false;
      let startX = 0;
      let startY = 0;
      let startScrollX = 0;
      let startScrollY = 0;

      const dragStartHandler = browserEvents.conditionalBind(
          this.viewportRect, 'pointerdown', this, (e: PointerEvent) => {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            const metrics = this.workspace.getMetricsManager().getMetrics();
            startScrollX = this.workspace.scrollX;
            startScrollY = this.workspace.scrollY;
            e.preventDefault();
            e.stopPropagation();
          });
      this.boundEvents.push(dragStartHandler);

      const dragMoveHandler = browserEvents.conditionalBind(
          document, 'pointermove', this, (e: PointerEvent) => {
            if (!isDragging) return;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            const scrollDeltaX = deltaX / this.scaleFactor;
            const scrollDeltaY = deltaY / this.scaleFactor;
            this.workspace.scroll(startScrollX + scrollDeltaX, startScrollY + scrollDeltaY);
            e.preventDefault();
            e.stopPropagation();
          });
      this.boundEvents.push(dragMoveHandler);

      const dragEndHandler = browserEvents.conditionalBind(
          document, 'pointerup', this, () => {
            isDragging = false;
          });
      this.boundEvents.push(dragEndHandler);
    }
  }

  /**
   * Handles a click on the mini map.
   *
   * @param e A pointer event.
   */
  private handleMiniMapClick(e: PointerEvent): void {
    if (e.target === this.viewportRect) return;

    // Calculate click position in mini map
    const rect = this.miniMapSvg!.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Convert to workspace coordinates
    const workspaceX = clickX / this.scaleFactor;
    const workspaceY = clickY / this.scaleFactor;

    // Calculate scroll position to center the click
    const metrics = this.workspace.getMetricsManager().getMetrics();
    const scrollX = workspaceX - metrics.viewWidth / 2;
    const scrollY = workspaceY - metrics.viewHeight / 2;

    this.workspace.scroll(scrollX, scrollY);
  }

  /**
   * Initializes the mini map.
   */
  init(): void {
    console.log('MiniMap init started');
    this.workspace.getComponentManager().addComponent({
      component: this,
      weight: ComponentManager.ComponentWeight.ZOOM_CONTROLS_WEIGHT + 1,
      capabilities: [ComponentManager.Capability.POSITIONABLE],
    });
    this.initialized = true;

    // Update mini map when workspace changes
    this.workspace.addChangeListener(() => this.update());
  }

  /**
   * Disposes of this mini map.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose(): void {
    this.workspace.getComponentManager().removeComponent('miniMap');
    if (this.svgGroup) {
      dom.removeNode(this.svgGroup);
    }
    for (const event of this.boundEvents) {
      browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The UI elements's bounding box. Null if bounding box should be
   *     ignored by other UI elements.
   */
  getBoundingRectangle(): Rect | null {
    const width = this.isExpanded ? this.WIDTH : 20;
    const height = this.isExpanded ? this.HEIGHT : 20;
    const bottom = this.top + height;
    const right = this.left + width;
    return new Rect(this.top, bottom, this.left, right);
  }

  /**
   * Positions the mini map.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that are already on the workspace.
   */
  position(metrics: UiMetrics, savedPositions: Rect[]): void {
    // Not yet initialized.
    if (!this.initialized) {
      return;
    }

    // Position in the top-right corner
    const cornerPosition = {
      horizontal: uiPosition.horizontalPosition.RIGHT,
      vertical: uiPosition.verticalPosition.TOP
    };

    const size = new Size(this.WIDTH, this.HEIGHT);
    const startRect = uiPosition.getStartPositionRect(
      cornerPosition,
      size,
      this.MARGIN_RIGHT,
      this.MARGIN_TOP,
      metrics,
      this.workspace
    );
    console.log('MiniMap startRect:', startRect);

    const positionRect = uiPosition.bumpPositionRect(
      startRect,
      this.MARGIN_TOP,
      uiPosition.bumpDirection.DOWN,
      savedPositions
    );

    this.top = positionRect.top;
    this.left = positionRect.left;
    this.svgGroup?.setAttribute(
      'transform',
      'translate(' + this.left + ',' + this.top + ')'
    );
  }

  /**
   * Updates the mini map to reflect the current workspace state.
   */
  update(): void {
    if (!this.previewGroup || !this.viewportRect || !this.miniMapSvg) return;

    // Clear previous preview
    while (this.previewGroup.firstChild) {
      this.previewGroup.removeChild(this.previewGroup.firstChild);
    }

    // Get workspace metrics
    const metrics = this.workspace.getMetricsManager().getMetrics();

    // Update preview group transform to account for scaling and translation
    const translateX = -this.workspace.scrollX * this.scaleFactor;
    const translateY = -this.workspace.scrollY * this.scaleFactor;
    this.previewGroup.setAttribute(
      'transform',
      `scale(${this.scaleFactor}) translate(${translateX}, ${translateY})`
    );

    // Render all blocks
    const allBlocks = this.workspace.getAllBlocks(false);
    for (const block of allBlocks) {
      const blockSvg = block as any as BlockSvg;
      if (blockSvg) {
        // Get the block's color
        const blockColor = this.getBlockColor(blockSvg);
        
        // Get block dimensions and position
        const blockSize = blockSvg.getHeightWidth();
        const blockXY = blockSvg.getRelativeToSurfaceXY();
        const blockWidth = blockSize.width;
        const blockHeight = blockSize.height;
        const previewX = blockXY.x * this.scaleFactor;
        const previewY = blockXY.y * this.scaleFactor;

        // Create block preview rectangle
        dom.createSvgElement(
          Svg.RECT,
          {
            'x': previewX,
            'y': previewY,
            'width': blockWidth * this.scaleFactor,
            'height': blockHeight * this.scaleFactor,
            'fill': blockColor,
            'stroke': '#333',
            'stroke-width': '1'
          },
          this.previewGroup
        );
      }
    }

    // Update viewport rectangle
    const viewportWidth = metrics.viewWidth * this.scaleFactor;
    const viewportHeight = metrics.viewHeight * this.scaleFactor;
    const viewportX = 0;
    const viewportY = 0;

    this.viewportRect.setAttribute('x', String(viewportX));
    this.viewportRect.setAttribute('y', String(viewportY));
    this.viewportRect.setAttribute('width', String(viewportWidth));
    this.viewportRect.setAttribute('height', String(viewportHeight));
  }

  /**
   * Gets the color of a block for the mini map.
   *
   * @param block The block to get the color for.
   * @returns The color of the block.
   */
  private getBlockColor(block: BlockSvg): string {
    // Get the block's color from its style
    const style = block.getSvgRoot().style;
    return style.fill || '#4a8af4'; // Default to blue if no fill color
  }

  /**
   * Toggles the mini map between expanded and collapsed states.
   */
  private toggle(): void {
    this.isExpanded = !this.isExpanded;
    // TODO: Implement collapse/expand functionality
    this.workspace.resize();
  }
}

/** CSS for mini map.  See css.js for use. */
Css.register(`
.blocklyMiniMap {
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 1000;
}

.blocklyMiniMapViewport {
  cursor: move;
}

.blocklyMiniMapSvg {
  border-radius: 4px;
}

.blocklyMiniMapToggle {
  cursor: pointer;
}

.blocklyMiniMapZoomIn,
.blocklyMiniMapZoomOut {
  stroke: #000;
  stroke-width: 1px;
}

.blocklyMiniMapZoomIn:hover,
.blocklyMiniMapZoomOut:hover {
  fill: #1a73e8;
}
`);