const { exec } = require('child_process');
const os = require('os');

/**
 * 清理 Windows 注册表中的协议处理器
 * 这个脚本用于移除可能导致应用重复启动的协议注册
 */

function cleanProtocolRegistry() {
  console.log('🧹 开始清理协议注册表...');
  
  // 需要清理的协议列表
  const problematicProtocols = [
    'bytedance',
    'toutiao', 
    'douyin',
    'xigua',
    'aweme',      // 抖音的另一个协议
    'snssdk',     // 字节跳动的通用协议
  ];

  if (process.platform === 'win32') {
    console.log('🖥️ 检测到 Windows 平台，开始清理注册表...');
    
    problematicProtocols.forEach(protocol => {
      // 清理用户级注册表
      const userCmd = `reg delete "HKEY_CURRENT_USER\\Software\\Classes\\${protocol}" /f`;
      const systemCmd = `reg delete "HKEY_LOCAL_MACHINE\\SOFTWARE\\Classes\\${protocol}" /f`;
      
      exec(userCmd, (error) => {
        if (!error) {
          console.log(`✅ 清理用户级协议注册: ${protocol}://`);
        }
      });
      
      exec(systemCmd, (error) => {
        if (!error) {
          console.log(`✅ 清理系统级协议注册: ${protocol}://`);
        }
      });
    });
    
    console.log('🎉 Windows 注册表清理命令已执行！');
  } else {
    console.log('ℹ️ 当前不是 Windows 平台，跳过注册表清理');
  }
  
  console.log('');
  console.log('📝 温馨提示：');
  console.log('1. 如果问题仍然存在，请重启 Windows 系统');
  console.log('2. 也可以手动运行 clean-protocol-registry.bat 文件');
  console.log('3. 检查是否有其他应用程序注册了这些协议');
}

// 立即运行清理
cleanProtocolRegistry();

module.exports = {
  cleanProtocolRegistry
};
