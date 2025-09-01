@echo off
chcp 65001 >nul
echo ==========================================
echo Multi-Browser - 使用本地 winCodeSign 构建
echo ==========================================
echo.

:: 设置环境变量禁用下载
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set WIN_CSC_LINK=
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_BUILDER_CACHE=%TEMP%\electron-builder-cache
set SKIP_NOTARIZATION=true

echo 检查本地 winCodeSign 文件...
if exist "winCodeSign-2.6.0.7z" (
    echo ✅ 找到本地 winCodeSign 文件
    
    :: 创建缓存目录
    if not exist "%TEMP%\electron-builder-cache\winCodeSign" (
        mkdir "%TEMP%\electron-builder-cache\winCodeSign"
    )
    
    :: 复制文件到缓存位置
    copy "winCodeSign-2.6.0.7z" "%TEMP%\electron-builder-cache\winCodeSign\" >nul 2>&1
    echo ✅ winCodeSign 已复制到缓存目录
) else (
    echo ⚠️  未找到 winCodeSign-2.6.0.7z 文件
)

echo.
echo 开始构建...
yarn run build:trial

echo.
echo ==========================================
