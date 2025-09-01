@echo off
chcp 65001 >nul
echo ===========================================
echo Multi-Browser 试用版构建完成总结
echo ===========================================
echo.
echo 🎉 恭喜！试用版构建成功！
echo.
echo 📍 应用程序位置: 
echo   %~dp0dist_trial\win-unpacked\Multi-Browser 试用版.exe
echo.
echo 📋 试用版信息:
echo   - 产品名称: Multi-Browser 试用版
echo   - 使用期限: 3 天
echo   - 输出目录: dist_trial
echo.
echo 🚀 启动应用程序:
cd "%~dp0dist_trial\win-unpacked"
start "" "Multi-Browser 试用版.exe"
echo.
echo ✅ 应用程序已启动！
echo ===========================================
pause
