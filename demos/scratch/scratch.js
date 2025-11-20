/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview JavaScript for Blockly to Scratch demo.
 */
'use strict';

/**
 * Create a Blockly workspace.
 */
function init() {
  const toolbox = document.getElementById('toolbox');
  const workspace = Blockly.inject('blocklyDiv', {
    toolbox: toolbox,
    zoom: {
      controls: true,
      wheel: true,
      startScale: 1.0,
      maxScale: 3,
      minScale: 0.3,
      scaleSpeed: 1.2
    }
  });
}

// Initialize the demo when the page loads.
window.addEventListener('load', init);