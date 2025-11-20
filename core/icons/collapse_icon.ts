/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as browserEvents from '../browser_events.js';
import * as touch from '../touch.js';
import * as dom from '../utils/dom.js';
import {Svg} from '../utils/svg.js';
import {BlockSvg} from '../block_svg.js';
import type {IIcon} from '../interfaces/i_icon.js';
import type {IFocusableTree} from '../interfaces/i_focusable_tree.js';
import {IconType} from './icon_types.js';

/**
 * Icon that allows collapsing/expanding a block.
 */
export class CollapseIcon implements IIcon {
  /** The block that this icon belongs to. */
  private block_: BlockSvg;

  /** The top-level SVG element for the icon. */
  private svgGroup_: SVGElement | null = null;

  /**
   * Creates a new CollapseIcon instance.
   *
   * @param block The block this icon is associated with.
   */
  constructor(block: BlockSvg) {
    this.block_ = block;
  }

  /**
   * Gets the type of this icon.
   *
   * @returns The icon type.
   */
  getType(): IconType<CollapseIcon> {
    return IconType.COLLAPSE;
  }

  /**
   * Initializes the SVG view for this icon.
   *
   * @param pointerdownListener The listener for pointerdown events.
   */
  initView(pointerdownListener: (e: PointerEvent) => void) {
    if (this.svgGroup_) {
      // Already initialized.
      return;
    }

    this.svgGroup_ = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    this.svgGroup_.setAttribute('class', 'blocklyIconGroup');

    // Create the SVG icon element (up arrow for collapse)
    const iconPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    iconPath.setAttribute('d', 'M10 18l-8-8 8-8 2 2-6 6 6 6z');
    iconPath.setAttribute('class', 'blocklyIcon');
    this.svgGroup_.appendChild(iconPath);

    // Add pointerdown event listener
    this.svgGroup_.addEventListener('pointerdown', (e) => {
      pointerdownListener(e);
      e.stopPropagation();
    });
  }

  /**
   * Gets the weight of this icon.
   * The weight determines the order of icons in the icon group.
   *
   * @returns The icon weight.
   */
  getWeight(): number {
    return 20; // Weight determines rendering order
  }

  /**
   * Gets the size of this icon.
   *
   * @returns The icon size.
   */
  getSize(): {width: number; height: number} {
    return {width: 24, height: 24}; // Size of the icon
  }

  /**
   * Applies color to this icon.
   */
  applyColour(): void {
    // No color to apply for this icon
  }

  /**
   * Hides this icon for an insertion marker.
   */
  hideForInsertionMarker(): void {
    // No action needed for insertion marker
  }

  /**
   * Updates the icon when the block's editable state changes.
   */
  updateEditable(): void {
    // No action needed for editable state
  }

  /**
   * Updates the icon when the block's collapsed state changes.
   */
  updateCollapsed(): void {
    // Update the icon's appearance when the block is collapsed/expanded
    if (!this.svgGroup_) return;
    const path = this.svgGroup_.querySelector('path') as SVGPathElement;
    if (this.block_.isCollapsed()) {
      path.setAttribute('d', 'M10 6l8 8-8 8-2-2 6-6-6-6z'); // Down arrow for expanded state
    } else {
      path.setAttribute('d', 'M10 18l-8-8 8-8 2 2-6 6 6 6z'); // Up arrow for collapsed state
    }
  }

  /**
   * Returns whether this icon should be shown when the block is collapsed.
   *
   * @returns True if the icon should be shown when collapsed.
   */
  isShownWhenCollapsed(): boolean {
    return false; // Icon not shown when block is collapsed
  }

  /**
   * Sets the offset of this icon within the block.
   *
   * @param offset The offset coordinates.
   */
  setOffsetInBlock(offset: {x: number; y: number}): void {
    // No action needed for offset change
  }

  /**
   * Handles location changes of the block.
   *
   * @param blockOrigin The block's origin coordinates.
   */
  onLocationChange(blockOrigin: {x: number; y: number}): void {
    // No action needed for location change
  }

  /**
   * Handles the click event on the collapse icon.
   */
  onClick(): void {
    // Toggle collapse state when clicked
    const newCollapsedState = !this.block_.isCollapsed();
    this.block_.setCollapsed(newCollapsedState, true); // Collapse recursively
  }

  /**
   * Returns the SVG element for this icon.
   *
   * @returns The SVG element.
   */
  getSvgRoot(): SVGElement | null {
    return this.svgGroup_;
  }

  /**
   * Disposes of this icon.
   */
  dispose() {
    if (this.svgGroup_) {
      this.svgGroup_.remove();
      this.svgGroup_ = null;
    }
  }

  /**
   * Focuses this icon.
   */
  focus() {
    // No focus handling needed for this icon
  }

  /**
   * Blurs this icon.
   */
  blur() {
    // No blur handling needed for this icon
  }

  /**
   * Returns whether this icon is focusable.
   *
   * @returns True if the icon is focusable.
   */
  isFocusable(): boolean {
    return false; // Icon is not focusable
  }

  getFocusableElement(): HTMLElement | SVGElement {
    // Return a dummy element since this icon is not focusable
    return document.createElement('div');
  }

  getFocusableTree(): IFocusableTree {
    // Return a minimal focusable tree since this icon is not focusable
    const tree: Partial<IFocusableTree> = {getRootFocusableNode: () => this};
    tree.getRestoredFocusableNode = () => null;
    tree.getNestedTrees = () => [];
    tree.lookUpFocusableNode = () => null;
    tree.onTreeFocus = () => {};
    tree.onTreeBlur = () => {};
    return tree as IFocusableTree;
  }

  onNodeFocus(): void {
    // No action needed on focus
  }

  onNodeBlur(): void {
    // No action needed on blur
  }

  canBeFocused(): boolean {
    return false; // Icon cannot be focused
  }
}