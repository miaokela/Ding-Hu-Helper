#!/bin/bash

echo "🧪 开始测试协议拦截功能..."

# 启动开发版本
echo "📱 启动修复后的开发版本进行测试..."

# 切换到项目目录
cd "/Users/kela/Program/Other/Client/Multi-Browser"

# 启动开发版本
npm run dev

echo "✅ 开发版本启动完成"
echo ""
echo "🔍 请测试以下场景："
echo "1. 访问包含 bytedance:// 协议链接的网页"
echo "2. 访问 security.zijieapi.com 相关页面"
echo "3. 点击可能触发协议跳转的链接"
echo "4. 观察控制台输出，确认拦截日志"
echo ""
echo "⚠️ 如果出现协议弹窗或应用重复启动，说明拦截失败"
echo "✅ 如果没有弹窗且控制台显示拦截日志，说明修复成功"
