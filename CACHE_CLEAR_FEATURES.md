# 浏览器缓存清除功能说明

## 已实现的功能

### 1. 域名标签页右键菜单清除缓存功能

#### 功能描述
在域名导航栏中的域名标签页上右键点击，会显示一个上下文菜单，其中包含"清除浏览器缓存"选项。

#### 实现位置
- **文件**: `src/components/domain-nav/index.vue`
- **功能**: 添加了 `clearDomainCache` 方法和对应的右键菜单项
- **事件流程**: 
  1. 用户在域名标签页上右键点击
  2. 显示包含"清除浏览器缓存"选项的右键菜单
  3. 点击该选项触发 `clearDomainCache` 事件
  4. 事件传递到父组件 `App.vue` 的 `handleClearDomainCache` 方法
  5. 调用 `BrowserPage` 组件的 `clearPartitionCache` 方法
  6. 清除指定 partition 的所有浏览器实例缓存

#### 清除内容
- 指定域名 partition 下所有标签页的浏览器缓存
- 包括HTTP缓存、localStorage、sessionStorage等

### 2. 应用启动时自动清除所有浏览器实例缓存

#### 功能描述
软件启动时自动清除所有创建过的浏览器实例相关的缓存数据和访问数据。

#### 实现位置
- **文件**: `electron/main.ts`
- **功能**: 添加了 `clearAllBrowserInstanceCaches` 方法
- **触发时机**: 在 `app.whenReady()` 中调用

#### 清除策略
1. **智能清除**: 
   - 尝试从数据库中读取所有域名的 `page_id`
   - 根据 `page_id` 构造对应的 partition 名称进行清除

2. **通用清除**: 
   - 清除默认 session 的缓存和存储数据
   - 清除常见的 partition 模式 (`persist:domain_*`, `persist:page_*` 等)
   - 作为智能清除的备用方案

#### 清除内容
- 所有 session 的 HTTP 缓存
- 所有 partition 的存储数据：
  - cookies
  - filesystem
  - indexedDB
  - localStorage
  - shadercache
  - websql
  - serviceworkers
  - cachestorage

## 技术实现细节

### 前端部分
1. **域名导航组件** (`domain-nav/index.vue`):
   - 增加了 `clearDomainCache` 事件发射
   - 右键菜单增加了清除缓存选项

2. **主应用组件** (`App.vue`):
   - 增加了 `handleClearDomainCache` 方法处理清除缓存事件
   - 通过 ref 调用 BrowserPage 组件的清除方法

3. **浏览器页面组件** (`browser-page/index.vue`):
   - 增加了 `clearPartitionCache` 方法
   - 通过 `defineExpose` 暴露给父组件调用
   - 遍历指定 partition 的所有标签页并清除缓存

### 后端部分
1. **主进程** (`electron/main.ts`):
   - 增加了 `clearAllBrowserInstanceCaches` 方法
   - 在应用启动时自动调用
   - 智能识别数据库中的 partition 并清除

## 使用方法

### 手动清除指定域名缓存
1. 在域名导航栏中找到要清除缓存的域名标签页
2. 右键点击该标签页
3. 在弹出的菜单中点击"清除浏览器缓存"
4. 系统会自动清除该域名下所有浏览器实例的缓存

### 自动清除所有缓存
- 无需手动操作
- 每次启动软件时会自动清除所有浏览器实例的缓存数据
- 清除过程会在控制台输出详细日志

## 注意事项

1. **数据安全**: 清除缓存会导致用户在该域名下的登录状态丢失
2. **性能影响**: 清除缓存后首次访问网站可能会比较慢
3. **日志输出**: 清除过程会在控制台输出详细的执行日志
4. **错误处理**: 如果某些 partition 不存在，会显示相应的提示信息，但不会影响其他 partition 的清除

## 日志示例

### 启动时自动清除日志
```
🧹 开始清除所有浏览器实例的缓存数据...
✅ 默认session缓存已清除
✅ 默认session存储数据已清除
📊 从数据库中发现 3 个partition
✅ 已清除partition "persist:12345678-1234-1234-1234-123456789abc" 的缓存和存储数据
✅ 已清除partition "persist:87654321-4321-4321-4321-cba987654321" 的缓存和存储数据
✅ 所有浏览器实例缓存数据清除完成，尝试了 53 个partition，实际清除了 5 个
```

### 手动清除日志
```
开始清空partition "12345678-1234-1234-1234-123456789abc" 的缓存
清空tab 1640995200000 的缓存
清空tab 1640995210000 的缓存
清空partition "12345678-1234-1234-1234-123456789abc" 缓存完成: 成功 2 个, 失败 0 个
已清空 2 个浏览器实例的缓存
```
