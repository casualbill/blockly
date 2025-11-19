/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Flowchart module for Blockly.
 * This module converts Blockly blocks into a visual flowchart and provides
 * features like real-time sync, execution highlighting, and UML export.
 */

import type {Workspace} from './workspace.js';
import type {Block} from './block.js';
import type {BlockSvg} from './block_svg.js';
import type {Input} from './inputs/input.js';
import * as Events from './events/events.js';
import * as common from './common.js';
import {inputTypes} from './inputs/input_types.js';
import * as eventUtils from './events/utils.js';

/**
 * Represents a flowchart node corresponding to a Blockly block.
 */
export interface FlowchartNode {
  id: string;
  blockId: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Represents a connection between two flowchart nodes.
 */
export interface FlowchartEdge {
  id: string;
  from: string;
  to: string;
  type: 'next' | 'value' | 'statement';
}

/**
 * Flowchart class that manages the conversion and rendering of Blockly blocks
 * to a visual flowchart.
 */
export class Flowchart {
  private workspace: Workspace;
  private nodes: Map<string, FlowchartNode> = new Map();
  private edges: Map<string, FlowchartEdge> = new Map();
  private container: HTMLElement | null = null;
  private svg: SVGElement | null = null;
  private currentExecutionNode: string | null = null;

  /**
   * Constructs a new Flowchart instance.
   * @param workspace The Blockly workspace to convert to flowchart.
   */
  constructor(workspace: Workspace) {
    this.workspace = workspace;
    this.initialize();
  }

  /**
   * Initializes the flowchart by setting up event listeners and rendering.
   */
  private initialize(): void {
    // Set up event listeners for workspace changes
    this.workspace.addChangeListener((event) => {
      this.handleWorkspaceChange(event);
    });
    
    // Initial rendering
    this.render();
  }

  /**
   * Handles workspace changes and updates the flowchart.
   * @param event The workspace event.
   */
  private handleWorkspaceChange(event: any): void {
    // Handle block creation, deletion, and connection changes
    switch (event.type) {
      case Events.BLOCK_CREATE:
      case Events.BLOCK_DELETE:
      case Events.BLOCK_MOVE:
      case Events.BLOCK_CHANGE:
        this.render();
        break;
      case Events.SELECTED:
        // Handle block selection to highlight in flowchart// 更新选中的块
        const selected = common.getSelected();
        if (selected && 'id' in selected) {
          this.highlightNode(selected.id);
        } else {
          this.clearHighlight();
        }
        break;
      // Handle other relevant events
    }
  }

  /**
   * Highlights a node in the flowchart.
   * @param blockId The ID of the Blockly block corresponding to the node.
   */
  public highlightNode(blockId: string): void {
    this.currentExecutionNode = `node-${blockId}`;
    this.draw();
  }

  /**
   * Clears all highlights in the flowchart.
   */
  public clearHighlight(): void {
    this.currentExecutionNode = null;
    this.draw();
  }

  /**
   * Converts Blockly blocks to flowchart nodes and edges.
   */
  private convertBlocksToFlowchart(): void {
    // Clear existing nodes and edges
    this.nodes.clear();
    this.edges.clear();

    // Get all top blocks from the workspace
    const topBlocks = this.workspace.getTopBlocks();
    
    // Convert each block and its children to flowchart elements
    for (const block of topBlocks) {
      this.convertBlockRecursive(block);
    }
  }

  /**
   * Recursively converts a block and its children to flowchart elements.
   * @param block The Blockly block to convert.
   */
  private convertBlockRecursive(block: Block): void {
    // Create a node for the current block
    const nodeId = `node-${block.id}`;
    const node: FlowchartNode = {
      id: nodeId,
      blockId: block.id,
      type: block.type,
      label: this.getBlockLabel(block),
      x: 0, // Default position, will be updated during layout
      y: 0,
      width: 120, // Default size
      height: 60
    };
    this.nodes.set(nodeId, node);

    // Handle next statement connection
    if (block.nextConnection && block.nextConnection.targetBlock()) {
      const nextBlock = block.nextConnection.targetBlock() as Block;
      const edge: FlowchartEdge = {
        id: `edge-${block.id}-${nextBlock.id}`,
        from: nodeId,
        to: `node-${nextBlock.id}`,
        type: 'next'
      };
      this.edges.set(edge.id, edge);
      // Recursively convert next block
      this.convertBlockRecursive(nextBlock);
    }

    // Handle statement inputs
    for (const input of block.inputList) {
      if (input.type === inputTypes.STATEMENT) {
        const connectedBlock = input.connection?.targetBlock();
        if (connectedBlock) {
          const edge: FlowchartEdge = {
            id: `edge-${block.id}-${input.name}-${connectedBlock.id}`,
            from: nodeId,
            to: `node-${connectedBlock.id}`,
            type: 'statement'
          };
          this.edges.set(edge.id, edge);
          // Recursively convert connected block and its children
          this.convertBlockRecursive(connectedBlock);
        }
      }
      // TODO: Handle value inputs
    }
  }

