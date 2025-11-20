/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {BlockSvg} from './block_svg.js';
import {Field} from './field.js';
import {WorkspaceSvg} from './workspace_svg.js';
import * as browserEvents from './browser_events.js';
import * as common from './common.js';
import * as Css from './css.js';
import * as dom from './utils/dom.js';
import {ComponentManager} from './component_manager.js';
import type {IPositionable} from './interfaces/i_positionable.js';
import type {UiMetrics} from './metrics_manager.js';
import {Rect} from './utils/rect.js';
import {Svg} from './utils/svg.js';

/**
 * Class for the find and replace functionality.
 */
export class FindReplace implements IPositionable {
  /**
   * The unique ID for this component that is used to register with the
   * ComponentManager.
   */
  id = 'findReplace';
  private readonly workspace: WorkspaceSvg;
  private panelDiv: HTMLDivElement | null = null;
  private findInput: HTMLInputElement | null = null;
  private replaceInput: HTMLInputElement | null = null;
  private matchCaseCheckbox: HTMLInputElement | null = null;
  private wholeWordCheckbox: HTMLInputElement | null = null;
  private replaceAllButton: HTMLButtonElement | null = null;
  private replaceButton: HTMLButtonElement | null = null;
  private skipButton: HTMLButtonElement | null = null;
  private resultsDiv: HTMLDivElement | null = null;
  private statusDiv: HTMLDivElement | null = null;
  private isOpen = false;
  private currentMatchIndex = 0;
  private matches: Array<{
    block: BlockSvg;
    field?: Field;
    content: string;
    type: string;
  }> = [];
  private recentSearches: string[] = [];
  private MAX_RECENT_SEARCHES = 10;

  /**
   * Creates a new FindReplace instance.
   *
   * @param workspace The workspace to search in.
   */
  constructor(workspace: WorkspaceSvg) {
    this.workspace = workspace;
    // Register with component manager for positioning
    this.workspace.getComponentManager().addComponent({
      component: this,
      capabilities: [ComponentManager.Capability.POSITIONABLE],
      weight: 4, // Lower weight means higher priority (placed before other elements)
    });
    this.init();
  }

  /**
   * Initializes the find and replace component.
   */
  private init(): void {
    this.createDom();
    this.attachEventListeners();
    this.loadRecentSearches();
    // Create and add the find/replace button to the toolbar
    this.createFindReplaceButton();
  }

  /**
   * Creates the find/replace button and adds it to the toolbar.
   */
  private createFindReplaceButton(): void {
    // Check if button already exists
    if (document.querySelector('.blocklyFindReplaceButton')) {
      return;
    }

    // Create button group
    const buttonGroup = dom.createSvgElement(Svg.G, {
      'class': 'blocklyFindReplaceButton',
      'title': '查找和替换'
    });

    // Create search icon
    dom.createSvgElement(Svg.CIRCLE, {
      'cx': 12,
      'cy': 12,
      'r': 10,
      'stroke': '#555',
      'stroke-width': '2',
      'fill': 'none'
    }, buttonGroup);

    dom.createSvgElement(Svg.LINE, {
      'x1': 16,
      'y1': 16,
      'x2': 20,
      'y2': 20,
      'stroke': '#555',
      'stroke-width': '2',
      'stroke-linecap': 'round'
    }, buttonGroup);

    // Add click event listener
    buttonGroup.addEventListener('click', () => this.toggle());

    // Add the button to the zoom controls group (similar to zoom buttons)
    const workspaceSvg = this.workspace.getCanvas() as unknown as SVGElement;
    const svgGroup = workspaceSvg.parentElement;
    if (svgGroup) {
      // Try to find zoom controls group and add after it
      const zoomControlsGroup = svgGroup.querySelector('.blocklyZoom');
      if (zoomControlsGroup) {
        zoomControlsGroup.parentNode?.insertBefore(buttonGroup, zoomControlsGroup.nextSibling);
      } else {
        // Fallback: add to svg group
        svgGroup.appendChild(buttonGroup);
      }
    } else {
      // Fallback: add to body
      document.body.appendChild(buttonGroup);
    }
  }

