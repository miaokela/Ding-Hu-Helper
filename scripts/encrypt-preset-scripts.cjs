const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

// RSA 加密配置（与主进程保持一致）
const RSA_CONFIG = {
  key: CryptoJS.enc.Utf8.parse('MultiB-Browser-Key32'), // 32字符密钥
  iv: CryptoJS.enc.Utf8.parse('MultiB-Browser-IV16'),   // 16字符IV
};

// RSA 加密函数
function encryptScript(text) {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, RSA_CONFIG.key, {
      iv: RSA_CONFIG.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  } catch (error) {
    console.error('加密失败:', error);
    throw error;
  }
}

// 处理预设脚本加密
function processPresetScripts() {
  const scriptsDir = path.join(__dirname, 'preset-scripts');
  const outputDir = path.join(__dirname, '../public/encrypted-scripts');
  
  // 确保输出目录存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // 处理千川登录脚本
  const qianchuanPath = path.join(scriptsDir, 'qianchuan-login.js');
  if (fs.existsSync(qianchuanPath)) {
    console.log('🔒 加密巨量千川脚本...');
    const originalScript = fs.readFileSync(qianchuanPath, 'utf8');
    const encryptedScript = encryptScript(originalScript);
    
    // 保存加密后的脚本
    const encryptedPath = path.join(outputDir, 'qianchuan-login.encrypted');
    fs.writeFileSync(encryptedPath, encryptedScript);
    
    console.log('✅ 巨量千川脚本加密完成');
    console.log(`   原文件: ${qianchuanPath}`);
    console.log(`   加密文件: ${encryptedPath}`);
    
    // 生成预设脚本配置文件
    const presetConfig = {
      scripts: [
        {
          id: 'jiliangqianchuan',
          name: '巨量千川',
          description: '巨量千川自动登录脚本',
          encryptedFile: 'qianchuan-login.encrypted'
        }
      ]
    };
    
    const configPath = path.join(outputDir, 'preset-config.json');
    fs.writeFileSync(configPath, JSON.stringify(presetConfig, null, 2));
    
    console.log('✅ 预设脚本配置文件生成完成');
    console.log(`   配置文件: ${configPath}`);
  } else {
    console.error('❌ 找不到千川登录脚本文件:', qianchuanPath);
  }
}

// 执行加密处理
try {
  console.log('🚀 开始处理预设脚本加密...');
  processPresetScripts();
  console.log('🎉 所有预设脚本加密完成！');
} catch (error) {
  console.error('❌ 处理失败:', error);
  process.exit(1);
}
