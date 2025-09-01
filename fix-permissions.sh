#!/bin/bash

# Multi-Browser 权限问题修复脚本
# 解决应用需要sudo权限运行的问题

echo "🔧 Multi-Browser 权限修复工具"
echo "=============================="

# 1. 修复系统认证模块，移除sudo依赖
echo "1️⃣ 修复系统认证模块..."

# 检查当前用户权限
CURRENT_USER=$(whoami)
USER_GROUPS=$(groups)

echo "当前用户: $CURRENT_USER"
echo "用户组: $USER_GROUPS"

# 2. 清理应用锁文件
echo "2️⃣ 清理应用锁文件..."
rm -f /tmp/multi-browser-universal.lock
echo "✅ 锁文件已清理"

# 3. 修复应用数据目录权限
echo "3️⃣ 修复应用数据目录权限..."
APP_DATA_DIR="$HOME/Library/Application Support/Multi-Browser 试用版"
if [ -d "$APP_DATA_DIR" ]; then
    chmod -R 755 "$APP_DATA_DIR"
    chown -R $CURRENT_USER:staff "$APP_DATA_DIR"
    echo "✅ 应用数据目录权限已修复"
else
    echo "ℹ️ 应用数据目录不存在，将在首次运行时创建"
fi

# 4. 修复项目文件权限
echo "4️⃣ 修复项目文件权限..."
PROJECT_DIR=$(pwd)
chmod -R 755 "$PROJECT_DIR"
find "$PROJECT_DIR" -name "*.sh" -exec chmod +x {} \;
echo "✅ 项目文件权限已修复"

# 5. 检查并修复可能的权限问题
echo "5️⃣ 检查系统权限..."

# 检查是否需要特殊权限
if [[ "$USER_GROUPS" == *"admin"* ]]; then
    echo "✅ 用户具有管理员权限"
else
    echo "⚠️ 用户没有管理员权限，某些功能可能受限"
fi

# 6. 检查node_modules权限
echo "6️⃣ 检查依赖包权限..."
if [ -d "node_modules" ]; then
    chmod -R 755 node_modules
    echo "✅ node_modules权限已修复"
fi

# 7. 检查electron权限
echo "7️⃣ 检查Electron权限..."
if [ -d "node_modules/electron/dist" ]; then
    chmod -R 755 node_modules/electron/dist
    echo "✅ Electron权限已修复"
fi

echo ""
echo "🎉 权限修复完成！"
echo ""
echo "📋 修复后的使用建议："
echo "   1. 重新启动终端"
echo "   2. 使用普通用户权限运行: yarn dev"
echo "   3. 如果仍有问题，请检查具体错误信息"
echo ""
