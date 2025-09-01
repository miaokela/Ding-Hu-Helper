@echo off
chcp 65001 >nul
echo ==========================================
echo 手动解压 winCodeSign 并构建
echo ==========================================
echo.

:: 设置缓存目录
set CACHE_DIR=%TEMP%\electron-builder-cache\winCodeSign

echo 清理旧的缓存...
if exist "%CACHE_DIR%" rmdir /s /q "%CACHE_DIR%" 2>nul
mkdir "%CACHE_DIR%" 2>nul

echo 解压 winCodeSign (跳过符号链接)...
if exist "winCodeSign-2.6.0.7z" (
    :: 使用 7-Zip 解压，跳过符号链接错误
    "%~dp0node_modules\7zip-bin\win\x64\7za.exe" x "winCodeSign-2.6.0.7z" -o"%CACHE_DIR%\extracted" -y 2>nul
    
    if exist "%CACHE_DIR%\extracted" (
        echo ✅ winCodeSign 解压成功
        
        :: 设置环境变量
        set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
        set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
        set WIN_CSC_LINK=
        set CSC_IDENTITY_AUTO_DISCOVERY=false
        set ELECTRON_BUILDER_CACHE=%TEMP%\electron-builder-cache
        set SKIP_NOTARIZATION=true
        
        echo 开始构建...
        yarn run build:trial
    ) else (
        echo ❌ 解压失败，使用简化构建...
        echo 改为目录输出模式...
        
        :: 临时修改为 dir 目标
        powershell -Command "(Get-Content package.json) -replace '\"target\": \"nsis\"', '\"target\": \"dir\"' | Set-Content package.json"
        
        set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
        yarn run build:trial
        
        :: 恢复原配置
        powershell -Command "(Get-Content package.json) -replace '\"target\": \"dir\"', '\"target\": \"nsis\"' | Set-Content package.json"
    )
) else (
    echo ❌ 未找到 winCodeSign-2.6.0.7z 文件
)

echo.
echo ==========================================
