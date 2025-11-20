/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Health score calculator for Blockly workspaces.
 *
 * @class
 */
// Former goog.module ID: Blockly.HealthScoreCalculator

import type {Block} from './block.js';
import type {Workspace} from './workspace.js';
import * as Procedures from './procedures.js';
import * as Variables from './variables.js';

/**
 * Interface for health score results.
 */
export interface HealthScoreResults {
  readability: number;
  modularity: number;
  logicalDepth: number;
  redundancy: number;
  totalScore: number;
  timestamp: number;
  suggestions: HealthScoreSuggestion[];
}

/**
 * Interface for health score suggestions.
 */
export interface HealthScoreSuggestion {
  category: 'readability' | 'modularity' | 'logicalDepth' | 'redundancy';
  message: string;
  severity: 'low' | 'medium' | 'high';
  blockIds?: string[];
  fixable: boolean;
}

/**
 * Class for calculating health scores for Blockly workspaces.
 */
export class HealthScoreCalculator {
  /**
   * Calculate the health score for a given workspace.
   *
   * @param workspace The workspace to calculate the health score for.
   * @param weights Optional weights for each category (readability, modularity, logicalDepth, redundancy).
   * @returns The health score results.
   */
  calculateHealthScore(
    workspace: Workspace,
    weights: {readability?: number; modularity?: number; logicalDepth?: number; redundancy?: number} = {},
  ): HealthScoreResults {
    const defaultWeights = {readability: 0.25, modularity: 0.25, logicalDepth: 0.25, redundancy: 0.25};
    const finalWeights = {...defaultWeights, ...weights};

    const blocks = workspace.getAllBlocks(false);
    const readability = this.calculateReadability(blocks, workspace);
    const modularity = this.calculateModularity(blocks, workspace);
    const logicalDepth = this.calculateLogicalDepth(blocks, workspace);
    const redundancy = this.calculateRedundancy(blocks, workspace);

    const totalScore = Math.round(
      readability * finalWeights.readability! +
      modularity * finalWeights.modularity! +
      logicalDepth * finalWeights.logicalDepth! +
      redundancy * finalWeights.redundancy!
    );

    const suggestions = this.generateSuggestions(blocks, workspace);

    return {
      readability,
      modularity,
      logicalDepth,
      redundancy,
      totalScore,
      timestamp: Date.now(),
      suggestions,
    };
  }

