#!/bin/bash

echo "🔥🔥🔥 完整协议注册清理脚本 🔥🔥🔥"
echo "========================================="
echo "此脚本将彻底清除所有相关的协议注册信息"
echo "========================================="

# 要清理的协议列表
PROTOCOLS=("bytedance" "toutiao" "douyin" "xigua" "aweme" "snssdk" "multi-browser")

# 应用程序名称列表
APP_NAMES=("盯户助手-季度版" "多浏览器助手" "Multi-Browser" "multi-browser")

echo ""
echo "📋 第一步：检查当前协议注册状态"
echo "----------------------------------------"
CURRENT_PROTOCOLS=$(/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump | grep -E "(bytedance|douyin|toutiao|xigua|aweme|snssdk|multi-browser)")
if [ -n "$CURRENT_PROTOCOLS" ]; then
    echo "🔍 发现以下协议注册："
    echo "$CURRENT_PROTOCOLS"
else
    echo "✅ 未发现相关协议注册"
fi

echo ""
echo "🗑️ 第二步：查找并删除应用程序"
echo "----------------------------------------"
for app_name in "${APP_NAMES[@]}"; do
    APP_PATH="/Applications/${app_name}.app"
    if [ -d "$APP_PATH" ]; then
        echo "🗑️ 删除应用程序: $APP_PATH"
        rm -rf "$APP_PATH"
        if [ $? -eq 0 ]; then
            echo "   ✅ 删除成功"
        else
            echo "   ❌ 删除失败，尝试使用sudo..."
            sudo rm -rf "$APP_PATH"
            if [ $? -eq 0 ]; then
                echo "   ✅ 使用sudo删除成功"
            else
                echo "   ❌ 删除失败"
            fi
        fi
    else
        echo "ℹ️ 应用程序不存在: $APP_PATH"
    fi
done

# 查找其他可能的应用程序
echo "🔍 搜索其他可能的相关应用程序..."
OTHER_APPS=$(find /Applications -name "*盯户*" -o -name "*quarterly*" -o -name "*multi-browser*" 2>/dev/null | grep "\.app$")
if [ -n "$OTHER_APPS" ]; then
    echo "🗑️ 发现其他相关应用程序："
    echo "$OTHER_APPS"
    echo "$OTHER_APPS" | while read app; do
        echo "   删除: $app"
        rm -rf "$app"
    done
else
    echo "✅ 未发现其他相关应用程序"
fi

echo ""
echo "🧹 第三步：清理LaunchServices配置"
echo "----------------------------------------"

# 删除LSHandlers配置
echo "🗑️ 删除LSHandlers配置..."
defaults delete com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers 2>/dev/null && echo "   ✅ LSHandlers配置已删除" || echo "   ℹ️ LSHandlers配置不存在或已删除"

# 清理LaunchServices缓存
echo "🗑️ 清理LaunchServices缓存..."
rm -rf ~/Library/Caches/com.apple.LaunchServices* 2>/dev/null
sudo rm -rf /Library/Caches/com.apple.LaunchServices* 2>/dev/null
sudo rm -rf /System/Library/Caches/com.apple.LaunchServices* 2>/dev/null
echo "   ✅ 缓存清理完成"

# 清理其他相关配置
echo "🗑️ 清理其他配置文件..."
rm -rf ~/Library/Preferences/com.dinghu.assistant.* 2>/dev/null
rm -rf ~/Library/Saved\ Application\ State/com.dinghu.assistant.* 2>/dev/null
echo "   ✅ 配置文件清理完成"

echo ""
echo "🔄 第四步：重建系统数据库"
echo "----------------------------------------"

# 重建LaunchServices数据库
echo "🔄 重建LaunchServices数据库..."
sudo /System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -kill -r -domain local -domain system -domain user
echo "   ✅ 数据库重建完成"

