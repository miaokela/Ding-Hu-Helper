# 试用版期限修改完成 ✅

## 修改内容

试用版的有效期已从 **7天** 修改为 **3天**。

## 修改的文件

### 1. scripts/prepare-build.cjs
```javascript
// 修改前
[VERSION_TYPES.TRIAL]: {
  name: '试用版',
  days: 7,           // ❌ 原来是7天
  buildSuffix: '_trial'
}

// 修改后  
[VERSION_TYPES.TRIAL]: {
  name: '试用版',
  days: 3,           // ✅ 现在是3天
  buildSuffix: '_trial'
}
```

### 2. src/utils/version.ts
```typescript
// 修改前
export enum VersionType {
  TRIAL = 'trial',      // 试用版：7天
  // ...
}

if (versionType === VersionType.TRIAL) {
  daysLimit = 7;      // ❌ 原来是7天
  // ...
}

// 修改后
export enum VersionType {
  TRIAL = 'trial',      // 试用版：3天
  // ...
}

if (versionType === VersionType.TRIAL) {
  daysLimit = 3;      // ✅ 现在是3天
  // ...
}
```

### 3. 文档更新
- `docs/version-control.md` - 更新试用版期限说明
- `docs/test-version-added.md` - 更新版本对比表格

## 验证结果

### ✅ 构建配置测试通过
```bash
$ node scripts/prepare-build.cjs trial
正在为 trial 版本准备构建配置...
构建时间: 8/17/2025, 9:47:29 AM
已配置 试用版 构建:
- 产品名称: Multi-Browser 试用版
- 使用期限: 3 天                    # ✅ 正确显示3天
- 到期时间: 8/20/2025, 9:47:29 AM   # ✅ 3天后的时间
- 输出目录: dist_trial
```

## 影响的版本类型

| 版本类型 | 有效期 | 修改状态 |
|---------|-------|---------|
| 试用版 | 3天 | ✅ 已修改 |
| 季度版 | 90天 | ⭕ 未变更 |
| 功能测试版 | 5分钟 | ⭕ 未变更 |

## 使用说明

现在构建试用版时，用户将获得：
- **3天**的使用期限（从构建时间开始计算）
- 倒计时显示剩余时间
- 过期后自动关闭应用程序

### 构建命令保持不变
```bash
yarn build:trial      # 构建3天试用版
yarn build:quarterly  # 构建90天季度版
yarn build:test       # 构建5分钟测试版
yarn build:all        # 构建所有版本
```

## 技术细节

### 时间计算
- 构建时间戳：`Date.now()`
- 到期时间：`buildTime + (3 * 24 * 60 * 60 * 1000)`  // 3天的毫秒数
- 倒计时精度：秒级更新（测试版）/ 分钟级显示（其他版本）

### 开发环境
开发环境中的模拟时间也会相应调整，便于测试3天期限的倒计时功能。

🎉 **试用版期限修改完成，现在是3天有效期！**
