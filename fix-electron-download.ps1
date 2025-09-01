# Electron 下载修复脚本
Write-Host "Electron 下载修复工具" -ForegroundColor Green

# 设置镜像环境变量
$env:ELECTRON_MIRROR = "https://mirrors.ustc.edu.cn/electron/"
$env:ELECTRON_CUSTOM_DIR = "{{ version }}"

Write-Host "已设置 Electron 镜像: $env:ELECTRON_MIRROR" -ForegroundColor Yellow

# 检查网络连接
Write-Host "测试镜像连接..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "https://mirrors.ustc.edu.cn/electron/" -Method Head -TimeoutSec 10
    Write-Host "✅ 中科大镜像连接正常" -ForegroundColor Green
} catch {
    Write-Host "❌ 中科大镜像连接失败，尝试其他镜像..." -ForegroundColor Red
    
    # 尝试清华镜像
    try {
        $env:ELECTRON_MIRROR = "https://mirrors.tuna.tsinghua.edu.cn/electron/"
        $response = Invoke-WebRequest -Uri $env:ELECTRON_MIRROR -Method Head -TimeoutSec 10
        Write-Host "✅ 清华镜像连接正常" -ForegroundColor Green
    } catch {
        Write-Host "❌ 清华镜像也失败，请检查网络连接" -ForegroundColor Red
        exit 1
    }
}

Write-Host "开始重新安装依赖..." -ForegroundColor Yellow

# 清理并重新安装
Remove-Item -Path "node_modules" -Recurse -Force -ErrorAction SilentlyContinue
yarn cache clean
yarn install

Write-Host "安装完成！" -ForegroundColor Green
