/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Snapshot management panel for Blockly.
 */
// Former goog.module ID: Blockly.snapshotPanel

import {Snapshot, SnapshotManager} from './snapshots.js';
import {DiffViewer} from './diff_viewer.js';
import {WorkspaceSvg} from './workspace_svg.js';

/**
 * Interface for snapshot panel options.
 */
export interface SnapshotPanelOptions {
  /** Container element for the snapshot panel. */
  container: HTMLElement;
  /** Snapshot manager instance. */
  snapshotManager: SnapshotManager;
  /** Workspace to use for diff viewing. */
  workspace1: WorkspaceSvg;
  /** Second workspace to use for diff viewing. */
  workspace2: WorkspaceSvg;
}

/**
 * Snapshot panel class.
 */
export class SnapshotPanel {
  private container: HTMLElement;
  private snapshotManager: SnapshotManager;
  private workspace1: WorkspaceSvg;
  private workspace2: WorkspaceSvg;
  private diffViewer: DiffViewer;
  private visible: boolean = false;
  private selectedSnapshots: Snapshot[] = [];

  constructor(options: SnapshotPanelOptions) {
    this.container = options.container;
    this.snapshotManager = options.snapshotManager;
    this.workspace1 = options.workspace1;
    this.workspace2 = options.workspace2;

    // Create diff viewer
    const diffContainer = document.createElement('div');
    document.body.appendChild(diffContainer);
    this.diffViewer = new DiffViewer({
      container: diffContainer,
      workspace1: this.workspace1,
      workspace2: this.workspace2,
    });

    this.init();
  }

  /**
   * Initializes the snapshot panel.
   */
  private init(): void {
    // Create UI elements
    this.container.innerHTML = `
      <div class="blockly-snapshot-panel">
        <div class="blockly-snapshot-header">
          <h2>历史快照</h2>
          <div class="blockly-snapshot-close">×</div>
        </div>
        <div class="blockly-snapshot-toolbar">
          <button id="blockly-create-snapshot-btn" class="blockly-snapshot-btn blockly-snapshot-btn-primary">
            创建快照
          </button>
          <button id="blockly-compare-snapshots-btn" class="blockly-snapshot-btn blockly-snapshot-btn-secondary">
            对比选择的快照
          </button>
          <button id="blockly-delete-snapshots-btn" class="blockly-snapshot-btn blockly-snapshot-btn-danger">
            删除选择的快照
          </button>
        </div>
        <div class="blockly-snapshot-list">
          <div id="blockly-snapshots-container"></div>
        </div>
      </div>
    `;

    // Style the snapshot panel
    this.addStyles();

    // Setup buttons
    this.setupButtons();

    // Hide by default
    this.hide();
  }

