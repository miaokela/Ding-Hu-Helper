// 测试标签页关闭逻辑
console.log('🧪 测试标签页关闭逻辑...');

// 模拟标签页管理
class MockTabManager {
  constructor() {
    this.tabs = [];
    this.activeTabId = null;
    this.nextId = 1;
  }
  
  // 创建标签页
  createTab(url, title) {
    const tab = {
      id: this.nextId++,
      url: url,
      title: title,
      partition: 'default'
    };
    this.tabs.push(tab);
    console.log(`✨ 创建标签页 ID:${tab.id} 标题:${title}`);
    
    // 如果是第一个标签页，自动激活
    if (this.tabs.length === 1) {
      this.activeTabId = tab.id;
    }
    
    return tab;
  }
  
  // 激活标签页
  activateTab(id) {
    const tab = this.tabs.find(t => t.id === id);
    if (tab) {
      this.activeTabId = id;
      console.log(`🎯 激活标签页 ID:${id} 标题:${tab.title}`);
    }
  }
  
  // 关闭标签页
  closeTab(id) {
    const index = this.tabs.findIndex(t => t.id === id);
    if (index >= 0) {
      const tab = this.tabs[index];
      this.tabs.splice(index, 1);
      console.log(`❌ 关闭标签页 ID:${id} 标题:${tab.title}`);
      
      // 如果关闭的是活跃标签页，需要切换到其他标签页
      if (this.activeTabId === id && this.tabs.length > 0) {
        this.activeTabId = this.tabs[0].id;
        console.log(`🔄 切换到标签页 ID:${this.activeTabId}`);
      } else if (this.tabs.length === 0) {
        this.activeTabId = null;
        console.log('📭 所有标签页已关闭');
      }
      
      return true;
    }
    return false;
  }
  
  // 内存保护：关闭除激活标签页外的所有标签页
  closeInactiveTabs() {
    console.log('\n🚨 执行内存保护：关闭除激活标签页外的所有标签页...');
    console.log(`当前总标签页数: ${this.tabs.length}`);
    console.log(`当前激活标签页ID: ${this.activeTabId}`);
    
    if (!this.activeTabId) {
      console.log('⚠️ 没有激活的标签页');
      return { success: false, closedCount: 0 };
    }
    
    const tabsToClose = this.tabs.filter(tab => tab.id !== this.activeTabId);
    console.log(`计划关闭 ${tabsToClose.length} 个非激活标签页`);
    
    let closedCount = 0;
    for (const tab of tabsToClose) {
      if (this.closeTab(tab.id)) {
        closedCount++;
      }
    }
    
    console.log(`✅ 内存保护完成：关闭了 ${closedCount} 个标签页`);
    this.showCurrentTabs();
    
    return { success: true, closedCount };
  }
  
  showCurrentTabs() {
    console.log('\n📊 当前标签页状态:');
    if (this.tabs.length === 0) {
      console.log('  (无标签页)');
    } else {
      this.tabs.forEach(tab => {
        const isActive = tab.id === this.activeTabId ? '🟢' : '⚪';
        console.log(`  ID:${tab.id} ${isActive} ${tab.title} (${tab.url})`);
      });
    }
  }
}

// 测试场景
function runTest() {
  const manager = new MockTabManager();
  
  console.log('\n=== 测试场景：内存保护功能 ===');
  
  // 创建多个标签页
  manager.createTab('https://example1.com', '示例网站1');
  manager.createTab('https://example2.com', '示例网站2');
  manager.createTab('https://example3.com', '示例网站3');
  manager.createTab('https://example4.com', '示例网站4');
  manager.createTab('https://example5.com', '示例网站5');
  
  // 激活第3个标签页
  manager.activateTab(3);
  
  manager.showCurrentTabs();
  
  // 模拟内存使用率超过90%，触发保护
  console.log('\n🚨 模拟内存使用率超过90%，触发保护机制...');
  manager.closeInactiveTabs();
  
  console.log('\n=== 测试完成 ===');
}

// 运行测试
runTest();
