@echo off
:: 设置终端为UTF-8编码以正确显示中文
chcp 65001 >nul

echo ==========================================
echo Multi-Browser 开发环境 - 中文支持
echo ==========================================
echo.
echo ✅ 终端编码已设置为 UTF-8 (65001)
echo ✅ 现在可以正确显示中文了
echo.
echo 常用命令:
echo   yarn dev          - 启动开发服务器
echo   yarn build:trial  - 构建试用版
echo   launch-trial.bat  - 启动试用版应用
echo.
echo ==========================================

:: 保持在项目根目录
cd /d "%~dp0"
