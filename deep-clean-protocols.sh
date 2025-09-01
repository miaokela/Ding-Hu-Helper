#!/bin/bash

echo "🔥 深度清理协议注册 - 强制清除版本"
echo "========================================="

# 要清理的协议列表
protocols=("bytedance" "toutiao" "douyin" "xigua" "aweme" "snssdk")

# 获取当前的LSHandlers配置
echo "🔍 获取当前配置..."
defaults read com.apple.LaunchServices/com.apple.launchservices.secure LSHandlers > /tmp/current_handlers.plist

# 创建新的配置文件，过滤掉相关协议
echo "🧹 过滤协议配置..."
python3 << 'EOF'
import plistlib
import sys

# 读取当前配置
try:
    with open('/tmp/current_handlers.plist', 'rb') as f:
        handlers = plistlib.load(f)
except:
    # 如果读取失败，创建空配置
    handlers = []

# 要移除的协议
protocols_to_remove = ['bytedance', 'toutiao', 'douyin', 'xigua', 'aweme', 'snssdk']

# 过滤掉相关协议
filtered_handlers = []
for handler in handlers:
    if isinstance(handler, dict) and 'LSHandlerURLScheme' in handler:
        scheme = handler['LSHandlerURLScheme']
        if scheme not in protocols_to_remove:
            filtered_handlers.append(handler)
    else:
        filtered_handlers.append(handler)

# 保存新配置
with open('/tmp/filtered_handlers.plist', 'wb') as f:
    plistlib.dump(filtered_handlers, f)

print(f"✅ 过滤完成，剩余 {len(filtered_handlers)} 个处理器")
EOF

# 应用新配置
echo "📝 应用新配置..."
defaults import com.apple.LaunchServices/com.apple.launchservices.secure /tmp/filtered_handlers.plist

# 强制重建LaunchServices数据库
echo "🔄 强制重建数据库..."
sudo /System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister -kill -r -domain local -domain system -domain user

# 清理临时文件
rm -f /tmp/current_handlers.plist /tmp/filtered_handlers.plist

echo "✅ 深度清理完成！"
echo "🔍 验证结果..."
