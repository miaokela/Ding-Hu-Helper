# 🌐 Multi-Browser 标签页拖拽功能

## 📋 功能概述

为Multi-Browser项目实现了完整的标签页拖拽功能，包括：

### 🔄 标签页重排序
- **域名标签页重排序**: 在域名导航栏中拖拽域名标签页改变顺序
- **WebView标签页重排序**: 在浏览器页面中拖拽WebView标签页改变顺序
- **实时排序**: 拖拽过程中提供视觉反馈，松开鼠标立即生效

### 🪟 分离新窗口
- **域名分离**: 将域名标签页拖拽到容器外部，创建独立的浏览器窗口
- **WebView分离**: 将WebView标签页拖拽到容器外部，在新窗口中打开该页面
- **智能检测**: 自动识别拖拽意图，区分重排序和分离操作

## 🚀 技术实现

### 核心技术栈
- **HTML5 Drag & Drop API**: 原生拖拽支持
- **Vue 3 组合式API**: 响应式状态管理
- **TypeScript**: 类型安全的开发体验
- **CSS3 动画**: 流畅的视觉效果
- **Electron API**: 新窗口创建和管理

### 主要组件修改

#### 1. 域名导航组件 (`src/components/domain-nav/index.vue`)

**新增状态管理**:
```typescript
const dragState = ref({
  isDragging: false,
  draggedDomain: null,
  dragOverIndex: -1,
  dragStartIndex: -1,
  isDetached: false,
  cloneElement: null
});
```

**新增事件处理器**:
- `onDragStart()`: 开始拖拽时的处理
- `onDragOver()`: 拖拽经过时的处理
- `onDrop()`: 放置时的处理
- `onDragEnd()`: 拖拽结束时的处理

**新增发射事件**:
- `reorderDomains`: 域名重排序事件
- `detachDomain`: 域名分离事件

#### 2. 浏览器页面组件 (`src/components/browser-page/index.vue`)

**新增拖拽状态**:
```typescript
const dragState = ref({
  isDragging: false,
  draggedTab: null,
  dragOverIndex: -1,
  dragStartIndex: -1,
  isDetached: false,
  cloneElement: null
});
```

**新增功能函数**:
- `reorderTabs()`: 标签页重排序逻辑
- `detachTabToNewWindow()`: 分离标签页为新窗口
- `resetTabDragState()`: 重置拖拽状态

#### 3. 主应用组件 (`src/App.vue`)

**新增事件处理器**:
```typescript
function handleReorderDomains(data) {
  // 处理域名重排序逻辑
}

function handleDetachDomain(domain) {
  // 处理域名分离为新窗口
}
```

## 🎨 视觉效果

### CSS样式文件 (`src/styles/drag-drop.css`)

**拖拽状态样式**:
- `.dragging`: 拖拽中的元素样式
- `.drag-over`: 拖拽目标区域高亮
- `.drag-detached`: 拖拽到外部区域的样式

**动画效果**:
- `pulse-red`: 红色脉冲动画
- `fadeInOut`: 淡入淡出动画
- `dash`: 虚线边框动画

## 📖 使用说明

### 域名标签页操作

1. **重新排序**:
   - 在域名导航栏中找到要移动的域名标签页
   - 按住鼠标左键开始拖拽
   - 拖拽到目标位置（会显示蓝色指示线）
   - 松开鼠标完成排序

2. **分离窗口**:
   - 按住鼠标左键拖拽域名标签页
   - 将标签页拖拽到容器外部区域（会显示红色指示）
   - 松开鼠标创建新窗口
   - 原域名实例自动关闭

### WebView标签页操作

1. **重新排序**:
   - 在WebView标签页栏中拖拽标签页
   - 移动到目标位置（显示蓝色边框）
   - 松开鼠标完成排序

2. **分离窗口**:
   - 拖拽WebView标签页到容器外部
   - 显示红色边框表示即将分离
   - 松开鼠标在新窗口中打开该页面
   - 原标签页自动关闭

## ⚙️ 配置选项

### 拖拽敏感度设置
```typescript
// 检测外部区域的边界值
const isOutside = event.clientY < containerRect.top - 50 || 
                 event.clientY > containerRect.bottom + 50 ||
                 event.clientX < containerRect.left - 50 ||
                 event.clientX > containerRect.right + 50;
```

### 新窗口配置
```typescript
// 新窗口创建参数
{
  url: domain.url,
  title: domain.name,
  partition: domain.partition,
  width: 1200,
  height: 800
}
```

## 🔧 开发调试

### 控制台日志
拖拽操作会在浏览器控制台输出详细的调试信息：

```javascript
console.log('开始拖拽域名:', domain.name, '索引:', index);
console.log('检测到拖拽到外部区域，准备分离窗口');
console.log('域名重新排序完成，新顺序:', openDomains.value.map(d => d.name));
```

### 状态监控
可以通过Vue DevTools监控拖拽状态的变化：
- `dragState.isDragging`: 是否正在拖拽
- `dragState.dragOverIndex`: 当前悬停的目标索引
- `dragState.isDetached`: 是否已脱离容器

## 🚨 注意事项

### 浏览器兼容性
- 需要支持HTML5 Drag & Drop API的现代浏览器
- 建议使用Chrome、Firefox、Edge等主流浏览器

### Electron API依赖
- 分离新窗口功能依赖Electron的`createNewWindow` API
- 如果API不可用，会回退到传统的`window.open()`方法

### 性能考虑
- 拖拽过程中会创建DOM克隆用于视觉效果
- 操作完成后会自动清理临时元素，避免内存泄漏

## 🎯 最佳实践

### 用户体验
1. **提供清晰的视觉反馈**: 使用颜色和动画指示拖拽状态
2. **支持取消操作**: 按ESC键或拖回原位置取消操作
3. **保持状态一致性**: 确保拖拽后的状态正确保存

### 代码维护
1. **模块化设计**: 将拖拽逻辑封装在独立的函数中
2. **类型安全**: 使用TypeScript确保类型安全
3. **错误处理**: 添加适当的错误处理和降级方案

## 🔮 未来扩展

### 可能的功能增强
1. **批量操作**: 支持多选标签页进行批量拖拽
2. **拖拽到其他域名**: 支持将WebView标签页拖拽到其他域名容器
3. **自定义拖拽区域**: 允许用户自定义拖拽的有效区域
4. **拖拽历史**: 记录拖拽操作历史，支持撤销重做

### 性能优化
1. **虚拟滚动**: 处理大量标签页时的性能优化
2. **懒加载**: 延迟加载非活跃标签页的内容
3. **内存管理**: 优化拖拽过程中的内存使用

---

## 📄 更新日志

### v1.0.0 (2025-08-22)
- ✨ 新增域名标签页拖拽重排序功能
- ✨ 新增WebView标签页拖拽重排序功能  
- ✨ 新增标签页分离为新窗口功能
- 🎨 添加拖拽视觉效果和动画
- 📚 完善使用说明和技术文档
- 🔧 优化代码结构和类型安全

---

**开发者**: GitHub Copilot  
**项目**: Multi-Browser  
**更新时间**: 2025年8月22日