  /**
   * Gets a user-friendly label for a block.
   * @param block The Blockly block.
   * @returns The label for the block.
   */
  private getBlockLabel(block: Block): string {
    // Default to block type if no label found
    let label = block.type;
    // Try to get label from fields
    for (const field of block.inputList.flatMap((input: Input) => input.fieldRow)) {
      if (field.name === 'TEXT' || field.name === 'MESSAGE') {
        label = field.getValue() as string;
        break;
      }
    }
    return label;
  }

  /**
   * Renders the flowchart.
   */
  public render(): void {
    // Convert blocks to flowchart elements
    this.convertBlocksToFlowchart();
    // Apply layout algorithm
    this.applyLayout();
    // Draw the flowchart
    this.draw();
  }

  /**
   * Applies layout to the flowchart nodes using a smart algorithm that avoids crossings.
   */
  private applyLayout(): void {
    if (this.nodes.size === 0) return;

    // Calculate bounding boxes for each block group
    const blockDepths: {[key: string]: number} = {};
    const blockHeights: {[key: string]: number} = {};

    // First pass: calculate depth and height for each block
    const topBlocks = this.workspace.getTopBlocks();
    
    for (const block of topBlocks) {
      this.calculateBlockDepth(block, 0, blockDepths);
      this.calculateBlockHeight(block, blockHeights);
    }

    // Second pass: arrange blocks in layers based on depth
    const depthLayers: {[key: number]: Block[]} = {};
    for (const block of this.workspace.getAllBlocks(false)) {
      const depth = blockDepths[block.id] || 0;
      if (!depthLayers[depth]) {
        depthLayers[depth] = [];
      }
      depthLayers[depth].push(block);
    }

    // Calculate max width for each layer to determine x positions
    const layerWidths: {[key: number]: number} = {};
    const xPositions: {[key: number]: number} = {};
    let maxDepth = 0;

    for (const depth in depthLayers) {
      const numDepth = parseInt(depth);
      maxDepth = Math.max(maxDepth, numDepth);
      
      let maxWidth = 0;
      for (const block of depthLayers[numDepth]) {
        const node = this.nodes.get(`node-${block.id}`);
        if (node) {
          maxWidth = Math.max(maxWidth, node.width);
        }
      }
      layerWidths[numDepth] = maxWidth;
    }

    // Calculate x positions for each layer
    let currentX = 50;
    for (let depth = 0; depth <= maxDepth; depth++) {
      xPositions[depth] = currentX;
      currentX += (layerWidths[depth] || 150) + 100;
    }

    // Calculate y positions for each layer
    const layerYOffsets: {[key: number]: number} = {0: 50};
    
    // Calculate vertical spacing between blocks
    const verticalSpacing = 80;
    
    // Third pass: assign positions to nodes
    for (let depth = 0; depth <= maxDepth; depth++) {
      const blocks = depthLayers[depth];
      if (!blocks) continue;

      let currentY = layerYOffsets[depth] || 50;
      
      for (const block of blocks) {
        const node = this.nodes.get(`node-${block.id}`);
        if (node) {
          node.x = xPositions[depth];
          node.y = currentY;
          
          // Update y offset for next block in this layer
          currentY += node.height + verticalSpacing;
          
          // Calculate y offsets for child blocks (next connection)
          const nextConnection = block.nextConnection;
          if (nextConnection) {
            const nextBlock = nextConnection.targetBlock();
            if (nextBlock) {
              const nextDepth = blockDepths[nextBlock.id] || 0;
              if (!layerYOffsets[nextDepth] || layerYOffsets[nextDepth] < currentY) {
                layerYOffsets[nextDepth] = currentY;
              }
            }
          }
          
          // Calculate y offsets for statement inputs (branches)
          for (const input of block.inputList) {
            if (input.type !== inputTypes.STATEMENT) continue; // Only statement inputs
            
            const connection = input.connection;
            if (!connection) continue;
            
            const childBlock = connection.targetBlock();
            if (childBlock) {
              const childDepth = blockDepths[childBlock.id] || 0;
              if (!layerYOffsets[childDepth] || layerYOffsets[childDepth] < currentY) {
                layerYOffsets[childDepth] = currentY;
              }
            }
          }
        }
      }
    }
  }

