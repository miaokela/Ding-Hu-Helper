@echo off
chcp 65001 >nul
echo ==========================================
echo 彻底清理 Git 相关文件和配置
echo ==========================================
echo.

echo 检查并删除可能的 Git 配置文件...
if exist ".git" (
    echo 发现 .git 目录，正在删除...
    rmdir /s /q ".git"
    echo ✅ .git 目录已删除
) else (
    echo ✅ 没有发现 .git 目录
)

if exist ".gitmodules" (
    echo 发现 .gitmodules 文件，正在删除...
    del ".gitmodules"
    echo ✅ .gitmodules 文件已删除
) else (
    echo ✅ 没有发现 .gitmodules 文件
)

echo.
echo 检查 .gitignore 文件...
if exist ".gitignore" (
    echo 📁 保留 .gitignore 文件（用于将来的版本控制）
) else (
    echo ℹ️  没有 .gitignore 文件
)

echo.
echo ✅ Git 清理完成！
echo 📋 当前项目状态：完全独立，没有任何 Git 关联
echo.
echo 如果需要重新启用版本控制，可以运行：
echo   init-local-git.bat  - 创建本地仓库
echo.
echo ==========================================
