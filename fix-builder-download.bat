@echo off
echo 解决 electron-builder 下载问题...

:: 设置环境变量
set ELECTRON_BUILDER_CACHE=C:\temp\electron-builder-cache
set ELECTRON_SKIP_BINARY_DOWNLOAD=1
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true

:: 创建缓存目录
if not exist "C:\temp\electron-builder-cache" mkdir "C:\temp\electron-builder-cache"

echo 环境变量已设置:
echo ELECTRON_BUILDER_CACHE=%ELECTRON_BUILDER_CACHE%
echo ELECTRON_SKIP_BINARY_DOWNLOAD=%ELECTRON_SKIP_BINARY_DOWNLOAD%
echo ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=%ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES%

echo.
echo 现在可以重新运行构建命令:
echo yarn build:trial

pause
