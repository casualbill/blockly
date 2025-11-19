/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Swift for variable blocks.
 */

import type {Block} from '../../core/block.js';
import type {SwiftGenerator} from './swift_generator.js';
import {Order} from './swift_generator.js';

export function variables_get(block: Block, generator: SwiftGenerator): [string, Order] {
  // Variable getter.
  const code = generator.getVariableName(block.getFieldValue('VAR'));
  return [code, Order.ATOMIC];
}

export function variables_set(block: Block, generator: SwiftGenerator) {
  // Variable setter.
  const argument0 = generator.valueToCode(block, 'VALUE', Order.ASSIGNMENT) || '0';
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  return varName + ' = ' + argument0 + '\n';
}