// 快速验证CPU统计修复效果
import os from 'os';

console.log('🔍 CPU统计准确性验证\n');

// 原始错误方法
function getOriginalCPU() {
  try {
    const cpus = os.cpus();
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type];
      }
      totalIdle += cpu.times.idle;
    }
    
    const idle = totalIdle / cpus.length;
    const total = totalTick / cpus.length;
    const usage = 100 - Math.floor((idle / total) * 100);
    
    return Math.max(0, Math.min(100, usage));
  } catch (error) {
    return 0;
  }
}

// 正确的方法（简化版）
let previousCPUInfo = null;

function getCorrectCPU() {
  try {
    const cpus = os.cpus();
    
    const currentCPUInfo = cpus.map(cpu => {
      const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
      return {
        idle: cpu.times.idle,
        total: total
      };
    });
    
    if (!previousCPUInfo) {
      previousCPUInfo = currentCPUInfo;
      return 0; // 首次运行，需要建立基准
    }
    
    let totalUsage = 0;
    let validCores = 0;
    
    for (let i = 0; i < currentCPUInfo.length; i++) {
      const current = currentCPUInfo[i];
      const previous = previousCPUInfo[i];
      
      const totalDiff = current.total - previous.total;
      const idleDiff = current.idle - previous.idle;
      
      if (totalDiff > 0) {
        const usage = 100 - (idleDiff / totalDiff) * 100;
        totalUsage += Math.max(0, Math.min(100, usage));
        validCores++;
      }
    }
    
    previousCPUInfo = currentCPUInfo;
    
    return validCores > 0 ? totalUsage / validCores : 0;
  } catch (error) {
    return 0;
  }
}

// 快速对比测试
async function quickTest() {
  console.log('🧪 方法对比测试:');
  console.log('═'.repeat(50));
  
  const originalCPU = getOriginalCPU();
  console.log(`❌ 原始方法 (错误): ${originalCPU.toFixed(1)}%`);
  console.log('   ↳ 基于累积时间，显示系统启动以来的平均值');
  console.log('   ↳ 通常显示30-70%的高数值，但不准确\n');
  
  console.log('⏳ 正确方法需要建立基准，等待3秒...');
  const firstCorrect = getCorrectCPU(); // 建立基准
  console.log(`✅ 首次运行 (建立基准): ${firstCorrect.toFixed(1)}%\n`);
  
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const secondCorrect = getCorrectCPU(); // 真正的计算
  console.log(`✅ 修复方法 (正确): ${secondCorrect.toFixed(1)}%`);
  console.log('   ↳ 基于时间差计算，反映真实CPU使用情况');
  console.log('   ↳ 通常显示0-15%的合理数值\n');
  
  console.log('📊 结果分析:');
  console.log('═'.repeat(50));
  const difference = Math.abs(originalCPU - secondCorrect);
  console.log(`📈 数值差异: ${difference.toFixed(1)}%`);
  
  if (difference > 20) {
    console.log('🚨 原始方法显示的CPU使用率严重偏高！');
    console.log('   这会误导用户以为系统负载很高');
  } else if (difference > 10) {
    console.log('⚠️ 原始方法存在明显偏差');
  } else {
    console.log('ℹ️ 两种方法结果相近（可能系统确实高负载）');
  }
  
  console.log('\n🎯 修复建议:');
  console.log('✅ 立即部署修复后的CPU统计算法');
  console.log('✅ 这将为用户提供准确的系统监控信息');
  console.log('✅ 避免误导性的高CPU使用率显示');
}

// 系统信息
console.log('💻 系统信息:');
const cpus = os.cpus();
console.log(`   CPU型号: ${cpus[0]?.model || 'Unknown'}`);
console.log(`   核心数: ${cpus.length}`);
console.log(`   架构: ${os.arch()}`);
console.log(`   平台: ${os.platform()}\n`);

// 运行测试
quickTest().catch(console.error);
