// 简单的CPU测试
import os from 'os';

console.log('🧪 测试CPU读取...');

function testCPUReading() {
  try {
    const cpus = os.cpus();
    console.log('CPU核心数:', cpus.length);
    console.log('CPU型号:', cpus[0]?.model || 'Unknown');
    
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
    
    console.log('计算结果:');
    console.log('  总闲置时间:', idle);
    console.log('  总时间:', total);
    console.log('  CPU使用率:', usage + '%');
    
    if (isNaN(usage) || usage < 0) {
      console.log('❌ CPU计算结果异常，使用进程CPU作为后备');
      const procUsage = process.getCPUUsage();
      const fallback = Math.min(100, Math.max(0, (procUsage.user + procUsage.system) / 10000));
      console.log('  进程CPU使用率:', fallback + '%');
    } else {
      console.log('✅ CPU使用率正常:', Math.min(100, Math.max(0, usage)) + '%');
    }
    
  } catch (error) {
    console.error('❌ CPU测试失败:', error);
  }
}

// 测试3次，间隔1秒
testCPUReading();
setTimeout(testCPUReading, 1000);
setTimeout(testCPUReading, 2000);
