/**
 * Node.js 测试脚本，用于测试 Canvas 积木块代码生成
 */

const fs = require('fs');
const path = require('path');

// 创建一个简单的测试
const testCode = `
// 模拟浏览器环境
const document = {
  createElement: () => ({
    getContext: () => ({
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      strokeRect: () => {},
      arc: () => {},
      strokeText: () => {},
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 0,
      setLineDash: () => {},
      font: '',
      clearRect: () => {},
      save: () => {},
      restore: () => {},
      rotate: () => {},
      drawImage: () => {}
    }),
    width: 400,
    height: 300,
    style: {}
  }),
  getElementById: () => ({ innerHTML: '', appendChild: () => {} })
};

const window = {
  Image: function() {
    return {
      src: '',
      onload: null
    };
  },
  requestAnimationFrame: () => {}
};

// 模拟数学对象
// 保持全局 Math 对象可用 (Node.js 中已存在)

// 测试生成的代码
const generatedCode = `
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');
canvas.width = 400;
canvas.height = 300;
canvas.style.border = '1px solid #ccc';
const container = document.getElementById('canvas-container') || document.body;
container.innerHTML = '';
container.appendChild(canvas);

ctx.strokeStyle = '#FF0000';
ctx.lineWidth = 2;
ctx.strokeRect(50, 50, 100, 100);
`;

console.log('测试生成的Canvas代码:');
console.log(generatedCode);
console.log('\n代码执行完成!');
`;

fs.writeFileSync('test-canvas-output.js', testCode);
console.log('测试脚本已生成: test-canvas-output.js');
console.log('运行: node test-canvas-output.js');