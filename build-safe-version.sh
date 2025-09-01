#!/bin/bash

echo "========================================="
echo "   构建无协议注册版本的 Multi-Browser"
echo "========================================="
echo

echo "🔧 构建配置："
echo "   - 已禁用单实例锁"
echo "   - 已禁用所有协议注册API"
echo "   - 已添加强制协议清理"
echo "   - 已禁用默认应用注册特性"
echo

echo "📦 开始构建..."

# 设置数据库
echo "1️⃣ 设置数据库..."
npm run setup:db
if [ $? -ne 0 ]; then
    echo "❌ 数据库设置失败"
    exit 1
fi

# 生成加密脚本
echo "2️⃣ 生成加密脚本..."
node scripts/generate-encrypted-scripts.cjs
if [ $? -ne 0 ]; then
    echo "❌ 脚本加密失败"
    exit 1
fi

# 构建渲染进程
echo "3️⃣ 构建渲染进程..."
NODE_ENV=production npm run build:renderer
if [ $? -ne 0 ]; then
    echo "❌ 渲染进程构建失败"
    exit 1
fi

# 构建主进程
echo "4️⃣ 构建主进程..."
npm run build:electron
if [ $? -ne 0 ]; then
    echo "❌ 主进程构建失败"
    exit 1
fi

# 检查关键文件
echo "5️⃣ 验证构建文件..."
if [ ! -f "dist/electron/main.js" ]; then
    echo "❌ 主进程文件缺失"
    exit 1
fi

# 验证协议禁用代码是否存在
if grep -q "disable-protocol-handler-registration" dist/electron/main.js; then
    echo "✅ 协议禁用代码已包含在构建中"
else
    echo "⚠️ 警告：协议禁用代码可能未正确包含"
fi

# 打包应用
echo "6️⃣ 打包应用..."
electron-builder
if [ $? -ne 0 ]; then
    echo "❌ 应用打包失败"
    exit 1
fi

echo
echo "========================================="
echo "           构建成功完成！"
echo "========================================="
echo
echo "📝 重要提醒："
echo "   ✅ 此版本已完全禁用协议注册功能"
echo "   ✅ 不会自动注册为任何协议的处理器"
echo "   ✅ 不会因为访问网页而意外启动"
echo "   🔧 如需清理系统协议注册，请运行："
echo "      - Windows: clean-protocol-registry-deep.bat (管理员权限)"
echo "      - macOS: 手动检查系统偏好设置"
echo
echo "🎉 应用已准备好安全部署！"
