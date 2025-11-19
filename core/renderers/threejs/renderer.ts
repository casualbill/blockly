/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.threejs.Renderer

import {Renderer as BaseRenderer} from '../common/renderer.js';
import {PathObject} from './path_object.js';
import {ConstantProvider} from '../common/constants.js';
import {RenderInfo} from '../common/info.js';
import {register} from '../common/block_rendering.js';

import {Drawer} from './drawer.js';
import type {BlockSvg} from '../../block_svg.js';
import type {BlockStyle} from '../../theme.js';
import type {IPathObject} from '../common/i_path_object.js';

export class Renderer extends BaseRenderer {
  /**
   * @param name The renderer name.
   */
  constructor(name: string) {
    super(name);
  }

  /**
   * Create a new instance of the renderer's constant provider.
   *
   * @returns The constant provider.
   */
  protected makeConstants_(): ConstantProvider {
    return new ConstantProvider();
  }

  /**
   * Create a new instance of the renderer's render info object.
   *
   * @param block The block to measure.
   * @returns The render info object.
   */
  protected makeRenderInfo_(block: BlockSvg): RenderInfo {
    return new RenderInfo(this, block);
  }

  /**
   * Create a new instance of the renderer's drawer.
   *
   * @param block The block to render.
   * @param info An object containing all information needed to render this
   *     block.
   * @returns The drawer.
   */
  protected makeDrawer_(block: BlockSvg, info: RenderInfo): Drawer {
    return new Drawer(block, info);
  }

  /**
   * Create a new instance of a renderer path object.
   *
   * @param root The root SVG element.
   * @param style The style object to use for colouring.
   * @returns The renderer path object.
   */
  makePathObject(root: SVGElement, style: BlockStyle): IPathObject {
    return new PathObject(root, style, this.constants_);
  }
}

// Register the renderer
register('threejs', Renderer);