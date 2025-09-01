// 测试智能内存保护功能
console.log('🧪 测试智能内存保护功能...');

// 模拟WebView管理
class MockWebViewManager {
  constructor() {
    this.webviews = [];
    this.nextId = 1;
  }
  
  // 创建WebView
  createWebView(url) {
    const webview = {
      id: this.nextId++,
      url: url,
      createdAt: Date.now(),
      isActive: false
    };
    this.webviews.push(webview);
    console.log(`✨ 创建WebView ID:${webview.id} URL:${url}`);
    return webview;
  }
  
  // 模拟激活WebView
  activateWebView(id) {
    this.webviews.forEach(wv => wv.isActive = false);
    const webview = this.webviews.find(wv => wv.id === id);
    if (webview) {
      webview.isActive = true;
      console.log(`🎯 激活WebView ID:${id}`);
    }
  }
  
  // 模拟智能关闭策略
  smartCloseInactiveWebviews(activeIds = []) {
    console.log(`\n🛡️ 执行智能内存保护...`);
    console.log(`当前WebView数量: ${this.webviews.length}`);
    console.log(`激活ID列表: [${activeIds.join(', ')}]`);
    
    let closedCount = 0;
    
    if (activeIds.length === 0) {
      console.log('📋 没有明确的激活列表，采用保守策略：保留最新的2个');
      
      // 按ID降序排序（ID越大越新）
      const sorted = [...this.webviews].sort((a, b) => b.id - a.id);
      const toClose = sorted.slice(2);
      
      toClose.forEach(wv => {
        console.log(`❌ 关闭WebView ID:${wv.id} (${wv.url})`);
        const index = this.webviews.findIndex(w => w.id === wv.id);
        if (index > -1) {
          this.webviews.splice(index, 1);
          closedCount++;
        }
      });
      
      console.log(`✅ 保守策略完成：保留${Math.min(2, sorted.length)}个，关闭${closedCount}个`);
    } else {
      console.log('📋 使用明确的激活列表');
      
      const toClose = this.webviews.filter(wv => !activeIds.includes(wv.id));
      
      toClose.forEach(wv => {
        console.log(`❌ 关闭非激活WebView ID:${wv.id} (${wv.url})`);
        const index = this.webviews.findIndex(w => w.id === wv.id);
        if (index > -1) {
          this.webviews.splice(index, 1);
          closedCount++;
        }
      });
      
      console.log(`✅ 精确策略完成：关闭${closedCount}个非激活WebView`);
    }
    
    console.log(`🏁 保护完成，剩余WebView: ${this.webviews.length}个`);
    this.showCurrentWebViews();
    
    return { success: true, closedCount };
  }
  
  showCurrentWebViews() {
    console.log('\n📊 当前WebView状态:');
    if (this.webviews.length === 0) {
      console.log('  (无WebView)');
    } else {
      this.webviews.forEach(wv => {
        console.log(`  ID:${wv.id} ${wv.isActive ? '🟢' : '⚪'} ${wv.url}`);
      });
    }
  }
}

// 测试场景
function runTest() {
  const manager = new MockWebViewManager();
  
  console.log('\n=== 测试场景1: 保守策略（无激活列表）===');
  
  // 创建5个WebView
  manager.createWebView('https://example1.com');
  manager.createWebView('https://example2.com');
  manager.createWebView('https://example3.com');
  manager.createWebView('https://example4.com');
  manager.createWebView('https://example5.com');
  
  manager.activateWebView(4);
  manager.showCurrentWebViews();
  
  // 模拟内存超过90%，触发保护
  console.log('\n🚨 模拟内存超过90%，触发自动保护...');
  manager.smartCloseInactiveWebviews();
  
  console.log('\n=== 测试场景2: 精确策略（有激活列表）===');
  
  // 重新创建WebView
  manager.webviews = [];
  manager.nextId = 1;
  
  const wv1 = manager.createWebView('https://site1.com');
  const wv2 = manager.createWebView('https://site2.com');
  const wv3 = manager.createWebView('https://site3.com');
  const wv4 = manager.createWebView('https://site4.com');
  
  manager.activateWebView(2);
  manager.activateWebView(4);
  manager.showCurrentWebViews();
  
  // 使用明确的激活列表
  console.log('\n🚨 模拟内存超过90%，使用明确的激活列表...');
  manager.smartCloseInactiveWebviews([2, 4]);
  
  console.log('\n🏁 所有测试完成！');
}

// 运行测试
runTest();
