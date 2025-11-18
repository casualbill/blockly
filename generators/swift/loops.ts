/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Swift for loop blocks.
 */

import type {ControlFlowInLoopBlock} from '../../blocks/loops.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import * as stringUtils from '../../core/utils/string.js';
import type {SwiftGenerator} from './swift_generator.js';
import {Order} from './swift_generator.js';

export function controls_repeat_ext(block: Block, generator: SwiftGenerator) {
  // Repeat n times.
  let repeats;
  if (block.getField('TIMES')) {
    // Internal number.
    repeats = String(Number(block.getFieldValue('TIMES')));
  } else {
    // External number.
    repeats = generator.valueToCode(block, 'TIMES', Order.ASSIGNMENT) || '0';
  }
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  let code = '';
  
  // Check if repeats is a simple number or needs to be calculated
  if (!repeats.match(/^\w+$/) && !stringUtils.isNumber(repeats)) {
    // External number, use for-in loop with stride
    code += 'for _ in 0 ..< ' + repeats + ' {\n' + branch + '}\n';
  } else {
    // Internal number, use for-in loop with range
    code += 'for _ in 0 ..< ' + repeats + ' {\n' + branch + '}\n';
  }
  return code;
}

export const controls_repeat = controls_repeat_ext;

export function controls_whileUntil(block: Block, generator: SwiftGenerator) {
  // Do while/until loop.
  const until = block.getFieldValue('MODE') === 'UNTIL';
  let argument0 = generator.valueToCode(block, 'BOOL', Order.NONE) || 'false';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  
  if (until) {
    return 'repeat {\n' + branch + '} while ' + '!' + argument0 + '\n';
  } else {
    return 'while ' + argument0 + ' {\n' + branch + '}\n';
  }
}

export function controls_for(block: Block, generator: SwiftGenerator) {
  // For loop.
  const variable0 = generator.getVariableName(block.getFieldValue('VAR'));
  const argument0 = generator.valueToCode(block, 'FROM', Order.ASSIGNMENT) || '0';
  const argument1 = generator.valueToCode(block, 'TO', Order.ASSIGNMENT) || '0';
  const increment = generator.valueToCode(block, 'BY', Order.ASSIGNMENT) || '1';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  
  let code;
  if (stringUtils.isNumber(argument0) && stringUtils.isNumber(argument1) && stringUtils.isNumber(increment)) {
    // All arguments are simple numbers.
    const start = Number(argument0);
    const end = Number(argument1);
    const step = Number(increment);
    
    if (step > 0) {
      if (start < end) {
        code = 'for ' + variable0 + ' in stride(from: ' + start + ', to: ' + end + ', by: ' + step + ') {\n' + branch + '}\n';
      } else {
        // Loop from start down to end with positive step, which is a no-op.
        code = '';
      }
    } else if (step < 0) {
      if (start > end) {
        code = 'for ' + variable0 + ' in stride(from: ' + start + ', to: ' + end + ', by: ' + step + ') {\n' + branch + '}\n';
      } else {
        // Loop from start up to end with negative step, which is a no-op.
        code = '';
      }
    } else {
      // Step is zero, which is a no-op.
      code = '';
    }
  } else {
    // Arguments are not simple numbers, use generic approach.
    code = 'var ' + variable0 + ' = ' + argument0 + '\n';
    code += 'let _step = ' + increment + '\n';
    code += 'let _end = ' + argument1 + '\n';
    code += 'if _step > 0 {\n';
    code += '  while ' + variable0 + ' < _end {\n';
    code += branch;
    code += '    ' + variable0 + ' += _step\n';
    code += '  }\n';
    code += '} else if _step < 0 {\n';
    code += '  while ' + variable0 + ' > _end {\n';
    code += branch;
    code += '    ' + variable0 + ' += _step\n';
    code += '  }\n';
    code += '}\n';
  }
  return code;
}

export function controls_forEach(block: Block, generator: SwiftGenerator) {
  // For each loop.
  const variable0 = generator.getVariableName(block.getFieldValue('VAR'));
  const argument0 = generator.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
  let branch = generator.statementToCode(block, 'DO');
  branch = generator.addLoopTrap(branch, block);
  
  const code = 'for ' + variable0 + ' in ' + argument0 + ' {\n' + branch + '}\n';
  return code;
}

export function controls_flow_statements(block: Block, generator: SwiftGenerator) {
  // Flow statements: continue, break.
  const flow = block.getFieldValue('FLOW');
  return flow.toLowerCase() + '\n';
}