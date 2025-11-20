/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Object representing a health score indicator.
 *
 * @class
 */
// Former goog.module ID: Blockly.HealthScore

import * as browserEvents from './browser_events.js';
import {ComponentManager} from './component_manager.js';
import * as Css from './css.js';
import {EventType} from './events/type.js';
import * as eventUtils from './events/utils.js';
import type {IPositionable} from './interfaces/i_positionable.js';
import type {UiMetrics} from './metrics_manager.js';
import * as uiPosition from './positionable_helpers.js';
import {SPRITE} from './sprites.js';
import * as Touch from './touch.js';
import * as dom from './utils/dom.js';
import {Rect} from './utils/rect.js';
import {Size} from './utils/size.js';
import {Svg} from './utils/svg.js';
import type {WorkspaceSvg} from './workspace_svg.js';
import {HealthScoreCalculator, type HealthScoreResults} from './health_score_calculator.js';

/**
 * Class for a health score indicator.
 */
export class HealthScore implements IPositionable {
  /**
   * The unique ID for this component that is used to register with the
   * ComponentManager.
   */
  id = 'healthScore';

  /**
   * Array holding info needed to unbind events.
   * Used for disposing.
   * Ex: [[node, name, func], [node, name, func]].
   */
  private boundEvents: browserEvents.Data[] = [];

  /** The health score button SVG <g> element. */
  private healthScoreGroup: SVGGElement | null = null;

  /** Width of the health score button. */
  private readonly WIDTH = 32;

  /** Height of the health score button. */
  private readonly HEIGHT = 32;

  /** Distance between health score button and bottom or top edge of workspace. */
  private readonly MARGIN_VERTICAL = 20;

  /** Distance between health score button and right or left edge of workspace. */
  private readonly MARGIN_HORIZONTAL = 60;

  /** The SVG group containing the health score button. */
  private svgGroup: SVGElement | null = null;

  /** Left coordinate of the health score button. */
  private left = 0;

  /** Top coordinate of the health score button. */
  private top = 0;

  /** Whether this has been initialized. */
  private initialized = false;

  /** @param workspace The workspace to sit in. */
  constructor(private readonly workspace: WorkspaceSvg) {}

  /**
   * Create the health score button.
   *
   * @returns The health score button SVG group.
   */
  createDom(): SVGElement {
    this.svgGroup = dom.createSvgElement(Svg.G, {});

    // Each filter/pattern needs a unique ID for the case of multiple Blockly
    // instances on a page.  Browser behaviour becomes undefined otherwise.
    // https://neil.fraser.name/news/2015/11/01/
    const rnd = String(Math.random()).substring(2);
    this.createHealthScoreButtonSvg(rnd);
    return this.svgGroup;
  }

  /** Initializes the health score button. */
  init() {
    this.workspace.getComponentManager().addComponent({
      component: this,
      weight: ComponentManager.ComponentWeight.ZOOM_CONTROLS_WEIGHT - 1,
      capabilities: [ComponentManager.Capability.POSITIONABLE],
    });
    this.initialized = true;
  }

  /**
   * Disposes of this health score button.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose() {
    this.workspace.getComponentManager().removeComponent('healthScore');
    if (this.svgGroup) {
      dom.removeNode(this.svgGroup);
    }
    for (const event of this.boundEvents) {
      browserEvents.unbind(event);
    }
    this.boundEvents.length = 0;
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The UI elements's bounding box. Null if bounding box should be
   *     ignored by other UI elements.
   */
  getBoundingRectangle(): Rect | null {
    const height = this.HEIGHT;
    const bottom = this.top + height;
    const right = this.left + this.WIDTH;
    return new Rect(this.top, bottom, this.left, right);
  }

  /**
   * Positions the health score button.
   * It is positioned in the opposite corner to the corner the
   * categories/toolbox starts at, near the zoom controls.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that are already on the workspace.
   */
  position(metrics: UiMetrics, savedPositions: Rect[]) {
    // Not yet initialized.
    if (!this.initialized) {
      return;
    }

    const cornerPosition = uiPosition.getCornerOppositeToolbox(
      this.workspace,
      metrics,
    );
    const height = this.HEIGHT;
    const startRect = uiPosition.getStartPositionRect(
      cornerPosition,
      new Size(this.WIDTH, height),
      this.MARGIN_HORIZONTAL,
      this.MARGIN_VERTICAL,
      metrics,
      this.workspace,
    );

    const verticalPosition = cornerPosition.vertical;
    const bumpDirection = verticalPosition === uiPosition.verticalPosition.TOP
      ? uiPosition.bumpDirection.DOWN
      : uiPosition.bumpDirection.UP;
    const positionRect = uiPosition.bumpPositionRect(
      startRect,
      this.MARGIN_VERTICAL,
      bumpDirection,
      savedPositions,
    );

    this.top = positionRect.top;
    this.left = positionRect.left;
    this.svgGroup?.setAttribute(
      'transform',
      'translate(' + this.left + ',' + this.top + ')',
    );
  }

