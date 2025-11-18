/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Swift for list blocks.
 */

import type {CreateWithBlock} from '../../blocks/lists.js';
import type {Block} from '../../core/block.js';
import {NameType} from '../../core/names.js';
import type {SwiftGenerator} from './swift_generator.js';
import {Order} from './swift_generator.js';

export function lists_create_empty(block: Block, generator: SwiftGenerator): [string, Order] {
  // Create an empty list.
  return ['[]', Order.ATOMIC];
}

export function lists_create_with(block: Block, generator: SwiftGenerator): [string, Order] {
  // Create a list with any number of elements of any type.
  const createWithBlock = block as CreateWithBlock;
  const elements = new Array(createWithBlock.itemCount_);
  for (let i = 0; i < createWithBlock.itemCount_; i++) {
    elements[i] = generator.valueToCode(block, 'ADD' + i, Order.NONE) || 'nil';
  }
  const code = '[' + elements.join(', ') + ']';
  return [code, Order.ATOMIC];
}

export function lists_repeat(block: Block, generator: SwiftGenerator): [string, Order] {
  // Create a list with one element repeated.
  const element = generator.valueToCode(block, 'ITEM', Order.NONE) || 'nil';
  const repeatCount = generator.valueToCode(block, 'NUM', Order.NONE) || '0';
  const code = 'Array(repeating: ' + element + ', count: ' + repeatCount + ')';
  return [code, Order.FUNCTION_CALL];
}

export function lists_length(block: Block, generator: SwiftGenerator): [string, Order] {
  // String or array length.
  const list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '[]';
  return [list + '.count', Order.MEMBER];
}

export function lists_isEmpty(block: Block, generator: SwiftGenerator): [string, Order] {
  // Is the array empty?
  const list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '[]';
  return [list + '.isEmpty', Order.MEMBER];
}

export function lists_indexOf(block: Block, generator: SwiftGenerator): [string, Order] {
  // Find an item in the list.
  const operator = block.getFieldValue('END') === 'FIRST' ? 'firstIndex' : 'lastIndex';
  const item = generator.valueToCode(block, 'FIND', Order.NONE) || 'nil';
  const list = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '[]';
  let code = list + '.' + operator + '(of: ' + item + ')';
  code = '(' + code + ' != nil ? ' + code + '! + 1 : -1)';
  
  if (!block.workspace.options.oneBasedIndex) {
    code = '(' + code + ' != -1 ? ' + code + ' - 1 : -1)';
  }
  
  return [code, Order.FUNCTION_CALL];
}

export function lists_getIndex(block: Block, generator: SwiftGenerator): [string, Order] {
  // Get element at index.
  const where = block.getFieldValue('WHERE');
  const listOrder = where === 'FROM_START' ? Order.MEMBER : Order.NONE;
  const list = generator.valueToCode(block, 'VALUE', listOrder) || '[]';
  
  let at = generator.valueToCode(block, 'AT', Order.NONE) || '1';
  if (block.workspace.options.oneBasedIndex) {
    at = '(' + at + ' - 1)';
  }
  
  let code;
  if (where === 'FIRST') {
    code = list + '.first';
  } else if (where === 'LAST') {
    code = list + '.last';
  } else if (where === 'FROM_START') {
    code = list + '[' + at + ']';
  } else if (where === 'FROM_END') {
    code = list + '[' + list + '.count - ' + at + ']';
  } else {
    throw Error('Unknown where: ' + where);
  }
  
  return [code, Order.MEMBER];
}

export function lists_setIndex(block: Block, generator: SwiftGenerator) {
  // Set element at index.
  const list = generator.getVariableName(block.getFieldValue('LIST'));
  const where = block.getFieldValue('WHERE');
  const value = generator.valueToCode(block, 'TO', Order.NONE) || 'nil';
  
  let at = generator.valueToCode(block, 'AT', Order.NONE) || '1';
  if (block.workspace.options.oneBasedIndex) {
    at = '(' + at + ' - 1)';
  }
  
  let code;
  if (where === 'FIRST') {
    code = list + '[0] = ' + value + '\n';
  } else if (where === 'LAST') {
    code = list + '[' + list + '.count - 1] = ' + value + '\n';
  } else if (where === 'FROM_START') {
    code = list + '[' + at + '] = ' + value + '\n';
  } else if (where === 'FROM_END') {
    code = list + '[' + list + '.count - ' + at + '] = ' + value + '\n';
  } else {
    throw Error('Unknown where: ' + where);
  }
  
  return code;
}