  /**
   * Calculate readability score (0-100).
   * Factors: block naming clarity, comment integrity, block layout.
   *
   * @param blocks Array of all blocks in the workspace.
   * @param workspace The workspace.
   * @returns Readability score.
   */
  private calculateReadability(blocks: Block[], workspace: Workspace): number {
    let score = 100;

    // Check for blocks with no comments
    const blocksWithComments = blocks.filter(block => block.getCommentText());
    const commentRatio = blocks.length > 0 ? blocksWithComments.length / blocks.length : 0;
    score -= Math.round((1 - commentRatio) * 20);

    // Check for blocks with default names (like "untitled function")
    const procedureBlocks = Procedures.allProcedures(workspace);
    const [returnProcedures, noReturnProcedures] = procedureBlocks;
    const allProcedureNames = [...returnProcedures, ...noReturnProcedures].map(p => p[0]);
    const unnamedProcedures = allProcedureNames.filter(name => name.startsWith('untitled'));
    score -= unnamedProcedures.length * 10;

    // Check for variable names (using a different approach to get variables)
    const variableBlocks = workspace.getAllBlocks().filter(block => block.type === 'variables_get' || block.type === 'variables_set');
    const variableNames = new Set<string>();
    variableBlocks.forEach(block => {
      const varName = block.getFieldValue('VAR');
      if (varName) {
        variableNames.add(varName);
      }
    });
    const unnamedVariables = Array.from(variableNames).filter(name => name.startsWith('var'));
    score -= unnamedVariables.length * 5;

    // Check for block density (layout) - simplified version
    if (blocks.length > 0) {
      // Since getMetricsManager might not be available, we skip density calculation
      // This could be improved with a better way to get workspace dimensions
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate modularity score (0-100).
   * Factors: block organization, function encapsulation, code reusability.
   *
   * @param blocks Array of all blocks in the workspace.
   * @param workspace The workspace.
   * @returns Modularity score.
   */
  private calculateModularity(blocks: Block[], workspace: Workspace): number {
    let score = 100;

    // Check for procedure usage
    const procedureBlocks = Procedures.allProcedures(workspace);
    const [returnProcedures, noReturnProcedures] = procedureBlocks;
    const procedureCount = returnProcedures.length + noReturnProcedures.length;
    
    if (blocks.length > 10) {
      const procedureRatio = procedureCount / blocks.length;
      if (procedureRatio < 0.1) {
        score -= Math.round((0.1 - procedureRatio) * 1000);
      }
    }

    // Check for duplicate blocks that could be encapsulated
    const blockTypeCounts: {[type: string]: number} = {};
    blocks.forEach(block => {
      blockTypeCounts[block.type] = (blockTypeCounts[block.type] || 0) + 1;
    });

    const repeatedBlockTypes = Object.entries(blockTypeCounts)
      .filter(([type, count]) => count > 3 && !['math_number', 'text', 'logic_boolean'].includes(type));
    
    repeatedBlockTypes.forEach(([type, count]) => {
      score -= (count - 3) * 5;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate logical depth score (0-100).
   * Factors: nesting level, control structure complexity, logical chain length.
   *
   * @param blocks Array of all blocks in the workspace.
   * @param workspace The workspace.
   * @returns Logical depth score.
   */
  private calculateLogicalDepth(blocks: Block[], workspace: Workspace): number {
    let score = 100;

    // Calculate maximum nesting depth
    const maxDepth = this.findMaxNestingDepth(blocks);
    
    // Penalize deep nesting
    if (maxDepth > 5) {
      score -= (maxDepth - 5) * 15;
    }

    // Check for complex control structures
    const controlBlocks = blocks.filter(block => 
      block.type.includes('loop') || block.type.includes('if') || block.type.includes('control')
    );
    
    const controlComplexity = controlBlocks.length / blocks.length;
    if (controlComplexity > 0.5) {
      score -= Math.round((controlComplexity - 0.5) * 100);
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate redundancy score (0-100).
   * Factors: duplicate block patterns, similar block sequences.
   *
   * @param blocks Array of all blocks in the workspace.
   * @param workspace The workspace.
   * @returns Redundancy score.
   */
  private calculateRedundancy(blocks: Block[], workspace: Workspace): number {
    let score = 100;

    // Simple check for duplicate block patterns
    const blockPatterns: {[pattern: string]: number} = {};
    
    blocks.forEach(block => {
      // Create a simple pattern based on block type and inputs
      const inputs = Object.values(block.inputList).map(input => input.type);
      const pattern = `${block.type}:${inputs.join(',')}`;
      blockPatterns[pattern] = (blockPatterns[pattern] || 0) + 1;
    });

    const redundantPatterns = Object.entries(blockPatterns)
      .filter(([pattern, count]) => count > 2);
    
    redundantPatterns.forEach(([pattern, count]) => {
      score -= (count - 2) * 8;
    });

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate improvement suggestions based on the analysis.
   *
   * @param blocks Array of all blocks in the workspace.
   * @param workspace The workspace.
   * @returns Array of suggestions.
   */
  private generateSuggestions(blocks: Block[], workspace: Workspace): HealthScoreSuggestion[] {
    const suggestions: HealthScoreSuggestion[] = [];

    // Readability suggestions
    const blocksWithComments = blocks.filter(block => block.getCommentText());
    if (blocksWithComments.length < blocks.length * 0.3) {
      suggestions.push({
        category: 'readability',
        message: 'Add comments to explain complex logic and improve understanding',
        severity: 'low',
        fixable: false,
      });
    }

    // Modularity suggestions
    const procedureBlocks = Procedures.allProcedures(workspace);
    const [returnProcedures, noReturnProcedures] = procedureBlocks;
    const procedureCount = returnProcedures.length + noReturnProcedures.length;
    
    if (blocks.length > 10 && procedureCount / blocks.length < 0.1) {
      suggestions.push({
        category: 'modularity',
        message: 'Consider encapsulating repeated code into functions for better reusability',
        severity: 'medium',
        fixable: false,
      });
    }

    // Logical depth suggestions
    const maxDepth = this.findMaxNestingDepth(blocks);
    if (maxDepth > 5) {
      suggestions.push({
        category: 'logicalDepth',
        message: `Reduce nesting depth (current max: ${maxDepth}). Consider refactoring complex logic into smaller blocks`,
        severity: 'high',
        fixable: false,
      });
    }

    // Redundancy suggestions
    const blockPatterns: {[pattern: string]: string[]} = {};
    
    blocks.forEach(block => {
      const inputs = Object.values(block.inputList).map(input => input.type);
      const pattern = `${block.type}:${inputs.join(',')}`;
      if (!blockPatterns[pattern]) {
        blockPatterns[pattern] = [];
      }
      blockPatterns[pattern].push(block.id);
    });

    Object.entries(blockPatterns).forEach(([pattern, blockIds]) => {
      if (blockIds.length > 2) {
        suggestions.push({
          category: 'redundancy',
          message: `Detected ${blockIds.length} instances of similar code. Consider refactoring into a function`,
          severity: 'medium',
          fixable: true,
          blockIds,
        });
      }
    });

    return suggestions;
  }

  /**
   * Find the maximum nesting depth of blocks in the workspace.
   *
   * @param blocks Array of all blocks in the workspace.
   * @returns Maximum nesting depth.
   */
  private findMaxNestingDepth(blocks: Block[]): number {
    let maxDepth = 0;

    const calculateDepth = (block: Block, currentDepth: number) => {
      maxDepth = Math.max(maxDepth, currentDepth);
      
      // Check all child blocks
      Object.values(block.inputList).forEach(input => {
        if (input.connection && input.connection.targetBlock()) {
          calculateDepth(input.connection.targetBlock()!, currentDepth + 1);
        }
      });
      
      // Check next block in sequence
      if (block.nextConnection && block.nextConnection.targetBlock()) {
        calculateDepth(block.nextConnection.targetBlock()!, currentDepth);
      }
    };

    // Find top-level blocks (no previous connection)
    const topLevelBlocks = blocks.filter(block => !block.previousConnection || !block.previousConnection.targetBlock());
    
    topLevelBlocks.forEach(block => {
      calculateDepth(block, 1);
    });

    return maxDepth;
  }
}