  /**
   * Creates the DOM for the find and replace panel.
   */
  private createDom(): void {
    const container = common.getParentContainer() || document.body;

    // Create panel div
    this.panelDiv = document.createElement('div');
    dom.addClass(this.panelDiv, 'blocklyFindReplacePanel');
    this.panelDiv.style.display = 'none';

    // Create find input
    const findLabel = document.createElement('label');
    findLabel.textContent = '查找: ';
    this.findInput = document.createElement('input');
    this.findInput.type = 'text';
    this.findInput.placeholder = '输入搜索内容...';
    dom.addClass(this.findInput, 'blocklyFindReplaceInput');

    // Create replace input
    const replaceLabel = document.createElement('label');
    replaceLabel.textContent = '替换: ';
    this.replaceInput = document.createElement('input');
    this.replaceInput.type = 'text';
    this.replaceInput.placeholder = '输入替换内容...';
    dom.addClass(this.replaceInput, 'blocklyFindReplaceInput');

    // Create options div
    const optionsDiv = document.createElement('div');
    dom.addClass(optionsDiv, 'blocklyFindReplaceOptions');

    // Create match case checkbox
    this.matchCaseCheckbox = document.createElement('input');
    this.matchCaseCheckbox.type = 'checkbox';
    this.matchCaseCheckbox.id = 'blocklyMatchCase';
    const matchCaseLabel = document.createElement('label');
    matchCaseLabel.htmlFor = 'blocklyMatchCase';
    matchCaseLabel.textContent = '区分大小写';

    // Create whole word checkbox
    this.wholeWordCheckbox = document.createElement('input');
    this.wholeWordCheckbox.type = 'checkbox';
    this.wholeWordCheckbox.id = 'blocklyWholeWord';
    const wholeWordLabel = document.createElement('label');
    wholeWordLabel.htmlFor = 'blocklyWholeWord';
    wholeWordLabel.textContent = '全字匹配';

    optionsDiv.appendChild(this.matchCaseCheckbox);
    optionsDiv.appendChild(matchCaseLabel);
    optionsDiv.appendChild(document.createTextNode(' '));
    optionsDiv.appendChild(this.wholeWordCheckbox);
    optionsDiv.appendChild(wholeWordLabel);

    // Create buttons div
    const buttonsDiv = document.createElement('div');
    dom.addClass(buttonsDiv, 'blocklyFindReplaceButtons');

    this.replaceAllButton = document.createElement('button');
    this.replaceAllButton.textContent = '替换全部';
    dom.addClass(this.replaceAllButton, 'blocklyFindReplaceButton');

    this.replaceButton = document.createElement('button');
    this.replaceButton.textContent = '替换';
    dom.addClass(this.replaceButton, 'blocklyFindReplaceButton');

    this.skipButton = document.createElement('button');
    this.skipButton.textContent = '跳过';
    dom.addClass(this.skipButton, 'blocklyFindReplaceButton');

    buttonsDiv.appendChild(this.replaceAllButton);
    buttonsDiv.appendChild(this.replaceButton);
    buttonsDiv.appendChild(this.skipButton);

    // Create results div
    this.resultsDiv = document.createElement('div');
    dom.addClass(this.resultsDiv, 'blocklyFindReplaceResults');

    // Create status div
    this.statusDiv = document.createElement('div');
    dom.addClass(this.statusDiv, 'blocklyFindReplaceStatus');

    // Assemble panel
    this.panelDiv.appendChild(findLabel);
    this.panelDiv.appendChild(this.findInput);
    this.panelDiv.appendChild(document.createElement('br'));
    this.panelDiv.appendChild(replaceLabel);
    this.panelDiv.appendChild(this.replaceInput);
    this.panelDiv.appendChild(document.createElement('br'));
    this.panelDiv.appendChild(optionsDiv);
    this.panelDiv.appendChild(document.createElement('br'));
    this.panelDiv.appendChild(buttonsDiv);
    this.panelDiv.appendChild(document.createElement('br'));
    this.panelDiv.appendChild(this.resultsDiv);
    this.panelDiv.appendChild(this.statusDiv);

    container.appendChild(this.panelDiv);
  }

