@echo off
chcp 65001 >nul
cls
echo.
echo ========================================
echo 🎨 转换 ding-logo-modern.svg 为多格式图标
echo ========================================
echo.

echo 第一步: 检查源文件...
if exist "ding-logo-modern.svg" (
    echo ✅ 找到源文件: ding-logo-modern.svg
) else (
    echo ❌ 未找到源文件: ding-logo-modern.svg
    pause
    exit /b 1
)

echo.
echo 第二步: 创建在线转换器...

echo 正在创建 convert-modern-to-png.html...
echo ^<!DOCTYPE html^> > convert-modern-to-png.html
echo ^<html^> >> convert-modern-to-png.html
echo ^<head^> >> convert-modern-to-png.html
echo     ^<meta charset="UTF-8"^> >> convert-modern-to-png.html
echo     ^<title^>转换 Modern Logo 为 PNG^</title^> >> convert-modern-to-png.html
echo     ^<style^> >> convert-modern-to-png.html
echo         body { font-family: Arial; text-align: center; padding: 50px; background: linear-gradient(135deg, #667eea 0%%, #764ba2 100%%); color: white; } >> convert-modern-to-png.html
echo         .container { background: rgba(255,255,255,0.1); padding: 30px; border-radius: 20px; max-width: 600px; margin: 0 auto; } >> convert-modern-to-png.html
echo         button { background: #4CAF50; color: white; padding: 15px 30px; border: none; border-radius: 8px; font-size: 18px; cursor: pointer; } >> convert-modern-to-png.html
echo         button:hover { background: #45a049; } >> convert-modern-to-png.html
echo     ^</style^> >> convert-modern-to-png.html
echo ^</head^> >> convert-modern-to-png.html
echo ^<body^> >> convert-modern-to-png.html
echo     ^<div class="container"^> >> convert-modern-to-png.html
echo         ^<h1^>🎨 Modern Logo 转换器^</h1^> >> convert-modern-to-png.html
echo         ^<p^>点击下面的按钮将 ding-logo-modern.svg 转换为 PNG^</p^> >> convert-modern-to-png.html
echo         ^<input type="file" id="fileInput" accept=".svg" style="display: none;" onchange="convertFile()"^> >> convert-modern-to-png.html
echo         ^<button onclick="document.getElementById('fileInput').click()"^>选择 SVG 文件^</button^> >> convert-modern-to-png.html
echo         ^<br^>^<br^> >> convert-modern-to-png.html
echo         ^<canvas id="canvas" style="display: none;"^>^</canvas^> >> convert-modern-to-png.html
echo         ^<div id="result"^>^</div^> >> convert-modern-to-png.html
echo     ^</div^> >> convert-modern-to-png.html
echo     ^<script^> >> convert-modern-to-png.html
echo         function convertFile() { >> convert-modern-to-png.html
echo             const file = document.getElementById('fileInput').files[0]; >> convert-modern-to-png.html
echo             if (!file) return; >> convert-modern-to-png.html
echo             const reader = new FileReader(); >> convert-modern-to-png.html
echo             reader.onload = function(e) { >> convert-modern-to-png.html
echo                 const canvas = document.getElementById('canvas'); >> convert-modern-to-png.html
echo                 const ctx = canvas.getContext('2d'); >> convert-modern-to-png.html
echo                 const img = new Image(); >> convert-modern-to-png.html
echo                 img.onload = function() { >> convert-modern-to-png.html
echo                     canvas.width = 512; canvas.height = 512; >> convert-modern-to-png.html
echo                     ctx.drawImage(img, 0, 0, 512, 512); >> convert-modern-to-png.html
echo                     canvas.toBlob(function(blob) { >> convert-modern-to-png.html
echo                         const a = document.createElement('a'); >> convert-modern-to-png.html
echo                         a.href = URL.createObjectURL(blob); >> convert-modern-to-png.html
echo                         a.download = 'multi-browser-logo.png'; >> convert-modern-to-png.html
echo                         a.click(); >> convert-modern-to-png.html
echo                         document.getElementById('result').innerHTML = '^<h2 style="color: #4CAF50;"^>✅ PNG 转换完成！^</h2^>^<p^>文件已下载为: multi-browser-logo.png^</p^>'; >> convert-modern-to-png.html
echo                     }, 'image/png'); >> convert-modern-to-png.html
echo                 }; >> convert-modern-to-png.html
echo                 const blob = new Blob([e.target.result], {type: 'image/svg+xml'}); >> convert-modern-to-png.html
echo                 img.src = URL.createObjectURL(blob); >> convert-modern-to-png.html
echo             }; >> convert-modern-to-png.html
echo             reader.readAsText(file); >> convert-modern-to-png.html
echo         } >> convert-modern-to-png.html
echo     ^</script^> >> convert-modern-to-png.html
echo ^</body^> >> convert-modern-to-png.html
echo ^</html^> >> convert-modern-to-png.html

echo ✅ 转换器创建完成！
echo.

echo 第三步: 打开转换器...
start convert-modern-to-png.html

echo.
echo 📋 转换步骤:
echo 1. 转换器已自动打开
echo 2. 点击"选择 SVG 文件"按钮
echo 3. 选择 ding-logo-modern.svg 文件
echo 4. 等待转换完成并下载 PNG
echo 5. 将下载的 multi-browser-logo.png 移动到当前目录
echo.

echo 💡 PNG转换完成后，按任意键继续生成ICNS...
pause

echo.
echo 第四步: 检查PNG文件...
if exist "multi-browser-logo.png" (
    echo ✅ 找到PNG文件，准备生成ICNS...
    
    echo 创建ICNS转换脚本...
    echo sips -s format icns multi-browser-logo.png --out multi-browser-logo.icns > generate-icns.sh
    
    echo ✅ ICNS转换脚本已创建
    echo 💡 macOS用户可以运行: bash generate-icns.sh
) else (
    echo ⚠️  未找到 multi-browser-logo.png
    echo    请确保已完成PNG转换并将文件放在当前目录
)

echo.
echo 第五步: 清理旧图标文件...
echo 准备删除以下文件:

set "files_to_delete=multi-browser-logo-edge.svg multi-browser-logo-final.svg multi-browser-logo-improved.svg multi-browser-logo-new.svg multi-browser-logo-aligned.svg multi-browser-logo-backup.svg ding-logo.svg ding-logo-centered.svg ding-logo-classic.svg"

for %%f in (%files_to_delete%) do (
    if exist "%%f" (
        echo   - %%f
    )
)

echo.
echo 是否要删除这些旧图标文件? (y/n)
set /p confirm=
if /i "%confirm%"=="y" (
    for %%f in (%files_to_delete%) do (
        if exist "%%f" (
            del "%%f"
            echo ✅ 已删除: %%f
        )
    )
    echo.
    echo 🎉 清理完成！
) else (
    echo 已跳过文件清理
)

echo.
echo 第六步: 重命名最终文件...
if exist "ding-logo-modern.svg" (
    copy "ding-logo-modern.svg" "multi-browser-logo.svg"
    echo ✅ 已创建: multi-browser-logo.svg
)

echo.
echo ========================================
echo 🎉 转换完成！
echo ========================================
echo.
echo 最终文件:
if exist "multi-browser-logo.svg" echo ✅ multi-browser-logo.svg
if exist "multi-browser-logo.png" echo ✅ multi-browser-logo.png  
if exist "multi-browser-logo.icns" echo ✅ multi-browser-logo.icns
echo.
echo 🚀 重启应用查看新图标效果！
echo.

pause
