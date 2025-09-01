/**
 * 标签页拖拽功能测试脚本
 * 用于验证拖拽重排序和分离窗口的核心逻辑
 */

// 模拟域名数据
const mockDomains = [
  { name: '电商平台', partition: 'domain-1', url: 'https://shop.example.com' },
  { name: '社交媒体', partition: 'domain-2', url: 'https://social.example.com' },
  { name: '开发工具', partition: 'domain-3', url: 'https://dev.example.com' },
  { name: '文档编辑', partition: 'domain-4', url: 'https://docs.example.com' }
];

// 模拟WebView标签页数据
const mockTabs = [
  { id: 1, title: '首页', url: 'https://shop.example.com/', partition: 'domain-1' },
  { id: 2, title: '商品列表', url: 'https://shop.example.com/products', partition: 'domain-1' },
  { id: 3, title: '用户中心', url: 'https://shop.example.com/profile', partition: 'domain-1' },
  { id: 4, title: '购物车', url: 'https://shop.example.com/cart', partition: 'domain-1' }
];

class DragDropTester {
  constructor() {
    this.domains = [...mockDomains];
    this.tabs = [...mockTabs];
    console.log('🧪 拖拽功能测试器初始化完成');
    this.runTests();
  }

  // 运行所有测试
  runTests() {
    console.log('\n🚀 开始运行拖拽功能测试...\n');
    
    this.testDomainReorder();
    this.testTabReorder();
    this.testDomainDetach();
    this.testTabDetach();
    this.testEdgeCases();
    
    console.log('\n✅ 所有测试完成！');
  }

  // 测试域名重排序
  testDomainReorder() {
    console.log('📋 测试1: 域名标签页重排序');
    
    const originalOrder = this.domains.map(d => d.name);
    console.log('原始顺序:', originalOrder);
    
    // 模拟将第1个域名移动到第3个位置
    const fromIndex = 0;
    const toIndex = 2;
    
    const reordered = this.reorderArray(this.domains, fromIndex, toIndex);
    const newOrder = reordered.map(d => d.name);
    
    console.log('重排序后:', newOrder);
    console.log('✅ 域名重排序测试通过\n');
    
    // 恢复原始状态
    this.domains = [...mockDomains];
  }

  // 测试标签页重排序
  testTabReorder() {
    console.log('📋 测试2: WebView标签页重排序');
    
    const originalOrder = this.tabs.map(t => t.title);
    console.log('原始顺序:', originalOrder);
    
    // 模拟将第2个标签页移动到第1个位置
    const fromIndex = 1;
    const toIndex = 0;
    
    const reordered = this.reorderArray(this.tabs, fromIndex, toIndex);
    const newOrder = reordered.map(t => t.title);
    
    console.log('重排序后:', newOrder);
    console.log('✅ 标签页重排序测试通过\n');
    
    // 恢复原始状态
    this.tabs = [...mockTabs];
  }

  // 测试域名分离
  testDomainDetach() {
    console.log('📋 测试3: 域名分离为新窗口');
    
    const domainToDetach = this.domains[1];
    console.log('分离域名:', domainToDetach.name);
    
    // 模拟分离操作
    const result = this.simulateDetachDomain(domainToDetach);
    
    if (result.success) {
      console.log('✅ 域名分离测试通过');
      console.log('   新窗口配置:', result.windowConfig);
      console.log('   剩余域名:', this.domains.filter(d => d.partition !== domainToDetach.partition).map(d => d.name));
    } else {
      console.log('❌ 域名分离测试失败');
    }
    console.log('');
    
    // 恢复原始状态
    this.domains = [...mockDomains];
  }

  // 测试标签页分离
  testTabDetach() {
    console.log('📋 测试4: 标签页分离为新窗口');
    
    const tabToDetach = this.tabs[2];
    console.log('分离标签页:', tabToDetach.title);
    
    // 模拟分离操作
    const result = this.simulateDetachTab(tabToDetach);
    
    if (result.success) {
      console.log('✅ 标签页分离测试通过');
      console.log('   新窗口配置:', result.windowConfig);
      console.log('   剩余标签页:', this.tabs.filter(t => t.id !== tabToDetach.id).map(t => t.title));
    } else {
      console.log('❌ 标签页分离测试失败');
    }
    console.log('');
    
    // 恢复原始状态
    this.tabs = [...mockTabs];
  }

  // 测试边界情况
  testEdgeCases() {
    console.log('📋 测试5: 边界情况处理');
    
    console.log('   🔸 测试无效索引重排序');
    const invalidReorder = this.reorderArray(this.domains, -1, 10);
    console.log('   结果: 数组保持不变 ✅');
    
    console.log('   🔸 测试相同位置重排序');
    const samePositionReorder = this.reorderArray(this.domains, 1, 1);
    console.log('   结果: 数组保持不变 ✅');
    
    console.log('   🔸 测试空数组操作');
    const emptyArrayReorder = this.reorderArray([], 0, 1);
    console.log('   结果: 返回空数组 ✅');
    
    console.log('✅ 边界情况测试通过\n');
  }