  /**
   * Attaches event listeners.
   */
  private attachEventListeners(): void {
    if (this.findInput) {
      this.findInput.addEventListener('input', () => this.search());
      this.findInput.addEventListener('keydown', (e) => this.handleKeyDown(e));
    }
    if (this.replaceAllButton) {
      this.replaceAllButton.addEventListener('click', () => this.replaceAll());
    }
    if (this.replaceButton) {
      this.replaceButton.addEventListener('click', () => this.replaceCurrent());
    }
    if (this.skipButton) {
      this.skipButton.addEventListener('click', () => this.skipCurrent());
    }

    // Register keyboard shortcuts
    browserEvents.conditionalBind(
      window,
      'keydown',
      this,
      (e: KeyboardEvent) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
          e.preventDefault();
          this.toggle();
        } else if ((e.ctrlKey || e.metaKey) && e.key === 'h') {
          e.preventDefault();
          this.toggle();
          if (this.replaceInput) {
            this.replaceInput.focus();
          }
        }
      },
    );
  }

  /**
   * Handles key down events in the input fields.
   */
  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter') {
      if (e.shiftKey) {
        // Previous match
        this.previousMatch();
      } else {
        // Next match
        this.nextMatch();
      }
    } else if (e.key === 'Escape') {
      this.close();
    }
  }

  /**
   * Toggles the find replace panel.
   */
  public toggle(): void {
    if (!this.panelDiv) return;

    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  /**
   * Disposes of this find replace component.
   * Unlink from all DOM elements to prevent memory leaks.
   */
  dispose(): void {
    // Remove the panel from the DOM
    if (this.panelDiv && this.panelDiv.parentNode) {
      this.panelDiv.parentNode.removeChild(this.panelDiv);
      this.panelDiv = null;
    }

    // Clear references
    this.findInput = null;
    this.replaceInput = null;
    this.matchCaseCheckbox = null;
    this.wholeWordCheckbox = null;
    this.replaceAllButton = null;
    this.replaceButton = null;
    this.skipButton = null;
    this.resultsDiv = null;
    this.statusDiv = null;
    // Remove button from DOM if it exists
    const button = document.querySelector('.blocklyFindReplaceButton');
    if (button && button.parentNode) {
      button.parentNode.removeChild(button);
    }
    // Remove from component manager
    this.workspace.getComponentManager().removeComponent('findReplace');
  }

  /**
   * Returns the bounding rectangle of the UI element in pixel units relative to
   * the Blockly injection div.
   *
   * @returns The UI elements's bounding box. Null if bounding box should be
   *     ignored by other UI elements.
   */
  getBoundingRectangle(): Rect | null {
    const button = document.querySelector('.blocklyFindReplaceButton');
    if (!button || !(button instanceof SVGElement)) {
      return null;
    }

    const rect = button.getBoundingClientRect();
    return new Rect(rect.left, rect.top, rect.width, rect.height);
  }

  /**
   * Positions the find/replace button.
   * It is positioned in the corner with the zoom controls.
   *
   * @param metrics The workspace metrics.
   * @param savedPositions List of rectangles that are already on the workspace.
   */
  position(metrics: UiMetrics, savedPositions: Rect[]): void {
    const button = document.querySelector('.blocklyFindReplaceButton');
    if (!button || !(button instanceof SVGElement)) {
      return;
    }

    // Position the button relative to the workspace
    const margin = 10;
    const zoomControls = document.querySelector('.blocklyZoom');
    if (zoomControls && zoomControls instanceof SVGElement) {
      const zoomRect = zoomControls.getBoundingClientRect();
      // Position find/replace button to the right of zoom controls
      button.setAttribute('transform', `translate(${zoomRect.width + margin}, 0)`);
    } else {
      // Default position if zoom controls not found
      button.setAttribute('transform', `translate(0, 0)`);
    }
  }

  /**
   * Opens the find replace panel.
   */
  public open(): void {
    if (!this.panelDiv || !this.findInput) return;

    this.isOpen = true;
    this.panelDiv.style.display = 'block';
    this.findInput.focus();
    this.findInput.select();
  }

  /**
   * Closes the find replace panel.
   */
  public close(): void {
    if (!this.panelDiv) return;

    this.isOpen = false;
    this.panelDiv.style.display = 'none';
    this.clearHighlights();
    this.matches = [];
    this.currentMatchIndex = 0;
  }

  /**
   * Performs a search.
   */
  private search(): void {
    if (!this.findInput) return;

    const query = this.findInput.value.trim();
    if (!query) {
      this.clearHighlights();
      this.matches = [];
      this.currentMatchIndex = 0;
      this.updateResults();
      this.updateStatus();
      return;
    }

    // Add to recent searches
    this.addToRecentSearches(query);

    const matchCase = this.matchCaseCheckbox?.checked || false;
    const wholeWord = this.wholeWordCheckbox?.checked || false;

    // Clear previous matches and highlights
    this.clearHighlights();
    this.matches = [];
    this.currentMatchIndex = 0;

    // Search all blocks in the workspace
    const allBlocks = this.workspace.getAllBlocks(false);

    for (const block of allBlocks) {
      if (!(block instanceof BlockSvg)) continue;

      // Check block type
      if (this.matchesBlockType(block, query, matchCase, wholeWord)) {
        this.matches.push({block, content: block.type, type: 'blockType'});
      }

      // Check block fields
      const fields = block.getFields();
      for (const [_fieldName, field] of Object.entries(fields)) {
        const content = field.getText();
        if (this.matchesContent(content, query, matchCase, wholeWord)) {
          this.matches.push({block, field, content, type: 'fieldValue'});
        }
      }

      // Check block text (for blockly-text fields)
      // Additional checks can be added here for other content types
    }

    // Highlight all matches
    this.highlightMatches();
    this.updateResults();
    this.updateStatus();
  }

  /**
   * Checks if a block type matches the query.
   */
  private matchesBlockType(
    block: BlockSvg,
    query: string,
    matchCase: boolean,
    wholeWord: boolean,
  ): boolean {
    const blockType = block.type;
    return this.matchesContent(blockType, query, matchCase, wholeWord);
  }

  /**
   * Checks if content matches the query.
   */
  private matchesContent(
    content: string,
    query: string,
    matchCase: boolean,
    wholeWord: boolean,
  ): boolean {
    if (!content) return false;

    const searchContent = matchCase ? content : content.toLowerCase();
    const searchQuery = matchCase ? query : query.toLowerCase();

    if (wholeWord) {
      const regex = new RegExp(
        `\\b${escapeRegExp(searchQuery)}\\b`,
        matchCase ? '' : 'i',
      );
      return regex.test(content);
    }

    return searchContent.includes(searchQuery);
  }

  /**
   * Highlights all matching blocks.
   */
  private highlightMatches(): void {
    for (const match of this.matches) {
      const block = match.block;
      dom.addClass(block.pathObject.svgPath, 'blocklyFindReplaceMatch');
    }
  }

  /**
   * Clears all highlights.
   */
  private clearHighlights(): void {
    const allBlocks = this.workspace.getAllBlocks(false);
    for (const block of allBlocks) {
      if (!(block instanceof Blockly.BlockSvg)) continue;
      dom.removeClass(block.pathObject.svgPath, 'blocklyFindReplaceMatch');
      dom.removeClass(
        block.pathObject.svgPath,
        'blocklyFindReplaceCurrentMatch',
      );
    }
  }

  /**
   * Updates the current match highlight.
   */
  private updateCurrentMatch(): void {
    this.clearHighlights();
    this.highlightMatches();

    if (this.matches.length === 0) return;

    const currentMatch = this.matches[this.currentMatchIndex];
    dom.addClass(
      currentMatch.block.pathObject.svgPath,
      'blocklyFindReplaceCurrentMatch',
    );

    // Scroll to the block
    this.workspace.centerOnBlock(currentMatch.block.id);
  }

  /**
   * Updates the results display.
   */
  private updateResults(): void {
    if (!this.resultsDiv) return;

    this.resultsDiv.innerHTML = '';

    if (this.matches.length === 0) {
      this.resultsDiv.textContent = '没有找到匹配项';
      return;
    }

    const resultsTitle = document.createElement('div');
    resultsTitle.textContent = `找到 ${this.matches.length} 个匹配项:`;
    dom.addClass(resultsTitle, 'blocklyFindReplaceResultsTitle');
    this.resultsDiv.appendChild(resultsTitle);

    for (let i = 0; i < this.matches.length; i++) {
      const match = this.matches[i];
      const resultItem = document.createElement('div');
      dom.addClass(resultItem, 'blocklyFindReplaceResultItem');

      if (i === this.currentMatchIndex) {
        dom.addClass(resultItem, 'blocklyFindReplaceCurrentResultItem');
      }

      const resultText = document.createElement('span');
      resultText.textContent = `#${i + 1}: ${match.content}`;
      resultItem.appendChild(resultText);

      // Add click handler
      resultItem.addEventListener('click', () => {
        this.currentMatchIndex = i;
        this.updateCurrentMatch();
        this.updateResults();
      });

      this.resultsDiv.appendChild(resultItem);
    }
  }

  /**
   * Updates the status display.
   */
  private updateStatus(): void {
    if (!this.statusDiv) return;

    if (this.matches.length === 0) {
      this.statusDiv.textContent = '';
      return;
    }

    this.statusDiv.textContent = `匹配项 ${this.currentMatchIndex + 1} / ${this.matches.length}`;
  }

  /**
   * Replaces the current match.
   */
  private replaceCurrent(): void {
    if (this.matches.length === 0 || !this.replaceInput || !this.findInput)
      return;

    // findText is unused, but we keep this for potential future use
    // const findText = this.findInput.value;
    const replaceText = this.replaceInput.value;
    const currentMatch = this.matches[this.currentMatchIndex];

    if (currentMatch.field) {
      // Replace field content
      currentMatch.field.setValue(replaceText);
    } else {
      // Replace block type or other content
      // This is a simplified example, actual implementation may need to handle more cases
      if (
        currentMatch.type === 'blockType' &&
        currentMatch.block.type !== replaceText
      ) {
        const newBlock = this.workspace.newBlock(replaceText);
        if (newBlock) {
          // Copy position and connections
          newBlock.moveBy(
            currentMatch.block.getRelativeToSurfaceXY().x,
            currentMatch.block.getRelativeToSurfaceXY().y,
          );
          // This is a simplified copy, actual implementation would need to handle connections and other properties
          currentMatch.block.dispose(true);
        }
      }
    }

    // Update search results
    this.search();

    // Select the next match
    this.nextMatch();
  }

  /**
   * Skips the current match.
   */
  private skipCurrent(): void {
    this.nextMatch();
  }

  /**
   * Moves to the next match.
   */
  private nextMatch(): void {
    if (this.matches.length === 0) return;

    this.currentMatchIndex = (this.currentMatchIndex + 1) % this.matches.length;
    this.updateCurrentMatch();
    this.updateResults();
    this.updateStatus();
  }

  /**
   * Moves to the previous match.
   */
  private previousMatch(): void {
    if (this.matches.length === 0) return;

    this.currentMatchIndex =
      (this.currentMatchIndex - 1 + this.matches.length) % this.matches.length;
    this.updateCurrentMatch();
    this.updateResults();
    this.updateStatus();
  }

  /**
   * Replaces all matches.
   */
  private replaceAll(): void {
    if (!this.replaceInput || this.matches.length === 0) return;

    const replacement = this.replaceInput.value;
    const confirmReplace = confirm(
      `确定要替换所有 ${this.matches.length} 个匹配项吗？`,
    );

    if (!confirmReplace) return;

    // Replace all matches
    for (const match of this.matches) {
      if (match.field) {
        match.field.setValue(replacement);
      }
    }

    // Refresh search results
    this.search();

    alert(`已完成 ${this.matches.length} 个替换`);
  }

  /**
   * Adds a query to recent searches.
   */
  private addToRecentSearches(query: string): void {
    // Remove existing entry if present
    const index = this.recentSearches.indexOf(query);
    if (index > -1) {
      this.recentSearches.splice(index, 1);
    }

    // Add to beginning
    this.recentSearches.unshift(query);

    // Keep only the most recent searches
    if (this.recentSearches.length > this.MAX_RECENT_SEARCHES) {
      this.recentSearches.pop();
    }

    this.saveRecentSearches();
  }

  /**
   * Loads recent searches from localStorage.
   */
  private loadRecentSearches(): void {
    try {
      const saved = localStorage.getItem('blocklyRecentSearches');
      if (saved) {
        this.recentSearches = JSON.parse(saved);
      }
    } catch {
      // Ignore errors
    }
  }

  /**
   * Saves recent searches to localStorage.
   */
  private saveRecentSearches(): void {
    try {
      localStorage.setItem(
        'blocklyRecentSearches',
        JSON.stringify(this.recentSearches),
      );
    } catch {
      // Ignore errors
    }
  }
}

