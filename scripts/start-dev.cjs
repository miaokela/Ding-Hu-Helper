#!/usr/bin/env node

const { spawn } = require('child_process');
const net = require('net');

console.log('🚀 启动 Multi-Browser 开发环境...\n');

// 检查端口是否可用
function checkPort(port, maxAttempts = 30, interval = 1000) {
  return new Promise((resolve, reject) => {
    let attempts = 0;
    
    const check = () => {
      attempts++;
      const socket = new net.Socket();
      
      socket.setTimeout(500);
      
      socket.on('connect', () => {
        socket.destroy();
        console.log(`✅ 端口 ${port} 可用`);
        resolve(port);
      });
      
      socket.on('timeout', () => {
        socket.destroy();
        if (attempts < maxAttempts) {
          console.log(`⏳ 等待端口 ${port} (${attempts}/${maxAttempts})...`);
          setTimeout(check, interval);
        } else {
          reject(new Error(`端口 ${port} 在 ${maxAttempts} 次尝试后仍不可用`));
        }
      });
      
      socket.on('error', () => {
        socket.destroy();
        if (attempts < maxAttempts) {
          console.log(`⏳ 等待端口 ${port} (${attempts}/${maxAttempts})...`);
          setTimeout(check, interval);
        } else {
          reject(new Error(`端口 ${port} 在 ${maxAttempts} 次尝试后仍不可用`));
        }
      });
      
      socket.connect(port, 'localhost');
    };
    
    check();
  });
}

async function startDev() {
  try {
    console.log('📋 1. 设置数据库...');
    await new Promise((resolve, reject) => {
      const setupDb = spawn('yarn', ['setup:db'], { stdio: 'inherit' });
      setupDb.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('数据库设置失败'));
      });
    });
    
    console.log('🏗️  2. 构建 Electron 代码...');
    await new Promise((resolve, reject) => {
      const buildElectron = spawn('yarn', ['build:electron'], { stdio: 'inherit' });
      buildElectron.on('close', (code) => {
        if (code === 0) resolve();
        else reject(new Error('Electron 构建失败'));
      });
    });
    
    console.log('🌐 3. 启动 Vite 开发服务器...');
    const viteProcess = spawn('yarn', ['dev:renderer'], { 
      stdio: ['inherit', 'pipe', 'inherit'],
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    let vitePort = null;
    
    viteProcess.stdout.on('data', (data) => {
      const output = data.toString();
      process.stdout.write(output);
      
      // 检测 Vite 服务器端口
      const portMatch = output.match(/Local:\s+http:\/\/localhost:(\d+)/);
      if (portMatch) {
        vitePort = parseInt(portMatch[1]);
        console.log(`📡 检测到 Vite 服务器端口: ${vitePort}`);
      }
    });
    
    // 等待 Vite 启动
    await new Promise((resolve) => setTimeout(resolve, 3000));
    
    if (vitePort) {
      console.log(`⏳ 等待 Vite 服务器在端口 ${vitePort} 就绪...`);
      await checkPort(vitePort);
    } else {
      console.log('⏳ 使用默认端口检测...');
      // 尝试常见端口
      const ports = [5173, 5174, 5175, 3000, 3001];
      for (const port of ports) {
        try {
          await checkPort(port, 5, 500);
          vitePort = port;
          break;
        } catch (e) {
          // 继续尝试下一个端口
        }
      }
    }
    
    if (!vitePort) {
      throw new Error('无法找到 Vite 开发服务器端口');
    }
    
    console.log(`🖥️  4. 启动 Electron 应用 (连接到端口 ${vitePort})...`);
    const electronProcess = spawn('npx', ['electron', '.'], { 
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' }
    });
    
    // 处理进程退出
    const cleanup = () => {
      console.log('\n🛑 正在关闭开发环境...');
      viteProcess.kill();
      electronProcess.kill();
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
    electronProcess.on('close', () => {
      console.log('Electron 应用已关闭');
      cleanup();
    });
    
  } catch (error) {
    console.error('❌ 启动失败:', error.message);
    process.exit(1);
  }
}

startDev();
