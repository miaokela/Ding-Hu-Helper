@echo off
chcp 65001 >nul
echo ==========================================
echo Multi-Browser - 完全跳过 winCodeSign 构建
echo ==========================================
echo.

:: 设置环境变量
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set WIN_CSC_LINK=
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_BUILDER_CACHE=%TEMP%\electron-builder-cache
set SKIP_NOTARIZATION=true

echo 开始构建 renderer 和 electron...
yarn run build:renderer
if errorlevel 1 (
    echo ❌ Renderer 构建失败
    pause
    exit /b 1
)

yarn run build:electron
if errorlevel 1 (
    echo ❌ Electron 构建失败
    pause
    exit /b 1
)

echo.
echo ✅ 源码构建成功！现在手动复制 Electron 包...

:: 检查是否有现有的应用目录
if exist "dist_trial\win-unpacked" (
    echo 清理旧的构建目录...
    rmdir /s /q "dist_trial\win-unpacked" 2>nul
)

:: 创建目标目录
mkdir "dist_trial\win-unpacked" 2>nul

:: 复制 Electron 预构建包（从 node_modules）
echo 复制 Electron 核心文件...
xcopy "node_modules\electron\dist\*" "dist_trial\win-unpacked\" /E /Y /Q >nul

:: 创建 resources 目录并复制应用文件
echo 复制应用程序文件...
mkdir "dist_trial\win-unpacked\resources" 2>nul
xcopy "dist\*" "dist_trial\win-unpacked\resources\app\" /E /Y /Q >nul

:: 复制数据库和资源文件
copy "domains.db" "dist_trial\win-unpacked\resources\" >nul
copy "electron\multi-browser-logo.png" "dist_trial\win-unpacked\resources\" >nul

:: 重命名主执行文件
if exist "dist_trial\win-unpacked\electron.exe" (
    ren "dist_trial\win-unpacked\electron.exe" "Multi-Browser 试用版.exe"
)

echo.
echo 🎉 手动构建完成！
echo.
echo 📁 应用程序位置: dist_trial\win-unpacked\Multi-Browser 试用版.exe
echo.
echo 启动应用测试...
cd "dist_trial\win-unpacked"
start "" "Multi-Browser 试用版.exe"

echo.
echo ==========================================
