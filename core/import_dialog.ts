/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * A dialog for importing scripts into Blockly.
 *
 * @class
 */

import * as Blockly from './blockly.js';
import {CodeConverter} from './code_converter.js';
import * as Css from './css.js';
import * as dom from './utils/dom.js';
import type {WorkspaceSvg} from './workspace_svg.js';

export interface ImportOptions {
  /** The workspace to import blocks into. */
  workspace: WorkspaceSvg;
  /** Callback function when import is successful. */
  onSuccess?: (blocks: any[]) => void;
  /** Callback function when import is cancelled. */
  onCancel?: () => void;
}

export class ImportDialog {
  private workspace_: WorkspaceSvg;
  private onSuccess_?: (blocks: any[]) => void;
  private onCancel_?: () => void;
  private dialogElement_: HTMLDialogElement | null = null;
  private codeTextarea_: HTMLTextAreaElement | null = null;
  private fileInput_: HTMLInputElement | null = null;
  private languageSelect_: HTMLSelectElement | null = null;
  private previewContainer_: HTMLDivElement | null = null;

  /**
   * @param options The options for the import dialog.
   */
  constructor(options: ImportOptions) {
    this.workspace_ = options.workspace;
    this.onSuccess_ = options.onSuccess;
    this.onCancel_ = options.onCancel;
  }

  /**
   * Opens the import dialog.
   */
  open() {
    this.createDom_();
    this.show_();
  }

  /**
   * Creates the DOM structure for the import dialog.
   */
  private createDom_() {
    const dialogElement = document.createElement('dialog');
    dom.addClass(dialogElement, 'blocklyImportDialog');

    // Create header
    const header = document.createElement('div');
    dom.addClass(header, 'blocklyImportDialogHeader');
    header.textContent = 'Import Script';
    dialogElement.appendChild(header);

    // Create content
    const content = document.createElement('div');
    dom.addClass(content, 'blocklyImportDialogContent');

    // Create language selection
    const languageDiv = document.createElement('div');
    dom.addClass(languageDiv, 'blocklyImportDialogRow');

    const languageLabel = document.createElement('label');
    languageLabel.textContent = 'Language:';
    languageLabel.setAttribute('for', 'blocklyImportLanguage');
    dom.addClass(languageLabel, 'blocklyImportDialogLabel');
    languageDiv.appendChild(languageLabel);

    const languageSelect = document.createElement('select');
    languageSelect.id = 'blocklyImportLanguage';
    dom.addClass(languageSelect, 'blocklyImportDialogSelect');

    const languages = [
      {value: 'javascript', label: 'JavaScript'},
      {value: 'python', label: 'Python'},
      {value: 'lua', label: 'Lua'},
      {value: 'php', label: 'PHP'},
      {value: 'dart', label: 'Dart'},
    ];

    languages.forEach((lang) => {
      const option = document.createElement('option');
      option.value = lang.value;
      option.textContent = lang.label;
      languageSelect.appendChild(option);
    });

    languageDiv.appendChild(languageSelect);
    content.appendChild(languageDiv);

    // Create file upload
    const fileDiv = document.createElement('div');
    dom.addClass(fileDiv, 'blocklyImportDialogRow');

    const fileLabel = document.createElement('label');
    fileLabel.textContent = 'Upload file:';
    fileLabel.setAttribute('for', 'blocklyImportFile');
    dom.addClass(fileLabel, 'blocklyImportDialogLabel');
    fileDiv.appendChild(fileLabel);

    const fileInput = document.createElement('input');
    fileInput.id = 'blocklyImportFile';
    fileInput.type = 'file';
    fileInput.accept = '.js,.py,.lua,.php,.dart';
    dom.addClass(fileInput, 'blocklyImportDialogFileInput');

    // Add file change event listener
    fileInput.addEventListener('change', (e) => {
      this.handleFileUpload_(e as InputEvent);
    });

    fileDiv.appendChild(fileInput);
    content.appendChild(fileDiv);

    // Create paste area
    const pasteDiv = document.createElement('div');
    dom.addClass(pasteDiv, 'blocklyImportDialogRow');

    const pasteLabel = document.createElement('label');
    pasteLabel.textContent = 'Paste code:';
    pasteLabel.setAttribute('for', 'blocklyImportCode');
    dom.addClass(pasteLabel, 'blocklyImportDialogLabel');
    pasteDiv.appendChild(pasteLabel);

    const codeTextarea = document.createElement('textarea');
    codeTextarea.id = 'blocklyImportCode';
    codeTextarea.placeholder = 'Paste your code here...';
    dom.addClass(codeTextarea, 'blocklyImportDialogTextarea');
    pasteDiv.appendChild(codeTextarea);
    content.appendChild(pasteDiv);

    // Create preview area
    const previewDiv = document.createElement('div');
    dom.addClass(previewDiv, 'blocklyImportDialogRow');

    const previewLabel = document.createElement('label');
    previewLabel.textContent = 'Preview:';
    dom.addClass(previewLabel, 'blocklyImportDialogLabel');
    previewDiv.appendChild(previewLabel);

    const previewContainer = document.createElement('div');
    dom.addClass(previewContainer, 'blocklyImportDialogPreview');
    previewContainer.textContent = 'Preview will be shown here...';
    previewDiv.appendChild(previewContainer);
    content.appendChild(previewDiv);

    dialogElement.appendChild(content);

    // Create buttons
    const buttonsDiv = document.createElement('div');
    dom.addClass(buttonsDiv, 'blocklyImportDialogButtons');

    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    dom.addClass(cancelButton, 'blocklyImportDialogButton');
    dom.addClass(cancelButton, 'blocklyImportDialogCancelButton');
    cancelButton.addEventListener('click', () => this.close_(false));
    buttonsDiv.appendChild(cancelButton);

    const importButton = document.createElement('button');
    importButton.textContent = 'Import';
    importButton.type = 'submit';
    dom.addClass(importButton, 'blocklyImportDialogButton');
    dom.addClass(importButton, 'blocklyImportDialogImportButton');
    buttonsDiv.appendChild(importButton);

    dialogElement.appendChild(buttonsDiv);

    // Add form submit event listener
    dialogElement.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleImport_();
    });

    this.dialogElement_ = dialogElement;
    this.codeTextarea_ = codeTextarea;
    this.fileInput_ = fileInput;
    this.languageSelect_ = languageSelect;
    this.previewContainer_ = previewContainer;

    // Append to body
    document.body.appendChild(dialogElement);
  }

  /**
   * Shows the import dialog.
   */
  private show_() {
    if (this.dialogElement_) {
      this.dialogElement_.showModal();
    }
  }

  /**
   * Closes the import dialog.
   *
   * @param imported Whether the import was successful.
   */
  private close_(imported: boolean) {
    if (this.dialogElement_) {
      this.dialogElement_.close();
      this.dialogElement_.remove();
      this.dialogElement_ = null;

      if (imported && this.onSuccess_) {
        // TODO: Implement actual import logic
        this.onSuccess_([]);
      } else if (this.onCancel_) {
        this.onCancel_();
      }
    }
  }

  /**
   * Handles file upload event.
   *
   * @param e The input event.
   */
  private handleFileUpload_(e: InputEvent) {
    const input = e.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      return;
    }

    const file = input.files[0];
    const reader = new FileReader();

    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (this.codeTextarea_) {
        this.codeTextarea_.value = content;
      }

      // Auto-detect language from file extension
      const extension = file.name.split('.').pop()?.toLowerCase();
      if (extension && this.languageSelect_) {
        const languageMap: Record<string, string> = {
          js: 'javascript',
          py: 'python',
          lua: 'lua',
          php: 'php',
          dart: 'dart',
        };
        const language = languageMap[extension] || 'javascript';
        this.languageSelect_.value = language;
      }

      // Generate preview
      this.generatePreview_();
    };

    reader.readAsText(file);
  }

  /**
   * Generates preview of the imported code.
   */
  private generatePreview_() {
    // TODO: Implement actual preview generation
    if (this.previewContainer_) {
      this.previewContainer_.textContent =
        'Preview functionality coming soon...';
    }
  }

  /**
   * Handles import action.
   */
  private handleImport_() {
    if (this.codeTextarea_ && this.languageSelect_) {
      const code = this.codeTextarea_.value;
      const selectedLanguage = this.languageSelect_.value;
      console.log('Importing code:', code);
      console.log('Selected language:', selectedLanguage);

      try {
        // 使用CodeConverter转换代码
        const xmlDoc = CodeConverter.convert(code, selectedLanguage);

        // 将转换后的XML添加到工作区
        const blocks = Blockly.Xml.domToWorkspace(xmlDoc, this.workspace_);

        // 调用成功回调并关闭对话框
        if (this.onSuccess_) {
          this.onSuccess_(blocks);
        }
        this.close_(true);
      } catch (error) {
        console.error('Code conversion failed:', error);
        // TODO: Show error message to user
      }
    }
  }
}

