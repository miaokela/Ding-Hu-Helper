#!/usr/bin/python3

import plistlib
import os
import subprocess

def remove_protocol_handlers():
    """移除特定协议的处理器设置"""
    
    # 要移除的协议列表
    protocols_to_remove = ['bytedance', 'toutiao', 'douyin', 'xigua', 'aweme', 'snssdk']
    
    print("🧹 开始清除协议处理器设置...")
    
    # 获取当前设置
    try:
        result = subprocess.run([
            'defaults', 'read', 
            'com.apple.LaunchServices/com.apple.launchservices.secure', 
            'LSHandlers'
        ], capture_output=True, text=True)
        
        if result.returncode != 0:
            print("❌ 无法读取 LaunchServices 设置")
            return
            
        # 解析plist输出
        plist_data = result.stdout
        
        # 由于defaults read输出不是标准plist格式，我们使用不同的方法
        print("📋 当前协议处理器：")
        
        for protocol in protocols_to_remove:
            print(f"🗑️ 移除协议处理器: {protocol}://")
            
            # 使用PlistBuddy删除条目
            subprocess.run([
                '/usr/libexec/PlistBuddy', 
                '-c', f'Delete :LSHandlers: LSHandlerURLScheme {protocol}',
                os.path.expanduser('~/Library/Preferences/com.apple.LaunchServices/com.apple.launchservices.secure.plist')
            ], capture_output=True)
            
            print(f"   ✅ 已尝试移除 {protocol}://")
        
        print("\n🔄 重建 LaunchServices 数据库...")
        subprocess.run([
            '/System/Library/Frameworks/CoreServices.framework/Versions/A/Frameworks/LaunchServices.framework/Versions/A/Support/lsregister',
            '-kill', '-r', '-domain', 'local', '-domain', 'system', '-domain', 'user'
        ])
        
        print("✅ 协议清理完成！")
        
    except Exception as e:
        print(f"❌ 清理过程中出错: {e}")

if __name__ == "__main__":
    remove_protocol_handlers()
