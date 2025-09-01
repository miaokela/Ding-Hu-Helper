# Multi-Browser 版本限制功能说明

## 功能概述

Multi-Browser 现在支持三种版本的软件打包：

1. **试用版**: 3天有效期
2. **季度版**: 90天有效期
3. **功能测试版**: 5分钟有效期（用于快速测试）

每个版本都会在界面右上角显示实时倒计时，并在过期时阻止软件继续使用。

## 版本特性

### 试用版
- 使用期限：3天
- 产品名称：`Multi-Browser 试用版`
- 输出目录：`dist_trial`
- 标识颜色：橙色

### 季度版
- 使用期限：90天
- 产品名称：`Multi-Browser 季度版`
- 输出目录：`dist_quarterly`
- 标识颜色：蓝色

### 功能测试版
- 使用期限：5分钟
- 产品名称：`Multi-Browser 功能测试版`
- 输出目录：`dist_test`
- 标识颜色：紫色
- 特殊功能：显示秒数倒计时，便于观察过期机制

## 界面展示

### 倒计时显示
在应用程序右上角会显示：
- 版本标识（试用版/季度版）
- 剩余时间倒计时（天数 + 时:分格式）
- 颜色状态指示：
  - 绿色：剩余时间充足（>3天）
  - 黄色：剩余时间不多（1-3天）
  - 橙色：即将过期（≤1天）
  - 红色：已过期

### 过期处理
当软件过期时：
- 显示过期提示对话框
- 禁止继续使用软件
- 自动关闭应用程序

## 构建命令

### 构建试用版
```bash
yarn build:trial
```

### 构建季度版
```bash
yarn build:quarterly
```

### 构建功能测试版
```bash
yarn build:test
```

### 构建所有版本
```bash
yarn build:all
```

## 技术实现

### 版本配置
- 打包时间在构建时自动记录
- 版本类型通过构建参数指定
- 到期时间根据版本类型自动计算

### 安全机制
- 版本信息在构建时写入代码，无法轻易修改
- 时间检查在客户端进行，基于系统时间
- 过期后强制关闭应用程序

### 文件结构
```
scripts/
├── prepare-build.cjs    # 构建前准备脚本
└── cleanup-build.cjs    # 构建后清理脚本

src/
├── utils/
│   └── version.ts       # 版本管理工具函数
└── components/
    └── version-countdown/
        └── index.vue    # 倒计时组件
```

## 开发注意事项

1. **开发环境**: 倒计时组件在开发环境中默认显示为试用版，不会真正过期
2. **构建流程**: 构建脚本会自动处理版本配置的注入和清理
3. **时间精度**: 倒计时精度为分钟，每分钟更新一次
4. **兼容性**: 支持所有Electron支持的平台

## 使用示例

```typescript
// 获取版本信息
import { getVersionName, calculateCountdown, isVersionExpired } from '@/utils/version';

// 检查是否过期
if (isVersionExpired()) {
  console.log('软件已过期');
}

// 获取倒计时信息
const countdown = calculateCountdown();
console.log(`剩余时间: ${countdown.remainingDays}天 ${countdown.remainingHours}:${countdown.remainingMinutes}`);
```

## 版本管理

每次构建都会生成独立的安装包：
- `dist_trial/` - 试用版安装包
- `dist_quarterly/` - 季度版安装包
- `dist_test/` - 功能测试版安装包

三个版本可以独立分发，具有不同的产品名称和有效期。

## 开发注意事项

1. **开发环境**: 倒计时组件在开发环境中默认显示为功能测试版，剩余3分钟，便于快速测试
2. **测试版用途**: 功能测试版专门用于验证版本限制功能，5分钟后自动过期
3. **时间显示**: 功能测试版会显示秒数，其他版本只显示时:分格式
4. **时间同步**: 每秒更新显示，每分钟进行时间同步校准
