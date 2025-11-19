/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * An import button used for importing scripts into Blockly.
 *
 * @class
 */

import * as Css from '../css.js';
import {ImportDialog} from '../import_dialog.js';
import type {IToolbox} from '../interfaces/i_toolbox.js';
import * as registry from '../registry.js';
import * as dom from '../utils/dom.js';
import * as toolbox from '../utils/toolbox.js';
import {ToolboxItem} from './toolbox_item.js';

export class ImportButton extends ToolboxItem {
  /** Name used for registering the import button. */
  static registrationName = 'importButton';

  /** All the CSS class names that are used to create the import button. */
  protected cssConfig_: CssConfig = {
    container: 'blocklyImportButton',
    text: 'blocklyImportButtonText',
  };

  private htmlDiv: HTMLDivElement | null = null;

  /** The text to display on the button. */
  private buttonText_: string;

  /**
   * @param buttonDef The information needed to create a button.
   * @param toolbox The parent toolbox for the button.
   */
  constructor(buttonDef: toolbox.ButtonInfo, toolbox: IToolbox) {
    super(buttonDef, toolbox);

    // TODO: Add i18n support
    this.buttonText_ = buttonDef['text'] || 'Import Script';

    const cssConfig =
      (buttonDef as any)['cssconfig'] || (buttonDef as any)['cssConfig'];
    if (cssConfig) {
      Object.assign(this.cssConfig_, cssConfig);
    }
  }

  override init() {
    this.createDom_();
  }

  /**
   * Creates the DOM for the import button.
   *
   * @returns The parent element for the button.
   */
  protected createDom_(): HTMLDivElement {
    const container = document.createElement('div');
    container.tabIndex = 0;
    container.id = this.getId();
    container.title = 'Import script to blocks';

    const className = this.cssConfig_['container'];
    if (className) {
      dom.addClass(container, className);
    }

    const textElement = document.createElement('div');
    textElement.textContent = this.buttonText_;

    const textClassName = this.cssConfig_['text'];
    if (textClassName) {
      dom.addClass(textElement, textClassName);
    }
    container.appendChild(textElement);

    // Add click event listener
    container.addEventListener('click', this.onClick.bind(this));

    this.htmlDiv = container;
    return container;
  }

  override getDiv() {
    return this.htmlDiv as HTMLDivElement;
  }

  override getClickTarget() {
    return this.htmlDiv as HTMLDivElement;
  }

  override isSelectable() {
    return true;
  }

  onClick(e: Event) {
    e.preventDefault();
    e.stopPropagation();
    // Open import dialog
    const importDialog = new ImportDialog({
      workspace: this.workspace_,
      onSuccess: (blocks) => {
        console.log('Import successful:', blocks);
        // TODO: Add blocks to workspace
      },
      onCancel: () => {
        console.log('Import cancelled');
      },
    });
    importDialog.open();
  }

  override dispose() {
    if (this.htmlDiv) {
      this.htmlDiv.removeEventListener('click', this.onClick.bind(this));
      dom.removeNode(this.htmlDiv);
    }
  }
}

export namespace ImportButton {
  export interface CssConfig {
    container: string;
    text: string;
  }
}

export type CssConfig = ImportButton.CssConfig;

/** CSS for Import Button.  See css.js for use. */
Css.register(`
.blocklyImportButton {
  padding: 8px 12px;
  margin: 4px;
  border-radius: 4px;
  background-color: #4CAF50;
  color: white;
  cursor: pointer;
  text-align: center;
  font-family: sans-serif;
  font-size: 14px;
  transition: background-color 0.3s;
}

.blocklyImportButton:hover {
  background-color: #45a049;
}

.blocklyImportButton:active {
  background-color: #3e8e41;
}

.blocklyImportButton:focus {
  outline: 2px solid #2196F3;
  outline-offset: 1px;
}

.blocklyImportButtonText {
  pointer-events: none;
}
`);

registry.register(
  registry.Type.TOOLBOX_ITEM,
  ImportButton.registrationName,
  ImportButton,
);
