/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Version control system for Blockly workspaces.
 */

import type {WorkspaceSvg} from './workspace_svg.js';
import type {UiMetrics} from './metrics_manager.js';
import type {IPositionable} from './interfaces/i_positionable.js';
import * as uiPosition from './positionable_helpers.js';
import * as dom from './utils/dom.js';
import {Svg} from './utils/svg.js';
import {Rect} from './utils/rect.js';
import {Size} from './utils/size.js';
import {ComponentManager} from './component_manager.js';
import * as workspaceSerialization from './serialization/workspaces.js';

/**
 * Interface for a version snapshot.
 */
export interface VersionSnapshot {
  /** Unique identifier for the version. */
  id: string;
  /** Version number (auto-incremented). */
  version: number;
  /** Timestamp when the version was saved. */
  timestamp: number;
  /** User-provided description of the version. */
  description: string;
  /** Serialized workspace data. */
  data: string;
}

/**
 * Version control system for Blockly workspaces.
 */
export class VersionControl implements IPositionable {
  /**
   * The unique ID for this component that is used to register with the
   * ComponentManager.
   */
  id = 'versionControl';

  /** Whether this has been initialized. */
  private initialized = false;
  /** The workspace this version control belongs to. */
  private workspace: WorkspaceSvg;
  /** The root SVG element for the version control UI. */
  private svgRoot: SVGElement | null = null;
  /** The version history. */
  private versions: VersionSnapshot[] = [];
  /** The current version index. */
  private currentVersionIndex: number = -1;
  /** Local storage key for saving versions. */
  private storageKey: string;

  /**
   * @param workspace The workspace to attach to.
   */
  constructor(workspace: WorkspaceSvg) {
    this.workspace = workspace;
    this.storageKey = `blockly_version_control_${workspace.id}`;
    this.loadVersions();
  }

  /**
   * Initializes the version control system.
   */
  init(): void {
    this.workspace.getComponentManager().addComponent({
      component: this,
      weight: ComponentManager.ComponentWeight.ZOOM_CONTROLS_WEIGHT + 1,
      capabilities: [ComponentManager.Capability.POSITIONABLE],
    });
    this.initialized = true;
  }

  /**
   * Load versions from local storage.
   */
  private loadVersions(): void {
    const saved = localStorage.getItem(this.storageKey);
    if (saved) {
      try {
        this.versions = JSON.parse(saved);
        this.currentVersionIndex = this.versions.length - 1;
      } catch (e) {
        console.error('Failed to load versions:', e);
        this.versions = [];
      }
    }
  }

  /**
   * Save versions to local storage.
   */
  private saveVersions(): void {
    localStorage.setItem(this.storageKey, JSON.stringify(this.versions));
  }

  /**
   * Creates the DOM element for the version control button.
   * @returns The root SVG element.
   */
  createDom(): SVGElement {
    const svgRoot = dom.createSvgElement(
      Svg.G,
      {'class': 'blocklyVersionControl'},
      null
    );

    // Create the button
    const button = dom.createSvgElement(
      Svg.CIRCLE,
      {
        'r': 15,
        'cx': 15,
        'cy': 15,
        'class': 'blocklyVersionControlButton'
      },
      svgRoot
    );

    // Create the icon
    const icon = dom.createSvgElement(
      Svg.G,
      {},
      svgRoot
    );

    // Add version control icon (three horizontal lines)
    for (let i = 0; i < 3; i++) {
      dom.createSvgElement(
        Svg.LINE,
        {
          'x1': 7,
          'y1': 10 + i * 5,
          'x2': 23,
          'y2': 10 + i * 5,
          'stroke': '#fff',
          'stroke-width': 2
        },
        icon
      );
    }

    // Add click event listener
    button.addEventListener('click', () => this.openPanel());

    this.svgRoot = svgRoot;
    return svgRoot;
  }

  /**
   * Opens the version control panel.
   */
  private openPanel(): void {
    // This is a placeholder - we'll implement the panel UI later
    console.log('Version control panel opened');
  }

