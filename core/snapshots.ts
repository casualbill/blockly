/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * History snapshots feature for Blockly.
 */
// Former goog.module ID: Blockly.snapshots

import * as serialization from './serialization.js';
import {Workspace} from './workspace.js';
import {WorkspaceSvg} from './workspace_svg.js';

/**
 * Interface for a snapshot object.
 */
export interface Snapshot {
  id: string;
  name?: string;
  description?: string;
  timestamp: number;
  blockCount: number;
  workspaceState: any;
  thumbnail?: string;
}

/**
 * Interface for snapshot manager options.
 */
export interface SnapshotManagerOptions {
  /** Maximum number of snapshots to keep. */
  maxSnapshots?: number;
  /** Auto-save interval in milliseconds. */
  autoSaveInterval?: number;
  /** Whether to enable auto-save. */
  autoSaveEnabled?: boolean;
  /** Storage adapter to use for saving snapshots. */
  storage?: StorageAdapter;
}

/**
 * Interface for storage adapter.
 */
export interface StorageAdapter {
  /**
   * Saves a snapshot.
   * @param snapshot Snapshot to save.
   */
  saveSnapshot(snapshot: Snapshot): Promise<void>;
  /**
   * Loads a snapshot by ID.
   * @param id Snapshot ID.
   * @returns The loaded snapshot.
   */
  loadSnapshot(id: string): Promise<Snapshot | null>;
  /**
   * Loads all snapshots.
   * @returns All snapshots.
   */
  loadAllSnapshots(): Promise<Snapshot[]>;
  /**
   * Deletes a snapshot by ID.
   * @param id Snapshot ID.
   */
  deleteSnapshot(id: string): Promise<void>;
  /**
   * Cleans up old snapshots (older than 30 days).
   */
  cleanUpOldSnapshots(): Promise<void>;
}

/**
 * Default storage adapter using IndexedDB or localStorage.
 */
export class DefaultStorageAdapter implements StorageAdapter {
  private readonly DB_NAME = 'BlocklySnapshots';
  private readonly DB_VERSION = 1;
  private readonly OBJECT_STORE_NAME = 'snapshots';
  private readonly MAX_AGE = 30 * 24 * 60 * 60 * 1000; // 30 days

  constructor() {
    // Check if IndexedDB is supported
    this.useIndexedDB = typeof indexedDB !== 'undefined';
  }

  private useIndexedDB: boolean;

  private openDB(): Promise<IDBDatabase> {
    if (!this.useIndexedDB) {
      return Promise.resolve(null as any);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.OBJECT_STORE_NAME)) {
          db.createObjectStore(this.OBJECT_STORE_NAME, {
            keyPath: 'id',
            autoIncrement: false,
          });
        }
      };
    });
  }

  async saveSnapshot(snapshot: Snapshot): Promise<void> {
    if (this.useIndexedDB) {
      const db = await this.openDB();
      const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.OBJECT_STORE_NAME);
      store.put(snapshot);
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } else {
      // Use localStorage as fallback
      const snapshots = this.loadAllSnapshotsFromLocalStorage();
      snapshots.push(snapshot);
      localStorage.setItem('blocklySnapshots', JSON.stringify(snapshots));
    }
  }

  async loadSnapshot(id: string): Promise<Snapshot | null> {
    if (this.useIndexedDB) {
      const db = await this.openDB();
      const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.OBJECT_STORE_NAME);
      const request = store.get(id);

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } else {
      const snapshots = this.loadAllSnapshotsFromLocalStorage();
      return snapshots.find((s) => s.id === id) || null;
    }
  }

  async loadAllSnapshots(): Promise<Snapshot[]> {
    if (this.useIndexedDB) {
      const db = await this.openDB();
      const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readonly');
      const store = transaction.objectStore(this.OBJECT_STORE_NAME);
      const request = store.getAll();

      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } else {
      return this.loadAllSnapshotsFromLocalStorage();
    }
  }

  async deleteSnapshot(id: string): Promise<void> {
    if (this.useIndexedDB) {
      const db = await this.openDB();
      const transaction = db.transaction(this.OBJECT_STORE_NAME, 'readwrite');
      const store = transaction.objectStore(this.OBJECT_STORE_NAME);
      store.delete(id);
      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve();
        transaction.onerror = () => reject(transaction.error);
      });
    } else {
      let snapshots = this.loadAllSnapshotsFromLocalStorage();
      snapshots = snapshots.filter((s) => s.id !== id);
      localStorage.setItem('blocklySnapshots', JSON.stringify(snapshots));
    }
  }

  async cleanUpOldSnapshots(): Promise<void> {
    const now = Date.now();
    const snapshots = await this.loadAllSnapshots();
    const oldSnapshots = snapshots.filter(
      (snapshot) => now - snapshot.timestamp > this.MAX_AGE,
    );

    for (const snapshot of oldSnapshots) {
      await this.deleteSnapshot(snapshot.id);
    }
  }

  private loadAllSnapshotsFromLocalStorage(): Snapshot[] {
    const snapshotsJson = localStorage.getItem('blocklySnapshots');
    return snapshotsJson ? JSON.parse(snapshotsJson) : [];
  }
}

