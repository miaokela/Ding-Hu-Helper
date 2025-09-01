const { execSync } = require('child_process');
const path = require('path');

console.log('永久版本测试开始...');
console.log('当前目录:', process.cwd());

try {
  // 测试运行 prepare-build.cjs
  console.log('\n运行永久版本构建准备...');
  const result = execSync('node scripts/prepare-build.cjs permanent', { 
    encoding: 'utf8',
    cwd: 'C:\\Project\\NewProject\\Multi-Browser'
  });
  console.log('输出:', result);
} catch (error) {
  console.error('错误:', error.message);
  console.error('标准输出:', error.stdout);
  console.error('标准错误:', error.stderr);
}

console.log('\n测试完成。');
