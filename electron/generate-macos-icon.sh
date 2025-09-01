#!/bin/bash

echo "🍎 macOS图标自动生成脚本"
echo "=".repeat(40)

# 检查是否有PNG源文件
if [ ! -f "multi-browser-logo.png" ]; then
    echo "❌ 错误: 找不到multi-browser-logo.png文件"
    echo "请先生成PNG文件，然后运行此脚本"
    exit 1
fi

echo "✅ 找到PNG源文件: multi-browser-logo.png"

# 创建临时目录
ICONSET_DIR="DingIcon.iconset"
rm -rf "$ICONSET_DIR"
mkdir "$ICONSET_DIR"

echo "📁 创建图标集目录: $ICONSET_DIR"

# 生成各种尺寸的图标
echo "🔄 生成各种尺寸的图标..."

sips -z 16 16 multi-browser-logo.png --out "$ICONSET_DIR/icon_16x16.png" > /dev/null 2>&1
sips -z 32 32 multi-browser-logo.png --out "$ICONSET_DIR/icon_16x16@2x.png" > /dev/null 2>&1
sips -z 32 32 multi-browser-logo.png --out "$ICONSET_DIR/icon_32x32.png" > /dev/null 2>&1
sips -z 64 64 multi-browser-logo.png --out "$ICONSET_DIR/icon_32x32@2x.png" > /dev/null 2>&1
sips -z 128 128 multi-browser-logo.png --out "$ICONSET_DIR/icon_128x128.png" > /dev/null 2>&1
sips -z 256 256 multi-browser-logo.png --out "$ICONSET_DIR/icon_128x128@2x.png" > /dev/null 2>&1
sips -z 256 256 multi-browser-logo.png --out "$ICONSET_DIR/icon_256x256.png" > /dev/null 2>&1
sips -z 512 512 multi-browser-logo.png --out "$ICONSET_DIR/icon_256x256@2x.png" > /dev/null 2>&1
sips -z 512 512 multi-browser-logo.png --out "$ICONSET_DIR/icon_512x512.png" > /dev/null 2>&1
cp multi-browser-logo.png "$ICONSET_DIR/icon_512x512@2x.png"

# 检查sips命令是否成功
if [ $? -eq 0 ]; then
    echo "✅ 所有尺寸图标生成完成"
else
    echo "⚠️  部分图标可能生成失败，但继续处理"
fi

# 生成icns文件
echo "🔧 生成icns文件..."
iconutil -c icns "$ICONSET_DIR" -o DingIcon.icns

if [ $? -eq 0 ]; then
    echo "✅ ICNS文件生成成功: DingIcon.icns"
    
    # 备份原文件
    if [ -f "multi-browser-logo.icns" ]; then
        cp multi-browser-logo.icns multi-browser-logo-backup.icns
        echo "📋 已备份原ICNS文件: multi-browser-logo-backup.icns"
    fi
    
    # 替换主图标文件
    mv DingIcon.icns multi-browser-logo.icns
    echo "🔄 已更新主ICNS文件: multi-browser-logo.icns"
    
else
    echo "❌ ICNS文件生成失败"
    exit 1
fi

# 清理临时文件
rm -rf "$ICONSET_DIR"
echo "🧹 清理临时文件完成"

echo ""
echo "🎉 macOS图标生成完成！"
echo "📁 生成的文件:"
echo "   - multi-browser-logo.icns (macOS图标)"
echo "   - multi-browser-logo-backup.icns (备份文件)"
echo ""
echo "💡 提示: 重启应用以查看新图标效果"