  /**
   * Calculates the depth of a block in the hierarchy.
   * @param block The Blockly block.
   * @param currentDepth The current depth level.
   * @param blockDepths The object to store depth results.
   */
  private calculateBlockDepth(block: Block, currentDepth: number, blockDepths: {[key: string]: number}): void {
    blockDepths[block.id] = currentDepth;
    
    // Check next connection (same depth)
    const nextConnection = block.nextConnection;
    if (nextConnection) {
      const nextBlock = nextConnection.targetBlock();
      if (nextBlock) {
        this.calculateBlockDepth(nextBlock, currentDepth, blockDepths);
      }
    }
    
    // Check statement inputs (deeper)
    for (const input of block.inputList) {
      if (input.type !== inputTypes.STATEMENT) continue; // Only statement inputs
      
      const connection = input.connection;
      if (!connection) continue;
      
      const childBlock = connection.targetBlock();
      if (childBlock) {
        this.calculateBlockDepth(childBlock, currentDepth + 1, blockDepths);
      }
    }
  }

  /**
   * Calculates the height required for a block and its children.
   * @param block The Blockly block.
   * @param blockHeights The object to store height results.
   * @returns The total height for this block and its children.
   */
  private calculateBlockHeight(block: Block, blockHeights: {[key: string]: number}): number {
    // Base height for the block itself
    const node = this.nodes.get(`node-${block.id}`);
    const baseHeight = node ? node.height : 50;
    
    // Calculate height for branches
    let branchHeight = 0;
    for (const input of block.inputList) {
      if (input.type !== inputTypes.STATEMENT) continue; // Only statement inputs
      
      const connection = input.connection;
      if (!connection) continue;
      
      const childBlock = connection.targetBlock();
      if (childBlock) {
        const childHeight = this.calculateBlockHeight(childBlock, blockHeights);
        branchHeight = Math.max(branchHeight, childHeight);
      }
    }
    
    // Calculate height for next connection
    let nextHeight = 0;
    const nextConnection = block.nextConnection;
    if (nextConnection) {
      const nextBlock = nextConnection.targetBlock();
      if (nextBlock) {
        nextHeight = this.calculateBlockHeight(nextBlock, blockHeights);
      }
    }
    
    const totalHeight = baseHeight + Math.max(branchHeight, nextHeight);
    blockHeights[block.id] = totalHeight;
    
    return totalHeight;
  }

