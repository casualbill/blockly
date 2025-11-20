/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * History snapshot button for Blockly toolbar.
 */
// Former goog.module ID: Blockly.snapshotButton

import {IDragTarget} from './interfaces/i_drag_target.js';
import {IDraggable} from './interfaces/i_draggable.js';
import {IPositionable} from './interfaces/i_positionable.js';
import {Rect} from './utils/rect.js';
import * as dom from './utils/dom.js';
import {Svg} from './utils/svg.js';
import {WorkspaceSvg} from './workspace_svg.js';
import {SnapshotManager} from './snapshots.js';
import {SnapshotPanel} from './snapshot_panel.js';

/**
 * Class for the history snapshot button.
 */
export class SnapshotButton implements IPositionable, IDragTarget {
  private workspace_: WorkspaceSvg;
  private svgGroup_: SVGElement | null = null;
  private button_: SVGElement | null = null;
  private marker_: SVGElement | null = null;
  private bubble_: SVGElement | null = null;
  private isVisible_: boolean = true;
  private buttonCallback_: () => void;
  private snapshotPanel_: SnapshotPanel | null = null;

  constructor(workspace: WorkspaceSvg) {
    this.workspace_ = workspace;

    // Create button callback
    this.buttonCallback_ = () => this.onClick_();
  }

  /**
   * Initializes the snapshot button.
   */
  init(): void {
    if (this.svgGroup_) {
      // Already initialized.
      return;
    }

    // Create group element
    this.svgGroup_ = dom.createSvgElement(Svg.G, {}, null);

    // Create button element
    this.button_ = dom.createSvgElement(Svg.G, {}, this.svgGroup_);

    // Create button background
    const buttonBg = dom.createSvgElement(
      Svg.CIRCLE,
      {
        'cx': 16,
        'cy': 16,
        'r': 16,
        'class': 'blocklySnapshotButtonBg'
      },
      this.button_
    );

    // Create button icon (history clock)
    const iconGroup = dom.createSvgElement(Svg.G, {'class': 'blocklySnapshotButtonIcon'}, this.button_);

    // Clock circle
    dom.createSvgElement(
      Svg.CIRCLE,
      {
        'cx': 16,
        'cy': 16,
        'r': 12,
        'fill': 'none',
        'stroke': '#fff',
        'stroke-width': '2'
      },
      iconGroup
    );

    // Clock hand 1
    dom.createSvgElement(
      Svg.LINE,
      {
        'x1': 16,
        'y1': 16,
        'x2': 16,
        'y2': 9,
        'stroke': '#fff',
        'stroke-width': '2',
        'stroke-linecap': 'round'
      },
      iconGroup
    );

    // Clock hand 2
    dom.createSvgElement(
      Svg.LINE,
      {
        'x1': 16,
        'y1': 16,
        'x2': 22,
        'y2': 19,
        'stroke': '#fff',
        'stroke-width': '2',
        'stroke-linecap': 'round'
      },
      iconGroup
    );

    // Attach event listeners
    this.button_!.addEventListener('pointerdown', this.buttonCallback_);
    this.button_!.addEventListener('mouseenter', () => this.onMouseEnter_());
    this.button_!.addEventListener('mouseleave', () => this.onMouseLeave_());

    // Add styles
    this.addStyles_();
  }