  /**
   * Saves the current workspace state as a new version.
   * @param description User-provided description of the version.
   * @returns The new version snapshot.
   */
  saveVersion(description: string): VersionSnapshot {
    const state = workspaceSerialization.save(this.workspace);
    const newVersion: VersionSnapshot = {
      id: this.generateId(),
      version: this.versions.length + 1,
      timestamp: Date.now(),
      description,
      data: JSON.stringify(state)
    };
    this.versions.push(newVersion);
    this.currentVersionIndex = this.versions.length - 1;
    this.saveVersions();
    return newVersion;
  }

  /**
   * Generates a unique ID for a version.
   * @returns A unique ID.
   */
  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  /**
   * Returns the list of all saved versions.
   * @returns The version history.
   */
  getVersions(): VersionSnapshot[] {
    return [...this.versions];
  }

  /**
   * Restores the workspace to a specific version.
   * @param versionIndex The index of the version to restore.
   */
  restoreVersion(versionIndex: number): void {
    if (versionIndex < 0 || versionIndex >= this.versions.length) {
      return;
    }
    const version = this.versions[versionIndex];
    const state = JSON.parse(version.data);
    this.workspace.clear();
    workspaceSerialization.load(state, this.workspace);
    this.currentVersionIndex = versionIndex;
  }

  /**
   * Exports a version as JSON.
   * @param versionIndex The index of the version to export.
   * @returns JSON string of the version.
   */
  exportVersion(versionIndex: number): string {
    if (versionIndex < 0 || versionIndex >= this.versions.length) {
      return '';
    }
    return JSON.stringify(this.versions[versionIndex], null, 2);
  }

  /**
   * Imports a version from JSON.
   * @param json JSON string of the version.
   */
  importVersion(json: string): void {
    try {
      const version: VersionSnapshot = JSON.parse(json);
      // Ensure the version has all required properties
      if (version.id && version.version && version.timestamp && version.description && version.data) {
        this.versions.push(version);
        this.currentVersionIndex = this.versions.length - 1;
        this.saveVersions();
      }
    } catch (e) {
      console.error('Failed to import version:', e);
    }
  }

  /**
   * Compares two versions and returns the differences.
   * @param versionIndex1 Index of the first version.
   * @param versionIndex2 Index of the second version.
   * @returns Differences between the two versions.
   */
  compareVersions(versionIndex1: number, versionIndex2: number): any {
    // This is a placeholder - we'll implement proper diffing later
    const v1 = this.versions[versionIndex1];
    const v2 = this.versions[versionIndex2];
    return {v1, v2, diff: 'Diffing not implemented yet'};
  }

  /**
   * Positions the version control button.
   * @param metrics UI metrics for positioning.
   * @param savedPositions List of saved positions.
   */
  position(metrics: UiMetrics, savedPositions: Rect[]): void {
    if (!this.svgRoot || !this.initialized) return;

    const cornerPosition = uiPosition.getCornerOppositeToolbox(
      this.workspace,
      metrics
    );

    const startRect = uiPosition.getStartPositionRect(
      cornerPosition,
      new Size(30, 30),
      20, // Margin from horizontal edge
      20, // Margin from vertical edge
      metrics,
      this.workspace
    );

    const verticalPosition = cornerPosition.vertical;
    const bumpDirection = verticalPosition === uiPosition.verticalPosition.TOP
        ? uiPosition.bumpDirection.DOWN
        : uiPosition.bumpDirection.UP;

    const positionRect = uiPosition.bumpPositionRect(
      startRect,
      20, // Margin between components
      bumpDirection,
      savedPositions
    );

    // Position the button
    this.svgRoot.setAttribute(
      'transform',
      `translate(${positionRect.left}, ${positionRect.top})`
    );
  }

  /**
   * Returns the bounding rectangle of the UI element.
   * @returns The bounding rectangle.
   */
  getBoundingRectangle(): Rect | null {
    if (!this.svgRoot) return null;
    // Using getBoundingClientRect instead of getBBox to avoid potential issues
    const rect = this.svgRoot.getBoundingClientRect();
    return new Rect(rect.top, rect.bottom, rect.left, rect.right);
  }

  /**
   * Disposes of the version control system.
   */
  dispose(): void {
    if (this.svgRoot && this.svgRoot.parentNode) {
      this.svgRoot.parentNode.removeChild(this.svgRoot);
    }
  }
}