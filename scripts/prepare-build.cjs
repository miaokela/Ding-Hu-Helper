const fs = require('fs');
const path = require('path');

// 版本类型
const VERSION_TYPES = {
  TRIAL: 'trial',
  QUARTERLY: 'quarterly',
  TEST: 'test',
  PERMANENT: 'permanent'
};

// 获取版本类型参数
const versionType = process.argv[2] || VERSION_TYPES.TRIAL;

console.log(`正在为 ${versionType} 版本准备构建配置...`);

// 更新 version.ts 文件
function updateVersionFile() {
  const versionFilePath = path.join(__dirname, '..', 'src', 'utils', 'version.ts');
  let content = fs.readFileSync(versionFilePath, 'utf8');
  
  // 简单替换版本字符串 - 支持已经替换过的情况
  content = content.replace(
    /export const VERSION_TYPE = '[^']*';/,
    `export const VERSION_TYPE = '${versionType}';`
  );
  
  fs.writeFileSync(versionFilePath, content);
  console.log(`✅ 已更新 version.ts: VERSION_TYPE = '${versionType}'`);
}

// 版本名称映射
const versionNames = {
  [VERSION_TYPES.TRIAL]: '试用版',
  [VERSION_TYPES.QUARTERLY]: '季度版',
  [VERSION_TYPES.TEST]: '功能测试版',
  [VERSION_TYPES.PERMANENT]: '永久版本'
};

// 更新 package.json 名称
function updatePackageJson() {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  packageJson.name = `multi-brower_${versionType}`;
  
  // 添加 productName 配置
  if (!packageJson.build) {
    packageJson.build = {};
  }
  
  packageJson.build.productName = `盯户助手-${versionNames[versionType]}`;
  packageJson.build.appId = `com.dinghu.assistant.${versionType}`;
  
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.log(`✅ 已更新 package.json: name = multi-brower_${versionType}`);
  console.log(`✅ 已更新 package.json: productName = 盯户助手-${versionNames[versionType]}`);
}

// 更新 vite.config.ts 中的全局常量
function updateViteConfig() {
  const viteConfigPath = path.join(__dirname, '..', 'vite.config.ts');
  let content = fs.readFileSync(viteConfigPath, 'utf8');
  
  const buildTime = Date.now();
  
  // 替换 BUILD_TIME
  content = content.replace(
    /__BUILD_TIME__': '".*?"/,
    `__BUILD_TIME__': '"${buildTime}"`
  );
  
  // 替换 VERSION_TYPE
  content = content.replace(
    /__VERSION_TYPE__': '".*?"/,
    `__VERSION_TYPE__': '"${versionType}"`
  );
  
  fs.writeFileSync(viteConfigPath, content);
  console.log(`✅ 已更新 vite.config.ts: BUILD_TIME = ${buildTime}, VERSION_TYPE = ${versionType}`);
}

// 执行更新
updateVersionFile();
updatePackageJson();
updateViteConfig();

console.log(`✅ ${versionNames[versionType]} 构建准备完成！`);
