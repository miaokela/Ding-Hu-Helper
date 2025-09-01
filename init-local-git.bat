@echo off
chcp 65001 >nul
echo ==========================================
echo 初始化本地 Git 仓库（不关联远程）
echo ==========================================
echo.

echo 初始化 Git 仓库...
git init

echo 添加所有文件到暂存区...
git add .

echo 创建初始提交...
git commit -m "初始提交: Multi-Browser 项目"

echo 查看状态...
git status

echo.
echo ✅ 本地 Git 仓库初始化完成！
echo 📁 这是一个纯本地仓库，没有关联任何远程仓库
echo.
echo 常用 Git 命令:
echo   git status        - 查看状态
echo   git add .         - 添加所有文件
echo   git commit -m ""  - 提交更改
echo   git log           - 查看提交历史
echo.
echo ==========================================
