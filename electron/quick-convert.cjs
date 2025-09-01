const fs = require('fs');
const path = require('path');

console.log('🎨 开始转换 ding-logo-modern.svg...');

// 检查源文件
if (!fs.existsSync('ding-logo-modern.svg')) {
    console.error('❌ 找不到源文件: ding-logo-modern.svg');
    process.exit(1);
}

// 复制SVG文件为最终版本
try {
    fs.copyFileSync('ding-logo-modern.svg', 'multi-browser-logo.svg');
    console.log('✅ 已创建: multi-browser-logo.svg');
} catch (err) {
    console.error('❌ 复制SVG失败:', err.message);
}

console.log('');
console.log('📋 PNG转换选项:');
console.log('');
console.log('方法1: 使用刚创建的转换器');
console.log('  - 已打开 convert-modern-to-png.html');
console.log('  - 选择 ding-logo-modern.svg 文件');
console.log('  - 下载得到 multi-browser-logo.png');
console.log('');
console.log('方法2: 使用在线工具');
console.log('  - https://convertio.co/svg-png/');
console.log('  - https://cloudconvert.com/svg-to-png');
console.log('');
console.log('方法3: 使用系统工具');
console.log('  - 用浏览器打开SVG，右键保存为PNG');
console.log('  - 或用画图软件打开SVG，另存为PNG');
console.log('');

// 创建ICNS转换脚本
const icnsScript = `# macOS ICNS生成脚本
if [ -f "multi-browser-logo.png" ]; then
    echo "🍎 开始生成ICNS文件..."
    sips -s format icns multi-browser-logo.png --out multi-browser-logo.icns
    echo "✅ ICNS文件生成完成!"
else
    echo "❌ 找不到PNG文件，请先完成PNG转换"
fi`;

fs.writeFileSync('generate-icns.sh', icnsScript);
console.log('✅ 已创建ICNS转换脚本: generate-icns.sh');

console.log('');
console.log('🧹 准备清理旧图标文件...');

const filesToDelete = [
    'multi-browser-logo-edge.svg',
    'multi-browser-logo-final.svg', 
    'multi-browser-logo-improved.svg',
    'multi-browser-logo-new.svg',
    'multi-browser-logo-aligned.svg',
    'multi-browser-logo-backup.svg',
    'ding-logo.svg',
    'ding-logo-centered.svg',
    'ding-logo-classic.svg'
];

console.log('将要删除的文件:');
filesToDelete.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`  - ${file}`);
    }
});

// 删除旧文件
let deletedCount = 0;
filesToDelete.forEach(file => {
    if (fs.existsSync(file)) {
        try {
            fs.unlinkSync(file);
            console.log(`✅ 已删除: ${file}`);
            deletedCount++;
        } catch (err) {
            console.error(`❌ 删除失败 ${file}:`, err.message);
        }
    }
});

console.log('');
console.log(`🎉 清理完成！删除了 ${deletedCount} 个旧文件`);
console.log('');
console.log('📊 当前状态:');
console.log(fs.existsSync('multi-browser-logo.svg') ? '✅ multi-browser-logo.svg' : '❌ multi-browser-logo.svg');
console.log(fs.existsSync('multi-browser-logo.png') ? '✅ multi-browser-logo.png' : '🔄 multi-browser-logo.png (需要转换)');
console.log(fs.existsSync('multi-browser-logo.icns') ? '✅ multi-browser-logo.icns' : '🔄 multi-browser-logo.icns (需要转换)');
console.log('');
console.log('🚀 下一步: 完成PNG转换后，重启应用查看新图标！');
