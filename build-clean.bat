@echo off
chcp 65001 >nul
echo ==========================================
echo Multi-Browser - 清理构建（解决 WIN_CSC_LINK 问题）
echo ==========================================
echo.

echo 正在清除可能导致问题的环境变量...
:: 完全清除代码签名相关的环境变量
set "WIN_CSC_LINK="
set "CSC_LINK="
set "CSC_KEY_PASSWORD="
set "CSC_IDENTITY_AUTO_DISCOVERY=false"

:: 设置 electron-builder 缓存路径（使用本地 winCodeSign）
set "ELECTRON_BUILDER_CACHE=%USERPROFILE%\AppData\Local\electron-builder\Cache"

echo ✅ 环境变量已清理
echo ✅ CSC_IDENTITY_AUTO_DISCOVERY=false
echo ✅ ELECTRON_BUILDER_CACHE=%ELECTRON_BUILDER_CACHE%

echo.
echo 开始构建 trial 版本...
echo ==========================================

:: 运行原始构建命令
yarn build:trial

echo.
echo ==========================================
if %ERRORLEVEL% EQU 0 (
    echo ✅ 构建成功完成！
    echo 📁 输出目录: dist_trial\
) else (
    echo ❌ 构建失败，错误代码: %ERRORLEVEL%
)
echo ==========================================

pause
