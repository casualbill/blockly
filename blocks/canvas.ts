/**
 * @license
 * Copyright 2024 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Former goog.module ID: Blockly.libraryBlocks.canvas

import {
  createBlockDefinitionsFromJsonArray,
  defineBlocks,
} from '../core/common.js';

/**
 * A dictionary of the block definitions provided by this module.
 */
export const blocks = createBlockDefinitionsFromJsonArray([
  // 创建画布
  {
    'type': 'canvas_create',
    'message0': '创建画布 宽度: %1 高度: %2',
    'args0': [
      {
        'type': 'field_number',
        'name': 'WIDTH',
        'value': 400,
        'min': 100,
        'max': 1000,
        'precision': 10
      },
      {
        'type': 'field_number',
        'name': 'HEIGHT',
        'value': 300,
        'min': 100,
        'max': 800,
        'precision': 10
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '创建一个Canvas画布',
    'helpUrl': ''
  },
  // 绘制线条
  {
    'type': 'canvas_draw_line',
    'message0': '绘制线条 从 x: %1 y: %2 到 x: %3 y: %4',
    'args0': [
      {
        'type': 'input_value',
        'name': 'X1',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'Y1',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'X2',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'Y2',
        'check': 'Number'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '绘制一条直线',
    'helpUrl': ''
  },
  // 绘制矩形
  {
    'type': 'canvas_draw_rect',
    'message0': '绘制矩形 x: %1 y: %2 宽: %3 高: %4',
    'args0': [
      {
        'type': 'input_value',
        'name': 'X',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'Y',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'WIDTH',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'HEIGHT',
        'check': 'Number'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '绘制矩形',
    'helpUrl': ''
  },
  // 绘制圆形
  {
    'type': 'canvas_draw_circle',
    'message0': '绘制圆形 圆心 x: %1 y: %2 半径: %3',
    'args0': [
      {
        'type': 'input_value',
        'name': 'X',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'Y',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'RADIUS',
        'check': 'Number'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '绘制圆形',
    'helpUrl': ''
  },
  // 绘制文本
  {
    'type': 'canvas_draw_text',
    'message0': '绘制文本 %1 位置 x: %2 y: %3',
    'args0': [
      {
        'type': 'input_value',
        'name': 'TEXT',
        'check': 'String'
      },
      {
        'type': 'input_value',
        'name': 'X',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'Y',
        'check': 'Number'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '绘制文本',
    'helpUrl': ''
  },
  // 设置填充颜色
  {
    'type': 'canvas_set_fill_color',
    'message0': '设置填充颜色 %1',
    'args0': [
      {
        'type': 'field_input',
        'name': 'COLOR',
        'text': '#FF0000'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '设置填充颜色',
    'helpUrl': ''
  },
  // 设置描边颜色
  {
    'type': 'canvas_set_stroke_color',
    'message0': '设置描边颜色 %1',
    'args0': [
      {
        'type': 'field_input',
        'name': 'COLOR',
        'text': '#000000'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '设置描边颜色',
    'helpUrl': ''
  },
  // 设置线条宽度
  {
    'type': 'canvas_set_line_width',
    'message0': '设置线条宽度 %1',
    'args0': [
      {
        'type': 'field_number',
        'name': 'WIDTH',
        'value': 1,
        'min': 0.5,
        'max': 20,
        'precision': 0.5
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '设置线条宽度',
    'helpUrl': ''
  },
  // 设置线条样式
  {
    'type': 'canvas_set_line_style',
    'message0': '设置线条样式 %1',
    'args0': [
      {
        'type': 'field_dropdown',
        'name': 'STYLE',
        'options': [
          ['实线', 'SOLID'],
          ['虚线', 'DASHED']
        ]
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '设置线条样式',
    'helpUrl': ''
  },
  // 设置字体大小
  {
    'type': 'canvas_set_font_size',
    'message0': '设置字体大小 %1',
    'args0': [
      {
        'type': 'field_number',
        'name': 'SIZE',
        'value': 12,
        'min': 6,
        'max': 72,
        'precision': 1
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '设置字体大小',
    'helpUrl': ''
  },
  // 设置画笔位置
  {
    'type': 'canvas_move_to',
    'message0': '移动画笔到 x: %1 y: %2',
    'args0': [
      {
        'type': 'input_value',
        'name': 'X',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'Y',
        'check': 'Number'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '设置画笔位置',
    'helpUrl': ''
  },
  // 移动画笔
  {
    'type': 'canvas_line_to',
    'message0': '画笔移动 x: %1 y: %2',
    'args0': [
      {
        'type': 'input_value',
        'name': 'X',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'Y',
        'check': 'Number'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '移动画笔并绘制直线',
    'helpUrl': ''
  },
  // 旋转角度
  {
    'type': 'canvas_rotate',
    'message0': '旋转角度 %1 度',
    'args0': [
      {
        'type': 'input_value',
        'name': 'ANGLE',
        'check': 'Number'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '旋转坐标系统',
    'helpUrl': ''
  },
  // 清除画布
  {
    'type': 'canvas_clear',
    'message0': '清除画布',
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '清除整个画布',
    'helpUrl': ''
  },
  // 保存状态
  {
    'type': 'canvas_save',
    'message0': '保存绘制状态',
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '保存当前绘制状态',
    'helpUrl': ''
  },
  // 恢复状态
  {
    'type': 'canvas_restore',
    'message0': '恢复绘制状态',
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '恢复之前保存的绘制状态',
    'helpUrl': ''
  },
  // 加载图片
  {
    'type': 'canvas_load_image',
    'message0': '加载图片 %1',
    'args0': [
      {
        'type': 'input_value',
        'name': 'URL',
        'check': 'String'
      }
    ],
    'output': 'Image',
    'style': 'canvas_blocks',
    'tooltip': '加载图片',
    'helpUrl': ''
  },
  // 绘制图片
  {
    'type': 'canvas_draw_image',
    'message0': '绘制图片 %1 位置 x: %2 y: %3',
    'args0': [
      {
        'type': 'input_value',
        'name': 'IMAGE',
        'check': 'Image'
      },
      {
        'type': 'input_value',
        'name': 'X',
        'check': 'Number'
      },
      {
        'type': 'input_value',
        'name': 'Y',
        'check': 'Number'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '绘制图片',
    'helpUrl': ''
  },
  // 动画帧率
  {
    'type': 'canvas_animation',
    'message0': '动画 帧率: %1 %2',
    'args0': [
      {
        'type': 'field_number',
        'name': 'FPS',
        'value': 30,
        'min': 1,
        'max': 60,
        'precision': 1
      },
      {
        'type': 'input_statement',
        'name': 'CODE'
      }
    ],
    'previousStatement': null,
    'nextStatement': null,
    'style': 'canvas_blocks',
    'tooltip': '创建动画循环',
    'helpUrl': ''
  }
]);

defineBlocks(blocks);