/**
 * Snapshot manager class.
 */
export class SnapshotManager {
  private workspace: Workspace;
  private options: SnapshotManagerOptions;
  private storage: StorageAdapter;
  private autoSaveTimer: number | null = null;

  constructor(workspace: Workspace, options: SnapshotManagerOptions = {}) {
    this.workspace = workspace;
    this.options = {
      maxSnapshots: 50,
      autoSaveInterval: 30000, // 30 seconds
      autoSaveEnabled: true,
      ...options,
    };
    this.storage = this.options.storage || new DefaultStorageAdapter();

    // Initialize auto-save if enabled
    if (this.options.autoSaveEnabled) {
      this.startAutoSave();
    }
  }

  /**
   * Creates a new snapshot of the current workspace state.
   * @param name Snapshot name (optional).
   * @param description Snapshot description (optional).
   * @returns The created snapshot.
   */
  async createSnapshot(
    name?: string,
    description?: string,
  ): Promise<Snapshot> {
    // Serialize workspace state
    const workspaceState = serialization.workspaces.save(this.workspace);

    // Create snapshot object
    const snapshot: Snapshot = {
      id: Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9),
      name: name || 'Auto-save ' + new Date().toLocaleString(),
      description: description || '',
      timestamp: Date.now(),
      blockCount: this.workspace.getAllBlocks().length,
      workspaceState: workspaceState,
    };

    // Save snapshot to storage
    await this.storage.saveSnapshot(snapshot);

    // Clean up old snapshots if needed
    await this.cleanUpSnapshots();

