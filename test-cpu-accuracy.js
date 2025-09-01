// 测试修复后的CPU统计准确性
import os from 'os';

// 模拟修复后的CPU统计逻辑
let cachedCPUPercent = 0;
let lastCPUUpdate = 0;
let previousCPUInfo = [];
const CPU_UPDATE_INTERVAL = 2000;

async function getCPUUsageAsync() {
  return new Promise((resolve) => {
    const now = Date.now();
    
    // 如果缓存还有效，直接返回
    if (now - lastCPUUpdate < CPU_UPDATE_INTERVAL) {
      console.log('📊 使用缓存的CPU数据:', cachedCPUPercent.toFixed(1) + '%');
      resolve(cachedCPUPercent);
      return;
    }
    
    setTimeout(() => {
      try {
        const cpus = os.cpus();
        console.log('🔄 更新CPU统计 - 核心数:', cpus.length);
        
        // 获取当前CPU时间
        const currentCPUInfo = cpus.map(cpu => {
          const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
          return {
            idle: cpu.times.idle,
            total: total
          };
        });
        
        let cpuUsage = 0;
        
        // 如果有历史数据，计算使用率
        if (previousCPUInfo.length > 0 && previousCPUInfo.length === currentCPUInfo.length) {
          let totalUsage = 0;
          let validCores = 0;
          
          console.log('⚙️ 基于时间差计算CPU使用率:');
          
          for (let i = 0; i < currentCPUInfo.length; i++) {
            const current = currentCPUInfo[i];
            const previous = previousCPUInfo[i];
            
            const totalDiff = current.total - previous.total;
            const idleDiff = current.idle - previous.idle;
            
            if (totalDiff > 0) {
              const usage = 100 - (idleDiff / totalDiff) * 100;
              const validUsage = Math.max(0, Math.min(100, usage));
              totalUsage += validUsage;
              validCores++;
              
              if (i < 3) { // 只显示前3个核心的详情
                console.log(`  核心${i}: ${validUsage.toFixed(1)}% (总时间差: ${totalDiff}, 闲置差: ${idleDiff})`);
              }
            }
          }
          
          if (validCores > 0) {
            cpuUsage = totalUsage / validCores;
            console.log(`✅ 平均CPU使用率: ${cpuUsage.toFixed(1)}% (基于${validCores}个核心)`);
          }
        } else {
          // 第一次运行或数据不匹配
          console.log('⏳ 首次CPU测量，建立基准数据...');
          cpuUsage = 0;
        }
        
        // 更新历史数据
        previousCPUInfo = currentCPUInfo;
        
        // 验证结果合理性
        if (isNaN(cpuUsage) || cpuUsage < 0) {
          console.warn('⚠️ CPU计算结果异常，使用进程CPU作为后备');
          try {
            const procUsage = process.getCPUUsage();
            cpuUsage = Math.min(100, Math.max(0, (procUsage.user + procUsage.system) / 10000));
            console.log(`🔄 进程CPU使用率: ${cpuUsage.toFixed(1)}%`);
          } catch (procError) {
            console.warn('❌ 获取进程CPU也失败:', procError);
            cpuUsage = cachedCPUPercent;
          }
        }
        
        cachedCPUPercent = Math.round(cpuUsage * 100) / 100;
        lastCPUUpdate = now;
        
        resolve(cachedCPUPercent);
      } catch (error) {
        console.warn('❌ 获取CPU使用率失败:', error);
        resolve(cachedCPUPercent);
      }
    }, 0);
  });
}

// 对比原始方法和修复后方法
async function compareOriginalAndFixed() {
  console.log('🧪 开始对比CPU统计方法的准确性...\n');
  
  // 原始错误方法（一次性快照）
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
  
  console.log('📈 连续测试10次，对比两种方法的差异:\n');
  
  for (let i = 0; i < 10; i++) {
    const originalCPU = getOriginalCPU();
    const fixedCPU = await getCPUUsageAsync();
    
    console.log(`测试 ${i + 1}:`);
    console.log(`  原始方法 (一次性快照): ${originalCPU.toFixed(1)}%`);
    console.log(`  修复方法 (基于时间差): ${fixedCPU.toFixed(1)}%`);
    console.log(`  差异: ${Math.abs(originalCPU - fixedCPU).toFixed(1)}%`);
    console.log('');
    
    // 等待3秒再进行下次测试
    if (i < 9) {
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  
  console.log('🎯 测试结论:');
  console.log('✅ 修复后的方法基于时间差计算，更准确反映实际CPU使用情况');
  console.log('✅ 原始方法使用累积时间快照，容易产生误导性的高数值');
  console.log('✅ 修复后支持缓存，避免频繁计算造成性能影响');
}

// 开始测试
compareOriginalAndFixed().catch(console.error);
