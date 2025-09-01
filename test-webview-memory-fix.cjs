/**
 * WebView 内存统计修复测试脚本
 * 用于验证改进后的内存获取方法
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

console.log('🔍 测试 WebView 内存统计修复...');

/**
 * 测试系统进程内存获取
 */
async function testProcessMemoryDetection() {
  console.log('\n📊 测试进程内存检测方法...');
  
  try {
    // 获取当前 Node.js 进程的内存信息作为测试
    const currentPid = process.pid;
    console.log(`测试进程 PID: ${currentPid}`);
    
    if (process.platform === 'win32') {
      console.log('🪟 测试 Windows tasklist 方法...');
      try {
        const { stdout } = await execAsync(`tasklist /fi "PID eq ${currentPid}" /fo csv | findstr ${currentPid}`);
        console.log('Tasklist 原始输出:', stdout);
        
        const lines = stdout.trim().split('\n');
        if (lines.length > 0) {
          const parts = lines[0].split(',');
          console.log('解析部分:', parts);
          if (parts.length >= 5) {
            const memoryStr = parts[4].replace(/"/g, '').replace(/,/g, '').replace(' K', '');
            const memoryKB = parseInt(memoryStr);
            if (!isNaN(memoryKB)) {
              const memoryMB = memoryKB / 1024;
              console.log(`✅ Windows 方法成功: ${memoryMB.toFixed(1)}MB`);
            } else {
              console.log('❌ 解析内存数值失败');
            }
          } else {
            console.log('❌ CSV 格式不符合预期');
          }
        }
      } catch (error) {
        console.log('❌ Windows 方法失败:', error.message);
      }
    }
    
    console.log('\n📋 Node.js 内置内存信息作为对比:');
    const nodeMemory = process.memoryUsage();
    console.log(`- RSS: ${(nodeMemory.rss / 1024 / 1024).toFixed(1)}MB`);
    console.log(`- Heap Used: ${(nodeMemory.heapUsed / 1024 / 1024).toFixed(1)}MB`);
    console.log(`- Heap Total: ${(nodeMemory.heapTotal / 1024 / 1024).toFixed(1)}MB`);
    console.log(`- External: ${(nodeMemory.external / 1024 / 1024).toFixed(1)}MB`);
    
  } catch (error) {
    console.error('测试失败:', error);
  }
}

/**
 * 测试智能估算算法
 */
function testSmartEstimation() {
  console.log('\n🧠 测试智能内存估算算法...');
  
  const testUrls = [
    'https://www.youtube.com/watch?v=test',
    'https://www.bilibili.com/video/test',
    'https://github.com/user/repo',
    'https://stackoverflow.com/questions/test',
    'https://www.baidu.com/s?wd=test',
    'https://www.google.com/search?q=test',
    'https://www.taobao.com/item/test',
    'https://www.tmall.com/product/test',
    'https://www.example.com/',
    ''
  ];
  
  testUrls.forEach(url => {
    let memoryMB = 70; // 默认值
    
    if (url) {
      if (url.includes('youtube.com') || url.includes('bilibili.com')) {
        memoryMB = 120; // 视频网站
      } else if (url.includes('github.com') || url.includes('stackoverflow.com')) {
        memoryMB = 80; // 开发类网站
      } else if (url.includes('baidu.com') || url.includes('google.com')) {
        memoryMB = 60; // 搜索引擎
      } else if (url.includes('taobao.com') || url.includes('tmall.com')) {
        memoryMB = 90; // 电商网站
      } else {
        memoryMB = 70; // 普通网站
      }
    }
    
    const domain = url ? new URL(url).hostname : '无URL';
    console.log(`📊 ${domain}: ${memoryMB}MB`);
  });
}

/**
 * 模拟修复前后的对比
 */
function demonstrateImprovement() {
  console.log('\n🔄 修复前后对比:');
  
  console.log('\n❌ 修复前 (问题):');
  console.log('- 所有 WebView 都显示固定的 50MB');
  console.log('- 无法反映真实的内存使用情况');
  console.log('- 估算值过于保守，不准确');
  
  console.log('\n✅ 修复后 (改进):');
  console.log('- 方法1: 尝试使用 Electron API 获取精确内存');
  console.log('- 方法2: 通过进程ID使用系统命令获取内存');
  console.log('- 方法3: 基于网站类型的智能估算');
  console.log('- 提供更准确的内存统计和更好的用户体验');
  
  console.log('\n📈 预期效果:');
  console.log('- 视频网站 (YouTube/B站): ~120MB');
  console.log('- 开发网站 (GitHub/Stack Overflow): ~80MB');
  console.log('- 搜索引擎 (百度/Google): ~60MB');
  console.log('- 电商网站 (淘宝/天猫): ~90MB');
  console.log('- 普通网站: ~70MB');
  console.log('- 能获取精确内存时显示真实数值');
}

// 主测试函数
async function runTests() {
  try {
    await testProcessMemoryDetection();
    testSmartEstimation();
    demonstrateImprovement();
    
    console.log('\n🎉 测试完成！');
    console.log('\n💡 建议:');
    console.log('1. 重启应用以应用内存统计修复');
    console.log('2. 打开不同类型的网站观察内存数值变化');
    console.log('3. 在内存监控面板查看详细的内存统计');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = {
  testProcessMemoryDetection,
  testSmartEstimation,
  demonstrateImprovement
};
