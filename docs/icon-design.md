# 🎨 Multi Browser 图标设计说明

这个项目现在提供了两种不同风格的图标设计，你可以根据喜好和使用场景选择使用。

## 📐 设计理念

### Chrome 风格 (默认)
- **设计灵感**: 参考Google Chrome浏览器的经典配色和设计语言
- **视觉特点**: 
  - 三段式分割设计
  - 经典的红、黄、绿、蓝四色搭配
  - 圆润的现代化外观
  - 中心地球仪象征互联网连接
- **适用场景**: 日常使用、面向消费者的产品、友好亲和的界面

### Edge 风格
- **设计灵感**: 参考Microsoft Edge浏览器的现代设计和Windows设计语言
- **视觉特点**:
  - 多面体几何设计
  - 蓝色系渐变配色
  - 棱角分明的3D效果
  - 现代几何图案
- **适用场景**: 商务使用、专业工具、企业级应用

## 🛠 技术规格

### 文件格式
- **SVG**: 矢量格式，无损缩放
- **PNG**: 栅格格式，512x512像素
- **ICNS**: macOS原生图标格式
- **多尺寸**: 自动生成16x16到1024x1024的所有常用尺寸

### 色彩规范

#### Chrome风格配色
```
蓝色: #4285F4 -> #1A73E8
绿色: #34A853 -> #137333  
红色: #EA4335 -> #C5221F
黄色: #FBBC05 -> #F29900
中心: #FFFFFF -> #E8EAED
```

#### Edge风格配色
```
主蓝: #0078D4 -> #005A9E
青色: #00BCF2 -> #00A4E4
橙色: #FF8C00 -> #FF6600
中心: #FFFFFF -> #E0E0E0
```

## 🚀 使用方法

### 快速切换图标
```bash
npm run select:icon
```

### 手动切换到指定图标
```bash
# Chrome风格
echo "1" | npm run select:icon

# Edge风格  
echo "2" | npm run select:icon
```

### 重新生成图标
```bash
npm run build:icons
```

### 预览图标效果
在浏览器中打开 `icon-preview.html` 文件

## 📁 文件结构

```
electron/
├── multi-browser-logo.svg          # 当前使用的SVG图标
├── multi-browser-logo.png          # 当前使用的PNG图标
├── multi-browser-logo.icns         # 当前使用的ICNS图标
├── multi-browser-logo-edge.svg     # Edge风格SVG
├── multi-browser-logo-edge.png     # Edge风格PNG
├── multi-browser-logo-backup.svg   # 备份的SVG (切换时生成)
└── multi-browser-logo-backup.png   # 备份的PNG (切换时生成)

src/assets/
├── multi-browser-logo.svg          # 应用内使用的SVG
└── multi-browser-logo.png          # 应用内使用的PNG

scripts/
├── build-icons.cjs                 # 图标构建脚本
└── select-icon.cjs                 # 图标选择脚本
```

## 🎯 自定义图标

### 修改现有图标
1. 编辑 `electron/multi-browser-logo.svg` 或 `electron/multi-browser-logo-edge.svg`
2. 运行 `npm run build:icons` 重新生成

### 创建新图标风格
1. 创建新的SVG文件，如 `electron/multi-browser-logo-custom.svg`
2. 使用ImageMagick生成PNG: `magick custom.svg -resize 512x512 custom.png`
3. 修改 `scripts/select-icon.cjs` 添加新选项

### 设计建议
- **尺寸**: 建议使用512x512像素的正方形画布
- **兼容性**: 确保在小尺寸(16x16)下仍然清晰可见
- **品牌一致性**: 保持与应用整体设计风格的一致性
- **可访问性**: 考虑色盲用户，避免只用颜色区分元素

## 🔧 故障排除

### 图标不显示
1. 检查文件是否存在: `ls electron/multi-browser-logo.*`
2. 重新生成图标: `npm run build:icons`
3. 清理缓存后重新构建应用

### 切换失败
1. 确保有足够的文件权限
2. 检查目标图标文件是否存在
3. 手动恢复备份文件

### 图标质量问题
1. 检查源SVG文件的质量
2. 确保ImageMagick正确安装
3. 调整PNG生成参数

## 📝 更新日志

- **v1.0**: 初始Chrome风格图标
- **v1.1**: 添加Edge风格图标选项
- **v1.2**: 增加图标选择器和预览工具
- **v1.3**: 完善文档和使用说明
