import os from 'os';

// 模拟优化后的CPU获取逻辑
let cachedCPUPercent = 0;
let lastCPUUpdate = 0;
const CPU_UPDATE_INTERVAL = 10000; // 10秒更新一次CPU数据

// 异步获取CPU使用率
async function getCPUUsageAsync() {
  return new Promise((resolve) => {
    const now = Date.now();
    
    // 如果缓存还有效，直接返回
    if (now - lastCPUUpdate < CPU_UPDATE_INTERVAL) {
      console.log('✅ 使用缓存的CPU数据');
      resolve(cachedCPUPercent);
      return;
    }
    
    console.log('🔄 更新CPU使用率...');
    
    // 使用setTimeout避免阻塞
    setTimeout(() => {
      try {
        // 简化的CPU使用率估算
        cachedCPUPercent = Math.random() * 50 + 10; // 模拟10-60%的使用率
        lastCPUUpdate = now;
        
        console.log('✅ CPU使用率已更新:', cachedCPUPercent.toFixed(1) + '%');
        resolve(cachedCPUPercent);
      } catch (error) {
        console.warn('获取CPU使用率失败:', error);
        resolve(cachedCPUPercent); // 返回缓存值
      }
    }, 0);
  });
}

// 模拟系统监控功能
async function getSystemStats() {
  const startTime = Date.now();
  
  try {
    // 异步获取CPU使用率
    const cpuPercent = await getCPUUsageAsync();
    const cpus = os.cpus();
    
    // 快速获取内存信息
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const memoryPercent = (usedMemory / totalMemory) * 100;
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`📊 系统监控完成 (耗时: ${duration}ms)`);
    console.log(`   CPU: ${cpuPercent.toFixed(1)}% (${cpus.length}核心)`);
    console.log(`   内存: ${memoryPercent.toFixed(1)}% (${(usedMemory / (1024**3)).toFixed(1)}GB / ${(totalMemory / (1024**3)).toFixed(1)}GB)`);
    
    return {
      cpu: {
        percent: Math.round(cpuPercent * 100) / 100,
        cores: cpus.length,
        model: cpus[0]?.model || 'Unknown'
      },
      memory: {
        total: Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100,
        used: Math.round(usedMemory / (1024 * 1024 * 1024) * 100) / 100,
        free: Math.round(freeMemory / (1024 * 1024 * 1024) * 100) / 100,
        percent: Math.round(memoryPercent * 100) / 100
      },
      performance: {
        duration: duration
      }
    };
  } catch (error) {
    console.error('获取系统统计信息失败:', error);
    return null;
  }
}

// 测试性能
console.log('🚀 开始测试优化后的系统监控性能...');
console.log('📝 测试场景: 快速连续调用 (模拟UI更新)');

async function runPerformanceTest() {
  // 测试快速连续调用
  console.log('\n=== 快速连续调用测试 ===');
  for (let i = 0; i < 5; i++) {
    console.log(`\n第${i + 1}次调用:`);
    await getSystemStats();
    await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟
  }
  
  // 等待10秒后再测试缓存失效
  console.log('\n⏳ 等待11秒后测试缓存失效...');
  await new Promise(resolve => setTimeout(resolve, 11000));
  
  console.log('\n=== 缓存失效后的调用测试 ===');
  await getSystemStats();
  
  console.log('\n✅ 性能测试完成');
  process.exit(0);
}

runPerformanceTest();
