@echo off
echo 开始构建永久版本...

REM 清理之前的构建
if exist "dist" rmdir /s /q "dist"

REM 设置环境变量为永久版本
set NODE_ENV=production
set VERSION_TYPE=permanent
set WIN_CSC_LINK=

echo 版本类型: %VERSION_TYPE%

REM 执行构建
call yarn build:electron

REM 执行打包
call yarn package

echo 永久版本构建完成！
pause
