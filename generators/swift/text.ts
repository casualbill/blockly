/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating Swift for text blocks.
 */

import type {JoinMutatorBlock} from '../../blocks/text.js';
import type {Block} from '../../core/block.js';
import type {SwiftGenerator} from './swift_generator.js';
import {Order} from './swift_generator.js';

/**
 * Regular expression to detect a single-quoted string literal.
 */
const strRegExp = /^\s*'([^']|\\')*'\s*$/;

/**
 * Enclose the provided value in 'String(...)' function.
 * Leave string literals alone.
 * @param value Code evaluating to a value.
 * @returns Array containing code evaluating to a string
 *     and the order of the returned code.[string, number]
 */
const forceString = function (value: string): [string, Order] {
  if (strRegExp.test(value)) {
    return [value, Order.ATOMIC];
  }
  return ['String(' + value + ')', Order.FUNCTION_CALL];
};

/**
 * Returns an expression calculating the index into a string.
 * @param stringName Name of the string, used to calculate length.
 * @param where The method of indexing, selected by dropdown in Blockly
 * @param opt_at The optional offset when indexing from start/end.
 * @returns Index expression.
 */
const getSubstringIndex = function (
  stringName: string,
  where: string,
  opt_at?: string,
): string | undefined {
  if (where === 'FIRST') {
    return '0';
  } else if (where === 'FROM_END') {
    return stringName + '.count - 1 - ' + opt_at;
  } else if (where === 'LAST') {
    return stringName + '.count - 1';
  } else {
    return opt_at;
  }
};

export function text(block: Block, generator: SwiftGenerator): [string, Order] {
  // Text value.
  const code = generator.quote_(block.getFieldValue('TEXT'));
  return [code, Order.ATOMIC];
}

export function text_join(block: Block, generator: SwiftGenerator): [string, Order] {
  // Create a string made up of any number of elements of any type.
  const joinBlock = block as JoinMutatorBlock;
  switch (joinBlock.itemCount_) {
    case 0:
      return ['""', Order.ATOMIC];
    case 1: {
      const element = generator.valueToCode(joinBlock, 'ADD0', Order.NONE) || '""';
      const codeAndOrder = forceString(element);
      return codeAndOrder;
    }
    case 2: {
      const element0 = generator.valueToCode(joinBlock, 'ADD0', Order.NONE) || '""';
      const element1 = generator.valueToCode(joinBlock, 'ADD1', Order.NONE) || '""';
      const code = forceString(element0)[0] + ' + ' + forceString(element1)[0];
      return [code, Order.ADDITION];
    }
    default: {
      const elements = new Array(joinBlock.itemCount_);
      for (let i = 0; i < joinBlock.itemCount_; i++) {
        elements[i] = generator.valueToCode(joinBlock, 'ADD' + i, Order.NONE) || '""';
      }
      const code = elements.map(e => forceString(e)[0]).join(' + ');
      return [code, Order.ADDITION];
    }
  }
}

export function text_append(block: Block, generator: SwiftGenerator) {
  // Append to a variable in place.
  const varName = generator.getVariableName(block.getFieldValue('VAR'));
  const argument0 = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  return varName + ' += ' + forceString(argument0)[0] + '\n';
}

export function text_length(block: Block, generator: SwiftGenerator): [string, Order] {
  // String length.
  const argument0 = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '""';
  return [argument0 + '.count', Order.MEMBER];
}

export function text_isEmpty(block: Block, generator: SwiftGenerator): [string, Order] {
  // Is the string null or empty?
  const argument0 = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '""';
  return [argument0 + '.isEmpty', Order.MEMBER];
}

export function text_indexOf(block: Block, generator: SwiftGenerator): [string, Order] {
  // Search the text for a substring.
  const operator = block.getFieldValue('END') === 'FIRST' ? '.firstIndex' : '.lastIndex';
  const subString = generator.valueToCode(block, 'FIND', Order.NONE) || '""';
  const text = generator.valueToCode(block, 'VALUE', Order.MEMBER) || '""';
  let code = text + operator + '(of: ' + subString + ')';
  code = '(' + code + ' != nil ? ' + code + '!.utf16Offset(in: ' + text + ') : -1)';
  return [code, Order.FUNCTION_CALL];
}

