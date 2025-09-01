@echo off
chcp 65001 >nul
echo 设置 electron-builder 环境变量以禁用签名...
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/
set ELECTRON_BUILDER_ALLOW_UNRESOLVED_DEPENDENCIES=true
set WIN_CSC_LINK=
set CSC_IDENTITY_AUTO_DISCOVERY=false
set ELECTRON_BUILDER_CACHE=%TEMP%\electron-builder-cache
set SKIP_NOTARIZATION=true

echo 环境变量设置完成：
echo ELECTRON_BUILDER_BINARIES_MIRROR=%ELECTRON_BUILDER_BINARIES_MIRROR%
echo CSC_IDENTITY_AUTO_DISCOVERY=%CSC_IDENTITY_AUTO_DISCOVERY%

echo 开始构建...
yarn run build:trial