  /**
   * Create the health score button icon and its event handler.
   *
   * @param rnd The random string to use as a suffix in the clip path's ID.
   *     These IDs must be unique in case there are multiple Blockly instances
   *     on the same page.
   */
  private createHealthScoreButtonSvg(rnd: string) {
    /* This markup will be generated and added to the .svgGroup:
        <g class="blocklyHealthScore">
          <clipPath id="blocklyHealthScoreClipPath837493">
            <rect width="32" height="32"></rect>
          </clipPath>
          <image width="96" height="124" x="0" y="-32"
        xlink:href="media/sprites.png"
              clip-path="url(#blocklyHealthScoreClipPath837493)"></image>
        </g>
        */
    this.healthScoreGroup = dom.createSvgElement(
      Svg.G,
      {'class': 'blocklyHealthScore'}, 
      this.svgGroup,
    );
    const clip = dom.createSvgElement(
      Svg.CLIPPATH,
      {'id': 'blocklyHealthScoreClipPath' + rnd}, 
      this.healthScoreGroup,
    );
    dom.createSvgElement(
      Svg.RECT,
      {
        'width': 32,
        'height': 32,
      },
      clip,
    );

    // For now, we'll use a simple circle instead of the sprites
    const healthScoreCircle = dom.createSvgElement(
      Svg.CIRCLE,
      {
        'cx': 16,
        'cy': 16,
        'r': 14,
        'fill': '#4CAF50',
        'stroke': '#2E7D32',
        'stroke-width': '2',
      },
      this.healthScoreGroup,
    );

    // Add a simple text label with initial score
    const healthScoreText = dom.createSvgElement(
      Svg.TEXT,
      {
        'x': 16,
        'y': 20,
        'text-anchor': 'middle',
        'font-family': 'Arial',
        'font-size': '14',
        'font-weight': 'bold',
        'fill': '#FFFFFF',
      },
      this.healthScoreGroup,
    );
    healthScoreText.textContent = '100';

    // Attach listener.
    this.boundEvents.push(
      browserEvents.conditionalBind(
        this.healthScoreGroup,
        'pointerdown',
        null,
        this.showHealthScoreDialog.bind(this),
      ),
    );
  }

  /**
   * Show the health score dialog when the button is clicked.
   */
  private showHealthScoreDialog() {
    // Calculate the health score
    const calculator = new HealthScoreCalculator();
    const results = calculator.calculateHealthScore(this.workspace);

    // Create the dialog element
    const dialog = this.createDialog(results);
    document.body.appendChild(dialog);

    // Add event listener to close the dialog when clicking outside
    const closeHandler = (e: Event) => {
      if (!(e.target as Element).closest('.blocklyHealthScoreDialog')) {
        document.body.removeChild(dialog);
        document.removeEventListener('click', closeHandler);
      }
    };
    document.addEventListener('click', closeHandler);
  }

