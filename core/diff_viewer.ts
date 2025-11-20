/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Diff viewer for comparing two Blockly workspace snapshots.
 */
// Former goog.module ID: Blockly.diffViewer

import {WorkspaceSvg} from './workspace_svg.js';
import {Snapshot, SnapshotDiff, SnapshotManager} from './snapshots.js';
import * as serialization from './serialization.js';

/**
 * Interface for diff viewer options.
 */
export interface DiffViewerOptions {
  /** Container element for the diff viewer. */
  container: HTMLElement;
  /** First workspace for comparison. */
  workspace1: WorkspaceSvg;
  /** Second workspace for comparison. */
  workspace2: WorkspaceSvg;
  /** Whether to show the original workspace on the left. */
  showOriginalLeft?: boolean;
}

/**
 * Diff viewer class.
 */
export class DiffViewer {
  private container: HTMLElement;
  private workspace1: WorkspaceSvg;
  private workspace2: WorkspaceSvg;
  private visible: boolean = false;

  constructor(options: DiffViewerOptions) {
    this.container = options.container;
    this.workspace1 = options.workspace1;
    this.workspace2 = options.workspace2;

    this.init();
  }

  /**
   * Initializes the diff viewer.
   */
  private init(): void {
    // Create UI elements
    this.container.innerHTML = `
      <div class="blockly-diff-viewer">
        <div class="blockly-diff-header">
          <h2>差异对比</h2>
          <div class="blockly-diff-close">×</div>
        </div>
        <div class="blockly-diff-stats">
          <div class="blockly-diff-stat">
            <span class="blockly-diff-add">新增: <span class="blockly-diff-count">0</span></span>
          </div>
          <div class="blockly-diff-stat">
            <span class="blockly-diff-delete">删除: <span class="blockly-diff-count">0</span></span>
          </div>
          <div class="blockly-diff-stat">
            <span class="blockly-diff-modify">修改: <span class="blockly-diff-count">0</span></span>
          </div>
        </div>
        <div class="blockly-diff-content">
          <div class="blockly-diff-side blockly-diff-original">
            <div class="blockly-diff-title">原始版本</div>
            <div class="blockly-diff-workspace-container">
              <div id="blockly-diff-workspace-1"></div>
            </div>
          </div>
          <div class="blockly-diff-divider"></div>
          <div class="blockly-diff-side blockly-diff-modified">
            <div class="blockly-diff-title">修改后版本</div>
            <div class="blockly-diff-workspace-container">
              <div id="blockly-diff-workspace-2"></div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Style the diff viewer
    this.addStyles();

    // Setup close button
    const closeBtn = this.container.querySelector('.blockly-diff-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }

    // Hide by default
    this.hide();
  }

  /**
   * Adds styles for the diff viewer.
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .blockly-diff-viewer {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.8);
        z-index: 10000;
        display: flex;
        flex-direction: column;
      }

      .blockly-diff-header {
        padding: 20px;
        background-color: #2c3e50;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .blockly-diff-header h2 {
        margin: 0;
        font-size: 24px;
      }

      .blockly-diff-close {
        font-size: 30px;
        cursor: pointer;
        padding: 0 10px;
      }

      .blockly-diff-stats {
        padding: 15px 20px;
        background-color: #34495e;
        color: white;
        display: flex;
        gap: 30px;
      }

      .blockly-diff-stat {
        font-size: 16px;
      }

      .blockly-diff-add {
        color: #27ae60;
      }

      .blockly-diff-delete {
        color: #e74c3c;
      }

      .blockly-diff-modify {
        color: #f39c12;
      }

      .blockly-diff-content {
        flex: 1;
        display: flex;
        overflow: hidden;
      }

      .blockly-diff-side {
        flex: 1;
        display: flex;
        flex-direction: column;
        padding: 20px;
        box-sizing: border-box;
      }

      .blockly-diff-title {
        padding: 10px;
        background-color: #ecf0f1;
        border-radius: 4px;
        margin-bottom: 10px;
        font-weight: bold;
        text-align: center;
      }

      .blockly-diff-workspace-container {
        flex: 1;
        border: 1px solid #bdc3c7;
        border-radius: 4px;
        overflow: hidden;
        background-color: white;
      }

      .blockly-diff-divider {
        width: 2px;
        background-color: #bdc3c7;
        margin: 20px 0;
      }

      /* Block highlighting styles */
      .blockly-diff-added {
        filter: drop-shadow(0 0 10px #27ae60);
        animation: blocklyDiffPulseAdded 1s ease-in-out;
      }

      .blockly-diff-deleted {
        filter: drop-shadow(0 0 10px #e74c3c);
        animation: blocklyDiffPulseDeleted 1s ease-in-out;
      }

      .blockly-diff-modified {
        filter: drop-shadow(0 0 10px #f39c12);
        animation: blocklyDiffPulseModified 1s ease-in-out;
      }

      @keyframes blocklyDiffPulseAdded {
        0% { filter: drop-shadow(0 0 5px #27ae60); }
        50% { filter: drop-shadow(0 0 15px #27ae60); }
        100% { filter: drop-shadow(0 0 10px #27ae60); }
      }

      @keyframes blocklyDiffPulseDeleted {
        0% { filter: drop-shadow(0 0 5px #e74c3c); }
        50% { filter: drop-shadow(0 0 15px #e74c3c); }
        100% { filter: drop-shadow(0 0 10px #e74c3c); }
      }

      @keyframes blocklyDiffPulseModified {
        0% { filter: drop-shadow(0 0 5px #f39c12); }
        50% { filter: drop-shadow(0 0 15px #f39c12); }
        100% { filter: drop-shadow(0 0 10px #f39c12); }
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Compares two snapshots and displays the differences.
   * @param snapshot1 First snapshot.
   * @param snapshot2 Second snapshot.
   */
  async compareSnapshots(snapshot1: Snapshot, snapshot2: Snapshot): Promise<void> {
    // Load snapshot states into workspaces
    this.loadSnapshotIntoWorkspace(snapshot1, this.workspace1);
    this.loadSnapshotIntoWorkspace(snapshot2, this.workspace2);

    // Calculate differences
    const diff = this.calculateDiff(snapshot1, snapshot2);

    // Apply highlighting
    this.applyHighlighting(diff);

    // Update stats
    this.updateStats(diff);

    // Show the diff viewer
    this.show();
  }

  /**
   * Loads a snapshot into a workspace.
   * @param snapshot Snapshot to load.
   * @param workspace Workspace to load into.
   */
  private loadSnapshotIntoWorkspace(snapshot: Snapshot, workspace: WorkspaceSvg): void {
    // Clear workspace
    workspace.clear();
    // Load snapshot state
    serialization.workspaces.load(snapshot.workspaceState, workspace);
  }

  /**
   * Calculates the differences between two snapshots.
   * @param snapshot1 First snapshot.
   * @param snapshot2 Second snapshot.
   * @returns The differences.
   */
  private calculateDiff(snapshot1: Snapshot, snapshot2: Snapshot): SnapshotDiff {
    // Directly use the imported SnapshotManager
    const snapshotManager = new SnapshotManager(this.workspace1);
    return snapshotManager.compareSnapshots(snapshot1, snapshot2);
  }

  /**
   * Gets all block IDs from a snapshot.
   * @param snapshot Snapshot to get block IDs from.
   * @returns Array of block IDs.
   */
  private getBlockIds(snapshot: Snapshot): string[] {
    const blocks: Record<string, any> = {};
    const workspaceState = snapshot.workspaceState;

    if (workspaceState && workspaceState.blocks && workspaceState.blocks.block) {
      const blocksArray = Array.isArray(workspaceState.blocks.block)
        ? workspaceState.blocks.block
        : [workspaceState.blocks.block];

      for (const block of blocksArray) {
        blocks[block.id] = block;
      }
    }

    return Object.keys(blocks);
  }

  /**
   * Applies highlighting to blocks based on the differences.
   * @param diff The differences between snapshots.
   */
  private applyHighlighting(diff: SnapshotDiff): void {
    // Clear previous highlighting
    this.clearHighlighting(this.workspace1);
    this.clearHighlighting(this.workspace2);

    // Highlight deleted blocks in first workspace
    for (const blockId of diff.deletedBlocks) {
      const block = this.workspace1.getBlockById(blockId);
      if (block) {
        (block as any).pathObject.svgGroup_.classList.add('blockly-diff-deleted');
      }
    }

    // Highlight added blocks in second workspace
    for (const blockId of diff.addedBlocks) {
      const block = this.workspace2.getBlockById(blockId);
      if (block) {
        (block as any).pathObject.svgGroup_.classList.add('blockly-diff-added');
      }
    }

    // Highlight modified blocks in both workspaces
    for (const blockId of diff.modifiedBlocks) {
      const block1 = this.workspace1.getBlockById(blockId);
      const block2 = this.workspace2.getBlockById(blockId);
      if (block1) {
        (block1 as any).pathObject.svgGroup_.classList.add('blockly-diff-modified');
      }
      if (block2) {
        (block2 as any).pathObject.svgGroup_.classList.add('blockly-diff-modified');
      }
    }
  }

  /**
   * Clears highlighting from all blocks in a workspace.
   * @param workspace Workspace to clear highlighting from.
   */
  private clearHighlighting(workspace: WorkspaceSvg): void {
    const blocks = workspace.getAllBlocks();
    for (const block of blocks) {
      (block as any).pathObject.svgGroup_.classList.remove(
        'blockly-diff-added',
        'blockly-diff-deleted',
        'blockly-diff-modified'
      );
    }
  }

  /**
   * Updates the statistics display.
   * @param diff The differences between snapshots.
   */
  private updateStats(diff: SnapshotDiff): void {
    const addCount = this.container.querySelector('.blockly-diff-add .blockly-diff-count');
    const deleteCount = this.container.querySelector('.blockly-diff-delete .blockly-diff-count');
    const modifyCount = this.container.querySelector('.blockly-diff-modify .blockly-diff-count');

    if (addCount) addCount.textContent = diff.stats.added.toString();
    if (deleteCount) deleteCount.textContent = diff.stats.deleted.toString();
    if (modifyCount) modifyCount.textContent = diff.stats.modified.toString();
  }

  /**
   * Shows the diff viewer.
   */
  show(): void {
    this.container.style.display = 'flex';
    this.visible = true;
  }

  /**
   * Hides the diff viewer.
   */
  hide(): void {
    this.container.style.display = 'none';
    this.visible = false;
  }

  /**
   * Returns whether the diff viewer is visible.
   */
  isVisible(): boolean {
    return this.visible;
  }
}