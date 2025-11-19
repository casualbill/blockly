/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @file Generating JavaScript for HTTP blocks.
 */

// Former goog.module ID: Blockly.JavaScript.http

import type {Block} from '../../core/block.js';
import type {JavascriptGenerator} from './javascript_generator.js';
import {Order} from './javascript_generator.js';

export function http_request(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // Generate code for HTTP request
  const method = block.getFieldValue('METHOD');
  const url = generator.valueToCode(block, 'URL', Order.ATOMIC) || "''";
  const headers = generator.valueToCode(block, 'HEADERS', Order.ATOMIC) || '{}';
  const body = generator.valueToCode(block, 'BODY', Order.ATOMIC) || 'undefined';
  const timeout = block.getFieldValue('TIMEOUT');
  const authType = block.getFieldValue('AUTH_TYPE');
  const authValue = generator.valueToCode(block, 'AUTH_VALUE', Order.ATOMIC) || "''";

  // Add authentication headers if needed
  let authHeaders = '';
  if (authType === 'BEARER') {
    authHeaders = `\n  if (authValue) {
    requestHeaders['Authorization'] = 'Bearer ' + authValue;
  }`;
  } else if (authType === 'BASIC') {
    authHeaders = `\n  if (authValue) {
    requestHeaders['Authorization'] = 'Basic ' + btoa(authValue);
  }`;
  }

  // Create request options
  const functionName = generator.provideFunction_(
    'httpRequest',
    `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(method, url, headers, body, timeout) {
  return new Promise((resolve, reject) => {
    const requestHeaders = {...headers};
    ${authHeaders}
    
    // Log request in debug mode
    if (typeof window !== 'undefined' && window.Blockly?.debugMode) {
      console.log('HTTP Request:', {
        method: method,
        url: url,
        headers: requestHeaders,
        body: body,
        timeout: timeout
      });
    }

    const xhr = new XMLHttpRequest();
    xhr.open(method, url, true);
    
    // Set headers
    for (const [key, value] of Object.entries(requestHeaders)) {
      xhr.setRequestHeader(key, value);
    }
    
    // Set timeout
    xhr.timeout = timeout * 1000;
    
    xhr.onload = function() {
      let responseBody;
      try {
        responseBody = JSON.parse(this.responseText);
      } catch (e) {
        responseBody = this.responseText;
      }
      
      const response = {
        status: this.status,
        headers: this.getAllResponseHeaders(),
        body: responseBody
      };
      
      // Log response in debug mode
      if (typeof window !== 'undefined' && window.Blockly?.debugMode) {
        console.log('HTTP Response:', response);
      }
      
      resolve(response);
    };
    
    xhr.onerror = function() {
      reject(new Error('Network error'));
    };
    
    xhr.ontimeout = function() {
      reject(new Error('Request timed out'));
    };
    
    // Send request
    if (body !== undefined) {
      // Check if body is JSON object and needs stringifying
      if (typeof body === 'object' && body !== null && !(body instanceof FormData)) {
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(body));
      } else {
        xhr.send(body);
      }
    } else {
      xhr.send();
    }
  });
}
  `
  );

  const code = `${functionName}(${method}, ${url}, ${headers}, ${body}, ${timeout})`;
  return [code, Order.FUNCTION_CALL];
}

export function http_response_status(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  const response = generator.valueToCode(block, 'RESPONSE', Order.MEMBER) || '{}';
  return [`${response}.status`, Order.MEMBER];
}

export function http_response_body(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  const response = generator.valueToCode(block, 'RESPONSE', Order.MEMBER) || '{}';
  return [`${response}.body`, Order.MEMBER];
}

export function http_response_headers(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  const response = generator.valueToCode(block, 'RESPONSE', Order.MEMBER) || '{}';
  return [`${response}.headers`, Order.MEMBER];
}

export function http_is_success(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  const response = generator.valueToCode(block, 'RESPONSE', Order.MEMBER) || '{}';
  return [`(${response}.status >= 200 && ${response}.status < 300)`, Order.RELATIONAL];
}

export function http_create_headers(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  // This block should be handled by mutator
  return ['{}', Order.ATOMIC];
}

export function http_create_body(
  block: Block,
  generator: JavascriptGenerator,
): [string, Order] {
  const format = block.getFieldValue('FORMAT');
  const content = generator.valueToCode(block, 'CONTENT', Order.ATOMIC) || '{}';

  if (format === 'JSON') {
    return [`JSON.stringify(${content})`, Order.FUNCTION_CALL];
  } else if (format === 'FORM') {
    // Generate FormData code
    const functionName = generator.provideFunction_(
      'createFormData',
      `
function ${generator.FUNCTION_NAME_PLACEHOLDER_}(data) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(data)) {
    formData.append(key, value);
  }
  return formData;
}
  `
    );
    return [`${functionName}(${content})`, Order.FUNCTION_CALL];
  }
  // Default to text
  return [content, Order.ATOMIC];
}