/** CSS for Import Dialog.  See css.js for use. */
Css.register(`
.blocklyImportDialog {
  width: 600px;
  max-width: 90vw;
  padding: 0;
  border: none;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
  font-family: sans-serif;
  overflow: hidden;
}

.blocklyImportDialogHeader {
  background-color: #4CAF50;
  color: white;
  padding: 16px;
  font-size: 20px;
  font-weight: bold;
}

.blocklyImportDialogContent {
  padding: 20px;
}

.blocklyImportDialogRow {
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.blocklyImportDialogLabel {
  font-weight: bold;
  font-size: 14px;
  color: #333;
}

.blocklyImportDialogSelect {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

.blocklyImportDialogFileInput {
  padding: 8px;
  font-size: 14px;
}

.blocklyImportDialogTextarea {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
  font-family: monospace;
  min-height: 200px;
  resize: vertical;
}

.blocklyImportDialogPreview {
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  min-height: 100px;
  background-color: #f5f5f5;
  font-size: 14px;
  overflow: auto;
}

.blocklyImportDialogButtons {
  padding: 16px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background-color: #f5f5f5;
}

.blocklyImportDialogButton {
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.3s;
}

.blocklyImportDialogCancelButton {
  background-color: #ddd;
  color: #333;
}

.blocklyImportDialogCancelButton:hover {
  background-color: #ccc;
}

.blocklyImportDialogImportButton {
  background-color: #4CAF50;
  color: white;
}

.blocklyImportDialogImportButton:hover {
  background-color: #45a049;
}

/* Style for the dialog backdrop */
.blocklyImportDialog::backdrop {
  background-color: rgba(0, 0, 0, 0.5);
}
`);