# 重启相关系统服务
echo "🔄 重启系统服务..."
sudo killall -HUP lsd 2>/dev/null
killall Dock 2>/dev/null
killall Finder 2>/dev/null
echo "   ✅ 系统服务重启完成"

# 清理DNS缓存
echo "🗑️ 清理DNS缓存..."
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder 2>/dev/null
echo "   ✅ DNS缓存清理完成"

echo ""
echo "⏳ 等待系统稳定（5秒）..."
sleep 5

echo ""
echo "🔍 第五步：验证清理结果"
echo "----------------------------------------"

# 检查协议注册
echo "🔍 检查协议注册状态..."
REMAINING_PROTOCOLS=$(/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump | grep -E "(bytedance|douyin|toutiao|xigua|aweme|snssdk|multi-browser)")
if [ -n "$REMAINING_PROTOCOLS" ]; then
    echo "⚠️ 仍有协议注册残留："
    echo "$REMAINING_PROTOCOLS"
    echo ""
    echo "🔧 尝试终极清理方法..."
    
    # 终极清理：手动移除特定协议
    for protocol in "${PROTOCOLS[@]}"; do
        echo "   🗑️ 移除协议: $protocol://"
        /usr/libexec/PlistBuddy -c "Delete :LSHandlers: LSHandlerURLScheme $protocol" ~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist 2>/dev/null || true
    done
    
    # 再次重建数据库
    sudo /System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -kill -r -domain local -domain system -domain user
    
    echo "   🔄 等待数据库重建..."
    sleep 3
    
    # 最终检查
    FINAL_CHECK=$(/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -dump | grep -E "(bytedance|douyin|toutiao|xigua|aweme|snssdk|multi-browser)")
    if [ -n "$FINAL_CHECK" ]; then
        echo "❌ 仍有协议注册残留，可能需要重启计算机"
        echo "$FINAL_CHECK"
    else
        echo "✅ 所有协议注册已完全清除"
    fi
else
    echo "✅ 所有协议注册已完全清除"
fi

# 检查应用程序
echo ""
echo "🔍 检查剩余应用程序..."
REMAINING_APPS=$(find /Applications -name "*盯户*" -o -name "*quarterly*" -o -name "*multi-browser*" 2>/dev/null | grep "\.app$")
if [ -n "$REMAINING_APPS" ]; then
    echo "⚠️ 仍有应用程序残留："
    echo "$REMAINING_APPS"
else
    echo "✅ 所有相关应用程序已清除"
fi

echo ""
echo "========================================="
echo "           🎉 清理完成报告 🎉"
echo "========================================="
echo ""
echo "✅ 已执行的清理操作："
echo "   📱 删除相关应用程序"
echo "   🗑️ 清理LaunchServices配置"
echo "   🧹 清理系统缓存"
echo "   🔄 重建系统数据库"
echo "   🔧 重启相关服务"
echo ""
echo "📋 清理的协议列表："
for protocol in "${PROTOCOLS[@]}"; do
    echo "   - $protocol://"
done
echo ""
echo "⚠️ 重要提醒："
echo "   🔄 建议重启计算机以确保所有更改完全生效"
echo "   🔍 重启后可运行以下命令验证："
echo "   lsregister -dump | grep -E '(bytedance|douyin|toutiao|xigua)'"
echo ""
echo "🆘 如果问题仍然存在："
echo "   1. 重启计算机"
echo "   2. 重新运行此脚本"
echo "   3. 检查是否有其他应用程序在使用这些协议"
echo ""
echo "========================================="

# 创建验证脚本
cat > /Users/kela/Program/Other/Client/Multi-Browser/verify-cleanup.sh << 'VERIFY_EOF'
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
VERIFY_EOF

chmod +x /Users/kela/Program/Other/Client/Multi-Browser/verify-cleanup.sh
echo "💾 已创建验证脚本: verify-cleanup.sh"
echo "   运行 ./verify-cleanup.sh 可随时验证清理状态"

echo ""
echo "🏁 脚本执行完毕！"