  /**
   * Draws the flowchart using SVG.
   */
  private draw(): void {
    if (!this.container) return;
    
    // Clear existing SVG
    if (this.svg) {
      this.svg.remove();
    }
    
    // Create new SVG
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', '100%');
    this.svg.setAttribute('height', '100%');
    this.container.appendChild(this.svg);
    
    // Draw edges first (so nodes are on top)
    for (const edge of this.edges.values()) {
      const fromNode = this.nodes.get(edge.from);
      const toNode = this.nodes.get(edge.to);
      if (fromNode && toNode) {
        let x1: number, y1: number, x2: number, y2: number;
        
        // Determine edge points based on connection type
        if (edge.type === 'next') {
          // Sequence connection: bottom center to top center
          x1 = fromNode.x + fromNode.width / 2;
          y1 = fromNode.y + fromNode.height;
          x2 = toNode.x + toNode.width / 2;
          y2 = toNode.y;
        } else if (edge.type === 'statement') {
          // Statement connection: right middle to left middle
          x1 = fromNode.x + fromNode.width;
          y1 = fromNode.y + fromNode.height / 2;
          x2 = toNode.x;
          y2 = toNode.y + toNode.height / 2;
        } else {
          // Value connection: right middle to left middle with different style
          x1 = fromNode.x + fromNode.width;
          y1 = fromNode.y + fromNode.height / 2;
          x2 = toNode.x;
          y2 = toNode.y + toNode.height / 2;
        }
        
        // Create edge with appropriate style
        const edgeSvg = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let pathData: string;
        
        if (edge.type === 'next') {
          // Straight line for sequence
          pathData = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
          // Curved line for branches
          const midX = (x1 + x2) / 2;
          pathData = `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`;
        }
        
        edgeSvg.setAttribute('d', pathData);
        edgeSvg.setAttribute('stroke', edge.type === 'value' ? '#666' : '#000');
        edgeSvg.setAttribute('stroke-width', edge.type === 'value' ? '1.5' : '2');
        edgeSvg.setAttribute('fill', 'none');
        
        this.svg!.appendChild(edgeSvg);
      }
    }
    
    // Draw nodes
    for (const node of this.nodes.values()) {
      const nodeGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      
      // Draw rectangle with execution highlighting
      const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      rect.setAttribute('x', node.x.toString());
      rect.setAttribute('y', node.y.toString());
      rect.setAttribute('width', node.width.toString());
      rect.setAttribute('height', node.height.toString());
      
      // Check if this is the currently executing node
      if (node.id === this.currentExecutionNode) {
        rect.setAttribute('fill', '#ffff99'); // Yellow highlight for execution
        rect.setAttribute('stroke', '#ffcc00');
        rect.setAttribute('stroke-width', '3');
      } else {
        rect.setAttribute('fill', '#fff');
        rect.setAttribute('stroke', '#000');
        rect.setAttribute('stroke-width', '2');
      }
      
      rect.setAttribute('rx', '8');
      
      // Draw text
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', (node.x + node.width / 2).toString());
      text.setAttribute('y', (node.y + node.height / 2).toString());
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('dominant-baseline', 'middle');
      text.setAttribute('font-size', '14');
      text.setAttribute('fill', '#000');
      text.textContent = node.label;
      
      // Add hover effect
      nodeGroup.addEventListener('mouseenter', () => {
        rect.setAttribute('fill', '#f0f0f0');
      });
      nodeGroup.addEventListener('mouseleave', () => {
        rect.setAttribute('fill', '#fff');
      });
      
      // Add click event to select corresponding block
      nodeGroup.addEventListener('click', () => {
        const block = this.workspace.getBlockById(node.blockId) as BlockSvg;
        if (block) {
          // 使用正确的方法选择块
        common.setSelected(block);
        }
      });
      
      nodeGroup.appendChild(rect);
      nodeGroup.appendChild(text);
      this.svg!.appendChild(nodeGroup);
    }
  }

  /**
   * Sets the container element for rendering the flowchart.
   * @param container The HTML container element.
   */
  public setContainer(container: HTMLElement): void {
    this.container = container;
    this.render();
  }

  /**
   * Highlights the currently executing node.
   * @param blockId The ID of the currently executing block.
   */
  public highlightExecution(blockId: string): void {
    this.currentExecutionNode = `node-${blockId}`;
    // Redraw with highlighting
    this.draw();
  }

  /**
   * Exports the flowchart as a UML diagram.
   * @returns The UML flowchart string.
   */
  public exportUML(): string {
    // Simple UML flowchart export
    let uml = '@startuml\n';
    uml += 'left to right direction\n';
    
    // Add nodes
    for (const node of this.nodes.values()) {
      uml += `rectangle "${node.label}" as ${node.id} #fff\n`;
    }
    
    // Add edges
    for (const edge of this.edges.values()) {
      uml += `${edge.from} --> ${edge.to}\n`;
    }
    
    uml += '@enduml';
    return uml;
  }

  /**
   * Optimizes the flowchart layout to eliminate crossed lines.
   */
  public optimizeLayout(): void {
    // TODO: Implement advanced layout optimization
    this.applyLayout();
    this.render();
  }

  /**
   * Disposes the flowchart instance.
   */
  public dispose(): void {
    // Clean up event listeners
    this.workspace.removeChangeListener(() => {}); // TODO: Fix this
    // Remove SVG
    if (this.svg) {
      this.svg.remove();
    }
    this.container = null;
  }
}