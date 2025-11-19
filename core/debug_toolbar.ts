/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from './blockly';
import {DebugController, DebugMode} from './debug_controller.js';
import {WorkspaceSvg} from './workspace_svg.js';

/**
 * Debug toolbar class that provides debugging controls.
 */
export class DebugToolbar {
  private container_: HTMLElement;
  private debugController_: DebugController;
  private stepIntoButton_: HTMLButtonElement;
  private stepOverButton_: HTMLButtonElement;
  private stepOutButton_: HTMLButtonElement;
  private continueButton_: HTMLButtonElement;
  private stopButton_: HTMLButtonElement;
  private clearBreakpointsButton_: HTMLButtonElement;
  private statusLabel_: HTMLElement;

  /**
   * Constructs a new DebugToolbar.
   * @param container The container element for the toolbar.
   * @param workspace The workspace to debug.
   */
  constructor(container: HTMLElement, workspace: WorkspaceSvg) {
    this.container_ = container;
    this.debugController_ = new DebugController(workspace);
    
    // Create buttons
    this.stepIntoButton_ = this.createButton_('单步进入', 'debug-step-into');
    this.stepOverButton_ = this.createButton_('单步跳过', 'debug-step-over');
    this.stepOutButton_ = this.createButton_('单步跳出', 'debug-step-out');
    this.continueButton_ = this.createButton_('继续执行', 'debug-continue');
    this.stopButton_ = this.createButton_('停止调试', 'debug-stop');
    this.clearBreakpointsButton_ = this.createButton_('清除所有断点', 'debug-clear-breakpoints');
    
    // Create status label
    this.statusLabel_ = document.createElement('div');
    this.statusLabel_.className = 'blocklyDebugStatus';
    this.statusLabel_.textContent = '未在调试';
    
    // Add event listeners
    this.stepIntoButton_.addEventListener('click', () => this.debugController_.step('into'));
    this.stepOverButton_.addEventListener('click', () => this.debugController_.step('over'));
    this.stepOutButton_.addEventListener('click', () => this.debugController_.step('out'));
    this.continueButton_.addEventListener('click', () => this.debugController_.continue());
    this.stopButton_.addEventListener('click', () => this.debugController_.stop());
    this.clearBreakpointsButton_.addEventListener('click', () => this.debugController_.clearAllBreakpoints());
    
    // Update button states based on debug mode
    this.debugController_.setOnExecutionUpdate((block, mode) => {
      this.updateButtonStates_(mode);
      this.updateStatus_(mode);
    });
    
    // Render toolbar
    this.render_();
  }
  
  /**
   * Creates a button element.
   * @param text The button text.
   * @param className The button class name.
   * @returns The created button element.
   * @private
   */
  private createButton_(text: string, className: string): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = `blocklyDebugButton ${className}`;
    button.textContent = text;
    button.disabled = true;
    return button;
  }
  
  /**
   * Renders the toolbar.
   * @private
   */
  private render_(): void {
    // Clear container
    this.container_.innerHTML = '';
    
    // Add buttons to container
    this.container_.appendChild(this.stepIntoButton_);
    this.container_.appendChild(this.stepOverButton_);
    this.container_.appendChild(this.stepOutButton_);
    this.container_.appendChild(this.continueButton_);
    this.container_.appendChild(this.stopButton_);
    this.container_.appendChild(this.clearBreakpointsButton_);
    this.container_.appendChild(this.statusLabel_);
    
    // Add container class
    this.container_.className = 'blocklyDebugToolbar';
  }
  
  /**
   * Updates the button states based on the current debug mode.
   * @param mode The current debug mode.
   * @private
   */
  private updateButtonStates_(mode: DebugMode): void {
    const isPaused = mode === DebugMode.PAUSED;
    const isRunning = mode === DebugMode.RUNNING || mode === DebugMode.STEPPING;
    
    this.stepIntoButton_.disabled = !isPaused;
    this.stepOverButton_.disabled = !isPaused;
    this.stepOutButton_.disabled = !isPaused;
    this.continueButton_.disabled = !isPaused;
    this.stopButton_.disabled = mode === DebugMode.NONE;
    this.clearBreakpointsButton_.disabled = false; // Always enabled
  }
  
  /**
   * Updates the status label based on the current debug mode.
   * @param mode The current debug mode.
   * @private
   */
  private updateStatus_(mode: DebugMode): void {
    switch (mode) {
      case DebugMode.RUNNING:
        this.statusLabel_.textContent = '运行中';
        break;
      case DebugMode.PAUSED:
        this.statusLabel_.textContent = '已暂停';
        break;
      case DebugMode.STEPPING:
        this.statusLabel_.textContent = '单步执行中';
        break;
      default:
        this.statusLabel_.textContent = '未在调试';
        break;
    }
  }
  
  /**
   * Gets the debug controller.
   * @returns The debug controller.
   */
  getDebugController(): DebugController {
    return this.debugController_;
  }
  
  /**
   * Starts debugging.
   */
  startDebugging(): void {
    this.debugController_.startDebugging();
  }
}
