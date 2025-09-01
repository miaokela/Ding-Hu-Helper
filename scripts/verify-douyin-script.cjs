const { decryptScript } = require('./generate-douyin-script.cjs');
const fs = require('fs');
const path = require('path');

console.log('🔍 验证抖音脚本解密...');

// 读取生成的文件内容
const filePath = path.join(__dirname, '../src/preset_scripts/douyin.js');
const fileContent = fs.readFileSync(filePath, 'utf8');

// 提取加密内容（使用正则表达式）
const match = fileContent.match(/export const script_text = "([^"]+)";/);
if (!match) {
  console.log('❌ 无法从文件中提取加密内容！');
  process.exit(1);
}

const encryptedContent = match[1];
console.log('📄 加密内容长度:', encryptedContent.length, '字符');

// 解密脚本
const decryptedScript = decryptScript(encryptedContent);

if (decryptedScript) {
  console.log('✅ 解密成功！');
  console.log('📄 前100个字符:', decryptedScript.substring(0, 100) + '...');
  console.log('📊 脚本总长度:', decryptedScript.length, '字符');
  
  // 检查关键函数是否存在
  const keyFunctions = ['checkPwd', 'hasLogin', 'getMobileInput', 'exec_login'];
  keyFunctions.forEach(func => {
    if (decryptedScript.includes(func)) {
      console.log(`✓ 包含函数: ${func}`);
    } else {
      console.log(`✗ 缺少函数: ${func}`);
    }
  });
} else {
  console.log('❌ 解密失败！');
}
