/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Class for handling smart code suggestions in the Blockly workspace.
 * @class
 */
export class SmartSuggestions {
  private workspace_: any;
  private isEnabled_: boolean;
  private suggestionsPanel_: any;
  private userPatterns_: any;
  private triggerConditions_: any;
  private displaySettings_: any;
  private eventListener_: any;

  /**
   * @param workspace The workspace to add smart suggestions to.
   * @param options Configuration options for smart suggestions.
   */
  constructor(workspace: any, options: any) {
    this.workspace_ = workspace;
    this.isEnabled_ = options.enabled !== false;
    this.suggestionsPanel_ = null;
    this.userPatterns_ = {};
    this.triggerConditions_ = {
      onDrag: options.triggerOnDrag !== false,
      onClick: options.triggerOnClick !== false,
      onInput: options.triggerOnInput !== false,
      ...options.triggerConditions
    };
    this.displaySettings_ = {
      showPreview: options.showPreview !== false,
      showDescription: options.showDescription !== false,
      position: options.position || 'bottom-right',
      ...options.displaySettings
    };

    this.init_();
  }

  /**
   * Initialize smart suggestions by attaching event listeners.
   * @private
   */
  private init_() {
    if (!this.isEnabled_) return;

    // Attach event listeners based on trigger conditions
    this.eventListener_ = this.onWorkspaceChange_.bind(this);
    this.workspace_.addChangeListener(this.eventListener_);
  }

  /**
   * Handle all workspace changes and filter to the events we care about.
   * @param {Event} e Workspace event.
   * @private
   */
  private onWorkspaceChange_(e: any) {
    switch (e.type) {
      case 'blockdrag':
        if (this.triggerConditions_.onDrag) {
          this.onBlockDrag_(e);
        }
        break;
      case 'click':
        if (this.triggerConditions_.onClick) {
          this.onBlockClick_(e);
        }
        break;
      case 'change':
        if (this.triggerConditions_.onInput && e.element === 'field') {
          this.onFieldInput_(e);
        }
        break;
      case 'connect':
        this.onBlockConnect_(e);
        break;
    }
  }

  /**
   * Handle block drag event and show suggestions.
   * @param {Event} e Block drag event.
   * @private
   */
  private onBlockDrag_(e: any) {
    const block = e.block;
    const potentialConnections = this.getPotentialConnections_(block);
    this.showSuggestions_(potentialConnections);
  }

  /**
   * Handle block click event and show suggestions.
   * @param {Event} e Block click event.
   * @private
   */
  private onBlockClick_(e: any) {
    const block = e.block;
    const nextBlocks = this.getNextBlocks_(block);
    this.showSuggestions_(nextBlocks);
  }

  /**
   * Handle field input event and show auto-complete suggestions.
   * @param {Event} e Field input event.
   * @private
   */
  private onFieldInput_(e: any) {
    const field = e.field;
    const inputText = e.newValue;
    const suggestions = this.getAutoCompleteSuggestions_(inputText, field);
    this.showAutoComplete_(suggestions);
  }

  /**
   * Handle block connect event to learn user patterns.
   * @param {Event} e Block connect event.
   * @private
   */
  private onBlockConnect_(e: any) {
    const parentBlock = e.parentBlock;
    const childBlock = e.childBlock;
    this.learnUserPattern_(parentBlock, childBlock);
  }

  /**
   * Get potential connections for a block.
   * @param {Block} block The block to get connections for.
   * @returns {Array} Array of potential blocks that can be connected.
   * @private
   */
  private getPotentialConnections_(block: any) {
    // Analyze block connections and recommend compatible blocks
    const potentialBlocks = [];
    const outputConnection = block.outputConnection;
    const inputConnections = block.inputList;

    if (outputConnection) {
      // Block has output, can be connected to inputs
      const compatibleInputs = this.workspace_.getBlocksByType(outputConnection.type);
      potentialBlocks.push(...compatibleInputs);
    }

    inputConnections.forEach((input: any) => {
      if (input.connection) {
        const compatibleBlocks = this.workspace_.getBlocksByType(input.connection.type);
        potentialBlocks.push(...compatibleBlocks);
      }
    });

    // Filter out incompatible blocks and duplicates
    return [...new Set(potentialBlocks)];
  }

  /**
   * Get next possible blocks for a given block.
   * @param {Block} block The block to get next blocks for.
   * @returns {Array} Array of recommended next blocks.
   * @private
   */
  private getNextBlocks_(block: any) {
    // Analyze code structure and recommend next blocks
    const nextBlocks = [];
    const blockType = block.type;

    // Simple example: if block is a 'if' statement, suggest 'else' or 'end' block
    if (blockType === 'controls_if') {
      nextBlocks.push(...this.workspace_.getBlocksByType('controls_if_else'));
      nextBlocks.push(...this.workspace_.getBlocksByType('controls_end'));
    }
    // Add more logic based on block types

    return nextBlocks;
  }