export function lists_getSublist(block: Block, generator: SwiftGenerator): [string, Order] {
  // Get sublist.
  const list = generator.valueToCode(block, 'LIST', Order.NONE) || '[]';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  
  let at1 = generator.valueToCode(block, 'AT1', Order.NONE) || '1';
  let at2 = generator.valueToCode(block, 'AT2', Order.NONE) || '1';
  
  if (block.workspace.options.oneBasedIndex) {
    at1 = '(' + at1 + ' - 1)';
    at2 = at2;
  } else {
    at1 = at1;
    at2 = '(' + at2 + ' + 1)';
  }
  
  let code = list;
  
  if (where1 === 'FROM_START') {
    code += '[' + at1 + '..<';
  } else if (where1 === 'FROM_END') {
    code += '[' + list + '.count - ' + at1 + '..<';
  } else if (where1 === 'FIRST') {
    code += '[0..<';
  } else {
    throw Error('Unknown where1: ' + where1);
  }
  
  if (where2 === 'FROM_START') {
    code += at2 + ']';
  } else if (where2 === 'FROM_END') {
    code += list + '.count - ' + at2 + ']';
  } else if (where2 === 'LAST') {
    code += list + '.count]';
  } else {
    throw Error('Unknown where2: ' + where2);
  }
  
  return [code, Order.MEMBER];
}

export function lists_insert(block: Block, generator: SwiftGenerator) {
  // Insert element at index.
  const list = generator.getVariableName(block.getFieldValue('LIST'));
  const element = generator.valueToCode(block, 'ITEM', Order.NONE) || 'nil';
  const where = block.getFieldValue('WHERE');
  
  let code;
  if (where === 'BEGINNING') {
    code = list + '.insert(' + element + ', at: 0)\n';
  } else if (where === 'END') {
    code = list + '.append(' + element + ')\n';
  } else if (where === 'INDEX') {
    const at = generator.valueToCode(block, 'AT', Order.NONE) || '1';
    let index = at;
    if (block.workspace.options.oneBasedIndex) {
      index = '(' + at + ' - 1)';
    }
    code = list + '.insert(' + element + ', at: ' + index + ')\n';
  } else {
    throw Error('Unknown where: ' + where);
  }
  
  return code;
}

export function lists_remove(block: Block, generator: SwiftGenerator) {
  // Remove element at index.
  const list = generator.getVariableName(block.getFieldValue('LIST'));
  const where = block.getFieldValue('WHERE');
  
  let code;
  if (where === 'BEGINNING') {
    code = list + '.removeFirst()\n';
  } else if (where === 'END') {
    code = list + '.removeLast()\n';
  } else if (where === 'INDEX') {
    const at = generator.valueToCode(block, 'AT', Order.NONE) || '1';
    let index = at;
    if (block.workspace.options.oneBasedIndex) {
      index = '(' + at + ' - 1)';
    }
    code = list + '.remove(at: ' + index + ')\n';
  } else {
    throw Error('Unknown where: ' + where);
  }
  
  return code;
}

export function lists_sort(block: Block, generator: SwiftGenerator) {
  // Sort list.
  const list = generator.getVariableName(block.getFieldValue('LIST'));
  const direction = block.getFieldValue('DIRECTION');
  const comparator = direction === '1' ? '>' : '<';
  
  const code = list + '.sort { $0 ' + comparator + ' $1 }\n';
  return code;
}

export function lists_reverse(block: Block, generator: SwiftGenerator) {
  // Reverse list.
  const list = generator.getVariableName(block.getFieldValue('LIST'));
  return list + '.reverse()\n';
}

export function lists_join(block: Block, generator: SwiftGenerator): [string, Order] {
  // Join list into string.
  const list = generator.valueToCode(block, 'LIST', Order.MEMBER) || '[]';
  const separator = generator.valueToCode(block, 'JOINER', Order.NONE) || '""';
  const code = list + '.joined(separator: ' + separator + ')';
  return [code, Order.MEMBER];
}

export function lists_split(block: Block, generator: SwiftGenerator): [string, Order] {
  // Split string into list.
  const string = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  const separator = generator.valueToCode(block, 'DELIM', Order.NONE) || '""';
  const code = string + '.split(separator: ' + separator + ')';
  return [code, Order.FUNCTION_CALL];
}