/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Swift for math blocks.
 */

import type {Block} from '../../core/block.js';
import type {SwiftGenerator} from './swift_generator.js';
import {Order} from './swift_generator.js';

export function math_number(block: Block, generator: SwiftGenerator): [string, Order] {
  // Numeric value.
  const number = Number(block.getFieldValue('NUM'));
  const order = number >= 0 ? Order.ATOMIC : Order.UNARY;
  return [String(number), order];
}

export function math_arithmetic(block: Block, generator: SwiftGenerator): [string, Order] {
  // Basic arithmetic operators, and power.
  const OPERATORS: Record<string, [string | null, Order]> = {
    'ADD': [' + ', Order.ADDITION],
    'MINUS': [' - ', Order.SUBTRACTION],
    'MULTIPLY': [' * ', Order.MULTIPLICATION],
    'DIVIDE': [' / ', Order.DIVISION],
    'POWER': [null, Order.NONE], // Handle power separately.
  };
  type OperatorOption = keyof typeof OPERATORS;
  const tuple = OPERATORS[block.getFieldValue('OP') as OperatorOption];
  const operator = tuple[0];
  const order = tuple[1];
  const argument0 = generator.valueToCode(block, 'A', order) || '0';
  const argument1 = generator.valueToCode(block, 'B', order) || '0';
  let code;
  // Power in Swift requires a special case since it has no operator.
  if (!operator) {
    code = 'pow(' + argument0 + ', ' + argument1 + ')';
    return [code, Order.FUNCTION_CALL];
  }
  code = argument0 + operator + argument1;
  return [code, order];
}

export function math_single(block: Block, generator: SwiftGenerator): [string, Order] {
  // Math operators with single operand.
  const operator = block.getFieldValue('OP');
  let code;
  let arg;
  if (operator === 'NEG') {
    // Negation is a special case given its different operator precedence.
    arg = generator.valueToCode(block, 'NUM', Order.UNARY) || '0';
    if (arg[0] === '-') {
      // --3 is not legal in Swift.
      arg = ' ' + arg;
    }
    code = '-' + arg;
    return [code, Order.UNARY];
  }
  if (operator === 'SIN' || operator === 'COS' || operator === 'TAN') {
    arg = generator.valueToCode(block, 'NUM', Order.DIVISION) || '0';
  } else {
    arg = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  }
  // First, handle cases which generate values that don't need parentheses
  // wrapping the code.
  switch (operator) {
    case 'ABS':
      code = 'abs(' + arg + ')';
      break;
    case 'ROOT':
      code = 'sqrt(' + arg + ')';
      break;
    case 'LN':
      code = 'log(' + arg + ')';
      break;
    case 'EXP':
      code = 'exp(' + arg + ')';
      break;
    case 'POW10':
      code = 'pow(10.0,' + arg + ')';
      break;
    case 'ROUND':
      code = 'round(' + arg + ')';
      break;
    case 'ROUNDUP':
      code = 'ceil(' + arg + ')';
      break;
    case 'ROUNDDOWN':
      code = 'floor(' + arg + ')';
      break;
    case 'SIN':
      code = 'sin(' + arg + ')';
      break;
    case 'COS':
      code = 'cos(' + arg + ')';
      break;
    case 'TAN':
      code = 'tan(' + arg + ')';
      break;
    case 'ASIN':
      code = 'asin(' + arg + ')';
      break;
    case 'ACOS':
      code = 'acos(' + arg + ')';
      break;
    case 'ATAN':
      code = 'atan(' + arg + ')';
      break;
    case 'LOG10':
      code = 'log10(' + arg + ')';
      break;
    case 'LOG2':
      code = 'log2(' + arg + ')';
      break;
    case 'PI':
      code = 'Double.pi';
      break;
    case 'E':
      code = 'M_E';
      break;
    case 'RANDOM':
      code = 'Double.random(in: 0.0 ..< 1.0)';
      break;
    case 'INT':
      code = 'Int(' + arg + ')';
      break;
    case 'FLOAT':
      code = 'Double(' + arg + ')';
      break;
    default:
      throw Error('Unknown math operator: ' + operator);
  }
  return [code, Order.FUNCTION_CALL];
}

export function math_trig_angle(block: Block, generator: SwiftGenerator) {
  // Trigonometry angle mode is not supported in Swift.
  return '';
}