  /**
   * Create the health score dialog.
   *
   * @param results The health score results.
   * @returns The dialog element.
   */
  private createDialog(results: HealthScoreResults): HTMLDivElement {
    const dialog = document.createElement('div');
    dialog.className = 'blocklyHealthScoreDialog';
    dialog.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background-color: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      z-index: 1000;
      min-width: 500px;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: Arial, sans-serif;
    `;

    // Create dialog header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      padding-bottom: 16px;
      border-bottom: 2px solid #f0f0f0;
    `;

    const title = document.createElement('h2');
    title.textContent = '结构健康指数';
    title.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 24px;
      font-weight: bold;
    `;
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 32px;
      cursor: pointer;
      color: #999;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: background-color 0.2s;
    `;
    closeBtn.onclick = () => document.body.removeChild(dialog);
    closeBtn.onmouseenter = () => closeBtn.style.backgroundColor = '#f0f0f0';
    closeBtn.onmouseleave = () => closeBtn.style.backgroundColor = 'transparent';
    header.appendChild(closeBtn);
    dialog.appendChild(header);

    // Create total score display
    const totalScoreContainer = document.createElement('div');
    totalScoreContainer.style.cssText = `
      text-align: center;
      margin-bottom: 32px;
    `;

    const totalScoreLabel = document.createElement('div');
    totalScoreLabel.textContent = '综合健康指数';
    totalScoreLabel.style.cssText = `
      font-size: 18px;
      color: #666;
      margin-bottom: 8px;
    `;
    totalScoreContainer.appendChild(totalScoreLabel);

    const totalScoreValue = document.createElement('div');
    totalScoreValue.textContent = `${results.totalScore}`;
    totalScoreValue.style.cssText = `
      font-size: 72px;
      font-weight: bold;
      color: ${results.totalScore >= 80 ? '#4CAF50' : results.totalScore >= 50 ? '#FF9800' : '#F44336'};
      margin: 0;
    `;
    totalScoreContainer.appendChild(totalScoreValue);
    dialog.appendChild(totalScoreContainer);

    // Create category scores
    const categoriesContainer = document.createElement('div');
    categoriesContainer.style.cssText = `
      margin-bottom: 32px;
    `;

    const categories = [
      {name: '可读性', value: results.readability, color: '#2196F3'},
      {name: '模块化', value: results.modularity, color: '#4CAF50'},
      {name: '逻辑深度', value: results.logicalDepth, color: '#FF9800'},
      {name: '重复度', value: results.redundancy, color: '#9C27B0'},
    ];

    categories.forEach(category => {
      const categoryContainer = document.createElement('div');
      categoryContainer.style.cssText = `
        margin-bottom: 16px;
      `;

      const categoryHeader = document.createElement('div');
      categoryHeader.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 8px;
      `;

      const categoryName = document.createElement('span');
      categoryName.textContent = category.name;
      categoryName.style.cssText = `
        font-size: 16px;
        font-weight: 600;
        color: #333;
      `;
      categoryHeader.appendChild(categoryName);

      const categoryValue = document.createElement('span');
      categoryValue.textContent = `${category.value}`;
      categoryValue.style.cssText = `
        font-size: 18px;
        font-weight: bold;
        color: ${category.color};
      `;
      categoryHeader.appendChild(categoryValue);
      categoryContainer.appendChild(categoryHeader);

      // Create progress bar
      const progressBarContainer = document.createElement('div');
      progressBarContainer.style.cssText = `
        width: 100%;
        height: 12px;
        background-color: #f0f0f0;
        border-radius: 6px;
        overflow: hidden;
      `;

      const progressBar = document.createElement('div');
      progressBar.style.cssText = `
        width: ${category.value}%;
        height: 100%;
        background-color: ${category.color};
        transition: width 0.5s ease;
      `;
      progressBarContainer.appendChild(progressBar);
      categoryContainer.appendChild(progressBarContainer);
      categoriesContainer.appendChild(categoryContainer);
    });

    dialog.appendChild(categoriesContainer);

    // Create suggestions section
    if (results.suggestions.length > 0) {
      const suggestionsContainer = document.createElement('div');
      suggestionsContainer.style.cssText = `
        margin-bottom: 24px;
      `;

      const suggestionsTitle = document.createElement('h3');
      suggestionsTitle.textContent = '改进建议';
      suggestionsTitle.style.cssText = `
        font-size: 20px;
        color: #333;
        margin: 0 0 16px 0;
      `;
      suggestionsContainer.appendChild(suggestionsTitle);

      const suggestionsList = document.createElement('ul');
      suggestionsList.style.cssText = `
        list-style: none;
        padding: 0;
        margin: 0;
      `;

      results.suggestions.forEach((suggestion, index) => {
        const suggestionItem = document.createElement('li');
        suggestionItem.style.cssText = `
          margin-bottom: 12px;
          padding: 12px;
          background-color: ${suggestion.severity === 'high' ? '#FFF3F3' : suggestion.severity === 'medium' ? '#FFF9E6' : '#F3FBFF'};
          border-left: 4px solid ${suggestion.severity === 'high' ? '#F44336' : suggestion.severity === 'medium' ? '#FF9800' : '#2196F3'};
          border-radius: 4px;
        `;

        const suggestionMessage = document.createElement('div');
        suggestionMessage.textContent = `${index + 1}. ${suggestion.message}`;
        suggestionMessage.style.cssText = `
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
        `;
        suggestionItem.appendChild(suggestionMessage);

        if (suggestion.fixable) {
          const fixBtn = document.createElement('button');
          fixBtn.textContent = '一键修复';
          fixBtn.style.cssText = `
            background-color: #4CAF50;
            color: white;
            border: none;
            padding: 6px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background-color 0.2s;
          `;
          fixBtn.onclick = () => this.applyFix(suggestion);
          fixBtn.onmouseenter = () => fixBtn.style.backgroundColor = '#43A047';
          fixBtn.onmouseleave = () => fixBtn.style.backgroundColor = '#4CAF50';
          suggestionItem.appendChild(fixBtn);
        }

        suggestionsList.appendChild(suggestionItem);
      });

      suggestionsContainer.appendChild(suggestionsList);
      dialog.appendChild(suggestionsContainer);
    }

    // Create close button
    const closeContainer = document.createElement('div');
    closeContainer.style.cssText = `
      text-align: center;
    `;

    const closeDialogBtn = document.createElement('button');
    closeDialogBtn.textContent = '关闭';
    closeDialogBtn.style.cssText = `
      background-color: #2196F3;
      color: white;
      border: none;
      padding: 10px 24px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
      transition: background-color 0.2s;
    `;
    closeDialogBtn.onclick = () => document.body.removeChild(dialog);
    closeDialogBtn.onmouseenter = () => closeDialogBtn.style.backgroundColor = '#1976D2';
    closeDialogBtn.onmouseleave = () => closeDialogBtn.style.backgroundColor = '#2196F3';
    closeContainer.appendChild(closeDialogBtn);
    dialog.appendChild(closeContainer);

    return dialog;
  }

  /**
   * Apply a fix for a suggestion.
   *
   * @param suggestion The suggestion to fix.
   */
  private applyFix(suggestion: any) {
    // For now, just show an alert
    alert('修复功能将在后续版本中实现');
    // TODO: Implement actual fix functionality
  }
}