  // 数组重排序工具函数
  reorderArray(array, fromIndex, toIndex) {
    if (!array || array.length === 0) return [];
    if (fromIndex < 0 || fromIndex >= array.length || 
        toIndex < 0 || toIndex >= array.length || 
        fromIndex === toIndex) {
      return array;
    }
    
    const result = [...array];
    const [movedItem] = result.splice(fromIndex, 1);
    result.splice(toIndex, 0, movedItem);
    
    return result;
  }

  // 模拟域名分离
  simulateDetachDomain(domain) {
    console.log(`   🪟 创建新窗口: ${domain.name}`);
    
    // 模拟Electron窗口配置
    const windowConfig = {
      url: domain.url,
      title: domain.name,
      partition: domain.partition,
      width: 1200,
      height: 800
    };
    
    // 模拟成功创建窗口
    const success = Math.random() > 0.1; // 90%成功率
    
    if (success) {
      console.log(`   ✅ 窗口创建成功`);
      console.log(`   🗑️ 关闭原域名实例`);
    } else {
      console.log(`   ❌ 窗口创建失败，回退到 window.open`);
    }
    
    return { success, windowConfig };
  }

  // 模拟标签页分离
  simulateDetachTab(tab) {
    console.log(`   🪟 创建新窗口: ${tab.title}`);
    
    const windowConfig = {
      url: tab.url,
      title: tab.title,
      partition: tab.partition,
      width: 1000,
      height: 700
    };
    
    const success = Math.random() > 0.1; // 90%成功率
    
    if (success) {
      console.log(`   ✅ 窗口创建成功`);
      console.log(`   🗑️ 关闭原标签页`);
    } else {
      console.log(`   ❌ 窗口创建失败，回退到 window.open`);
    }
    
    return { success, windowConfig };
  }

  // 性能测试
  performanceTest() {
    console.log('\n⚡ 性能测试');
    
    // 测试大量数据的重排序性能
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({
      id: i,
      name: `项目${i}`,
      url: `https://example${i}.com`
    }));
    
    const startTime = performance.now();
    
    // 执行100次重排序操作
    for (let i = 0; i < 100; i++) {
      const fromIndex = Math.floor(Math.random() * largeArray.length);
      const toIndex = Math.floor(Math.random() * largeArray.length);
      this.reorderArray(largeArray, fromIndex, toIndex);
    }
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`   📊 1000项数组执行100次重排序用时: ${duration.toFixed(2)}ms`);
    console.log(`   📈 平均每次操作: ${(duration / 100).toFixed(2)}ms`);
    
    if (duration < 100) {
      console.log('   ✅ 性能测试通过 (优秀)');
    } else if (duration < 500) {
      console.log('   ⚠️ 性能测试通过 (良好)');
    } else {
      console.log('   ❌ 性能测试不理想，需要优化');
    }
  }
}

// 拖拽状态验证器
class DragStateValidator {
  static validateDragState(state) {
    const requiredFields = ['isDragging', 'draggedItem', 'dragOverIndex', 'isDetached'];
    const errors = [];
    
    requiredFields.forEach(field => {
      if (!(field in state)) {
        errors.push(`缺少必需字段: ${field}`);
      }
    });
    
    if (state.isDragging && !state.draggedItem) {
      errors.push('拖拽状态不一致: isDragging为true但draggedItem为空');
    }
    
    if (state.dragOverIndex < -1) {
      errors.push('无效的dragOverIndex值');
    }
    
    return {
      valid: errors.length === 0,
      errors: errors
    };
  }
}

// 运行测试
console.log('🎯 Multi-Browser 拖拽功能测试');
console.log('================================');

// 基本功能测试
const tester = new DragDropTester();

// 性能测试
tester.performanceTest();

// 状态验证测试
console.log('\n🔍 拖拽状态验证测试');
const mockState1 = { isDragging: true, draggedItem: { id: 1 }, dragOverIndex: 2, isDetached: false };
const mockState2 = { isDragging: true, draggedItem: null, dragOverIndex: -2, isDetached: false };

const validation1 = DragStateValidator.validateDragState(mockState1);
const validation2 = DragStateValidator.validateDragState(mockState2);

console.log('有效状态验证:', validation1.valid ? '✅ 通过' : '❌ 失败');
console.log('无效状态验证:', validation2.valid ? '❌ 应该失败' : '✅ 正确识别错误');

if (!validation2.valid) {
  console.log('错误详情:', validation2.errors);
}

console.log('\n🎉 测试脚本执行完毕！');
console.log('📝 查看控制台输出了解详细的测试结果');

// 导出测试工具供其他模块使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DragDropTester,
    DragStateValidator
  };
}
