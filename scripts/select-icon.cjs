#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const electronDir = path.join(__dirname, '..', 'electron');
const assetsDir = path.join(__dirname, '..', 'src', 'assets');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎨 图标选择器');
console.log('================');
console.log('请选择要使用的图标风格:');
console.log('1. Chrome风格 (默认 - 彩色三段式设计)');
console.log('2. Edge风格 (棱角分明的多面体设计)');
console.log('3. Improved风格 (改进版设计)');
console.log('');

rl.question('请输入选择 (1, 2 或 3, 默认为 1): ', (answer) => {
  const choice = answer.trim() || '1';
  
  let sourceSvg, sourcePng;
  let iconStyle;
  
  switch(choice) {
    case '1':
      sourceSvg = 'multi-browser-logo.svg';
      sourcePng = 'multi-browser-logo.png';
      iconStyle = 'Chrome风格';
      break;
    case '2':
      sourceSvg = 'multi-browser-logo-edge.svg';
      sourcePng = 'multi-browser-logo-edge.png';
      iconStyle = 'Edge风格';
      break;
    case '3':
      sourceSvg = 'multi-browser-logo-improved.svg';
      sourcePng = 'multi-browser-logo-improved.png';
      iconStyle = 'Improved风格';
      break;
    default:
      console.log('❌ 无效选择，使用默认Chrome风格');
      sourceSvg = 'multi-browser-logo.svg';
      sourcePng = 'multi-browser-logo.png';
      iconStyle = 'Chrome风格 (默认)';
  }
  
  try {
    // 检查文件是否存在
    const svgSource = path.join(electronDir, sourceSvg);
    const pngSource = path.join(electronDir, sourcePng);
    
    if (!fs.existsSync(svgSource) || !fs.existsSync(pngSource)) {
      console.log('❌ 图标文件不存在，请先生成图标');
      process.exit(1);
    }
    
    // 如果选择的不是默认图标，则替换文件
    if (choice !== '1') {
      console.log(`🔄 切换到 ${iconStyle}...`);
      
      // 备份当前图标
      if (fs.existsSync(path.join(electronDir, 'multi-browser-logo.svg'))) {
        fs.copyFileSync(
          path.join(electronDir, 'multi-browser-logo.svg'),
          path.join(electronDir, 'multi-browser-logo-backup.svg')
        );
      }
      if (fs.existsSync(path.join(electronDir, 'multi-browser-logo.png'))) {
        fs.copyFileSync(
          path.join(electronDir, 'multi-browser-logo.png'),
          path.join(electronDir, 'multi-browser-logo-backup.png')
        );
      }
      
      // 复制选择的图标
      fs.copyFileSync(svgSource, path.join(electronDir, 'multi-browser-logo.svg'));
      fs.copyFileSync(pngSource, path.join(electronDir, 'multi-browser-logo.png'));
      
      console.log('📁 已备份原图标为 *-backup.* 文件');
    }
    
    // 更新assets目录
    fs.copyFileSync(
      path.join(electronDir, 'multi-browser-logo.svg'),
      path.join(assetsDir, 'multi-browser-logo.svg')
    );
    fs.copyFileSync(
      path.join(electronDir, 'multi-browser-logo.png'),
      path.join(assetsDir, 'multi-browser-logo.png')
    );
    
    console.log(`✅ 已切换到 ${iconStyle}`);
    console.log('📱 正在重新生成所有尺寸的图标...');
    
    // 执行图标构建
    const { execSync } = require('child_process');
    execSync('npm run build:icons', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
    
    console.log('🎉 图标更新完成！');
    console.log('');
    console.log('图标特点:');
    if (choice === '1') {
      console.log('• Chrome风格的三段式彩色设计');
      console.log('• 蓝色、绿色、红色、黄色渐变');
      console.log('• 中心地球仪图标');
      console.log('• 圆润的现代设计');
    } else if (choice === '2') {
      console.log('• Edge风格的多面体设计');
      console.log('• 蓝色、青色、橙色渐变');
      console.log('• 棱角分明的3D效果');
      console.log('• 现代几何图案');
    } else if (choice === '3') {
      console.log('• 改进版设计风格');
      console.log('• 优化的视觉效果');
      console.log('• 现代化的设计语言');
      console.log('• 更好的可识别性');
    }
    
  } catch (error) {
    console.error('❌ 图标切换失败:', error.message);
    process.exit(1);
  }
  
  rl.close();
});