  /**
   * Get auto-complete suggestions for user input.
   * @param {string} inputText The user input text.
   * @param {Field} field The field being edited.
   * @returns {Array} Array of auto-complete suggestions.
   * @private
   */
  private getAutoCompleteSuggestions_(inputText: string, field: any) {
    // Get all variables and functions defined in the workspace
    const variables = this.workspace_.getVariables();
    const functions = this.workspace_.getFunctions();

    // Filter suggestions based on input text
    const suggestions = [...variables, ...functions]
      .filter(item => item.name.toLowerCase().startsWith(inputText.toLowerCase()))
      .map(item => item.name);

    return suggestions;
  }

  /**
   * Learn user patterns from connected blocks.
   * @param {Block} parentBlock The parent block.
   * @param {Block} childBlock The child block.
   * @private
   */
  private learnUserPattern_(parentBlock: any, childBlock: any) {
    const parentType = parentBlock.type;
    const childType = childBlock.type;

    if (!this.userPatterns_[parentType]) {
      this.userPatterns_[parentType] = {};
    }

    if (!this.userPatterns_[parentType][childType]) {
      this.userPatterns_[parentType][childType] = 0;
    }

    this.userPatterns_[parentType][childType]++;
  }

  /**
   * Show suggestions panel with recommended blocks.
   * @param {Array} blocks Array of recommended blocks.
   * @private
   */
  private showSuggestions_(blocks: any[]) {
    // Filter blocks based on user patterns (most used first)
    const sortedBlocks = this.sortBlocksByUsage_(blocks);

    // Create or update suggestions panel
    if (!this.suggestionsPanel_) {
      this.suggestionsPanel_ = this.createSuggestionsPanel_();
    }

    this.suggestionsPanel_.update(sortedBlocks);
    this.suggestionsPanel_.show();
  }

  /**
   * Show auto-complete suggestions.
   * @param {Array} suggestions Array of auto-complete suggestions.
   * @private
   */
  private showAutoComplete_(suggestions: any[]) {
    // Implement auto-complete UI
    console.log('Auto-complete suggestions:', suggestions);
  }

  /**
   * Sort blocks by usage frequency (user patterns).
   * @param {Array} blocks Array of blocks to sort.
   * @returns {Array} Sorted array of blocks.
   * @private
   */
  private sortBlocksByUsage_(blocks: any[]) {
    // Create a map of block type to usage count
    const usageMap = new Map();
    blocks.forEach(block => {
      const blockType = block.type;
      let usageCount = 0;

      // Calculate total usage of this block type after all other block types
      for (const parentType in this.userPatterns_) {
        if (this.userPatterns_[parentType][blockType]) {
          usageCount += this.userPatterns_[parentType][blockType];
        }
      }

      usageMap.set(block, usageCount);
    });

    // Sort blocks by usage count descending
    return blocks.sort((a, b) => usageMap.get(b) - usageMap.get(a));
  }

  /**
   * Create suggestions panel UI.
   * @returns {Object} The created suggestions panel.
   * @private
   */
  private createSuggestionsPanel_() {
    // Implement suggestions panel UI
    return {
      update: (blocks: any[]) => {
        console.log('Updating suggestions panel with blocks:', blocks);
      },
      show: () => {
        console.log('Showing suggestions panel');
      },
      hide: () => {
        console.log('Hiding suggestions panel');
      }
    };
  }

  /**
   * Enable or disable smart suggestions.
   * @param {boolean} enabled Whether to enable smart suggestions.
   */
  setEnabled(enabled: boolean) {
    this.isEnabled_ = enabled;
    if (!enabled) {
      this.hideSuggestions();
    }
  }

  /**
   * Check if smart suggestions are enabled.
   * @returns {boolean} Whether smart suggestions are enabled.
   */
  isEnabled() {
    return this.isEnabled_;
  }

  /**
   * Customize trigger conditions for smart suggestions.
   * @param {Object} conditions Trigger conditions configuration.
   */
  setTriggerConditions(conditions: any) {
    this.triggerConditions_ = {...this.triggerConditions_, ...conditions};
  }

  /**
   * Customize display settings for smart suggestions.
   * @param {Object} settings Display settings configuration.
   */
  setDisplaySettings(settings: any) {
    this.displaySettings_ = {...this.displaySettings_, ...settings};
  }

  /**
   * Hide suggestions panel.
   */
  hideSuggestions() {
    if (this.suggestionsPanel_) {
      this.suggestionsPanel_.hide();
    }
  }

  /**
   * Dispose of smart suggestions resources.
   */
  dispose() {
    this.hideSuggestions();
    // Remove event listeners
    if (this.eventListener_) {
      this.workspace_.removeChangeListener(this.eventListener_);
    }
  }
}