  /**
   * Adds styles for the snapshot button.
   */
  private addStyles_(): void {
    const style = document.createElement('style');
    style.textContent = `
      .blocklySnapshotButtonBg {
        fill: #3498db;
      }

      .blocklySnapshotButtonBg:hover {
        fill: #2980b9;
      }

      .blocklySnapshotButtonIcon {
        pointer-events: none;
      }

      .blocklySnapshotButton {
        cursor: pointer;
      }

      .blocklySnapshotButton:hover .blocklySnapshotButtonBg {
        transform: scale(1.1);
        transition: transform 0.2s;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Handles click event on the snapshot button.
   */
  private onClick_(): void {
    if (!this.workspace_.snapshotManager) {
      // Initialize snapshot manager if not already
      this.workspace_.snapshotManager = new SnapshotManager(this.workspace_);
    }

    // Create or show snapshot panel
    if (!this.snapshotPanel_) {
      const panelContainer = document.createElement('div');
      document.body.appendChild(panelContainer);
      
      // Create a temporary workspace for diff viewing
      const diffWorkspace1 = new WorkspaceSvg({parentWorkspace: this.workspace_});
      const diffWorkspace2 = new WorkspaceSvg({parentWorkspace: this.workspace_});
      
      this.snapshotPanel_ = new SnapshotPanel({
        container: panelContainer,
        snapshotManager: this.workspace_.snapshotManager,
        workspace1: diffWorkspace1,
        workspace2: diffWorkspace2,
      });
    }

    this.snapshotPanel_.show();
  }

  /**
   * Handles mouse enter event on the snapshot button.
   */
  private onMouseEnter_(): void {
    // Show tooltip or highlight effect
  }

  /**
   * Handles mouse leave event on the snapshot button.
   */
  private onMouseLeave_(): void {
    // Hide tooltip or highlight effect
  }

  /**
   * Returns the SVG root of the snapshot button.
   */
  getSvgRoot(): SVGElement {
    return this.svgGroup_!;
  }

  /**
   * Positions the snapshot button in the workspace.
   * @param metrics Metrics to use for positioning.
   * @param savedPositions Positions of other UI elements.
   */
  position(metrics: any, savedPositions: any): void {
    const height = metrics.viewHeight;
    const width = metrics.viewWidth;
    const top = metrics.viewTop;
    const left = metrics.viewLeft;

    // Position the button in the top-right corner
    const x = left + width - 40;
    const y = top + 20;

    this.svgGroup_!.setAttribute('transform', `translate(${x}, ${y})`);
  }

  /**
   * Returns whether the snapshot button is visible.
   */
  isVisible(): boolean {
    return this.isVisible_;
  }

  /**
   * Sets whether the snapshot button is visible.
   * @param visible Whether to show or hide the button.
   */
  setVisible(visible: boolean): void {
    this.isVisible_ = visible;
    this.svgGroup_!.style.display = visible ? 'block' : 'none';
  }

  /**
   * Returns the bounding rectangle of the snapshot button.
   */
  getBoundingRectangle(): Rect | null {
    if (!this.svgGroup_) return null;

    const groupBounds = this.svgGroup_.getBoundingClientRect();
    return new Rect(
      groupBounds.left,
      groupBounds.top,
      groupBounds.width,
      groupBounds.height
    );
  }

  /**
   * Handles when a draggable element is dragged over this drag target.
   * @param dragElement The draggable element.
   */
  onDragOver(dragElement: IDraggable): void {
    // Allow dropping
  }

  /**
   * Handles when a draggable element enters this drag target.
   * @param dragElement The draggable element.
   */
  onDragEnter(dragElement: IDraggable): void {
    // Highlight the snapshot button when dragging a block over it
    const svgRoot = this.getSvgRoot();
    svgRoot.classList.add('blockly-snapshot-button-drag-over');
  }

  /**
   * Handles when a draggable element leaves this drag target.
   * @param dragElement The draggable element.
   */
  onDragLeave(dragElement: IDraggable): void {
    // Remove the highlight from the snapshot button
    const svgRoot = this.getSvgRoot();
    svgRoot.classList.remove('blockly-snapshot-button-drag-over');
  }

  /**
   * Handles when a draggable element is dropped onto this drag target.
   * @param dragElement The draggable element.
   */
  onDrop(dragElement: IDraggable): void {
    // Remove the highlight from the snapshot button
    const svgRoot = this.getSvgRoot();
    svgRoot.classList.remove('blockly-snapshot-button-drag-over');
    // Create a new snapshot
    this.workspace_.snapshotManager?.createSnapshot();
  }

  /**
   * Returns whether a block can be dropped on the snapshot button.
   */
  canDrop(): boolean {
    return false;
  }

  /**
   * Disposes of the snapshot button.
   */
  dispose(): void {
    if (this.button_) {
      this.button_!.removeEventListener('pointerdown', this.buttonCallback_);
    }
    if (this.svgGroup_) {
      dom.removeNode(this.svgGroup_);
    }
    if (this.snapshotPanel_) {
      // Dispose panel if it exists
    }
  }
}