const fs = require('fs');
const path = require('path');

console.log('🔧 测试版本配置修复...');

// 1. 测试 prepare-build.cjs 脚本
console.log('\n1. 测试准备构建脚本...');
try {
  const { execSync } = require('child_process');
  const result = execSync('node scripts/prepare-build.cjs trial', { 
    cwd: path.resolve(__dirname),
    encoding: 'utf8'
  });
  console.log('✅ prepare-build.cjs 执行成功');
  console.log(result);
} catch (error) {
  console.error('❌ prepare-build.cjs 执行失败:', error.message);
}

// 2. 检查 vite.config.ts 是否被正确更新
console.log('\n2. 检查 vite.config.ts 更新...');
try {
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  console.log('当前 vite.config.ts 中的 define 配置:');
  const defineMatch = viteConfig.match(/define:\s*\{([^}]+)\}/);
  if (defineMatch) {
    console.log(defineMatch[0]);
  } else {
    console.log('❌ 未找到 define 配置');
  }
} catch (error) {
  console.error('❌ 读取 vite.config.ts 失败:', error.message);
}

// 3. 恢复原始配置
console.log('\n3. 恢复开发配置...');
try {
  const { execSync } = require('child_process');
  execSync('node scripts/cleanup-build.cjs', { 
    cwd: path.resolve(__dirname),
    encoding: 'utf8'
  });
  console.log('✅ 已恢复开发配置');
} catch (error) {
  console.warn('⚠️ 恢复配置失败，可能需要手动恢复:', error.message);
}

console.log('\n🎉 测试完成！');
