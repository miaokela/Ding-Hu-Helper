import os from 'os';

// CPU使用率缓存
let previousCPUUsage = null;
let previousTimestamp = 0;

// 计算CPU使用率的辅助函数
function calculateCPUUsage() {
  const cpus = os.cpus();
  const currentUsage = cpus.map(cpu => {
    const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
    const idle = cpu.times.idle;
    return { total, idle };
  });
  
  const currentTimestamp = Date.now();
  
  if (!previousCPUUsage || currentTimestamp - previousTimestamp < 1000) {
    // 如果没有上一次的数据或间隔太短，返回0
    return 0;
  }
  
  let totalUsage = 0;
  for (let i = 0; i < currentUsage.length; i++) {
    const current = currentUsage[i];
    const previous = previousCPUUsage[i];
    
    const totalDiff = current.total - previous.total;
    const idleDiff = current.idle - previous.idle;
    
    if (totalDiff > 0) {
      const usage = 100 - (idleDiff / totalDiff) * 100;
      totalUsage += usage;
    }
  }
  
  const avgUsage = totalUsage / currentUsage.length;
  
  // 更新缓存
  previousCPUUsage = currentUsage;
  previousTimestamp = currentTimestamp;
  
  return Math.round(Math.max(0, Math.min(100, avgUsage)) * 100) / 100;
}

// 初始化CPU使用率缓存
function initCPUUsage() {
  const cpus = os.cpus();
  previousCPUUsage = cpus.map(cpu => {
    const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
    const idle = cpu.times.idle;
    return { total, idle };
  });
  previousTimestamp = Date.now();
  console.log('CPU监控已初始化，核心数:', cpus.length);
  console.log('CPU型号:', cpus[0]?.model || 'Unknown');
}

// 测试函数
function testCPUUsage() {
  const cpuPercent = calculateCPUUsage();
  console.log('CPU使用率:', cpuPercent + '%');
  
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryPercent = (usedMemory / totalMemory) * 100;
  
  console.log('内存使用率:', Math.round(memoryPercent * 100) / 100 + '%');
  console.log('总内存:', Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100 + 'GB');
  console.log('已用内存:', Math.round(usedMemory / (1024 * 1024 * 1024) * 100) / 100 + 'GB');
  console.log('---');
}

// 开始测试
console.log('开始CPU和内存监控测试...');
initCPUUsage();

// 每2秒测试一次
const interval = setInterval(testCPUUsage, 2000);

// 初始测试
setTimeout(testCPUUsage, 1000);

// 10秒后停止测试
setTimeout(() => {
  clearInterval(interval);
  console.log('测试完成');
  process.exit(0);
}, 10000);
