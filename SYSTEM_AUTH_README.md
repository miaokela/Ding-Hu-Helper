# 系统账号密码校验功能

为 Multi-Browser 应用添加了系统用户身份验证功能，确保只有当前系统用户才能使用应用。

## 🔐 功能概述

此功能在应用启动时要求用户输入当前系统用户的登录密码进行验证。只有验证成功的用户才能访问应用主界面。

## ✨ 主要特性

- **多平台支持** - 支持 Windows、macOS 和 Linux 系统
- **本地验证** - 使用系统本地API进行密码验证，无需网络连接
- **安全可靠** - 密码不会被存储或记录，仅用于验证
- **用户友好** - 美观的登录界面和良好的用户体验
- **智能检测** - 自动检测系统是否支持认证功能
- **错误处理** - 完善的错误提示和重试机制

## 🚀 实现方式

### 后端实现

1. **系统认证模块** (`electron/system-auth.ts`)
   - 跨平台密码验证逻辑
   - Windows: 使用 PowerShell + .NET AccountManagement
   - macOS: 使用 AppleScript + sudo验证
   - Linux: 使用 sudo命令验证

2. **主进程集成** (`electron/main.ts`)
   - 添加系统认证相关的IPC处理器
   - 提供用户信息获取、密码验证、平台支持检查等API

3. **预加载脚本** (`electron/preload.ts`)
   - 暴露系统认证API到渲染进程
   - 类型安全的API调用

### 前端实现

1. **认证组件** (`src/components/system-auth/SystemAuthModal.vue`)
   - 美观的登录界面
   - 密码输入和验证逻辑
   - 错误处理和用户反馈

2. **主应用集成** (`src/App.vue`)
   - 启动时进行系统认证检查
   - 只有认证成功后才显示主界面
   - 加载状态和错误处理

## 📝 API 接口

### 主进程 IPC 处理器

```typescript
// 获取当前用户信息
ipcMain.handle("system-auth-get-current-user")

// 验证用户密码
ipcMain.handle("system-auth-verify-password", password, username?)

// 检查系统认证支持
ipcMain.handle("system-auth-check-support")
```

### 渲染进程 API

```typescript
// 获取当前用户信息
window.electronAPI.systemAuthGetCurrentUser()

// 验证用户密码
window.electronAPI.systemAuthVerifyPassword(password, username?)

// 检查系统认证支持
window.electronAPI.systemAuthCheckSupport()
```

## 🔧 使用方法

1. **自动启用** - 功能已集成到应用启动流程中，无需额外配置

2. **用户体验** - 应用启动时会自动检查系统认证支持：
   - 支持：显示登录界面要求输入密码
   - 不支持：自动跳过认证直接进入应用

3. **密码验证** - 用户需要输入当前系统账户的登录密码

## 🛠️ 平台支持

### Windows
- **验证方式**: PowerShell + .NET System.DirectoryServices.AccountManagement
- **要求**: Windows 7+ 系统
- **权限**: 需要普通用户权限即可

### macOS
- **验证方式**: AppleScript + sudo验证
- **要求**: macOS 10.12+ 系统
- **权限**: 可能需要在"系统偏好设置"中授权

### Linux
- **验证方式**: sudo 命令验证
- **要求**: 支持sudo的发行版
- **权限**: 需要用户在sudoers中

## ⚠️ 注意事项

1. **首次使用** - 系统可能会询问权限，请选择允许
2. **macOS权限** - 可能需要在"系统偏好设置 → 安全性与隐私"中授权
3. **密码安全** - 密码仅用于验证，不会被存储或传输
4. **错误重试** - 连续输入错误密码建议重启应用
5. **平台兼容** - 不支持的平台会自动跳过认证

## 🔒 安全性

- **本地验证** - 所有验证都在本地进行，不涉及网络传输
- **密码保护** - 用户密码不会被存储、记录或传输到任何位置
- **系统级安全** - 使用操作系统原生的身份验证机制
- **权限控制** - 只有系统的合法用户才能访问应用

## 📄 文件结构

```
electron/
├── system-auth.ts           # 系统认证核心模块
├── main.ts                  # 主进程(包含IPC处理器)
└── preload.ts              # 预加载脚本(API暴露)

src/
├── components/
│   └── system-auth/
│       └── SystemAuthModal.vue  # 认证界面组件
├── types/
│   └── electron-api.d.ts   # API类型定义
└── App.vue                  # 主应用(认证集成)
```

## 🎯 未来增强

- [ ] 支持生物识别认证 (指纹/面部识别)
- [ ] 添加记住认证状态选项
- [ ] 支持多用户切换
- [ ] 增加认证日志记录
- [ ] 添加认证超时设置

---

💡 此功能大大增强了应用的安全性，确保只有系统的合法用户才能访问 Multi-Browser 应用。
