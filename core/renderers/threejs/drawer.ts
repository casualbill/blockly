/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.threejs.Drawer

import {Drawer as BaseDrawer} from '../common/drawer.js';
import type {BlockSvg} from '../../block_svg.js';
import type {RenderInfo} from '../common/info.js';

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
   * Draw the block to the workspace.
   */
  draw() {
    // Call the base class draw method to generate the path
    super.draw();

    // The base class sets this.outlinePath_ and this.inlinePath_
    // For Three.js, we need to pass this to the pathObject
    const path = this.outlinePath_ + ' ' + this.inlinePath_;
    this.block_.pathObject.setPath(path);

    // Add some 3D positioning based on block depth
    const zOffset = 0.05 * this.getBlockDepth_(this.block_);
    // Set a Z offset based on depth
    (this.block_.pathObject as any).zOffset = zOffset;
  }

  /**
   * Calculate the depth of the block in the stack.
   *
   * @param block The block to calculate depth for.
   * @returns The depth of the block.
   */
  private getBlockDepth_(block: BlockSvg): number {
    // Calculate depth based on block position in stack
    let depth = 0;
    let currentBlock = block;
    while (currentBlock) {
      if (currentBlock.previousConnection && currentBlock.previousConnection.targetBlock()) {
        depth++;
      }
      const nextBlock = currentBlock.previousConnection ? currentBlock.previousConnection.targetBlock() : null;
      if (!nextBlock) break;
      currentBlock = nextBlock;
    }
    return depth;
  }
}