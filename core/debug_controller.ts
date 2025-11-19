/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from './blockly';
import {Block} from './block';
import {Workspace} from './workspace';

/**
 * Enum for debug execution mode.
 */
export enum DebugMode {
  /** Not in debug mode. */
  NONE,
  /** Running normally. */
  RUNNING,
  /** Paused at a breakpoint. */
  PAUSED,
  /** Stepping through code. */
  STEPPING
}

/**
 * Debug controller class that manages breakpoints and execution.
 */
export class DebugController {
  private workspace_: Workspace;
  private mode_: DebugMode = DebugMode.NONE;
  private breakpoints_: Set<string> = new Set();
  private currentBlock_: Block | null = null;
  private stepMode_: 'into' | 'over' | 'out' = 'into';
  private executionQueue_: Block[] = [];
  private onExecutionUpdate_: ((block: Block | null, mode: DebugMode) => void) | null = null;

  /**
   * Constructs a new DebugController.
   * @param workspace The workspace to debug.
   */
  constructor(workspace: Workspace) {
    this.workspace_ = workspace;
  }

  /**
   * Gets the current debug mode.
   * @returns The current debug mode.
   */
  getMode(): DebugMode {
    return this.mode_;
  }

  /**
   * Sets a breakpoint on the given block.
   * @param block The block to set the breakpoint on.
   * @param enabled Whether the breakpoint should be enabled.
   */
  setBreakpoint(block: Block, enabled: boolean): void {
    if (enabled) {
      this.breakpoints_.add(block.id);
      block.setBreakpoint(true);
    } else {
      this.breakpoints_.delete(block.id);
      block.setBreakpoint(false);
    }
  }

  /**
   * Checks if a block has a breakpoint.
   * @param block The block to check.
   * @returns True if the block has a breakpoint.
   */
  hasBreakpoint(block: Block): boolean {
    return this.breakpoints_.has(block.id);
  }

  /**
   * Clears all breakpoints in the workspace.
   */
  clearAllBreakpoints(): void {
    this.breakpoints_.forEach(blockId => {
      const block = this.workspace_.getBlockById(blockId);
      if (block) {
        block.setBreakpoint(false);
      }
    });
    this.breakpoints_.clear();
  }

  /**
   * Starts debugging the workspace.
   */
  startDebugging(): void {
    if (this.mode_ !== DebugMode.NONE) {
      return; // Already debugging
    }
    this.mode_ = DebugMode.RUNNING;
    this.executeNextBlock_();
  }

  /**
   * Pauses execution at the current block.
   */
  pause(): void {
    if (this.mode_ === DebugMode.RUNNING) {
      this.mode_ = DebugMode.PAUSED;
      this.notifyExecutionUpdate_();
    }
  }

  /**
   * Continues execution from the current block.
   */
  continue(): void {
    if (this.mode_ === DebugMode.PAUSED) {
      this.mode_ = DebugMode.RUNNING;
      this.executeNextBlock_();
    }
  }

  /**
   * Steps through the code.
   * @param mode The step mode: 'into', 'over', or 'out'.
   */
  step(mode: 'into' | 'over' | 'out'): void {
    if (this.mode_ !== DebugMode.PAUSED) {
      return; // Can only step when paused
    }
    this.stepMode_ = mode;
    this.mode_ = DebugMode.STEPPING;
    this.executeNextBlock_();
  }

  /**
   * Stops debugging.
   */
  stop(): void {
    this.mode_ = DebugMode.NONE;
    this.currentBlock_ = null;
    this.executionQueue_ = [];
    this.notifyExecutionUpdate_();
  }

  /**
   * Executes the next block in the queue.
   * @private
   */
  private executeNextBlock_(): void {
    // If we're paused, don't execute anything
    if (this.mode_ === DebugMode.PAUSED) {
      return;
    }

    // Get the next block to execute
    let nextBlock: Block | null;
    if (this.executionQueue_.length > 0) {
      nextBlock = this.executionQueue_.shift() || null;
    } else if (this.currentBlock_) {
      // If we have a current block, get the next one
      nextBlock = this.getNextBlock_(this.currentBlock_, this.stepMode_);
    } else {
      // Otherwise, get the first block in the workspace
      nextBlock = this.getFirstBlock_();
    }

    // If there are no more blocks to execute, stop debugging
    if (!nextBlock) {
      this.stop();
      return;
    }

    // Set the current block and highlight it
    this.currentBlock_ = nextBlock;
    nextBlock.setExecuting(true);

    // Check if we should pause at a breakpoint
    if (this.breakpoints_.has(nextBlock.id)) {
      this.mode_ = DebugMode.PAUSED;
      this.notifyExecutionUpdate_();
      return;
    }

    // If we're stepping, pause after executing this block
    if (this.mode_ === DebugMode.STEPPING) {
      this.mode_ = DebugMode.PAUSED;
      this.notifyExecutionUpdate_();
      return;
    }

    // Otherwise, continue execution after a short delay (simulating code execution)
    setTimeout(() => {
      // Unhighlight the current block
      if (this.currentBlock_) {
        this.currentBlock_.setExecuting(false);
      }
      // Execute the next block
      this.executeNextBlock_();
    }, 100);
  }

  /**
   * Gets the next block to execute based on the step mode.
   * @param currentBlock The current block being executed.
   * @param stepMode The step mode: 'into', 'over', or 'out'.
   * @returns The next block to execute, or null if there are no more blocks.
   * @private
   */
  private getNextBlock_(currentBlock: Block, stepMode: 'into' | 'over' | 'out'): Block | null {
    // Implement step logic based on mode
    // This is a simplified implementation - in a real interpreter, this would be more complex
    if (stepMode === 'into') {
      // Step into functions or loops
      // For now, just return the next block in the sequence
      return currentBlock.getNextBlock();
    } else if (stepMode === 'over') {
      // Step over functions or loops
      // For now, just return the next block in the sequence
      return currentBlock.getNextBlock();
    } else if (stepMode === 'out') {
      // Step out of functions or loops
      // For now, just return the next block in the sequence
      return currentBlock.getNextBlock();
    }
    return null;
  }

  /**
   * Gets the first block in the workspace.
   * @returns The first block in the workspace, or null if there are no blocks.
   * @private
   */
  private getFirstBlock_(): Block | null {
    // Get all top-level blocks
    const topBlocks = this.workspace_.getTopBlocks(true);
    if (topBlocks.length === 0) {
      return null;
    }
    // Return the first block
    return topBlocks[0];
  }

  /**
   * Sets a callback for execution updates.
   * @param callback The callback function.
   */
  setOnExecutionUpdate(callback: (block: Block | null, mode: DebugMode) => void): void {
    this.onExecutionUpdate_ = callback;
  }

  /**
   * Notifies the callback of an execution update.
   * @private
   */
  private notifyExecutionUpdate_(): void {
    if (this.onExecutionUpdate_) {
      this.onExecutionUpdate_(this.currentBlock_, this.mode_);
    }
  }
}