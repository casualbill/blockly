/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object for managing workspace guides (horizontal/vertical lines)
 * in Blockly.
 *
 * @class
 */
// Former goog.module ID: Blockly.Guides

import {Coordinate} from './utils/coordinate.js';
import * as dom from './utils/dom.js';
import {Svg} from './utils/svg.js';
import type {WorkspaceSvg} from './workspace_svg.js';

export interface GuideOptions {
  /** Whether guides should be enabled. */
  enabled?: boolean;
  /** Colour of the guides. */
  colour?: string;
  /** Width of the guide lines. */
  width?: number;
  /** 吸附强度 (0: weak, 1: medium, 2: strong). */
  snapStrength?: number;
}

export enum SnapStrength {
  WEAK = 10,
  MEDIUM = 5,
  STRONG = 2,
}

export interface Guide {
  id: string;
  type: 'horizontal' | 'vertical';
  position: number;
  element: SVGElement;
  textElement: SVGElement;
  locked: boolean;
}

export class Guides {
  private workspace: WorkspaceSvg;
  private guides: Guide[] = [];
  private guideLayer: SVGGElement;
  private options: GuideOptions;
  private nextId = 0;

  /**
   * @param workspace The workspace this guides belong to.
   * @param options A dictionary of normalized options for the guides.
   */
  constructor(workspace: WorkspaceSvg, options: GuideOptions) {
    this.workspace = workspace;
    this.options = options;
    this.guideLayer = this.createGuideLayer();
  }

  /**
   * Creates the SVG layer for guides.
   *
   * @returns The created SVG layer.
   */
  private createGuideLayer(): SVGGElement {
    const svg = this.workspace.getParentSvg();
    const layer = dom.createSvgElement(Svg.G, {'class': 'blocklyGuides'}, svg);
    return layer;
  }

  /**
   * Adds a guide to the workspace.
   *
   * @param type The type of guide (horizontal or vertical).
   * @param position The position of the guide.
   * @returns The created guide.
   */
  addGuide(type: 'horizontal' | 'vertical', position: number): Guide {
    const id = `guide_${this.nextId++}`;
    const colour = this.options.colour || 'rgba(0, 123, 255, 0.5)';
    const width = this.options.width || 1;

    const guideElement = dom.createSvgElement(
      Svg.LINE,
      {
        'class': 'blocklyGuide',
        'x1': type === 'horizontal' ? 0 : position,
        'y1': type === 'horizontal' ? position : 0,
        'x2': type === 'horizontal' ? '100%' : position,
        'y2': type === 'horizontal' ? position : '100%',
        'stroke': colour,
        'stroke-width': width,
        'cursor': this.options.enabled ? 'move' : 'default',
      },
      this.guideLayer,
    );

    // Create text element to show distance
    const textElement = dom.createSvgElement(
      Svg.TEXT,
      {
        'class': 'blocklyGuideText',
        'x': type === 'horizontal' ? 10 : position + 10,
        'y': type === 'horizontal' ? position - 5 : 20,
        'font-size': '12px',
        'fill': colour,
        'font-family': 'Arial, sans-serif',
        'pointer-events': 'none',
      },
      this.guideLayer,
    );
    textElement.textContent = `${position}px`;

    const guide: Guide = {
      id,
      type,
      position,
      element: guideElement,
      textElement: textElement,
      locked: false,
    };

    this.guides.push(guide);

    // Add event listeners
    if (this.options.enabled) {
      this.addGuideEventListeners(guide);
    }

    return guide;
  }

  /**
   * Adds event listeners to a guide.
   *
   * @param guide The guide to add listeners to.
   */
  private addGuideEventListeners(guide: Guide): void {
    // Add drag support
    let isDragging = false;

    const handleMouseDown = (_: PointerEvent) => {
      if (guide.locked) return;
      isDragging = true;
      this.workspace.hideChaff(true);
    };

    const handleMouseMove = (e: PointerEvent) => {
      if (!isDragging || guide.locked) return;

      const svgPoint = dom.clientToSvgPoint(this.workspace.getParentSvg(), e);
      let newPosition = guide.type === 'horizontal' ? svgPoint.y : svgPoint.x;

      // Snap to grid
      const grid = this.workspace.getGrid();
      const gridSpacing = grid?.getSpacing() || 20;
      newPosition = Math.round(newPosition / gridSpacing) * gridSpacing;

      // Update guide position
      this.moveGuide(guide.id, newPosition);
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    guide.element.addEventListener('pointerdown', handleMouseDown);
    document.addEventListener('pointermove', handleMouseMove);
    document.addEventListener('pointerup', handleMouseUp);

    // Add context menu support (right-click to delete)
    guide.element.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.removeGuide(guide.id);
    });

