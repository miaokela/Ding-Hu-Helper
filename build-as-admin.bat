@echo off
echo 请以管理员权限运行此脚本

:: 检查管理员权限
net session >nul 2>&1
if %errorLevel% == 0 (
    echo 管理员权限确认
    echo 开始构建...
    cd /d "C:\Project\Multi-Browser"
    yarn build:trial
) else (
    echo 错误：需要管理员权限来创建符号链接
    echo 请右键点击此文件，选择"以管理员身份运行"
    pause
)

pause