/**
 * Escapes a string for use in a regular expression.
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** CSS for Find and Replace.  See css.js for use. */
Css.register(`
.blocklyFindReplacePanel {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #fff;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  z-index: 1000;
  font-family: Arial, sans-serif;
  font-size: 14px;
}

.blocklyFindReplaceInput {
  margin: 5px 0;
  padding: 5px;
  border: 1px solid #ddd;
  border-radius: 3px;
  width: 250px;
}

.blocklyFindReplaceOptions {
  margin: 5px 0;
  font-size: 12px;
}

.blocklyFindReplaceButtons {
  margin: 5px 0;
}

.blocklyFindReplaceButton {
  margin-right: 5px;
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 3px;
  background-color: #f5f5f5;
  cursor: pointer;
  font-size: 12px;
}

.blocklyFindReplaceButton:hover {
  background-color: #e0e0e0;
}

.blocklyFindReplaceResults {
  margin: 10px 0;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid #eee;
  padding: 5px;
  font-size: 12px;
}

.blocklyFindReplaceResultsTitle {
  font-weight: bold;
  margin-bottom: 5px;
}

.blocklyFindReplaceResultItem {
  padding: 3px;
  margin: 2px 0;
  border-radius: 2px;
  cursor: pointer;
}

.blocklyFindReplaceResultItem:hover {
  background-color: #f0f0f0;
}

.blocklyFindReplaceCurrentResultItem {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
}

.blocklyFindReplaceStatus {
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.blocklyFindReplaceMatch {
  stroke: #ff9800;
  stroke-width: 2;
  filter: drop-shadow(0 0 3px rgba(255, 152, 0, 0.5));
}

.blocklyFindReplaceCurrentMatch {
  stroke: #f44336;
  stroke-width: 2;
  filter: drop-shadow(0 0 5px rgba(244, 67, 54, 0.7));
}
`);