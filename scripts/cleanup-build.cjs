const fs = require('fs');
const path = require('path');

console.log('正在清理构建配置...');

// 恢复 package.json
const packageJsonPath = path.join(__dirname, '../package.json');
const backupPath = path.join(__dirname, '../package.json.backup');

if (fs.existsSync(backupPath)) {
  const backupContent = fs.readFileSync(backupPath, 'utf8');
  fs.writeFileSync(packageJsonPath, backupContent);
  console.log('已恢复 package.json');
} else {
  console.warn('未找到 package.json 备份文件');
}

// 清理 vite.config.ts 中的版本配置
const viteConfigPath = path.join(__dirname, '../vite.config.ts');
let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

// 恢复为默认的 define 配置（用于开发环境）
const defaultDefineConfig = `  define: {
    '__BUILD_TIME__': '"${Date.now()}"',
    '__VERSION_TYPE__': '"permanent"'
  },`;

// 移除构建时的 define 配置，替换为默认配置
if (viteConfig.includes('define:')) {
  viteConfig = viteConfig.replace(
    /\s+define:\s*\{[^}]*\},/,
    `\n  ${defaultDefineConfig}\n`
  );
} else {
  // 如果没有 define 配置，添加默认配置
  viteConfig = viteConfig.replace(
    /(\s+)plugins:/,
    `$1${defaultDefineConfig}\n$1plugins:`
  );
}

fs.writeFileSync(viteConfigPath, viteConfig);
console.log('已恢复 vite.config.ts 为默认开发配置');

console.log('构建配置清理完成。');
