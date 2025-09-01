@echo off
REM clear register
reg delete "HKEY_CURRENT_USER\Software\Classes\bytedance" /f >nul 2>&1
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Classes\bytedance" /f >nul 2>&1

reg delete "HKEY_CURRENT_USER\Software\Classes\douyin" /f >nul 2>&1
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Classes\douyin" /f >nul 2>&1

reg delete "HKEY_CURRENT_USER\Software\Classes\toutiao" /f >nul 2>&1
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Classes\toutiao" /f >nul 2>&1

reg delete "HKEY_CURRENT_USER\Software\Classes\xigua" /f >nul 2>&1
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Classes\xigua" /f >nul 2>&1

reg delete "HKEY_CURRENT_USER\Software\Classes\aweme" /f >nul 2>&1
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Classes\aweme" /f >nul 2>&1

reg delete "HKEY_CURRENT_USER\Software\Classes\snssdk" /f >nul 2>&1
reg delete "HKEY_LOCAL_MACHINE\SOFTWARE\Classes\snssdk" /f >nul 2>&1

pause
