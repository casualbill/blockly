/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.canvas.Renderer

import type {BlockSvg} from '../../block_svg.js';
import type {BlockStyle} from '../../theme.js';
import * as blockRendering from '../common/block_rendering.js';
import {ConstantProvider} from '../common/constants.js';
import type {RenderInfo as BaseRenderInfo} from '../common/info.js';
import {RenderInfo} from '../common/info.js';
import {Renderer as BaseRenderer} from '../common/renderer.js';
import {Drawer} from './drawer.js';
import {PathObject} from './path_object.js';

/**
 * The canvas renderer. This renderer uses HTML5 Canvas to render blocks.
 */
export class Renderer extends BaseRenderer {
  protected override constants_!: ConstantProvider;

  /**
   * @param name The renderer name.
   */
  constructor(name: string) {
    super(name);
  }

  /**
   * Create a new instance of the renderer's drawer.
   *
   * @param block The block to render.
   * @param info An object containing all information needed to render this
   *     block.
   * @returns The drawer.
   */
  protected override makeDrawer_(
    block: BlockSvg,
    info: BaseRenderInfo,
  ): Drawer {
    return new Drawer(block, info as RenderInfo);
  }

  /**
   * Create a new instance of a renderer path object.
   *
   * @param root The root HTML element.
   * @param style The style object to use for colouring.
   * @returns The renderer path object.
   */
  override makePathObject(root: any, style: BlockStyle): PathObject {
    // Canvas renderer uses HTML element instead of SVG
    return new PathObject(root, style, this.constants_);
  }
}

blockRendering.register('canvas', Renderer);
