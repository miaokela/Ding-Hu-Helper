const fs = require('fs');
const path = require('path');
const CryptoJS = require('crypto-js');

// RSA 加密配置（与主进程保持一致）
const RSA_CONFIG = {
  key: CryptoJS.enc.Utf8.parse('MultiB-Browser-Key32'), // 32字符密钥
  iv: CryptoJS.enc.Utf8.parse('MultiB-Browser-IV16'),   // 16字符IV
};

// 真正的 AES 加密函数
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
    return null;
  }
}

// 真正的 AES 解密函数
function decryptScript(encryptedText) {
  try {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, RSA_CONFIG.key, {
      iv: RSA_CONFIG.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

// 生成加密的脚本文件
function generateEncryptedScript() {
  console.log('🔐 开始生成加密脚本文件...');
  
  generateJuliangqianchuanScript();
  generateDouyinScript();
}

// 生成巨量千川加密脚本
function generateJuliangqianchuanScript() {
  console.log('📝 生成巨量千川脚本...');
  
  const originScriptPath = path.join(__dirname, '../src/preset_scripts/juliangqianchuan_origin.cjs');
  const encryptedScriptPath = path.join(__dirname, '../src/preset_scripts/juliangqianchuan.js');
  
  try {
    // 读取原始脚本
    const originScript = require(originScriptPath);
    console.log('📖 读取巨量千川原始脚本成功');
    
    // 加密脚本内容
    const encryptedContent = encryptScript(originScript);
    if (!encryptedContent) {
      throw new Error('巨量千川脚本加密失败');
    }
    console.log('🔒 巨量千川脚本加密成功');
    
    // 生成加密文件内容
    const fileContent = `// 巨量千川加密脚本
// 此文件由构建脚本自动生成，请勿手动修改

export const script_text = "${encryptedContent}";

export const presetScript = {
  id: "jiliangqianchuan",
  name: "巨量千川",
  description: "自动化脚本",
  encryptedCode: script_text
};

export default presetScript;
`;
    
    // 写入加密文件
    fs.writeFileSync(encryptedScriptPath, fileContent, 'utf8');
    console.log('✅ 巨量千川加密脚本文件生成成功:', encryptedScriptPath);
    
    // 验证解密
    const decryptedTest = decryptScript(encryptedContent);
    if (decryptedTest === originScript) {
      console.log('✅ 巨量千川加密解密验证成功');
    } else {
      console.error('❌ 巨量千川加密解密验证失败');
    }
    
  } catch (error) {
    console.error('❌ 生成巨量千川加密脚本失败:', error);
  }
}

// 生成抖音加密脚本
function generateDouyinScript() {
  console.log('📝 生成抖音脚本...');
  
  const originScriptPath = path.join(__dirname, '../src/preset_scripts/douyin_origin.cjs');
  const encryptedScriptPath = path.join(__dirname, '../src/preset_scripts/douyin.js');
  
  try {
    // 读取原始脚本
    const originScript = require(originScriptPath);
    console.log('📖 读取抖音原始脚本成功');
    
    // 加密脚本内容
    const encryptedContent = encryptScript(originScript);
    if (!encryptedContent) {
      throw new Error('抖音脚本加密失败');
    }
    console.log('🔒 抖音脚本加密成功');
    
    // 生成加密文件内容
    const fileContent = `// 抖音加密脚本
// 此文件由构建脚本自动生成，请勿手动修改

export const script_text = "${encryptedContent}";

export const presetScript = {
  id: "douyin",
  name: "抖音",
  description: "抖音自动登录脚本",
  encryptedCode: script_text
};

export default presetScript;
`;
    
    // 写入加密文件
    fs.writeFileSync(encryptedScriptPath, fileContent, 'utf8');
    console.log('✅ 抖音加密脚本文件生成成功:', encryptedScriptPath);
    
    // 验证解密
    const decryptedTest = decryptScript(encryptedContent);
    if (decryptedTest === originScript) {
      console.log('✅ 抖音加密解密验证成功');
    } else {
      console.error('❌ 抖音加密解密验证失败');
    }
    
  } catch (error) {
    console.error('❌ 生成抖音加密脚本失败:', error);
  }
}

// 如果直接运行此脚本，则生成加密文件
if (require.main === module) {
  generateEncryptedScript();
}

module.exports = {
  encryptScript,
  decryptScript,
  generateEncryptedScript,
  generateJuliangqianchuanScript,
  generateDouyinScript,
};
