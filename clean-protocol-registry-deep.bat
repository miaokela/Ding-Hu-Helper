@echo off
echo ========================================
echo     完全清除协议注册表 - 深度清理版本
echo ========================================
echo.

:: 管理员权限检查
net session >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ 当前已具备管理员权限
) else (
    echo ❌ 需要管理员权限！请右键"以管理员身份运行"
    pause
    exit /b 1
)

echo.
echo 🧹 开始深度清理所有可能的协议注册...
echo.

:: 定义要清理的协议列表
set protocols=bytedance toutiao douyin xigua aweme snssdk bytedance-frontend bytedance-service bytedance-ads douyin-fe douyin-service douyin-creator multi-browser multi-brower

:: 用户级别注册表清理
echo 📍 清理用户级别注册表...
for %%p in (%protocols%) do (
    reg delete "HKEY_CURRENT_USER\Software\Classes\%%p" /f >nul 2>&1
    if !errorlevel! == 0 (
        echo    ✅ 清理用户级协议: %%p://
    ) else (
        echo    ℹ️ 用户级协议未注册: %%p://
    )
)

:: 系统级别注册表清理
echo.
echo 📍 清理系统级别注册表...
for %%p in (%protocols%) do (
    reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Classes\%%p" /f >nul 2>&1
    if !errorlevel! == 0 (
        echo    ✅ 清理系统级协议: %%p://
    ) else (
        echo    ℹ️ 系统级协议未注册: %%p://
    )
)

:: 清理可能的32位应用注册项
echo.
echo 📍 清理32位应用注册项...
for %%p in (%protocols%) do (
    reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\WOW6432Node\Classes\%%p" /f >nul 2>&1
    if !errorlevel! == 0 (
        echo    ✅ 清理WOW64协议: %%p://
    ) else (
        echo    ℹ️ WOW64协议未注册: %%p://
    )
)

:: 清理用户选择的协议处理器设置
echo.
echo 📍 清理用户协议处理器选择设置...
for %%p in (%protocols%) do (
    reg delete "HKEY_CURRENT_USER\Software\Microsoft\Windows\Shell\Associations\UrlAssociations\%%p" /f >nul 2>&1
    if !errorlevel! == 0 (
        echo    ✅ 清理协议关联: %%p://
    ) else (
        echo    ℹ️ 协议关联未设置: %%p://
    )
)

:: 清理Windows应用商店应用的协议注册
echo.
echo 📍 清理应用商店应用协议注册...
for %%p in (%protocols%) do (
    reg query "HKEY_CURRENT_USER\Software\Classes\Local Settings\Software\Microsoft\Windows\CurrentVersion\AppModel\PackageRepository\Packages" /s /f "%%p" >nul 2>&1
    if !errorlevel! == 0 (
        echo    ⚠️ 发现应用商店相关的%%p协议注册，需要手动检查
    )
)

:: 强制刷新系统图标缓存和关联
echo.
echo 🔄 刷新系统设置...
ie4uinit.exe -show
taskkill /f /im explorer.exe >nul 2>&1
start explorer.exe

echo.
echo ========================================
echo              清理完成！
echo ========================================
echo.
echo 📝 后续建议：
echo 1. 重启计算机以确保所有更改生效
echo 2. 检查默认应用设置中是否还有相关协议
echo 3. 如果问题持续，请检查其他可能注册协议的应用
echo 4. 安全软件可能会拦截协议注册行为
echo.

pause
