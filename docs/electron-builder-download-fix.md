# electron-builder 下载问题解决方案

## 问题描述
electron-builder 在尝试下载 winCodeSign 工具时失败：
```
⨯ Get "https://github.com/electron-userland/electron-builder-binaries/releases/download/winCodeSign-2.6.0/winCodeSign-2.6.0.7z"
```

## 解决方案

### 1. 修改 package.json 配置

在 `build` 部分添加 Windows 特定配置：
```json
"win": {
  "icon": "electron/multi-browser-logo.png",
  "target": "nsis",
  "requestedExecutionLevel": "asInvoker"
}
```

添加构建优化选项：
```json
"removePackageScripts": true,
"compression": "store"
```

### 2. 设置环境变量

```bash
set ELECTRON_BUILDER_CACHE=C:\temp\electron-builder-cache
set ELECTRON_SKIP_BINARY_DOWNLOAD=1
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
```

### 3. 备用解决方案

如果仍然有问题，可以：

#### A. 使用便携版构建
```json
"win": {
  "target": "portable"
}
```

#### B. 手动下载工具
```bash
# 手动下载 winCodeSign 到缓存目录
mkdir C:\temp\electron-builder-cache
# 下载文件到该目录
```

#### C. 使用不同的目标格式
```json
"win": {
  "target": [
    {
      "target": "dir",
      "arch": ["x64"]
    }
  ]
}
```

### 4. 验证修复

```bash
yarn build:trial
```

## 注意事项

1. 跳过代码签名适用于开发和测试阶段
2. 生产环境发布时需要考虑代码签名
3. 可以使用 `compression: "store"` 加快打包速度
4. 环境变量设置后在当前会话中有效

这些修改可以绕过网络下载问题，让打包过程顺利完成。
