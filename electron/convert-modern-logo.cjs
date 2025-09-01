const fs = require('fs');
const path = require('path');

// 创建HTML转换器
const htmlConverter = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>SVG转PNG转换器</title>
</head>
<body>
    <canvas id="canvas" style="display: none;"></canvas>
    <script>
        function convertSvg() {
            const canvas = document.getElementById('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            // 读取SVG文件内容
            fetch('./ding-logo-modern.svg')
                .then(response => response.text())
                .then(svgText => {
                    const blob = new Blob([svgText], {type: 'image/svg+xml'});
                    const url = URL.createObjectURL(blob);
                    
                    img.onload = function() {
                        // 设置高分辨率 512x512
                        canvas.width = 512;
                        canvas.height = 512;
                        
                        // 绘制SVG
                        ctx.drawImage(img, 0, 0, 512, 512);
                        
                        // 转换为PNG并下载
                        canvas.toBlob(function(blob) {
                            const a = document.createElement('a');
                            a.href = URL.createObjectURL(blob);
                            a.download = 'multi-browser-logo.png';
                            a.click();
                            
                            console.log('PNG转换完成！');
                            
                            // 显示完成信息
                            document.body.innerHTML = '<h1 style="color: green; text-align: center; font-family: Arial;">✅ PNG转换完成！</h1><p style="text-align: center;">文件已下载为: multi-browser-logo.png</p>';
                        }, 'image/png');
                        
                        URL.revokeObjectURL(url);
                    };
                    
                    img.src = url;
                })
                .catch(err => {
                    console.error('转换失败:', err);
                    document.body.innerHTML = '<h1 style="color: red; text-align: center;">❌ 转换失败</h1>';
                });
        }
        
        // 页面加载后自动开始转换
        window.onload = convertSvg;
    </script>
</body>
</html>`;

// 写入HTML转换器
fs.writeFileSync('convert-modern-to-png.html', htmlConverter);

console.log('✅ 已创建PNG转换器: convert-modern-to-png.html');
console.log('');
console.log('📋 转换步骤:');
console.log('1. 双击打开 convert-modern-to-png.html');
console.log('2. 自动下载 multi-browser-logo.png 文件');
console.log('3. 将下载的PNG文件移动到electron目录');
console.log('4. 运行ICNS转换脚本');
console.log('');
