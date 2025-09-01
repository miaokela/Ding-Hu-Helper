const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 开始无 winCodeSign 构建...');

// 设置环境变量来完全禁用 winCodeSign 下载
process.env.ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/';
process.env.ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES = 'true';
process.env.CSC_IDENTITY_AUTO_DISCOVERY = 'false';
process.env.SKIP_NOTARIZATION = 'true';
process.env.ELECTRON_BUILDER_CACHE = path.join(require('os').tmpdir(), 'electron-builder-cache-custom');
// 删除 WIN_CSC_LINK 来避免错误
delete process.env.WIN_CSC_LINK;

// 创建一个假的 winCodeSign 缓存来阻止下载
const cacheDir = path.join(require('os').tmpdir(), 'electron-builder-cache-custom', 'winCodeSign', '2.6.0');
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
    
    // 创建假的必要文件来欺骗 electron-builder
    const fakeFiles = [
        'windows-10/x64/signtool.exe',
        'rcedit-x64.exe'
    ];
    
    fakeFiles.forEach(file => {
        const filePath = path.join(cacheDir, file);
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, ''); // 创建空文件
    });
    
    console.log('✅ 创建了假的 winCodeSign 缓存');
}

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
    
    // 使用修改过的环境变量运行 electron-builder
    console.log('🔧 开始 electron-builder 打包...');
    execSync('electron-builder', { 
        stdio: 'inherit',
        env: { ...process.env }
    });
    
    // 执行清理脚本
    execSync('node scripts/cleanup-build.cjs', { stdio: 'inherit' });
    
    console.log('🎉 构建完成！');
    
} catch (error) {
    console.error('❌ 构建失败:', error.message);
    process.exit(1);
}
