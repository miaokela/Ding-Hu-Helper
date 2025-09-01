@echo off
chcp 65001 >nul
echo ===========================================
echo Multi-Browser 试用版 - 最终打包
echo ===========================================
echo.

cd /d "%~dp0"

echo 正在创建分发包...
set DIST_DIR=dist_trial\win-unpacked
set OUTPUT_ZIP=Multi-Browser-Trial-v1.0-Win64.zip

if exist "%OUTPUT_ZIP%" del "%OUTPUT_ZIP%"

echo 压缩应用程序...
powershell -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%OUTPUT_ZIP%' -Force"

if exist "%OUTPUT_ZIP%" (
    echo.
    echo ✅ 打包成功！
    echo.
    echo 📦 发布包: %OUTPUT_ZIP%
    echo 📂 大小: 
    dir "%OUTPUT_ZIP%" | find "%OUTPUT_ZIP%"
    echo.
    echo 🚀 启动试用版测试:
    cd "%DIST_DIR%"
    start "" "Multi-Browser 试用版.exe"
    echo.
    echo ===========================================
    echo 🎉 Multi-Browser 试用版构建完成！
    echo ===========================================
    echo.
    echo 试用版信息:
    echo   - 产品名称: Multi-Browser 试用版  
    echo   - 使用期限: 3 天
    echo   - 构建时间: %date% %time%
    echo   - 发布包: %OUTPUT_ZIP%
    echo   - 目标平台: Windows x64
    echo.
    echo 可以将 %OUTPUT_ZIP% 分发给用户！
    echo ===========================================
) else (
    echo ❌ 打包失败！
)

pause
