#!/bin/bash

echo "🧹 清除 macOS 协议注册 - 完全清理版本"
echo "========================================="

# 检查是否为root用户
if [ "$EUID" -ne 0 ]; then
    echo "❌ 需要 root 权限！请使用 sudo 运行此脚本"
    exit 1
fi

# 要清理的协议列表
protocols=("bytedance" "toutiao" "douyin" "xigua" "aweme" "snssdk")

# 1. 强制删除LaunchServices缓存
echo "🗑️ 清除 LaunchServices 缓存..."
rm -rf /Library/Caches/com.apple.LaunchServices*
rm -rf /System/Library/Caches/com.apple.LaunchServices*
rm -rf ~/Library/Caches/com.apple.LaunchServices*

# 2. 清除用户首选项中的协议关联
echo "🗑️ 清除用户协议首选项..."
for protocol in "${protocols[@]}"; do
    # 删除用户首选项
    defaults delete com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers -dict LSHandlerURLScheme "$protocol" 2>/dev/null || true
    defaults delete com.apple.LaunchServices LSHandlers -dict LSHandlerURLScheme "$protocol" 2>/dev/null || true
    echo "   ✅ 清理协议首选项: $protocol://"
done

# 3. 重建LaunchServices数据库
echo "🔄 重建 LaunchServices 数据库..."
/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -kill -r -domain local -domain system -domain user

# 4. 清除系统代理缓存
echo "🗑️ 清除系统代理缓存..."
dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# 5. 重启Finder和Dock
echo "🔄 重启 Finder 和 Dock..."
sudo killall Finder
sudo killall Dock

echo
echo "========================================="
echo "           清理完成！"
echo "========================================="
echo
echo "✅ 已清除以下协议的所有注册："
for protocol in "${protocols[@]}"; do
    echo "   - $protocol://"
done
echo
echo "⚠️ 建议重启计算机以确保所有更改生效"
echo "🔍 之后可以运行以下命令验证："
echo "   lsregister -dump | grep -i 'bytedance\\|douyin\\|toutiao'"
