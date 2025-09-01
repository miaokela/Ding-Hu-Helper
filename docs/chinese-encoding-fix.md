# Windows 终端中文乱码解决方案

## 问题原因
Windows CMD 默认使用 GBK 编码（代码页 936），而现代开发工具通常使用 UTF-8 编码，导致中文显示为乱码。

## 解决方法

### 1. 临时解决（当前会话有效）
```bash
chcp 65001
```

### 2. 永久解决方案

#### 方法一：修改批处理文件
在每个 `.bat` 文件开头添加：
```batch
@echo off
chcp 65001 >nul
```

#### 方法二：修改注册表（系统级）
1. 按 `Win + R`，输入 `regedit`
2. 导航到：`HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Command Processor`
3. 新建字符串值：`AutoRun`，值为：`chcp 65001 >nul`

#### 方法三：使用 PowerShell
PowerShell 默认支持 UTF-8，推荐开发时使用 PowerShell 而不是 CMD。

### 3. VS Code 终端设置
在 VS Code 设置中添加：
```json
{
  "terminal.integrated.shellArgs.windows": ["/k", "chcp 65001 >nul"]
}
```

## 已修复的文件
- ✅ `build-simple.bat` - 构建脚本
- ✅ `package-trial.bat` - 打包脚本
- ✅ `launch-trial.bat` - 启动脚本
- ✅ `setup-chinese.bat` - 中文支持脚本

## 验证方法
运行以下命令验证中文显示：
```bash
echo 测试中文显示 - Multi-Browser 试用版
```

## 编码页说明
- `936` - GBK/GB2312 (简体中文)
- `65001` - UTF-8 (Unicode)
- `1252` - Windows-1252 (西欧)

现在所有的批处理脚本都会自动设置 UTF-8 编码，确保中文正确显示！
