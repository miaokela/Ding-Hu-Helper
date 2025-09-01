# WebView拖拽分离功能实现文档

## 🎯 功能概述

实现了完整的WebView标签页拖拽分离功能，包括：

1. **拖拽分离**: 将WebView标签页拖拽到软件外部，自动创建独立窗口
2. **智能合并**: 分离窗口拖拽回主窗口时，自动合并为标签页

## 🚀 核心实现

### 1. Electron主进程 (main.ts)

```typescript
// 创建分离的WebView窗口
ipcMain.handle("create-detached-webview-window", async (event, data) => {
  // 创建新的BrowserWindow
  // 加载包含WebView的HTML页面
  // 实现窗口间拖拽监听
});

// 窗口碰撞检测
ipcMain.handle("get-window-bounds", async (event) => {
  // 获取窗口位置信息
});

// 合并窗口回主窗口
ipcMain.handle("merge-back-to-main", async (event, windowId, tabId) => {
  // 获取WebView状态
  // 通知主窗口恢复标签页
  // 关闭分离窗口
});
```

### 2. 预加载脚本 (preload.ts)

```typescript
contextBridge.exposeInMainWorld("electronAPI", {
  // WebView分离窗口相关API
  createDetachedWebviewWindow: (data) => 
    ipcRenderer.invoke("create-detached-webview-window", data),
  
  getWindowBounds: () => ipcRenderer.invoke("get-window-bounds"),
  getMainWindowBounds: () => ipcRenderer.invoke("get-main-window-bounds"),
  
  // 事件监听
  onRestoreDetachedTab: (callback) => {
    ipcRenderer.on("restore-detached-tab", (_event, data) => callback(data));
  },
});
```

### 3. 前端组件 (browser-page/index.vue)

```vue
<script setup lang="ts">
// 拖拽状态管理
const dragState = ref({
  isDragging: false,
  draggedTab: null,
  isDetached: false
});

// 分离标签页为新窗口
async function detachTabToNewWindow(tab: Tab) {
  const result = await window.electronAPI.createDetachedWebviewWindow({
    url: tab.url,
    title: tab.title,
    partition: tab.partition,
    tabId: tab.id.toString()
  });
  
  if (result.success) {
    closeTab(tab.id); // 关闭原标签页
  }
}

// 恢复分离的标签页
function restoreDetachedTab(data) {
  // 创建新标签页
  // 恢复WebView状态
  // 激活新标签页
}
</script>
```

## 🔧 技术特性

### 智能拖拽检测
- **区域识别**: 自动检测拖拽是重排序还是分离
- **视觉反馈**: 蓝色边框表示重排序，红色表示分离
- **阈值控制**: 50像素外部区域触发分离模式

### 窗口管理
- **多窗口支持**: 基于Electron的BrowserWindow
- **状态保持**: 完整保留WebView的浏览状态
- **内存优化**: 自动清理临时文件和事件监听器

### 碰撞检测算法
```javascript
function checkNearMainWindow(bounds, mainBounds) {
  const tabBarArea = {
    x: mainBounds.x,
    y: mainBounds.y,
    width: mainBounds.width,
    height: 100 // 标签栏区域高度
  };
  
  const threshold = 20; // 接近阈值
  
  return (
    bounds.x + bounds.width > tabBarArea.x - threshold &&
    bounds.x < tabBarArea.x + tabBarArea.width + threshold &&
    bounds.y + 20 > tabBarArea.y - threshold &&
    bounds.y < tabBarArea.y + tabBarArea.height + threshold
  );
}
```

## 📋 使用流程

### 分离WebView标签页
1. 在WebView标签页上按下鼠标左键
2. 拖拽标签页到软件窗口外部区域
3. 当标签页变红色时，松开鼠标
4. 系统自动创建包含该WebView的独立窗口

### 合并回主窗口
1. 拖拽分离窗口，使其顶部接近主窗口
2. 当窗口顶部进入主窗口标签栏区域时
3. 显示"拖拽到这里可以合并回主窗口"提示
4. 松开鼠标完成合并，或点击"合并回主窗口"按钮

## 🛠️ 代码结构

```
src/
├── components/
│   ├── browser-page/
│   │   └── index.vue          # WebView标签页组件
│   └── domain-nav/
│       └── index.vue          # 域名导航组件
├── styles/
│   └── drag-drop.css          # 拖拽样式
└── main.ts                    # 样式引入

electron/
├── main.ts                    # 主进程逻辑
└── preload.ts                 # 预加载脚本

docs/
├── webview-detach-demo.html   # 功能演示页面
└── webview-detach-feature.md  # 本文档
```

## 🔍 调试信息

在开发者工具控制台中，可以看到详细的调试日志：

```
🪟 创建分离的WebView窗口: {url, title, partition, tabId}
✅ 分离窗口创建成功: detached-1234567890-abc123
🔄 恢复分离的标签页: {windowId, tabId, webviewInfo}
✅ 标签页恢复成功
```

## ⚠️ 注意事项

1. **Electron环境依赖**: 此功能必须在Electron环境中运行
2. **权限要求**: 需要窗口创建和IPC通信权限
3. **性能影响**: 分离窗口会增加内存使用，建议限制同时打开的分离窗口数量
4. **兼容性**: 降级方案使用window.open，但无法实现智能合并

## 🚀 未来优化

1. **多显示器支持**: 改进跨显示器的拖拽检测
2. **手势识别**: 添加触摸手势支持
3. **窗口磁吸**: 实现窗口边缘自动对齐功能
4. **批量操作**: 支持多个标签页同时分离

## 📊 测试覆盖

- ✅ 基本拖拽分离功能
- ✅ 智能合并检测
- ✅ 窗口状态保持
- ✅ 错误处理和降级方案
- ✅ 内存清理机制
- ✅ 边界情况处理

---

**实现状态**: ✅ 已完成  
**测试状态**: ✅ 已验证  
**文档状态**: ✅ 已完善
