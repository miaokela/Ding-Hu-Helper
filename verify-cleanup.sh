#!/bin/bash
echo "🔍 协议清理验证脚本"
echo "===================="
echo ""
echo "📋 检查协议注册状态："
PROTOCOLS=$(/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump | grep -E "(bytedance|douyin|toutiao|xigua|aweme|snssdk|multi-browser)")
if [ -n "$PROTOCOLS" ]; then
    echo "❌ 发现协议注册残留："
    echo "$PROTOCOLS"
else
    echo "✅ 未发现相关协议注册"
fi

echo ""
echo "📋 检查应用程序："
APPS=$(find /Applications -name "*盯户*" -o -name "*quarterly*" -o -name "*multi-browser*" 2>/dev/null | grep "\.app$")
if [ -n "$APPS" ]; then
    echo "❌ 发现应用程序残留："
    echo "$APPS"
else
    echo "✅ 未发现相关应用程序"
fi

echo ""
echo "📋 检查Bundle ID："
BUNDLE_IDS=$(/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump | grep "com.dinghu.assistant")
if [ -n "$BUNDLE_IDS" ]; then
    echo "❌ 发现Bundle ID残留："
    echo "$BUNDLE_IDS"
else
    echo "✅ 未发现相关Bundle ID"
fi
echo ""
echo "===================="
