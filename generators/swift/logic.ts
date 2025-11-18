/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Swift for logic blocks.
 */

import type {Block} from '../../core/block.js';
import type {SwiftGenerator} from './swift_generator.js';
import {Order} from './swift_generator.js';

export function controls_if(block: Block, generator: SwiftGenerator) {
  // If/elseif/else condition.
  let n = 0;
  let code = '';
  if (generator.STATEMENT_PREFIX) {
    // Automatic prefix insertion is switched off for this block.  Add manually.
    code += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  do {
    const conditionCode = generator.valueToCode(block, 'IF' + n, Order.NONE) || 'false';
    let branchCode = generator.statementToCode(block, 'DO' + n);
    if (generator.STATEMENT_SUFFIX) {
      branchCode = generator.prefixLines(generator.injectId(generator.STATEMENT_SUFFIX, block), generator.INDENT) + branchCode;
    }
    code += (n > 0 ? ' else ' : '') + 'if ' + conditionCode + ' {\n' + branchCode + '}';
    n++;
  } while (block.getInput('IF' + n));

  if (block.getInput('ELSE') || generator.STATEMENT_SUFFIX) {
    let branchCode = block.getInput('ELSE') ? generator.statementToCode(block, 'ELSE') : '';
    if (generator.STATEMENT_SUFFIX) {
      branchCode = generator.prefixLines(generator.injectId(generator.STATEMENT_SUFFIX, block), generator.INDENT) + branchCode;
    }
    code += ' else {\n' + branchCode + '}';
  }
  return code + '\n';
}

export const controls_ifelse = controls_if;

export function logic_compare(block: Block, generator: SwiftGenerator): [string, Order] {
  // Comparison operator.
  const OPERATORS = {
    'EQ': '==',
    'NEQ': '!=',
    'LT': '<',
    'LTE': '<=',
    'GT': '>',
    'GTE': '>=',
    'LTU': '<',  // Less than, unsigned
    'GTU': '>',  // Greater than, unsigned
    'LTEU': '<=',  // Less than or equal, unsigned
    'GTEU': '>='  // Greater than or equal, unsigned
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('OP') as OperatorOption];
  const order = operator === '==' || operator === '!=' ? Order.EQUALITY : Order.RELATIONAL;
  const argument0 = generator.valueToCode(block, 'A', order) || '0';
  const argument1 = generator.valueToCode(block, 'B', order) || '0';
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
}

export function logic_operation(block: Block, generator: SwiftGenerator): [string, Order] {
  // Operations 'and', 'or'.
  const operator = block.getFieldValue('OP') === 'AND' ? '&&' : '||';
  const order = operator === '&&' ? Order.LOGICAL_AND : Order.LOGICAL_OR;
  let argument0 = generator.valueToCode(block, 'A', order);
  let argument1 = generator.valueToCode(block, 'B', order);
  if (!argument0 && !argument1) {
    // If there are no arguments, then the return value is false.
    argument0 = 'false';
    argument1 = 'false';
  } else {
    // Single missing arguments have no effect on the return value.
    if (!argument0) {
      argument0 = 'true';
    } else if (!argument1) {
      argument1 = 'true';
    }
  }
  const code = argument0 + ' ' + operator + ' ' + argument1;
  return [code, order];
}

export function logic_negate(block: Block, generator: SwiftGenerator): [string, Order] {
  // Negation.
  const argument0 = generator.valueToCode(block, 'BOOL', Order.UNARY) || 'false';
  const code = '!' + argument0;
  return [code, Order.UNARY];
}

export function logic_boolean(block: Block, generator: SwiftGenerator): [string, Order] {
  // Boolean values true and false.
  const code = block.getFieldValue('BOOL') ? 'true' : 'false';
  return [code, Order.ATOMIC];
}

export function logic_null(block: Block, generator: SwiftGenerator): [string, Order] {
  // Null value.
  return ['nil', Order.ATOMIC];
}

export function logic_ternary(block: Block, generator: SwiftGenerator): [string, Order] {
  // Ternary operator.  ?:}
  const conditionCode = generator.valueToCode(block, 'IF', Order.NONE) || 'false';
  const thenCode = generator.valueToCode(block, 'THEN', Order.NONE) || 'nil';
  const elseCode = generator.valueToCode(block, 'ELSE', Order.NONE) || 'nil';
  const code = conditionCode + ' ? ' + thenCode + ' : ' + elseCode;
  return [code, Order.TERNARY];
}