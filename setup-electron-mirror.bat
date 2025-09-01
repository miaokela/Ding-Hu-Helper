@echo off
echo 正在设置 Electron 下载镜像...

:: 设置环境变量
set ELECTRON_MIRROR=https://mirrors.ustc.edu.cn/electron/
set ELECTRON_CUSTOM_DIR={{ version }}

:: 备用镜像列表
echo 可用的镜像源:
echo 1. 中科大镜像: https://mirrors.ustc.edu.cn/electron/
echo 2. 清华镜像: https://mirrors.tuna.tsinghua.edu.cn/electron/
echo 3. 华为镜像: https://repo.huaweicloud.com/electron/
echo 4. 腾讯镜像: https://mirrors.cloud.tencent.com/electron/

echo.
echo 当前使用中科大镜像
echo 如果下载失败，请手动下载 Electron:
echo https://mirrors.ustc.edu.cn/electron/37.2.5/electron-v37.2.5-win32-x64.zip
echo.

pause
