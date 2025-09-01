// 测试内存保护功能
console.log('🧪 测试内存保护功能...');

// 模拟内存监控逻辑
function simulateMemoryProtection() {
  let currentMemoryPercent = 85; // 起始内存使用率
  let hasAutoClosedWebviews = false;
  
  console.log('📊 开始模拟内存使用率变化...');
  
  // 模拟内存使用率上升
  const memoryTestInterval = setInterval(() => {
    currentMemoryPercent += Math.random() * 3; // 随机增加1-3%
    
    console.log(`内存使用率: ${currentMemoryPercent.toFixed(1)}%`);
    
    if (currentMemoryPercent >= 90 && !hasAutoClosedWebviews) {
      console.log('🚨 内存使用率超过90%！');
      console.log('🛡️ 触发自动保护：关闭所有WebView实例');
      hasAutoClosedWebviews = true;
      
      // 模拟关闭WebView后内存下降
      setTimeout(() => {
        currentMemoryPercent = Math.max(75, currentMemoryPercent - 20);
        console.log(`✅ WebView关闭完成，内存使用率降至: ${currentMemoryPercent.toFixed(1)}%`);
      }, 1000);
    }
    
    if (currentMemoryPercent < 85 && hasAutoClosedWebviews) {
      console.log('✅ 内存使用率已降至安全水平，重置保护状态');
      hasAutoClosedWebviews = false;
    }
    
    // 测试完成条件
    if (currentMemoryPercent > 95) {
      clearInterval(memoryTestInterval);
      console.log('🏁 内存保护测试完成');
    }
  }, 1000);
  
  // 10秒后强制结束测试
  setTimeout(() => {
    clearInterval(memoryTestInterval);
    console.log('⏰ 测试超时结束');
  }, 10000);
}

// 运行测试
simulateMemoryProtection();
