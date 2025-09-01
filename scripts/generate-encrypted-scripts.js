const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// 简化的加密函数（用于演示）
function encryptScript(text) {
  try {
    // 使用简单的 base64 编码作为演示（实际项目中应该使用真正的 RSA）
    return Buffer.from(text, 'utf8').toString('base64');
  } catch (error) {
    console.error('加密失败:', error);
    return null;
  }
}

// 简化的解密函数（用于演示）
function decryptScript(encryptedText) {
  try {
    // 使用简单的 base64 解码作为演示（实际项目中应该使用真正的 RSA）
    return Buffer.from(encryptedText, 'base64').toString('utf8');
  } catch (error) {
    console.error('解密失败:', error);
    return null;
  }
}

// 生成加密的脚本文件
function generateEncryptedScript() {
  console.log('🔐 开始生成加密脚本文件...');
  
  const originScriptPath = path.join(__dirname, '../src/preset_scripts/juliangqianchuan_origin.js');
  const encryptedScriptPath = path.join(__dirname, '../src/preset_scripts/juliangqianchuan.js');
  
  try {
    // 读取原始脚本
    const originScript = require(originScriptPath);
    console.log('📖 读取原始脚本成功');
    
    // 加密脚本内容
    const encryptedContent = encryptScript(originScript);
    if (!encryptedContent) {
      throw new Error('脚本加密失败');
    }
    console.log('🔒 脚本加密成功');
    
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
    console.log('✅ 加密脚本文件生成成功:', encryptedScriptPath);
    
    // 验证解密
    const decryptedTest = decryptScript(encryptedContent);
    if (decryptedTest === originScript) {
      console.log('✅ 加密解密验证成功');
    } else {
      console.error('❌ 加密解密验证失败');
    }
    
  } catch (error) {
    console.error('❌ 生成加密脚本失败:', error);
  }
}

// 如果直接运行此脚本，则生成加密文件
if (require.main === module) {
  generateEncryptedScript();
}

module.exports = {
  encryptScript,
  decryptScript,
  generateEncryptedScript
};
