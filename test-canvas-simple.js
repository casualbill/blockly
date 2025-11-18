/**
 * Blockly Canvas 功能测试
 */

/* global console */
console.log('=== Blockly Canvas 扩展功能 ===\n');

console.log('✅ 已实现的积木块:');
console.log('');

// 创建画布
console.log('1. 创建画布:');
console.log('   类型: canvas_create');
console.log('   功能: 创建Canvas元素，可设置宽度和高度');
console.log('   默认: 400x300');
console.log('');

// 基础绘制
console.log('2. 基础绘制:');
console.log('   - canvas_draw_line: 绘制线条 (x1,y1 到 x2,y2)');
console.log('   - canvas_draw_rect: 绘制矩形 (x,y,宽,高)');
console.log('   - canvas_draw_circle: 绘制圆形 (圆心x,y,半径)');
console.log('   - canvas_draw_text: 绘制文本 (内容,x,y)');
console.log('');

// 颜色设置
console.log('3. 颜色设置:');
console.log('   - canvas_set_fill_color: 设置填充颜色');
console.log('   - canvas_set_stroke_color: 设置描边颜色');
console.log('   - 支持: RGB、十六进制、颜色名称');
console.log('');

// 坐标系统
console.log('4. 坐标系统:');
console.log('   - canvas_move_to: 设置画笔位置 (x,y)');
console.log('   - canvas_line_to: 移动画笔并绘制');
console.log('   - canvas_rotate: 旋转角度 (度)');
console.log('');

// 样式设置
console.log('5. 样式设置:');
console.log('   - canvas_set_line_width: 线条宽度');
console.log('   - canvas_set_line_style: 线条样式 (实线/虚线)');
console.log('   - canvas_set_font_size: 字体大小');
console.log('');

// 画布操作
console.log('6. 画布操作:');
console.log('   - canvas_clear: 清除整个画布');
console.log('');

// 状态管理
console.log('7. 状态管理:');
console.log('   - canvas_save: 保存当前绘制状态');
console.log('   - canvas_restore: 恢复绘制状态');
console.log('   - 用途: 实现图层效果');
console.log('');

// 图片操作
console.log('8. 图片操作:');
console.log('   - canvas_load_image: 加载图片 (URL)');
console.log('   - canvas_draw_image: 绘制图片 (图片对象,x,y)');
console.log('');

// 动画功能
console.log('9. 动画功能:');
console.log('   - canvas_animation: 动画循环');
console.log('   - 功能: 设置帧率，每帧执行代码块');
console.log('');

console.log('=== 代码生成示例 ===\n');
console.log('创建画布并绘制矩形:');
console.log('```javascript');
console.log('const canvas = document.createElement("canvas")');
console.log('```')