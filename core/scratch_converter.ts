/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Scratch converter for Blockly.
 */

import type {Block} from './block.js';
import type {Workspace} from './workspace.js';

export namespace ScratchConverter {
  /**
   * Convert a Blockly workspace to Scratch JSON format.
   * @param workspace Blockly workspace to convert.
   * @returns Scratch JSON object.
   */
  export function workspaceToScratchJson(workspace: Workspace): any {
    const scratchProject: any = {
      "targets": [
        {
          "isStage": true,
          "name": "Stage",
          "variables": {
            "list": [],
            "variable": []
          },
          "broadcasts": {},
          "comments": [],
          "currentCostume": 0,
          "costumes": [],
          "effects": {
            "brightness": 50,
            "ghost": 0,
            "color": 0,
            "size": 100
          },
          "layerOrder": 0,
          "lists": {},
          "sounds": [],
          "blocks": {
            "blocks": [],
            "variables": []
          },
          "tempo": 60,
          "videoState": {
            "motionTransparency": 50,
            "motionZoom": 100
          },
          "textToSpeechLanguage": null
        }
      ],
      "monitors": [],
      "extensions": [],
      "meta": {
        "semver": "3.0.0",
        "vm": "0.2.0",
        "agent": "Mozilla/5.0"
      }
    };

    // Add blocks to the project
    const blocks = workspace.getAllBlocks(false);
    const scratchBlocks: any[] = [];
    
    blocks.forEach((block: Block) => {
      const scratchBlock = blockToScratchBlock(block);
      if (scratchBlock) {
        scratchBlocks.push(scratchBlock);
      }
    });

    scratchProject.targets[0].blocks.blocks = scratchBlocks;

    return scratchProject;
  }

  /**
   * Convert a single Blockly block to Scratch block format.
   * @param block Blockly block to convert.
   * @returns Scratch block object or null if conversion failed.
   */
  function blockToScratchBlock(block: Block): any | null {
    let scratchBlock: any = null;

    // Map Blockly block types to Scratch block types
    const blockTypeMap: Record<string, string> = {
      'controls_if': 'control_if',
      'controls_repeat_ext': 'control_repeat',
      'controls_whileUntil': 'control_while',
      'controls_for': 'control_for',
      'controls_forEach': 'control_forEach',
      'logic_compare': 'operator_equals',
      'logic_operation': 'operator_and',
      'logic_negate': 'operator_not',
      'logic_boolean': 'logic_boolean',
      'math_arithmetic': 'operator_add',
      'math_number': 'number',
      'text': 'text'
      // Add more mappings as needed
    };

    const scratchBlockType = blockTypeMap[block.type];
    if (!scratchBlockType) {
      console.warn(`Unsupported block type: ${block.type}`);
      return null;
    }

    scratchBlock = {
      "opcode": scratchBlockType,
      "next": null,
      "inputs": {},
      "fields": {},
      "topLevel": block.previousConnection === null,
      "parent": null,
      "shadow": false,
      "x": block.getRelativeToSurfaceXY().x,
      "y": block.getRelativeToSurfaceXY().y
    };

    // Handle fields
    const fields = block.getFields();
    for (const field of fields) {
      if (field.name) {
        scratchBlock.fields[field.name] = field.getValue();
      }
    }

    // Handle inputs
    const inputs = block.inputList;
    inputs.forEach((input: any) => {
      if (input.connection && input.connection.targetBlock()) {
        scratchBlock.inputs[input.name] = {
          "block": input.connection.targetBlock().id
        };
      }
    });

    // Handle next block
    if (block.nextConnection) {
      const nextBlock = block.nextConnection.targetBlock();
      if (nextBlock) {
        scratchBlock.next = {
          "block": nextBlock.id
        };
      }
    }

    return scratchBlock;
  }

  /**
   * Convert a Blockly workspace to Scratch SB3 format and trigger download.
   * @param workspace Blockly workspace to convert.
   */
  export function downloadAsScratch(workspace: Workspace): void {
    const scratchJson = workspaceToScratchJson(workspace);
    const scratchJsonString = JSON.stringify(scratchJson, null, 2);
    const blob = new Blob([scratchJsonString], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'project.sb3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}