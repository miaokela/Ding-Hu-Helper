@echo off
echo 设置 electron-builder 环境变量以避免下载问题...

:: 设置镜像和跳过选项
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set WIN_CSC_LINK=
set ELECTRON_BUILDER_CACHE=%TEMP%\electron-builder-cache
set SKIP_BINARY_DOWNLOAD_FOR_MODULE=true

:: 创建缓存目录
if not exist "%TEMP%\electron-builder-cache" mkdir "%TEMP%\electron-builder-cache"

echo 环境变量设置完成:
echo ELECTRON_BUILDER_BINARIES_MIRROR=%ELECTRON_BUILDER_BINARIES_MIRROR%
echo ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=%ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES%
echo WIN_CSC_LINK=%WIN_CSC_LINK%
echo ELECTRON_BUILDER_CACHE=%ELECTRON_BUILDER_CACHE%

echo.
echo 开始构建...
yarn build:trial

pause
