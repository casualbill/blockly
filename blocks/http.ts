/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.libraryBlocks.http

import { createBlockDefinitionsFromJsonArray } from '../core/common.js';

/**
 * A dictionary of the block definitions provided by this module.
 */
export const blocks = createBlockDefinitionsFromJsonArray([
  {
    'type': 'http_request',
    'message0': '%{BKY_HTTP_REQUEST_TITLE}',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'METHOD',
        'options': [
          ['GET', 'GET'],
          ['POST', 'POST'],
          ['PUT', 'PUT'],
          ['DELETE', 'DELETE'],
          ['PATCH', 'PATCH']
        ]
      },
      {
        'type': 'input_value',
        'name': 'URL',
        'check': 'String'
      },
      {
        'type': 'input_value',
        'name': 'HEADERS',
        'check': 'Object',
        'align': 'RIGHT',
        'optional': true
      },
      {
        'type': 'input_value',
        'name': 'BODY',
        'check': ['String', 'Object'],
        'align': 'RIGHT',
        'optional': true
      },
      {
        'type': 'field_number',
        'name': 'TIMEOUT',
        'value': 30,
        'min': 1,
        'precision': 1,
        'suffix': '%{BKY_HTTP_REQUEST_SECONDS}'
      },
      {
        'type': 'field_dropdown',
        'name': 'AUTH_TYPE',
        'options': [
          ['None', 'NONE'],
          ['Bearer Token', 'BEARER'],
          ['Basic Auth', 'BASIC']
        ]
      },
      {
        'type': 'input_value',
        'name': 'AUTH_VALUE',
        'check': 'String',
        'align': 'RIGHT',
        'optional': true
      }
    ],
    'output': 'Object',
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_REQUEST_TOOLTIP}',
    'helpUrl': '%{BKY_HTTP_REQUEST_HELPURL}',
    'extensions': ['http_request_tooltip']
  },
  {
    'type': 'http_response_status',
    'message0': '%{BKY_HTTP_RESPONSE_STATUS_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'RESPONSE',
        'check': 'Object'
      }
    ],
    'output': 'Number',
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_RESPONSE_STATUS_TOOLTIP}'
  },
  {
    'type': 'http_response_body',
    'message0': '%{BKY_HTTP_RESPONSE_BODY_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'RESPONSE',
        'check': 'Object'
      }
    ],
    'output': ['String', 'Object'],
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_RESPONSE_BODY_TOOLTIP}'
  },
  {
    'type': 'http_response_headers',
    'message0': '%{BKY_HTTP_RESPONSE_HEADERS_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'RESPONSE',
        'check': 'Object'
      }
    ],
    'output': 'Object',
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_RESPONSE_HEADERS_TOOLTIP}'
  },
  {
    'type': 'http_is_success',
    'message0': '%{BKY_HTTP_IS_SUCCESS_TITLE}',
    'args0': [
      {
        'type': 'input_value',
        'name': 'RESPONSE',
        'check': 'Object'
      }
    ],
    'output': 'Boolean',
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_IS_SUCCESS_TOOLTIP}'
  },
  {
    'type': 'http_create_headers',
    'message0': '%{BKY_HTTP_CREATE_HEADERS_TITLE}',
    'output': 'Object',
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_CREATE_HEADERS_TOOLTIP}',
    'mutator': 'http_headers_mutator'
  },
  {
    'type': 'http_create_body',
    'message0': '%{BKY_HTTP_CREATE_BODY_TITLE}',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'FORMAT',
        'options': [
          ['JSON', 'JSON'],
          ['Form Data', 'FORM'],
          ['Text', 'TEXT']
        ]
      },
      {
        'type': 'input_value',
        'name': 'CONTENT',
        'check': ['String', 'Object']
      }
    ],
    'output': ['String', 'Object'],
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_CREATE_BODY_TOOLTIP}'
  },
  {
    'type': 'http_on_success',
    'message0': '%{BKY_HTTP_ON_SUCCESS_TITLE} %1',
    'args0': [
      {
        'type': 'input_statement',
        'name': 'HANDLER'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_ON_SUCCESS_TOOLTIP}'
  },
  {
    'type': 'http_on_error',
    'message0': '%{BKY_HTTP_ON_ERROR_TITLE} %1',
    'args0': [
      {
        'type': 'input_statement',
        'name': 'HANDLER'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'text_blocks',
    'tooltip': '%{BKY_HTTP_ON_ERROR_TOOLTIP}'
  }
]);

/**
 * Extensions for HTTP blocks.
 */
import * as Extensions from '../core/extensions.js';
import {FieldDropdown} from '../core/field_dropdown.js';
import {FieldTextInput} from '../core/field_textinput.js';
import {MutatorIcon} from '../core/icons/mutator_icon.js';

Extensions.register('http_request_tooltip', function(this: any) { const block = this;
  const method = block.getFieldValue('METHOD');
  const url = block.getFieldValue('URL') || 'url';
  block.setTooltip(`Send ${method} request to ${url}`);
});

/**
 * Headers mutator for HTTP blocks.
 */
import {defineBlocks} from '../core/common.js';

// Define header container and item blocks for mutator
defineBlocks({
  'http_headers_container': {
    message0: '%{BKY_HTTP_CREATE_HEADERS_TITLE} %1 %2',
    args0: [
      {type: 'input_dummy'},
      {type: 'input_statement', name: 'STACK'}
    ],
    style: 'text_blocks',
    tooltip: '%{BKY_HTTP_CREATE_HEADERS_TOOLTIP}',
    enableContextMenu: false
  },
  'http_header_item': {
    message0: '%1: %2',
    args0: [
      {type: 'field_input', name: 'KEY', text: 'Content-Type'},
      {type: 'field_input', name: 'VALUE', text: 'application/json'}
    ],
    previousStatement: null,
    nextStatement: null,
    style: 'text_blocks',
    tooltip: 'Header key-value pair',
    enableContextMenu: false
  }
});

// Implement the mutator
Extensions.registerMutator('http_headers_mutator', {
  // Define the structure
  mutationToDom: function(this: any) {
    const container = document.createElement('mutation');
    container.setAttribute('items', this.itemCount_);
    return container;
  },
  
  domToMutation: function(this: any, xmlElement: Element) {
    this.itemCount_ = parseInt(xmlElement.getAttribute('items') || '0', 10);
    this.rebuildShape_();
  },
  
  decompose: function(this: any, workspace: any) {
    const containerBlock = workspace.newBlock('http_headers_container');
    containerBlock.initSvg();
    
    let connection = containerBlock.getInput('STACK').connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock('http_header_item');
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    
    return containerBlock;
  },
  
  compose: function(this: any, containerBlock: any) {
    let itemBlock = containerBlock.getInputTargetBlock('STACK');
    const connections = [];
    
    while (itemBlock) {
      connections.push(itemBlock);
      itemBlock = itemBlock.nextConnection && itemBlock.nextConnection.targetBlock();
    }
    
    this.itemCount_ = connections.length;
    this.rebuildShape_();
    
    for (let i = 0; i < this.itemCount_; i++) {
      // Copy values from mutator blocks to main block
      const key = connections[i].getFieldValue('KEY');
      const value = connections[i].getFieldValue('VALUE');
      this.setFieldValue(key, 'KEY' + i);
      this.setFieldValue(value, 'VALUE' + i);
    }
  },
  
  saveConnections: function(this: any, containerBlock: any) {
    // Not needed for simple headers mutator
  },
  
  rebuildShape_: function(this: any) {
    // Remove old inputs
    for (let i = 0; i < this.itemCount_; i++) {
      this.removeInput('HEADER' + i);
    }
    
    // Add new inputs
    for (let i = 0; i < this.itemCount_; i++) {
      this.appendValueInput('HEADER' + i)
          .setAlign("RIGHT")
          .appendField(new FieldTextInput('Key'), 'KEY' + i)
          .appendField(':')
          .appendField(new FieldTextInput('Value'), 'VALUE' + i);
    }
  },
  
  init: function(this: any) {
    this.itemCount_ = 0;
    this.rebuildShape_();
  }
}, () => ['http_headers_container', 'http_header_item']);