  /**
   * Adds styles for the snapshot panel.
   */
  private addStyles(): void {
    const style = document.createElement('style');
    style.textContent = `
      .blockly-snapshot-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        height: 100%;
        background-color: white;
        z-index: 1000;
        box-shadow: -2px 0 5px rgba(0, 0, 0, 0.3);
        display: flex;
        flex-direction: column;
        font-family: Arial, sans-serif;
      }

      .blockly-snapshot-header {
        padding: 20px;
        background-color: #2c3e50;
        color: white;
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .blockly-snapshot-header h2 {
        margin: 0;
        font-size: 20px;
      }

      .blockly-snapshot-close {
        font-size: 24px;
        cursor: pointer;
        padding: 0 5px;
      }

      .blockly-snapshot-toolbar {
        padding: 15px;
        border-bottom: 1px solid #bdc3c7;
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }

      .blockly-snapshot-btn {
        padding: 8px 16px;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        font-size: 14px;
        font-weight: bold;
        transition: background-color 0.3s;
      }

      .blockly-snapshot-btn-primary {
        background-color: #3498db;
        color: white;
      }

      .blockly-snapshot-btn-primary:hover {
        background-color: #2980b9;
      }

      .blockly-snapshot-btn-secondary {
        background-color: #95a5a6;
        color: white;
      }

      .blockly-snapshot-btn-secondary:hover {
        background-color: #7f8c8d;
      }

      .blockly-snapshot-btn-danger {
        background-color: #e74c3c;
        color: white;
      }

      .blockly-snapshot-btn-danger:hover {
        background-color: #c0392b;
      }

      .blockly-snapshot-list {
        flex: 1;
        overflow-y: auto;
        padding: 15px;
      }

      .blockly-snapshots-container {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .blockly-snapshot-item {
        border: 1px solid #bdc3c7;
        border-radius: 4px;
        padding: 15px;
        background-color: #ecf0f1;
        cursor: pointer;
        transition: all 0.3s;
      }

      .blockly-snapshot-item:hover {
        background-color: #bdc3c7;
        transform: translateY(-2px);
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      }

      .blockly-snapshot-item.selected {
        background-color: #3498db;
        color: white;
        border-color: #2980b9;
      }

      .blockly-snapshot-item-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      }

      .blockly-snapshot-name {
        font-weight: bold;
        font-size: 16px;
      }

      .blockly-snapshot-timestamp {
        font-size: 12px;
        opacity: 0.8;
      }

      .blockly-snapshot-info {
        font-size: 14px;
        margin-bottom: 8px;
        display: flex;
        gap: 15px;
      }

      .blockly-snapshot-block-count {
        font-weight: bold;
      }

      .blockly-snapshot-description {
        font-size: 13px;
        opacity: 0.9;
        margin-top: 8px;
        padding-top: 8px;
        border-top: 1px solid rgba(255, 255, 255, 0.3);
      }

      .blockly-snapshot-item-actions {
        margin-top: 10px;
        display: flex;
        gap: 5px;
        justify-content: flex-end;
      }

      .blockly-snapshot-item-btn {
        padding: 5px 10px;
        border: none;
        border-radius: 2px;
        cursor: pointer;
        font-size: 12px;
        font-weight: bold;
      }

      .blockly-snapshot-item-btn.view {
        background-color: #27ae60;
        color: white;
      }

      .blockly-snapshot-item-btn.view:hover {
        background-color: #229954;
      }

      .blockly-snapshot-item-btn.restore {
        background-color: #f39c12;
        color: white;
      }

      .blockly-snapshot-item-btn.restore:hover {
        background-color: #e67e22;
      }

      .blockly-snapshot-item-btn.delete {
        background-color: #e74c3c;
        color: white;
      }

      .blockly-snapshot-item-btn.delete:hover {
        background-color: #c0392b;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Sets up button event handlers.
   */
  private setupButtons(): void {
    // Create snapshot button
    const createBtn = document.getElementById('blockly-create-snapshot-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.createSnapshot());
    }

    // Compare snapshots button
    const compareBtn = document.getElementById('blockly-compare-snapshots-btn');
    if (compareBtn) {
      compareBtn.addEventListener('click', () => this.compareSnapshots());
    }

    // Delete snapshots button
    const deleteBtn = document.getElementById('blockly-delete-snapshots-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => this.deleteSelectedSnapshots());
    }

    // Close button
    const closeBtn = this.container.querySelector('.blockly-snapshot-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.hide());
    }
  }

  /**
   * Creates a new snapshot.
   */
  private createSnapshot(): void {
    const name = prompt('请输入快照名称:', '手动快照 ' + new Date().toLocaleString());
    if (!name) return;

    const description = prompt('请输入快照描述:');

    this.snapshotManager.createSnapshot(name, description || undefined).then(() => {
      this.loadSnapshots();
      alert('快照已创建!');
    }).catch((error) => {
      console.error('Failed to create snapshot:', error);
      alert('创建快照失败!');
    });
  }

  /**
   * Compares selected snapshots.
   */
  private compareSnapshots(): void {
    if (this.selectedSnapshots.length !== 2) {
      alert('请选择两个快照进行对比!');
      return;
    }

    this.diffViewer.compareSnapshots(this.selectedSnapshots[0], this.selectedSnapshots[1]);
  }

  /**
   * Deletes selected snapshots.
   */
  private deleteSelectedSnapshots(): void {
    if (this.selectedSnapshots.length === 0) {
      alert('请选择要删除的快照!');
      return;
    }

    if (confirm(`确定要删除 ${this.selectedSnapshots.length} 个快照吗?`)) {
      for (const snapshot of this.selectedSnapshots) {
        this.snapshotManager.deleteSnapshot(snapshot.id);
      }

      this.selectedSnapshots = [];
      this.loadSnapshots();
      alert('快照已删除!');
    }
  }

  /**
   * Loads all snapshots and displays them in the list.
   */
  async loadSnapshots(): Promise<void> {
    const snapshots = await this.snapshotManager.loadAllSnapshots();
    const container = document.getElementById('blockly-snapshots-container');
    if (!container) return;

    container.innerHTML = '';

    for (const snapshot of snapshots) {
      const item = this.createSnapshotItem(snapshot);
      container.appendChild(item);
    }
  }

  /**
   * Creates a snapshot item element.
   * @param snapshot Snapshot to create element for.
   * @returns The created DOM element.
   */
  private createSnapshotItem(snapshot: Snapshot): HTMLElement {
    const div = document.createElement('div');
    div.className = 'blockly-snapshot-item';
    div.dataset.snapshotId = snapshot.id;

    const date = new Date(snapshot.timestamp);
    const formattedTime = date.toLocaleString();

    div.innerHTML = `
      <div class="blockly-snapshot-item-header">
        <div class="blockly-snapshot-name">${this.escapeHtml(snapshot.name || '')}</div>
        <div class="blockly-snapshot-timestamp">${formattedTime}</div>
      </div>
      <div class="blockly-snapshot-info">
        <div class="blockly-snapshot-block-count">块数量: ${snapshot.blockCount}</div>
      </div>
      ${snapshot.description ? `<div class="blockly-snapshot-description">${this.escapeHtml(snapshot.description)}</div>` : ''}
      <div class="blockly-snapshot-item-actions">
        <button class="blockly-snapshot-item-btn view">查看</button>
        <button class="blockly-snapshot-item-btn restore">恢复</button>
        <button class="blockly-snapshot-item-btn delete">删除</button>
      </div>
    `;

    // Setup selection
    div.addEventListener('click', (e) => {
      if (!(e.target as HTMLElement).closest('.blockly-snapshot-item-btn')) {
        this.toggleSnapshotSelection(snapshot, div);
      }
    });

    // Setup view button
    const viewBtn = div.querySelector('.blockly-snapshot-item-btn.view');
    if (viewBtn) {
      viewBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        // TODO: Implement view functionality
        alert('查看功能待实现');
      });
    }

    // Setup restore button
    const restoreBtn = div.querySelector('.blockly-snapshot-item-btn.restore');
    if (restoreBtn) {
      restoreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.restoreSnapshot(snapshot);
      });
    }

    // Setup delete button
    const deleteBtn = div.querySelector('.blockly-snapshot-item-btn.delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteSnapshot(snapshot);
      });
    }

    return div;
  }

  /**
   * Toggles snapshot selection.
   * @param snapshot Snapshot to toggle.
   * @param element DOM element of the snapshot item.
   */
  private toggleSnapshotSelection(snapshot: Snapshot, element: HTMLElement): void {
    const index = this.selectedSnapshots.findIndex((s) => s.id === snapshot.id);
    if (index > -1) {
      // Deselect
      this.selectedSnapshots.splice(index, 1);
      element.classList.remove('selected');
    } else {
      // Select (limit to 2)
      if (this.selectedSnapshots.length < 2) {
        this.selectedSnapshots.push(snapshot);
        element.classList.add('selected');
      }
    }
  }

  /**
   * Restores a snapshot.
   * @param snapshot Snapshot to restore.
   */
  private restoreSnapshot(snapshot: Snapshot): void {
    if (confirm('确定要恢复此快照吗?当前工作区的内容将被覆盖!')) {
      this.snapshotManager.loadSnapshot(snapshot.id).then((success) => {
        if (success) {
          this.hide();
          alert('快照已恢复!');
        } else {
          alert('恢复快照失败!');
        }
      });
    }
  }

  /**
   * Deletes a snapshot.
   * @param snapshot Snapshot to delete.
   */
  private deleteSnapshot(snapshot: Snapshot): void {
    if (confirm('确定要删除此快照吗?')) {
      this.snapshotManager.deleteSnapshot(snapshot.id).then(() => {
        this.loadSnapshots();
      });
    }
  }

  /**
   * Escapes HTML characters in a string.
   * @param str String to escape.
   * @returns Escaped string.
   */
  private escapeHtml(str: string): string {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * Shows the snapshot panel.
   */
  show(): void {
    this.container.style.display = 'flex';
    this.visible = true;
    this.loadSnapshots();
  }

  /**
   * Hides the snapshot panel.
   */
  hide(): void {
    this.container.style.display = 'none';
    this.visible = false;
    this.selectedSnapshots = [];
  }

  /**
   * Returns whether the snapshot panel is visible.
   */
  isVisible(): boolean {
    return this.visible;
  }
}