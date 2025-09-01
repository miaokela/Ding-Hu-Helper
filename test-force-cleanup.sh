#!/bin/bash

# 测试强制清理非活跃webview功能的调试脚本

echo "🧪 测试强制清理功能"
echo "===================="

# 首先清理所有electron进程
echo "1️⃣ 清理现有electron进程..."
pkill -f "electron\|Multi-Browser" 2>/dev/null
sleep 2

echo "2️⃣ 启动应用（开发模式）..."
cd /Users/kela/Program/Other/Client/Multi-Browser

# 设置调试环境变量
export DEBUG=true
export NODE_ENV=development

# 启动应用并输出调试信息
yarn dev 2>&1 | tee debug.log &

echo "3️⃣ 应用启动中，请等待..."
sleep 10

echo "4️⃣ 测试建议："
echo "   - 打开多个网页标签"
echo "   - 观察内存监控组件"
echo "   - 点击'强制清理非活跃标签页'按钮"
echo "   - 查看控制台输出的调试信息"
echo ""
echo "🔍 调试日志已保存到 debug.log"
echo "   实时查看日志: tail -f debug.log"
echo ""
echo "📊 查看系统webview进程:"
echo "   ps aux | grep -E 'webview|electron|Multi-Browser'"
echo ""