export function text_charAt(block: Block, generator: SwiftGenerator): [string, Order] {
  // Get substring from text.
  const where = block.getFieldValue('WHERE');
  const textOrder = where === 'FROM_START' ? Order.MEMBER : Order.NONE;
  const text = generator.valueToCode(block, 'VALUE', textOrder) || '""';
  let at = generator.valueToCode(block, 'AT', Order.NONE) || '0';
  
  let code;
  if (where === 'FIRST') {
    code = text + '.first';
  } else if (where === 'LAST') {
    code = text + '.last';
  } else if (where === 'FROM_START') {
    code = text + '[' + text + '.index(' + text + '.startIndex, offsetBy: ' + at + ')]';
  } else if (where === 'FROM_END') {
    code = text + '[' + text + '.index(' + text + '.endIndex, offsetBy: -(' + at + ' + 1))]';
  } else {
    throw Error('Unknown where: ' + where);
  }
  
  return [code, Order.MEMBER];
}

export function text_getSubstring(block: Block, generator: SwiftGenerator): [string, Order] {
  // Get substring.
  const text = generator.valueToCode(block, 'STRING', Order.NONE) || '""';
  const where1 = block.getFieldValue('WHERE1');
  const where2 = block.getFieldValue('WHERE2');
  
  let at1 = generator.valueToCode(block, 'AT1', Order.NONE) || '0';
  let at2 = generator.valueToCode(block, 'AT2', Order.NONE) || '0';
  
  let code = text + '.substring(with: ';
  
  if (where1 === 'FROM_START') {
    code += text + '.index(' + text + '.startIndex, offsetBy: ' + at1 + ')';
  } else if (where1 === 'FROM_END') {
    code += text + '.index(' + text + '.endIndex, offsetBy: -(' + at1 + ' + 1))';
  } else if (where1 === 'FIRST') {
    code += text + '.startIndex';
  } else {
    throw Error('Unknown where1: ' + where1);
  }
  
  code += '..<';
  
  if (where2 === 'FROM_START') {
    code += text + '.index(' + text + '.startIndex, offsetBy: ' + (parseInt(at2) + 1) + ')';
  } else if (where2 === 'FROM_END') {
    code += text + '.index(' + text + '.endIndex, offsetBy: -' + at2 + ')';
  } else if (where2 === 'LAST') {
    code += text + '.endIndex';
  } else {
    throw Error('Unknown where2: ' + where2);
  }
  
  code += ')';
  
  return [code, Order.FUNCTION_CALL];
}

export function text_changeCase(block: Block, generator: SwiftGenerator): [string, Order] {
  // Change capitalization.
  const OPERATORS = {
    'UPPERCASE': '.uppercased()',
    'LOWERCASE': '.lowercased()',
    'TITLECASE': '.capitalized()'
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('CASE') as OperatorOption];
  const argument0 = generator.valueToCode(block, 'TEXT', Order.MEMBER) || '""';
  const code = argument0 + operator;
  return [code, Order.MEMBER];
}

export function text_trim(block: Block, generator: SwiftGenerator): [string, Order] {
  // Trim spaces from text.
  const OPERATORS = {
    'LEFT': '.trimmingCharacters(in: .leadingWhitespaces)',
    'RIGHT': '.trimmingCharacters(in: .trailingWhitespaces)',
    'BOTH': '.trimmingCharacters(in: .whitespaces)'
  };
  type OperatorOption = keyof typeof OPERATORS;
  const operator = OPERATORS[block.getFieldValue('MODE') as OperatorOption];
  const argument0 = generator.valueToCode(block, 'TEXT', Order.MEMBER) || '""';
  const code = argument0 + operator;
  return [code, Order.MEMBER];
}

export function text_print(block: Block, generator: SwiftGenerator) {
  // Print statement.
  const argument0 = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  return 'print(' + argument0 + ')\n';
}

export function text_prompt_ext(block: Block, generator: SwiftGenerator): [string, Order] {
  // Prompt function.
  const message = generator.valueToCode(block, 'TEXT', Order.NONE) || '""';
  const defaultText = generator.valueToCode(block, 'DEFAULT', Order.NONE) || '""';
  
  let code;
  if (block.getField('TYPE')?.getText() === 'TEXT') {
    code = 'readLine(strippingNewline: true) ?? ' + defaultText;
  } else {
    code = 'Double(readLine(strippingNewline: true) ?? "") ?? ' + defaultText;
  }
  
  return [code, Order.FUNCTION_CALL];
}

export const text_prompt = text_prompt_ext;