    return snapshot;
  }

  /**
   * Loads a snapshot and applies it to the workspace.
   * @param id Snapshot ID.
   * @returns Whether the snapshot was loaded successfully.
   */
  async loadSnapshot(id: string): Promise<boolean> {
    const snapshot = await this.storage.loadSnapshot(id);
    if (!snapshot) {
      return false;
    }

    // Deserialize workspace state
    serialization.workspaces.load(snapshot.workspaceState, this.workspace);
    return true;
  }

  /**
   * Deletes a snapshot.
   * @param id Snapshot ID.
   */
  async deleteSnapshot(id: string): Promise<void> {
    await this.storage.deleteSnapshot(id);
  }

  /**
   * Loads all snapshots.
   * @returns All snapshots.
   */
  async loadAllSnapshots(): Promise<Snapshot[]> {
    const snapshots = await this.storage.loadAllSnapshots();
    // Sort by timestamp descending
    return snapshots.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Cleans up old snapshots.
   */
  private async cleanUpSnapshots(): Promise<void> {
    // Clean up snapshots older than 30 days
    await this.storage.cleanUpOldSnapshots();

    // Limit number of snapshots
    const snapshots = await this.storage.loadAllSnapshots();
    if (snapshots.length > this.options.maxSnapshots!) {
      const snapshotsToDelete = snapshots.slice(this.options.maxSnapshots!);
      for (const snapshot of snapshotsToDelete) {
        await this.storage.deleteSnapshot(snapshot.id);
      }
    }
  }

  /**
   * Starts auto-save timer.
   */
  private startAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }

    this.autoSaveTimer = window.setInterval(() => {
      this.createSnapshot().catch((error) => {
        console.error('Failed to auto-save snapshot:', error);
      });
    }, this.options.autoSaveInterval!);
  }

  /**
   * Stops auto-save timer.
   */
  stopAutoSave(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
      this.autoSaveTimer = null;
    }
  }

  /**
   * Compares two snapshots and returns the differences.
   * @param snapshot1 First snapshot.
   * @param snapshot2 Second snapshot.
   * @returns Differences between the two snapshots.
   */
  compareSnapshots(snapshot1: Snapshot, snapshot2: Snapshot): SnapshotDiff {
    const blocks1 = this.extractBlocksFromSnapshot(snapshot1);
    const blocks2 = this.extractBlocksFromSnapshot(snapshot2);

    const addedBlocks: string[] = [];
    const deletedBlocks: string[] = [];
    const modifiedBlocks: string[] = [];

    // Find added blocks
    for (const blockId in blocks2) {
      if (!(blockId in blocks1)) {
        addedBlocks.push(blockId);
      }
    }

    // Find deleted blocks
    for (const blockId in blocks1) {
      if (!(blockId in blocks2)) {
        deletedBlocks.push(blockId);
      }
    }

    // Find modified blocks
    for (const blockId in blocks1) {
      if (blockId in blocks2) {
        if (this.blocksAreDifferent(blocks1[blockId], blocks2[blockId])) {
          modifiedBlocks.push(blockId);
        }
      }
    }

    return {
      addedBlocks,
      deletedBlocks,
      modifiedBlocks,
      stats: {
        added: addedBlocks.length,
        deleted: deletedBlocks.length,
        modified: modifiedBlocks.length,
      },
    };
  }

  /**
   * Extracts blocks from a snapshot.
   * @param snapshot Snapshot to extract blocks from.
   * @returns Object with block IDs as keys and block data as values.
   */
  private extractBlocksFromSnapshot(snapshot: Snapshot): Record<string, any> {
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

    return blocks;
  }

  /**
   * Compares two blocks and returns whether they are different.
   * @param block1 First block.
   * @param block2 Second block.
   * @returns Whether the blocks are different.
   */
  private blocksAreDifferent(block1: any, block2: any): boolean {
    // Compare basic block properties
    if (block1.type !== block2.type) return true;
    if (block1.x !== block2.x) return true;
    if (block1.y !== block2.y) return true;
    if (block1.disabled !== block2.disabled) return true;
    if (block1.deletable !== block2.deletable) return true;
    if (block1.movable !== block2.movable) return true;
    if (block1.editable !== block2.editable) return true;

    // Compare fields
    const fields1 = block1.field || [];
    const fields2 = block2.field || [];

    const fields1Map = this.fieldsToMap(fields1);
    const fields2Map = this.fieldsToMap(fields2);

    for (const fieldName in fields1Map) {
      if (fields1Map[fieldName] !== fields2Map[fieldName]) return true;
    }

    for (const fieldName in fields2Map) {
      if (!(fieldName in fields1Map)) return true;
    }

    // Compare inputs
    const inputs1 = block1.input || [];
    const inputs2 = block2.input || [];

    if (inputs1.length !== inputs2.length) return true;

    return false;
  }

  /**
   * Converts fields array to a map.
   * @param fields Fields array.
   * @returns Fields map with field names as keys and field values as values.
   */
  private fieldsToMap(fields: any[]): Record<string, string> {
    const fieldsMap: Record<string, string> = {};
    const fieldsArray = Array.isArray(fields) ? fields : [fields];

    for (const field of fieldsArray) {
      if (field.name && field[field.type]) {
        fieldsMap[field.name] = field[field.type];
      }
    }

    return fieldsMap;
  }
}

/**
 * Interface for snapshot differences.
 */
export interface SnapshotDiff {
  addedBlocks: string[];
  deletedBlocks: string[];
  modifiedBlocks: string[];
  stats: {
    added: number;
    deleted: number;
    modified: number;
  };
}

/**
 * Registers the snapshots feature.
 */
export function register(): void {
  // TODO: Register UI components and toolbar button
}