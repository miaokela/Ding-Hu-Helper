const fs = require('fs');
const path = require('path');

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

// 生成抖音加密脚本
function generateDouyinScript() {
  console.log('🔐 开始生成抖音加密脚本...');
  
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
  generateDouyinScript();
}

module.exports = {
  encryptScript,
  decryptScript,
  generateDouyinScript
};
