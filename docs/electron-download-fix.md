# Electron 下载问题解决方案

## 问题描述
Electron 从 GitHub 下载失败，连接超时：
```
dial tcp 20.205.243.166:443: connectex: A connection attempt failed
```

## 解决方案

### 方案1：使用国内镜像源（推荐）

已在项目中配置了以下镜像：

#### .npmrc 文件配置：
```
electron_mirror=https://mirrors.ustc.edu.cn/electron/
electron_custom_dir={{ version }}
registry=https://registry.npmmirror.com
```

#### package.json 配置：
```json
"electronDownload": {
  "mirror": "https://mirrors.ustc.edu.cn/electron/",
  "customDir": "{{ version }}"
}
```

### 方案2：备用镜像源

如果中科大镜像失败，可以尝试其他镜像：

1. **清华镜像**：
   ```bash
   set ELECTRON_MIRROR=https://mirrors.tuna.tsinghua.edu.cn/electron/
   ```

2. **华为镜像**：
   ```bash
   set ELECTRON_MIRROR=https://repo.huaweicloud.com/electron/
   ```

3. **腾讯镜像**：
   ```bash
   set ELECTRON_MIRROR=https://mirrors.cloud.tencent.com/electron/
   ```

### 方案3：手动下载（最后手段）

1. 访问镜像地址下载对应版本：
   - https://mirrors.ustc.edu.cn/electron/37.2.5/electron-v37.2.5-win32-x64.zip

2. 放置到正确位置：
   ```
   %USERPROFILE%\.electron\37.2.5\electron-v37.2.5-win32-x64.zip
   ```

## 使用方法

1. 运行 `setup-electron-mirror.bat` 设置镜像
2. 删除 node_modules: `rd /s /q node_modules`
3. 清理缓存: `yarn cache clean`
4. 重新安装: `yarn install`

## 验证安装

```bash
yarn dev
```

如果 Electron 成功启动，说明安装成功。
