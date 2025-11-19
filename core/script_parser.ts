/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * 脚本解析器模块，用于解析不同语言的代码并生成抽象语法树(AST)
 */
export const javascript = {
  /**
   * 解析JavaScript代码并生成抽象语法树
   *
   * @param code JavaScript代码字符串
   * @returns 抽象语法树
   */
  parse(code: string): any[] {
    // 简单的JavaScript解析实现，仅处理变量声明
    const ast: any[] = [];
    const lines = code.split('\n');

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//')) {
        continue;
      }

      // 匹配变量声明: var x = 10;
      const varRegex =
        /(var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([0-9]+);/;
      const match = trimmedLine.match(varRegex);

      if (match) {
        const [, declarationType, variableName, value] = match;
        ast.push({
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {name: variableName},
              init: {type: 'Literal', value: parseInt(value)},
            },
          ],
          kind: declarationType,
        });
      }
    }

    return ast;
  },
};

export const python = {
  /**
   * 解析Python代码并生成抽象语法树
   *
   * @param code Python代码字符串
   * @returns 抽象语法树
   */
  parse(code: string): any[] {
    // 简单的Python解析实现，仅处理变量声明
    const ast: any[] = [];
    const lines = code.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('#')) {
        continue;
      }
      // 匹配变量声明: x = 10
      const varRegex = /([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([0-9]+)/;
      const match = trimmedLine.match(varRegex);
      if (match) {
        const [, variableName, value] = match;
        ast.push({
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {name: variableName},
              init: {type: 'Literal', value: parseInt(value)},
            },
          ],
          kind: 'assignment',
        });
      }
    }
    return ast;
  },
};

export const lua = {
  /**
   * 解析Lua代码并生成抽象语法树
   *
   * @param code Lua代码字符串
   * @returns 抽象语法树
   */
  parse(code: string): any[] {
    // 简单的Lua解析实现，仅处理变量声明
    const ast: any[] = [];
    const lines = code.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        continue;
      }
      // 匹配变量声明: local x = 10
      const varRegex = /(local)?\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([0-9]+);?/;
      const match = trimmedLine.match(varRegex);
      if (match) {
        const [, declarationType, variableName, value] = match;
        ast.push({
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {name: variableName},
              init: {type: 'Literal', value: parseInt(value)},
            },
          ],
          kind: declarationType ? 'local' : 'global',
        });
      }
    }
    return ast;
  },
};

export const php = {
  /**
   * 解析PHP代码并生成抽象语法树
   *
   * @param code PHP代码字符串
   * @returns 抽象语法树
   */
  parse(code: string): any[] {
    // 简单的PHP解析实现，仅处理变量声明
    const ast: any[] = [];
    const lines = code.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//')) {
        continue;
      }
      // 匹配变量声明: $x = 10;
      const varRegex = /\$([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([0-9]+);/;
      const match = trimmedLine.match(varRegex);
      if (match) {
        const [, variableName, value] = match;
        ast.push({
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {name: variableName},
              init: {type: 'Literal', value: parseInt(value)},
            },
          ],
          kind: 'assignment',
        });
      }
    }
    return ast;
  },
};

export const dart = {
  /**
   * 解析Dart代码并生成抽象语法树
   *
   * @param code Dart代码字符串
   * @returns 抽象语法树
   */
  parse(code: string): any[] {
    // 简单的Dart解析实现，仅处理变量声明
    const ast: any[] = [];
    const lines = code.split('\n');
    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || trimmedLine.startsWith('//')) {
        continue;
      }
      // 匹配变量声明: var/final/const/int/double/String/bool x = value;
      const varRegex =
        /(var|final|const|int|double|String|bool)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*([^;]+);/;
      const match = trimmedLine.match(varRegex);
      if (match) {
        const [, declarationType, variableName, valueStr] = match;
        let value;
        let typeAnnotation;

        // Check if it's a typed declaration (int/double/String/bool)
        const typedDeclarations = ['int', 'double', 'String', 'bool'];
        if (typedDeclarations.includes(declarationType)) {
          // Typed declaration
          typeAnnotation = {type: 'TypeAnnotation', name: declarationType};

          // Parse value based on type
          if (declarationType === 'int') {
            value = parseInt(valueStr);
          } else if (declarationType === 'double') {
            value = parseFloat(valueStr);
          } else {
            // String or bool: remove quotes
            value = valueStr.replace(/'/g, '').replace(/"/g, '');
          }
        } else {
          // Untyped declaration (var/final/const)
          // Try to parse as number first
          if (/^[0-9]+$/.test(valueStr)) {
            value = parseInt(valueStr);
          } else if (/^[0-9]+\.[0-9]+$/.test(valueStr)) {
            value = parseFloat(valueStr);
          } else {
            // Treat as string (remove quotes if any)
            value = valueStr.replace(/'/g, '').replace(/"/g, '');
          }
        }

        // Create AST node
        ast.push({
          type: 'VariableDeclaration',
          declarations: [
            {
              type: 'VariableDeclarator',
              id: {
                name: variableName,
                ...(typeAnnotation && {typeAnnotation}), // Add type annotation if exists
              },
              init: {
                type: 'Literal',
                value,
              },
            },
          ],
          kind: declarationType,
        });
      }
    }
    return ast;
  },
};