    // Add double-click support (lock/unlock)
    guide.element.addEventListener('dblclick', () => {
      guide.locked = !guide.locked;
      guide.element.style.cursor = guide.locked ? 'default' : 'move';
    });
  }

  /**
   * Moves a guide to a new position.
   *
   * @param id The ID of the guide to move.
   * @param position The new position.
   */
  moveGuide(id: string, position: number): void {
    const guide = this.guides.find((g) => g.id === id);
    if (!guide) return;

    guide.position = position;

    if (guide.type === 'horizontal') {
      guide.element.setAttribute('y1', `${position}`);
      guide.element.setAttribute('y2', `${position}`);
      guide.textElement.setAttribute('y', `${position - 5}`);
    } else {
      guide.element.setAttribute('x1', `${position}`);
      guide.element.setAttribute('x2', `${position}`);
      guide.textElement.setAttribute('x', `${position + 10}`);
    }

    guide.textElement.textContent = `${position}px`;
  }

  /**
   * Removes a guide from the workspace.
   *
   * @param id The ID of the guide to remove.
   */
  removeGuide(id: string): void {
    const index = this.guides.findIndex((g) => g.id === id);
    if (index === -1) return;

    const guide = this.guides[index];
    guide.element.remove();
    guide.textElement.remove();
    this.guides.splice(index, 1);
  }

  /**
   * Clears all guides from the workspace.
   */
  clearGuides(): void {
    for (const guide of this.guides) {
      guide.element.remove();
      guide.textElement.remove();
    }
    this.guides = [];
  }

  /**
   * Gets all guides in the workspace.
   *
   * @returns Array of guides.
   */
  getGuides(): Guide[] {
    return [...this.guides];
  }

  /**
   * Finds the nearest guide to a given position.
   *
   * @param type The type of guide to find.
   * @param position The position to search from.
   * @returns The nearest guide or null if none.
   */
  findNearestGuide(
    type: 'horizontal' | 'vertical',
    position: number,
  ): Guide | null {
    const guidesOfType = this.guides.filter((g) => g.type === type);
    if (guidesOfType.length === 0) return null;

    return guidesOfType.reduce((nearest, current) => {
      const currentDiff = Math.abs(current.position - position);
      const nearestDiff = Math.abs(nearest.position - position);
      return currentDiff < nearestDiff ? current : nearest;
    });
  }

  /**
   * Gets the snap threshold based on the current snap strength.
   *
   * @returns The snap threshold in pixels.
   */
  getSnapThreshold(): number {
    const snapStrength = this.options.snapStrength || 1;
    if (typeof snapStrength === 'string') {
      switch ((snapStrength as string).toLowerCase()) {
        case 'weak':
          return SnapStrength.WEAK;
        case 'strong':
          return SnapStrength.STRONG;
        case 'medium':
        default:
          return SnapStrength.MEDIUM;
      }
    } else {
      switch (snapStrength) {
        case 0:
          return SnapStrength.WEAK;
        case 2:
          return SnapStrength.STRONG;
        case 1:
        default:
          return SnapStrength.MEDIUM;
      }
    }
  }

  /**
   * Sets the snap strength.
   *
   * @param strength The snap strength (0: weak, 1: medium, 2: strong).
   */
  setSnapStrength(strength: number): void {
    this.options.snapStrength = strength;
  }

  /**
   * Disposes of the guides.
   */
  dispose(): void {
    this.clearGuides();
    this.guideLayer.remove();
  }

  /** Snap a coordinate to the nearest guide. */
  snapToGuides(coordinate: Coordinate): Coordinate {
    let snappedX = coordinate.x;
    let snappedY = coordinate.y;
    const threshold = this.getSnapThreshold();

    // Check vertical guides for x-snap
    this.guides.forEach((guide) => {
      if (guide.type === 'vertical') {
        const distance = Math.abs(coordinate.x - guide.position);
        if (distance < threshold) {
          snappedX = guide.position;
        }
      }
    });

    // Check horizontal guides for y-snap
    this.guides.forEach((guide) => {
      if (guide.type === 'horizontal') {
        const distance = Math.abs(coordinate.y - guide.position);
        if (distance < threshold) {
          snappedY = guide.position;
        }
      }
    });

    return new Coordinate(snappedX, snappedY);
  }
}
