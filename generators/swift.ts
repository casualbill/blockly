/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Instantiate a SwiftGenerator and populate it with the
 * complete set of block generator functions for Swift.  This is
 * the entrypoint for swift_compressed.js.
 */

import {SwiftGenerator} from './swift/swift_generator.js';
import * as lists from './swift/lists.js';
import * as logic from './swift/logic.js';
import * as loops from './swift/loops.js';
import * as math from './swift/math.js';
import * as procedures from './swift/procedures.js';
import * as text from './swift/text.js';
import * as variables from './swift/variables.js';
import * as variablesDynamic from './swift/variables_dynamic.js';

export * from './swift/swift_generator.js';

/**
 * Swift code generator instance.
 * @type {!SwiftGenerator}
 */
export const swiftGenerator = new SwiftGenerator();

// Install per-block-type generator functions:
const generators: typeof swiftGenerator.forBlock = {
  ...lists,
  ...logic,
  ...loops,
  ...math,
  ...procedures,
  ...text,
  ...variables,
  ...variablesDynamic,
};
for (const name in generators) {
  swiftGenerator.forBlock[name] = generators[name];
}