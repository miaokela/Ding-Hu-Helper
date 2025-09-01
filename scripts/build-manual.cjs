const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 开始手动构建（完全跳过 winCodeSign）...');

// 运行实际的构建命令
try {
    const buildType = process.argv[2] || 'trial';
    console.log(`📦 构建类型: ${buildType}`);
    
    // 执行准备脚本
    execSync(`node scripts/prepare-build.cjs ${buildType}`, { stdio: 'inherit' });
    
    // 构建 renderer
    execSync('cross-env NODE_ENV=production yarn build:renderer', { stdio: 'inherit' });
    
    // 构建 electron
    execSync('yarn build:electron', { stdio: 'inherit' });
    
    console.log('🔧 开始手动打包...');
    
    // 获取输出目录
    let outputDir = 'dist_trial';
    if (buildType === 'quarterly') outputDir = 'dist_quarterly';
    if (buildType === 'test') outputDir = 'dist_test';
    
    const appDir = path.join(outputDir, 'win-unpacked');
    
    // 清理旧的构建
    if (fs.existsSync(appDir)) {
        execSync(`rmdir /s /q "${appDir}"`, { stdio: 'inherit' });
    }
    
    // 创建目录
    fs.mkdirSync(appDir, { recursive: true });
    
    // 复制 Electron 核心文件
    console.log('📦 复制 Electron 核心文件...');
    execSync(`xcopy "node_modules\\electron\\dist\\*" "${appDir}\\" /E /Y /Q`, { stdio: 'inherit' });
    
    // 创建 resources 目录
    const resourcesDir = path.join(appDir, 'resources');
    fs.mkdirSync(resourcesDir, { recursive: true });
    
    // 复制应用文件
    console.log('📂 复制应用程序文件...');
    const appResourcesDir = path.join(resourcesDir, 'app');
    fs.mkdirSync(appResourcesDir, { recursive: true });
    execSync(`xcopy "dist\\*" "${appResourcesDir}\\" /E /Y /Q`, { stdio: 'inherit' });
    
    // 复制额外文件
    execSync(`copy "domains.db" "${resourcesDir}\\"`, { stdio: 'inherit' });
    execSync(`copy "electron\\multi-browser-logo.png" "${resourcesDir}\\"`, { stdio: 'inherit' });
    
    // 创建 package.json for asar
    const appPackageJson = {
        name: buildType === 'trial' ? 'Multi-Browser 试用版' : 
              buildType === 'quarterly' ? 'Multi-Browser 季度版' : 'Multi-Browser 测试版',
        main: 'dist/electron/main.js'
    };
    fs.writeFileSync(path.join(appResourcesDir, 'package.json'), JSON.stringify(appPackageJson, null, 2));
    
    // 重命名执行文件
    const exeName = buildType === 'trial' ? 'Multi-Browser 试用版.exe' : 
                   buildType === 'quarterly' ? 'Multi-Browser 季度版.exe' : 'Multi-Browser 测试版.exe';
    
    if (fs.existsSync(path.join(appDir, 'electron.exe'))) {
        fs.renameSync(path.join(appDir, 'electron.exe'), path.join(appDir, exeName));
    }
    
    // 执行清理脚本
    execSync('node scripts/cleanup-build.cjs', { stdio: 'inherit' });
    
    console.log('🎉 手动构建完成！');
    console.log(`📁 应用程序位置: ${path.join(appDir, exeName)}`);
    
    // 启动测试
    console.log('🚀 启动应用测试...');
    execSync(`cd "${appDir}" && start "" "${exeName}"`, { stdio: 'inherit' });
    
} catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
}
