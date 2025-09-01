import {
  app,
  BrowserWindow,
  ipcMain,
  WebContents,
  webContents,
  session,
  globalShortcut,
  dialog,
  shell,
  Menu,
  clipboard,
} from "electron";
import { fileURLToPath } from "url";
import path, { dirname, join } from "path";
import { createRequire } from "module";
import fs from "fs";
import { sqlite3, open } from "./database.js";
import CryptoJS from "crypto-js";
import { systemAuth } from "./system-auth.js";

// � 完全禁用客户端软件弹窗
console.log('🚀 启动客户端弹窗完全禁用机制...');

// 直接替换所有弹窗方法 - 不显示任何客户端弹窗
dialog.showMessageBox = async () => ({ response: 1, checkboxChecked: false });
dialog.showMessageBoxSync = () => 1;
dialog.showErrorBox = () => {};
dialog.showOpenDialog = async () => ({ canceled: true, filePaths: [] });
dialog.showOpenDialogSync = () => [];
dialog.showSaveDialog = async () => ({ canceled: true, filePath: '' });
dialog.showSaveDialogSync = () => '';

// 禁用外部链接和路径打开
(shell as any).openExternal = () => Promise.resolve();
(shell as any).openPath = () => Promise.resolve('');

console.log('✅ 客户端弹窗完全禁用 - 所有客户端弹窗已被静默处理');

// 拦截外部链接打开
shell.openExternal = async (url: string, options?: any) => {
  console.log('🚨 拦截shell.openExternal - 阻止外部链接:', url);
  return;
};

console.log('✅ 纯客户端对话框拦截机制已激活');

// 🔒 全版本单实例应用限制 - 优化Windows防闪烁
import os from 'os';
const lockFilePath = path.join(os.tmpdir(), 'multi-browser-universal.lock');

// ⚡ 先进行Electron单实例锁检查，防止Windows窗口闪烁
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  console.log('🚫 检测到Electron实例已存在，立即静默退出 (防闪烁)');
  // Windows优化：同步退出防止鼠标转圈圈
  app.quit();
  process.exit(0);
}

// 检查是否已有其他版本实例在运行
let isFirstInstance = true;
let isExiting = false; // 添加退出状态标记防止重复退出

try {
  if (fs.existsSync(lockFilePath)) {
    // 检查锁文件是否是僵尸文件（进程已不存在）
    try {
      const lockContent = fs.readFileSync(lockFilePath, 'utf8');
      const pid = parseInt(lockContent);
      
      // 检查进程是否还在运行
      try {
        process.kill(pid, 0); // 0信号只检查进程是否存在，不会杀死进程
        isFirstInstance = false; // 进程存在，说明有其他实例在运行
        console.log('🚫 检测到其他版本的应用正在运行 (PID:', pid, ')，立即静默退出');
        
        // 防止重复退出
        if (!isExiting) {
          isExiting = true;
          console.log('🚪 执行同步退出...');
          app.quit();
          process.exit(0);
        }
      } catch (err) {
        // 进程不存在，删除僵尸锁文件
        fs.unlinkSync(lockFilePath);
        console.log('🧹 清理僵尸锁文件');
      }
    } catch (err) {
      // 锁文件损坏，删除它
      fs.unlinkSync(lockFilePath);
      console.log('🧹 清理损坏的锁文件');
    }
  }
  
  if (isFirstInstance) {
    // 创建锁文件，写入当前进程PID
    fs.writeFileSync(lockFilePath, process.pid.toString());
    console.log('✅ 成功创建全版本单实例锁，当前PID:', process.pid);
    
    // 应用退出时清理锁文件
    const cleanupLock = () => {
      try {
        if (fs.existsSync(lockFilePath)) {
          const lockContent = fs.readFileSync(lockFilePath, 'utf8');
          if (parseInt(lockContent) === process.pid) {
            fs.unlinkSync(lockFilePath);
            console.log('🧹 已清理单实例锁文件');
          }
        }
      } catch (err) {
        console.log('⚠️ 清理锁文件时出错:', err);
      }
    };
    
    // 监听各种退出事件
    process.on('exit', cleanupLock);
    process.on('SIGINT', cleanupLock);
    process.on('SIGTERM', cleanupLock);
    process.on('uncaughtException', cleanupLock);
    
    // 完全静默处理重复启动 - Windows优化版
    app.on('second-instance', (event, commandLine, workingDirectory) => {
      console.log('🔍 检测到重复启动尝试，完全静默处理 (Windows防闪烁)');
      // 什么都不做，完全静默 - 不聚焦窗口，不显示通知，不执行任何UI操作
      return;
    });
  }
} catch (err) {
  console.error('❌ 单实例锁创建失败:', err);
  app.quit();
  process.exit(1);
}// 为 ES Module 环境创建 require 函数
const require = createRequire(import.meta.url);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let mainWindow: BrowserWindow | null = null;

// RSA 加密配置
const RSA_CONFIG = {
  key: CryptoJS.enc.Utf8.parse('MultiB-Browser-Key32'), // 32字符密钥
  iv: CryptoJS.enc.Utf8.parse('MultiB-Browser-IV16'),   // 16字符IV
};

// RSA 加密函数
function encryptScript(text: string): string {
  try {
    const encrypted = CryptoJS.AES.encrypt(text, RSA_CONFIG.key, {
      iv: RSA_CONFIG.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    return encrypted.toString();
  } catch (error) {
    console.error('加密失败:', error);
    throw error;
  }
}

// RSA 解密函数
function decryptScript(encryptedText: string): string {
  try {
    // 首先尝试使用base64解码（用于新的预设脚本）
    try {
      const decoded = Buffer.from(encryptedText, 'base64').toString('utf8');
      // 验证解码结果是否是有效的JavaScript代码
      if (decoded.includes('function') || decoded.includes('console.log') || decoded.includes('document.')) {
        console.log('✅ 使用base64解密成功');
        return decoded;
      }
    } catch (base64Error) {
      console.log('Base64解码失败，尝试AES解密...');
    }
    
    // 如果base64解码失败，回退到AES解密（用于旧的加密脚本）
    const decrypted = CryptoJS.AES.decrypt(encryptedText, RSA_CONFIG.key, {
      iv: RSA_CONFIG.iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    console.log('✅ 使用AES解密成功');
    return result;
  } catch (error) {
    console.error('解密失败:', error);
    throw error;
  }
}

// 全局错误处理
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // 不要退出程序，继续运行
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // 不要退出程序，继续运行
});

// 获取应用图标路径
function getIconPath(): string {
  if (process.env.NODE_ENV === "development") {
    // 开发环境：使用源码目录中的图标
    // __dirname 指向 dist/electron，需要回到项目根目录
    const projectRoot = path.join(__dirname, "../..");
    const iconPath = path.join(projectRoot, "electron/multi-browser-logo.png");
    console.log(`开发环境图标路径: ${iconPath}`);

    // 检查文件是否存在
    try {
      fs.accessSync(iconPath);
      return iconPath;
    } catch {
      console.warn(`图标文件不存在: ${iconPath}，使用默认图标`);
      return path.join(__dirname, "multi-browser-logo.png");
    }
  } else {
    // 生产环境：使用打包后的图标
    if (process.platform === "darwin") {
      // macOS: 尝试使用 .icns 文件，如果不存在则使用 PNG
      const icnsPath = path.join(process.resourcesPath, "multi-browser-logo.icns");
      const pngPath = path.join(__dirname, "multi-browser-logo.png");

      // 检查 icns 文件是否存在
      try {
        fs.accessSync(icnsPath);
        return icnsPath;
      } catch {
        return pngPath;
      }
    } else {
      // Windows/Linux: 使用 PNG
      return path.join(__dirname, "multi-browser-logo.png");
    }
  }
}

// 删除指定partition的存储文件夹并清除session数据
async function deletePartitionStorageFolder(partitionName: string) {
  try {
    console.log(`🧹 开始删除partition "${partitionName}" 的存储数据...`);

    // 第一步：清除session中的所有数据（包括cookies）
    try {
      const partitionSession = session.fromPartition(partitionName);
      if (partitionSession) {
        // 清除缓存
        await partitionSession.clearCache();
        console.log(`✅ 已清除partition "${partitionName}" 的缓存`);

        // 清除所有存储数据，特别是cookies
        await partitionSession.clearStorageData({
          storages: [
            'cookies',           // 🍪 最重要：清除cookies
            'filesystem',
            'indexdb',
            'localstorage',
            'shadercache',
            'websql',
            'serviceworkers',
            'cachestorage',
          ],
        });
        console.log(`✅ 已清除partition "${partitionName}" 的所有存储数据（包括cookies）`);
      }
    } catch (sessionError) {
      console.warn(`⚠️ 清除partition session数据时出错:`, sessionError);
    }

    // 第二步：删除文件系统中的存储文件夹
    const userDataPath = app.getPath('userData');
    const partitionPath = path.join(userDataPath, 'Partitions', partitionName.replace('persist:', ''));

    if (fs.existsSync(partitionPath)) {
      await fs.promises.rmdir(partitionPath, { recursive: true });
      console.log(`🗑️ 已删除partition存储文件夹: ${partitionPath}`);
    } else {
      console.log(`ℹ️ partition存储文件夹不存在: ${partitionPath}`);
    }

    console.log(`✅ partition "${partitionName}" 删除完成（包括cookies和所有存储数据）`);
    return true;

  } catch (error) {
    console.error(`❌ 删除partition存储数据失败 "${partitionName}":`, error);
    return false;
  }
}

// 清除所有浏览器实例的缓存数据并删除存储文件夹
async function clearAllBrowserInstanceCaches() {
  console.log('🧹 开始清除所有浏览器实例的缓存数据和存储文件夹...');

  try {
    // 获取默认session
    const defaultSession = session.defaultSession;
    await defaultSession.clearCache();
    console.log('✅ 默认session缓存已清除');

    // 清除默认session的存储数据
    await defaultSession.clearStorageData({
      storages: [
        'cookies',
        'filesystem',
        'indexdb',
        'localstorage',
        'shadercache',
        'websql',
        'serviceworkers',
        'cachestorage',
      ],
    });
    console.log('✅ 默认session存储数据已清除');

    // 删除所有partition存储文件夹
    try {
      const userDataPath = app.getPath('userData');
      const partitionsPath = path.join(userDataPath, 'Partitions');

      if (fs.existsSync(partitionsPath)) {
        const partitionDirs = await fs.promises.readdir(partitionsPath);
        let deletedFolders = 0;

        for (const partitionDir of partitionDirs) {
          const partitionFolderPath = path.join(partitionsPath, partitionDir);
          const stat = await fs.promises.stat(partitionFolderPath);

          if (stat.isDirectory()) {
            try {
              await fs.promises.rmdir(partitionFolderPath, { recursive: true });
              deletedFolders++;
              console.log(`🗑️ 已删除partition存储文件夹: ${partitionFolderPath}`);
            } catch (deleteError) {
              console.warn(`⚠️ 删除partition文件夹失败 "${partitionFolderPath}":`, deleteError);
            }
          }
        }

        console.log(`🗑️ 总共删除了 ${deletedFolders} 个partition存储文件夹`);
      } else {
        console.log('ℹ️ Partitions文件夹不存在，无需删除');
      }
    } catch (folderError) {
      console.warn('⚠️ 删除partition存储文件夹时出错:', folderError);
    }

    // 尝试从数据库中获取所有域名的partition信息
    let partitionsFromDB = new Set<string>();
    try {
      const db = await getDb(); // 使用默认数据库路径
      const domains = await db.all('SELECT DISTINCT page_id FROM domain');

      domains.forEach((domain: any) => {
        if (domain.page_id) {
          partitionsFromDB.add(`persist:${domain.page_id}`);
        }
      });

      console.log(`📊 从数据库中发现 ${partitionsFromDB.size} 个partition`);
    } catch (dbError) {
      console.warn('⚠️ 无法从数据库获取partition信息，使用通用清除方法:', dbError);
    }

    // 添加一些常见的partition模式作为备用
    const partitionsToTry = new Set<string>();

    // 添加数据库中的partitions
    partitionsFromDB.forEach(partition => partitionsToTry.add(partition));

    // 添加基础partitions
    partitionsToTry.add('persist:browser_default');

    // 添加一些通用模式作为备用（以防数据库无法访问）
    for (let i = 1; i <= 50; i++) {
      partitionsToTry.add(`persist:domain_${i}`);
      partitionsToTry.add(`persist:page_${i}`);
    }

    // 也清除一些可能的UUID格式的partition
    // 注意：这个循环只是为了清除可能遗留的partition，实际使用中应该以数据库为准

    let clearedCount = 0;
    let attemptedCount = 0;

    for (const partitionName of partitionsToTry) {
      try {
        attemptedCount++;
        const partitionSession = session.fromPartition(partitionName);

        // 检查session是否实际存在（通过尝试获取其属性）
        if (partitionSession) {
          await partitionSession.clearCache();
          await partitionSession.clearStorageData({
            storages: [
              'cookies',
              'filesystem',
              'indexdb',
              'localstorage',
              'shadercache',
              'websql',
              'serviceworkers',
              'cachestorage',
            ],
          });
          clearedCount++;
          console.log(`✅ 已清除partition "${partitionName}" 的缓存和存储数据`);
        }
      } catch (error) {
        // 某些partition可能不存在，这是正常的
        // 只有在调试模式下才显示这些信息
        if (process.env.NODE_ENV === 'development' && attemptedCount <= 10) {
          console.log(`ℹ️ partition "${partitionName}" 不存在或已清除`);
        }
      }
    }

    console.log(`✅ 所有浏览器实例缓存数据清除完成，尝试了 ${attemptedCount} 个partition，实际清除了 ${clearedCount} 个`);

  } catch (error) {
    console.error('❌ 清除浏览器实例缓存时发生错误:', error);
  }
}

async function createWindow() {
  // 🔒 额外的Windows防闪烁检查 - 创建窗口前再次确认单实例状态
  if (!isFirstInstance) {
    console.log('🚫 在创建窗口前发现多实例状态，立即退出防止闪烁');
    
    // 防止重复退出
    if (isExiting) {
      console.log('🔄 已在退出过程中，忽略重复请求');
      return;
    }
    
    isExiting = true;
    console.log('🚪 执行同步退出...');
    app.quit();
    process.exit(0);
  }

  const iconPath = getIconPath();
  console.log(`使用图标路径: ${iconPath}`);

  // 🔥 全局拦截所有web-contents的对话框
  app.on('web-contents-created', (_, contents) => {
    console.log('🔍 新的web-contents创建，添加对话框拦截');
    
    contents.on('dom-ready', () => {
      contents.executeJavaScript(`
        (function() {
          console.log('🚨 注入 iframe 和对话框拦截到页面');
          
          // 1. 拦截所有对话框
          window.confirm = function(message) {
            console.log('🚨 拦截confirm调用:', message);
            return true;
          };
          
          window.alert = function(message) {
            console.log('🚨 拦截alert调用:', message);
            return;
          };
          
          // 2. 拦截 iframe 创建 - 重写 createElement
          const originalCreateElement = document.createElement;
          document.createElement = function(tagName) {
            const element = originalCreateElement.call(this, tagName);
            
            if (tagName.toLowerCase() === 'iframe') {
              console.log('🚨 检测到 iframe 创建');
              
              // 重写 src 属性设置
              Object.defineProperty(element, 'src', {
                set: function(value) {
                  console.log('🚨 尝试设置 iframe src:', value);
                  
                  // 阻止危险协议的 iframe
                  if (value && (
                    value.startsWith('bytedance://') ||
                    value.startsWith('toutiao://') ||
                    value.startsWith('douyin://') ||
                    value.includes('dispatch_message') ||
                    value.includes('__JSBridgeIframe__')
                  )) {
                    console.log('🚫 阻止危险 iframe:', value);
                    this.style.display = 'none';
                    this.remove(); // 直接移除
                    return;
                  }
                  
                  // 允许正常的 src
                  this.setAttribute('src', value);
                },
                get: function() {
                  return this.getAttribute('src');
                }
              });
            }
            
            return element;
          };
          
          // 3. 监听 DOM 变化，移除已存在的危险 iframe
          const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
              mutation.addedNodes.forEach(function(node) {
                if (node.nodeType === 1) { // Element node
                  // 检查新添加的节点
                  if (node.tagName === 'IFRAME') {
                    const iframe = node;
                    const src = iframe.src || iframe.getAttribute('src');
                    
                    if (src && (
                      src.startsWith('bytedance://') ||
                      src.startsWith('toutiao://') ||
                      src.startsWith('douyin://') ||
                      src.includes('dispatch_message') ||
                      iframe.id === '__JSBridgeIframe__'
                    )) {
                      console.log('🚫 移除危险 iframe:', src, iframe.id);
                      iframe.remove();
                      return;
                    }
                  }
                  
                  // 检查子元素中的 iframe
                  const iframes = node.querySelectorAll ? node.querySelectorAll('iframe') : [];
                  iframes.forEach(function(iframe) {
                    const src = iframe.src || iframe.getAttribute('src');
                    
                    if (src && (
                      src.startsWith('bytedance://') ||
                      src.startsWith('toutiao://') ||
                      src.startsWith('douyin://') ||
                      src.includes('dispatch_message') ||
                      iframe.id === '__JSBridgeIframe__'
                    )) {
                      console.log('🚫 移除子元素中的危险 iframe:', src, iframe.id);
                      iframe.remove();
                    }
                  });
                }
              });
            });
          });
          
          // 开始监听
          observer.observe(document.body || document.documentElement, {
            childList: true,
            subtree: true
          });
          
          // 4. 立即清理已存在的危险 iframe
          function cleanupExistingIframes() {
            const iframes = document.querySelectorAll('iframe');
            iframes.forEach(function(iframe) {
              const src = iframe.src || iframe.getAttribute('src');
              
              if (src && (
                src.startsWith('bytedance://') ||
                src.startsWith('toutiao://') ||
                src.startsWith('douyin://') ||
                src.includes('dispatch_message') ||
                iframe.id === '__JSBridgeIframe__'
              )) {
                console.log('🚫 清理已存在的危险 iframe:', src, iframe.id);
                iframe.remove();
              }
            });
          }
          
          // 立即执行一次清理
          cleanupExistingIframes();
          
          // DOM 加载完成后再执行一次
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', cleanupExistingIframes);
          }
          
          console.log('✅ iframe 和对话框拦截已激活');
        })();
      `).catch(err => {
        console.error('注入对话框拦截失败:', err);
      });
    });
  });

  try {
    mainWindow = new BrowserWindow({
      width: 1600,
      height: 800,
      minWidth: 1600,
      minHeight: 800,
      title: "盯户助手",
      icon: iconPath,
      autoHideMenuBar: true, // 隐藏菜单栏
      webPreferences: {
        preload: join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        devTools: true,
        webviewTag: true,
        webSecurity: false,
        allowRunningInsecureContent: true,
        experimentalFeatures: true,
        // Windows 输入修复：禁用拼写检查，可能导致输入问题
        spellcheck: false,
        // 确保输入事件正常传递
        enableBlinkFeatures: 'TouchEventFeatureDetection',
      },
    });

    // Windows 特定修复：确保窗口可以接收输入事件
    if (process.platform === 'win32') {
      mainWindow.setSkipTaskbar(false);
      // 确保窗口在创建后立即获得焦点
      mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        mainWindow?.focus();
      });
    }

    console.log(`当前环境：${process.env.NODE_ENV}`);

    if (process.env.NODE_ENV === "development") {
      // 尝试多个可能的端口
      const ports = [5173, 5174, 5175, 5176];
      let loaded = false;

      for (const port of ports) {
        try {
          await mainWindow.loadURL(`http://localhost:${port}`);
          console.log(`✅ 成功连接到端口 ${port}`);
          loaded = true;
          break;
        } catch (error) {
          console.log(`❌ 端口 ${port} 连接失败，尝试下一个...`);
        }
      }

      if (!loaded) {
        throw new Error("无法连接到开发服务器");
      }

      mainWindow.webContents.openDevTools();
    } else {
      await mainWindow.loadFile(
        join(__dirname, "../../dist/renderer/index.html")
      );
    }

    // Windows 输入修复：添加事件监听器
    if (process.platform === 'win32') {
      mainWindow.webContents.on('dom-ready', () => {
        // 注入修复输入问题的代码 + 对话框拦截
        mainWindow?.webContents.executeJavaScript(`
          // 修复 Windows 下输入框无法输入的问题
          document.addEventListener('DOMContentLoaded', function() {
            // 强制启用所有输入元素
            const inputs = document.querySelectorAll('input, textarea');
            inputs.forEach(input => {
              input.removeAttribute('readonly');
              input.removeAttribute('disabled');
            });
            
            // 修复焦点问题
            document.addEventListener('click', function(e) {
              if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                e.target.focus();
              }
            });
            
            console.log('Windows 输入修复已应用');
          });
          
          // 立即应用修复
          const inputs = document.querySelectorAll('input, textarea');
          inputs.forEach(input => {
            input.removeAttribute('readonly');
            input.removeAttribute('disabled');
          });
        `);
      });
    }

    mainWindow.webContents.on(
      "did-attach-webview",
      (_event, contents: WebContents) => {
        // 设置webview的窗口打开处理器
        contents.setWindowOpenHandler(({ url }) => {
          console.log('外链请求:', url);

          // 过滤危险协议
          const dangerousProtocols = ['bytedance:', 'javascript:', 'data:', 'vbscript:'];
          if (dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol))) {
            console.warn('阻止危险协议:', url);
            return { action: 'deny' };
          }

          // 通知渲染进程创建新标签页
          mainWindow?.webContents.send("webview-open-url", {
            url,
            webContentsId: contents.id
          });

          return { action: 'deny' };
        });

        // 添加错误处理
        contents.on('crashed' as any, (event: any) => {
          console.warn('webview crashed:', event);
        });

        contents.on('unresponsive' as any, () => {
          console.warn('webview became unresponsive');
        });

        contents.on('responsive' as any, () => {
          console.log('webview became responsive again');
        });

        // 允许所有权限请求（摄像头、麦克风、通知等）
        contents.session.setPermissionRequestHandler((webContents, permission, callback) => {
          // 对于大部分权限，我们都允许
          callback(true);
        });

        // 设置更宽松的内容安全策略
        contents.session.webRequest.onHeadersReceived((details, callback) => {
          const responseHeaders = details.responseHeaders || {};

          // 移除严格的安全头
          delete responseHeaders['content-security-policy'];
          delete responseHeaders['content-security-policy-report-only'];
          delete responseHeaders['x-frame-options'];
          delete responseHeaders['x-content-type-options'];
          delete responseHeaders['strict-transport-security'];
          delete responseHeaders['x-xss-protection'];

          // 添加允许跨域的头
          responseHeaders['access-control-allow-origin'] = ['*'];
          responseHeaders['access-control-allow-methods'] = ['GET, POST, PUT, DELETE, OPTIONS'];
          responseHeaders['access-control-allow-headers'] = ['*'];

          callback({ responseHeaders });
        });

        // 设置证书错误忽略
        contents.on('certificate-error', (event, url, error, certificate, callback) => {
          event.preventDefault();
          callback(true);
        });

        // 处理导航事件 - 添加协议安全检查
        contents.on('will-navigate', (event, url) => {
          console.log('webview即将导航到:', url);

          // 过滤掉不安全的协议
          const dangerousProtocols = ['bytedance:', 'javascript:', 'data:', 'vbscript:', 'chrome:', 'chrome-extension:', 'moz-extension:'];
          const hasUnsafeProtocol = dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol));

          if (hasUnsafeProtocol) {
            console.warn('阻止webview导航到不安全的协议:', url);
            event.preventDefault();
            return;
          }

          // 允许安全的导航正常进行
        });

        // 监听所有导航重定向
        contents.on('will-redirect', (event, url) => {
          console.log('webview即将重定向到:', url);

          // 过滤掉不安全的协议
          const dangerousProtocols = ['bytedance:', 'javascript:', 'data:', 'vbscript:', 'chrome:', 'chrome-extension:', 'moz-extension:'];
          const hasUnsafeProtocol = dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol));

          if (hasUnsafeProtocol) {
            console.warn('阻止webview重定向到不安全的协议:', url);
            event.preventDefault();
            return;
          }
        });

        // 监听外部协议请求
        contents.on('will-prevent-unload', (event) => {
          console.log('webview尝试阻止卸载');
        });

        // 处理加载失败
        contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
          if (errorCode !== -3) { // -3是ERR_ABORTED，通常是正常的
            console.error(`webview加载失败: ${errorCode} - ${errorDescription} - ${validatedURL}`);
          }
        });

        // 添加webview右键菜单
        contents.on('context-menu', (event, params) => {
          const contextMenu = Menu.buildFromTemplate([
            {
              label: '刷新',
              accelerator: 'CmdOrCtrl+R',
              click: () => {
                contents.reload();
              }
            },
            {
              label: '强制刷新',
              accelerator: 'CmdOrCtrl+Shift+R',
              click: () => {
                contents.reloadIgnoringCache();
              }
            },
            { type: 'separator' },
            {
              label: '后退',
              accelerator: 'Alt+Left',
              enabled: contents.canGoBack(),
              click: () => {
                contents.goBack();
              }
            },
            {
              label: '前进',
              accelerator: 'Alt+Right',
              enabled: contents.canGoForward(),
              click: () => {
                contents.goForward();
              }
            },
            { type: 'separator' },
            {
              label: '复制链接',
              visible: params.linkURL !== '',
              click: () => {
                if (params.linkURL) {
                  clipboard.writeText(params.linkURL);
                }
              }
            },
            {
              label: '复制图片',
              visible: params.hasImageContents,
              click: () => {
                contents.copyImageAt(params.x, params.y);
              }
            },
            {
              label: '复制',
              visible: params.selectionText !== '',
              accelerator: 'CmdOrCtrl+C',
              click: () => {
                contents.copy();
              }
            },
            { type: 'separator' },
            {
              label: '检查元素',
              click: () => {
                contents.inspectElement(params.x, params.y);
              }
            }
          ]);

          contextMenu.popup({ window: BrowserWindow.fromWebContents(contents) || undefined });
        });
      }
    );

    // 生产环境也打开DevTools以便调试
    // mainWindow.webContents.openDevTools();
    // console.log("✅ 生产环境DevTools已打开");
  } catch (err) {
    console.error("创建窗口失败：", err);
  }
}

// 捕获顶层 promise 拒绝
app
  .whenReady()
  .then(async () => {
    // 🧹 启动时清除所有浏览器实例的缓存数据 - 已禁用
    // await clearAllBrowserInstanceCaches();

    // 注册全局快捷键来开关DevTools
    globalShortcut.register('F12', () => {
      if (mainWindow && mainWindow.webContents) {
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
          console.log('✅ DevTools已关闭');
        } else {
          mainWindow.webContents.openDevTools();
          console.log('✅ DevTools已打开');
        }
      }
    });

    // 注册另一个快捷键 Ctrl+Shift+I
    globalShortcut.register('CommandOrControl+Shift+I', () => {
      if (mainWindow && mainWindow.webContents) {
        if (mainWindow.webContents.isDevToolsOpened()) {
          mainWindow.webContents.closeDevTools();
          console.log('✅ DevTools已关闭 (Ctrl+Shift+I)');
        } else {
          mainWindow.webContents.openDevTools();
          console.log('✅ DevTools已打开 (Ctrl+Shift+I)');
        }
      }
    });

    console.log('✅ 已注册DevTools快捷键: F12 和 Ctrl+Shift+I');

    // 设置应用级别的安全策略
    app.commandLine.appendSwitch('disable-web-security');
    app.commandLine.appendSwitch('disable-features', 'VizDisplayCompositor');
    app.commandLine.appendSwitch('allow-running-insecure-content');
    app.commandLine.appendSwitch('disable-site-isolation-trials');
    app.commandLine.appendSwitch('ignore-certificate-errors');
    app.commandLine.appendSwitch('ignore-ssl-errors');
    app.commandLine.appendSwitch('ignore-certificate-errors-spki-list');

    // 设置自定义协议处理器，防止系统弹出未知协议对话框
    const dangerousProtocols = ['bytedance', 'toutiao', 'douyin', 'xigua', 'javascript', 'data', 'vbscript'];

    // dangerousProtocols.forEach(protocol => {
    //   app.setAsDefaultProtocolClient(protocol, process.execPath, []);
    //   console.log(`已注册协议处理器: ${protocol}://`);
    // });

    // 处理协议请求
    app.on('open-url', (event, url) => {
      event.preventDefault();
      console.log('收到协议请求:', url);

      // 检查是否是危险协议
      const isDangerous = dangerousProtocols.some(protocol => url.startsWith(`${protocol}:`));

      if (isDangerous) {
        console.warn('阻止处理危险协议:', url);
        // 可以选择显示一个通知或者忽略
        return;
      }

      // 对于其他协议，可以选择处理或忽略
      console.log('忽略协议请求:', url);
    });

    createWindow();
  })
  .catch((err) => console.error("应用启动失败：", err));

app.on("window-all-closed", () => {
  // 注销所有全局快捷键
  globalShortcut.unregisterAll();
  console.log('✅ 已注销所有全局快捷键');

  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.handle("ping", async () => "pong from main process");

// 🔐 系统认证相关的IPC处理器
ipcMain.handle("system-auth-get-current-user", async () => {
  try {
    const currentUser = systemAuth.getCurrentUser();
    const platformInfo = systemAuth.getPlatformInfo();
    console.log(`📋 获取当前用户信息: ${currentUser} (${platformInfo.platform})`);
    return {
      success: true,
      username: currentUser,
      platform: platformInfo.platform,
      supported: systemAuth.isSupportedPlatform()
    };
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle("system-auth-verify-password", async (_event, password: string, username?: string) => {
  try {
    console.log('🔐 开始系统密码验证...');
    const result = await systemAuth.verifyPassword(password, username);
    
    if (result.success) {
      console.log('✅ 系统密码验证成功');
    } else {
      console.log('❌ 系统密码验证失败:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('系统密码验证异常:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle("system-auth-check-support", async () => {
  try {
    const platformInfo = systemAuth.getPlatformInfo();
    const isSupported = systemAuth.isSupportedPlatform();
    
    console.log(`🔍 检查系统认证支持: ${isSupported} (${platformInfo.platform})`);
    
    return {
      success: true,
      supported: isSupported,
      platform: platformInfo.platform,
      arch: platformInfo.arch,
      release: platformInfo.release
    };
  } catch (error) {
    console.error('检查系统认证支持失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle("system-auth-check-user-password", async (_event, username?: string) => {
  try {
    console.log('🔍 检查用户密码设置状态...');
    const result = await systemAuth.checkUserHasPassword(username);
    
    if (result.success) {
      const hasPassword = !!result.username;
      console.log(`✅ 用户密码检测完成: ${hasPassword ? '有密码' : '无密码'}`);
    } else {
      console.log('❌ 用户密码检测失败:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('用户密码检测异常:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

// 清除指定 webContents 的缓存
ipcMain.handle("clear-cache", async (_evt, wcId: number) => {
  const wc = webContents.fromId(wcId);
  if (wc) await wc.session.clearCache();
  return true;
});

// 删除指定partition的存储文件夹和所有session数据（包括cookies）
ipcMain.handle("delete-partition-storage", async (_evt, partitionName: string) => {
  return await deletePartitionStorageFolder(partitionName);
});

// 在主进程中打开或创建 SQLite 数据库
async function getDb(customPath?: string): Promise<any> {
  let dbPath: string;

  if (customPath && customPath.trim() !== '') {
    // 如果指定了非空的自定义路径，处理相对路径和绝对路径
    if (path.isAbsolute(customPath)) {
      dbPath = customPath;
    } else {
      // 相对路径处理
      if (process.env.NODE_ENV === "development") {
        // 开发环境：相对于项目根目录
        dbPath = path.join(process.cwd(), customPath);
      } else {
        // 生产环境：相对于应用资源目录
        dbPath = path.join(process.resourcesPath, customPath);
      }
    }
  } else {
    // 默认数据库路径（用户数据目录）
    dbPath = path.join(app.getPath("userData"), "app.db");
  }

  console.log(`数据库路径: ${dbPath}`);

  // 确保数据库目录存在
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  return open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
}

// 存储数据库连接
const dbConnections = new Map<string, any>();

// SQLite API 实现
// 打开数据库连接
ipcMain.handle("sqlite-open", async (_event, filePath: string) => {
  try {
    const db = await getDb(filePath);
    const connectionId = filePath;
    dbConnections.set(connectionId, db);
    return { success: true, connectionId };
  } catch (error) {
    console.error("Failed to open database:", error);
    return { success: false, error: (error as Error).message };
  }
});

// 执行 SQL 语句
ipcMain.handle(
  "sqlite-run",
  async (_event, sql: string, params: any[] = []) => {
    try {
      const db = await getDb();
      const result = await db.run(sql, params || []);
      return { success: true, result };
    } catch (error) {
      console.error("Failed to run SQL:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// 执行 SQL 查询并返回所有结果
ipcMain.handle(
  "sqlite-all",
  async (_event, sql: string, params: any[] = []) => {
    try {
      const db = await getDb();
      const rows = await db.all(sql, params || []);
      return { success: true, rows };
    } catch (error) {
      console.error("Failed to query SQL:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// 执行 SQL 查询并返回单个结果
ipcMain.handle(
  "sqlite-get",
  async (_event, sql: string, params: any[] = []) => {
    try {
      const db = await getDb();
      const row = await db.get(sql, params || []);
      return { success: true, row };
    } catch (error) {
      console.error("Failed to get SQL result:", error);
      return { success: false, error: (error as Error).message };
    }
  }
);

// RSA 加密处理器
ipcMain.handle("encrypt-script", async (_event, text: string) => {
  try {
    const encrypted = encryptScript(text);
    return { success: true, encrypted };
  } catch (error) {
    console.error("加密失败:", error);
    return { success: false, error: (error as Error).message };
  }
});

// RSA 解密处理器
ipcMain.handle("decrypt-script", async (_event, encryptedText: string) => {
  try {
    const decrypted = decryptScript(encryptedText);
    return { success: true, decrypted };
  } catch (error) {
    console.error("解密失败:", error);
    return { success: false, error: (error as Error).message };
  }
});



// 获取系统资源使用情况
ipcMain.handle("get-system-stats", async () => {
  try {
    // 快速获取内存信息
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const systemMemoryPercent = (usedMemory / totalMemory) * 100;
    
    // 异步获取主进程内存使用
    const procMemUsage = await process.getProcessMemoryInfo();
    const mainProcessMemoryMB = (procMemUsage as any).private / 1024;
    
    // 获取所有WebView的内存使用情况
    const allWebContents = webContents.getAllWebContents();
    const webviews = allWebContents.filter(wc => wc.getType() === 'webview');
    
    let totalWebViewMemoryMB = 0;
    const webviewMemoryDetails: Array<{id: number, url: string, memoryMB: number}> = [];
    
    // 尝试获取WebView内存信息
    for (const wv of webviews) {
      try {
        let memoryMB = 50; // 默认估算值
        let memoryObtained = false;
        
        // 方法1: 尝试使用 webContents.getProcessMemoryInfo (Electron 现代API)
        try {
          if (typeof (wv as any).getProcessMemoryInfo === 'function') {
            const memInfo = await (wv as any).getProcessMemoryInfo();
            if (memInfo && memInfo.private) {
              memoryMB = memInfo.private / 1024;
              memoryObtained = true;
              console.log(`✅ WebView ${wv.id} 内存 (方法1): ${memoryMB.toFixed(1)}MB`);
            }
          }
        } catch (error) {
          console.log(`⚠️ WebView ${wv.id} 方法1获取内存失败:`, error instanceof Error ? error.message : String(error));
        }
        
        // 方法2: 如果方法1失败，尝试通过进程ID获取内存信息
        if (!memoryObtained) {
          try {
            const pid = wv.getOSProcessId();
            if (pid) {
              // 使用 Node.js process 模块获取进程内存信息
              const { exec } = require('child_process');
              const { promisify } = require('util');
              const execAsync = promisify(exec);
              
              if (process.platform === 'win32') {
                // Windows: 使用 tasklist 命令
                const { stdout } = await execAsync(`tasklist /fi "PID eq ${pid}" /fo csv | findstr ${pid}`);
                const lines = stdout.trim().split('\n');
                if (lines.length > 0) {
                  // 解析 CSV 格式，内存字段可能包含逗号分隔的千位数
                  const csvLine = lines[0];
                  const matches = csvLine.match(/"([^"]+)"/g);
                  if (matches && matches.length >= 5) {
                    const memoryStr = matches[4].replace(/"/g, '');
                    // 移除所有逗号和 'K' 后缀，提取数字
                    const memoryKB = parseInt(memoryStr.replace(/[,\s]/g, '').replace('K', ''));
                    if (!isNaN(memoryKB)) {
                      memoryMB = memoryKB / 1024;
                      memoryObtained = true;
                      console.log(`✅ WebView ${wv.id} 内存 (方法2-Windows): ${memoryMB.toFixed(1)}MB`);
                    }
                  }
                }
              } else if (process.platform === 'darwin') {
                // macOS: 使用 ps 命令
                const { stdout } = await execAsync(`ps -p ${pid} -o rss=`);
                const memoryKB = parseInt(stdout.trim());
                if (!isNaN(memoryKB)) {
                  memoryMB = memoryKB / 1024;
                  memoryObtained = true;
                  console.log(`✅ WebView ${wv.id} 内存 (方法2-macOS): ${memoryMB.toFixed(1)}MB`);
                }
              } else if (process.platform === 'linux') {
                // Linux: 使用 ps 命令
                const { stdout } = await execAsync(`ps -p ${pid} -o rss --no-headers`);
                const memoryKB = parseInt(stdout.trim());
                if (!isNaN(memoryKB)) {
                  memoryMB = memoryKB / 1024;
                  memoryObtained = true;
                  console.log(`✅ WebView ${wv.id} 内存 (方法2-Linux): ${memoryMB.toFixed(1)}MB`);
                }
              }
            }
          } catch (error) {
            console.log(`⚠️ WebView ${wv.id} 方法2获取内存失败:`, error instanceof Error ? error.message : String(error));
          }
        }
        
        // 方法3: 如果前面都失败，尝试基于URL复杂度的智能估算
        if (!memoryObtained) {
          const url = wv.getURL();
          if (url) {
            // 根据不同网站类型进行更准确的估算
            if (url.includes('youtube.com') || url.includes('bilibili.com')) {
              memoryMB = 120; // 视频网站通常占用更多内存
            } else if (url.includes('github.com') || url.includes('stackoverflow.com')) {
              memoryMB = 80; // 开发类网站
            } else if (url.includes('baidu.com') || url.includes('google.com')) {
              memoryMB = 60; // 搜索引擎
            } else if (url.includes('taobao.com') || url.includes('tmall.com')) {
              memoryMB = 90; // 电商网站
            } else {
              memoryMB = 70; // 普通网站的更合理估算
            }
            console.log(`📊 WebView ${wv.id} 智能估算内存 (${url}): ${memoryMB}MB`);
          } else {
            console.log(`📊 WebView ${wv.id} 使用默认估算内存: ${memoryMB}MB`);
          }
        }
        
        webviewMemoryDetails.push({
          id: wv.id,
          url: wv.getURL() || 'unknown',
          memoryMB: Math.round(memoryMB * 100) / 100
        });
        totalWebViewMemoryMB += memoryMB;
        
      } catch (error) {
        console.warn(`❌ 获取WebView ${wv.id} 内存信息完全失败，使用默认估算值:`, error);
        // 最后的兜底方案
        const estimatedMemoryMB = 70;
        webviewMemoryDetails.push({
          id: wv.id,
          url: wv.getURL() || 'unknown',
          memoryMB: estimatedMemoryMB
        });
        totalWebViewMemoryMB += estimatedMemoryMB;
      }
    }
    
    // 计算应用总内存（主进程 + 所有WebView）
    const totalAppMemoryMB = mainProcessMemoryMB + totalWebViewMemoryMB;
    const totalAppMemoryBytes = totalAppMemoryMB * 1024 * 1024;
    const appMemoryPercent = (totalAppMemoryBytes / totalMemory) * 100;
    
    // 计算真实内存使用率（考虑应用内存占用）
    // 使用系统内存和应用内存的最大值，确保不会低估内存使用
    const realMemoryPercent = Math.max(systemMemoryPercent, appMemoryPercent);
    
    console.log(`📊 内存统计 - 系统:${systemMemoryPercent.toFixed(1)}%, 应用总计:${totalAppMemoryMB.toFixed(1)}MB(${appMemoryPercent.toFixed(1)}%), 主进程:${mainProcessMemoryMB.toFixed(1)}MB, WebView:${totalWebViewMemoryMB.toFixed(1)}MB`);
    
    return {
      memory: {
        total: Math.round(totalMemory / (1024 * 1024 * 1024) * 100) / 100, // GB
        used: Math.round(usedMemory / (1024 * 1024 * 1024) * 100) / 100, // GB
        free: Math.round(freeMemory / (1024 * 1024 * 1024) * 100) / 100, // GB
        percent: Math.round(realMemoryPercent * 100) / 100, // 使用真实内存使用率
        system: {
          percent: Math.round(systemMemoryPercent * 100) / 100 // 系统级内存使用率
        },
        app: {
          mb: Math.round(totalAppMemoryMB * 100) / 100, // 应用总内存
          percent: Math.round(appMemoryPercent * 100) / 100, // 应用内存占系统百分比
          main: Math.round(mainProcessMemoryMB * 100) / 100, // 主进程内存
          webviews: Math.round(totalWebViewMemoryMB * 100) / 100 // WebView总内存
        }
      },
      webviews: {
        count: webviews.length,
        total: allWebContents.length,
        memoryDetails: webviewMemoryDetails.slice(0, 10) // 只返回前10个详情，避免数据过大
      }
    };
  } catch (error) {
    console.error("获取系统资源信息失败:", error);
    return null;
  }
});

// 强制关闭非活跃的webview
ipcMain.handle("force-close-inactive-webviews", async (_event, activeWebContentsIds: number[]) => {
  try {
    const allWebContents = webContents.getAllWebContents();
    const webviews = allWebContents.filter(wc => wc.getType() === 'webview');
    let closedCount = 0;
    
    // 如果没有明确的激活ID列表，采用保守策略
    if (!activeWebContentsIds || activeWebContentsIds.length === 0) {
      console.log('🛡️ 没有明确的激活WebView列表，采用保守策略：保留最新的2个WebView');
      
      // 按创建时间排序，保留最新的2个WebView
      const sortedWebviews = webviews.sort((a, b) => b.id - a.id); // ID越大通常越新
      const webviewsToClose = sortedWebviews.slice(2); // 保留前2个，关闭其余的
      
      for (const wv of webviewsToClose) {
        try {
          wv.close();
          closedCount++;
          console.log(`关闭WebView ID: ${wv.id}`);
        } catch (error) {
          console.warn(`关闭webview ${wv.id} 失败:`, error);
        }
      }
      
      console.log(`🧹 内存保护(保守策略): 保留了最新的${Math.min(2, webviews.length)}个WebView，关闭了 ${closedCount} 个WebView`);
    } else {
      // 有明确的激活ID列表，按原逻辑处理
      for (const wv of webviews) {
        if (!activeWebContentsIds.includes(wv.id)) {
          try {
            wv.close();
            closedCount++;
            console.log(`关闭非激活WebView ID: ${wv.id}`);
          } catch (error) {
            console.warn(`关闭webview ${wv.id} 失败:`, error);
          }
        }
      }
      
      console.log(`🧹 内存保护: 强制关闭了 ${closedCount} 个非活跃webview`);
    }
    
    return { success: true, closedCount };
  } catch (error) {
    console.error("强制关闭非活跃webview失败:", error);
    return { success: false, error: (error as Error).message };
  }
});

// 关闭所有webview（内存保护）
ipcMain.handle("force-close-all-webviews", async () => {
  try {
    const allWebContents = webContents.getAllWebContents();
    const webviews = allWebContents.filter(wc => wc.getType() === 'webview');
    let closedCount = 0;
    
    for (const wv of webviews) {
      try {
        wv.close();
        closedCount++;
      } catch (error) {
        console.warn(`关闭webview ${wv.id} 失败:`, error);
      }
    }
    
    console.log(`🚨 内存保护: 强制关闭了所有 ${closedCount} 个webview实例`);
    return { success: true, closedCount };
  } catch (error) {
    console.error("强制关闭所有webview失败:", error);
    return { success: false, error: (error as Error).message };
  }
});

// 关闭应用程序处理器
ipcMain.handle("close-app", async () => {
  app.quit();
});

// 存储分离的窗口实例
const detachedWindows = new Map<string, BrowserWindow>();
const windowDragListeners = new Map<string, any>();

// 创建分离的WebView窗口
ipcMain.handle("create-detached-webview-window", async (event, data) => {
  try {
    const { url, title, partition, width = 1000, height = 700, tabId } = data;
    console.log('🪟 创建分离的WebView窗口:', { url, title, partition, tabId });

    // 创建新窗口
    const detachedWindow = new BrowserWindow({
      width,
      height,
      minWidth: 800,
      minHeight: 600,
      title: title || '分离窗口',
      autoHideMenuBar: true,
      icon: getIconPath(),
      webPreferences: {
        preload: join(__dirname, "preload.js"),
        contextIsolation: true,
        nodeIntegration: false,
        devTools: true,
        webviewTag: true,
        webSecurity: false,
        allowRunningInsecureContent: true,
        partition: partition,
        spellcheck: false,
      },
      frame: true,
      titleBarStyle: 'default'
    });

    // 生成唯一的窗口ID
    const windowId = `detached-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    detachedWindows.set(windowId, detachedWindow);

    // 加载包含WebView的HTML页面
    const detachedHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title || '分离窗口'}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #f5f5f5;
            overflow: hidden;
        }
        .detached-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
            width: 100vw;
        }
        .detached-header {
            background: linear-gradient(90deg, #4f46e5, #7c3aed);
            color: white;
            padding: 8px 16px;
            font-size: 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            user-select: none;
            -webkit-app-region: drag;
        }
        .detached-title {
            font-weight: 500;
            opacity: 0.9;
        }
        .detached-controls {
            display: flex;
            gap: 8px;
            -webkit-app-region: no-drag;
        }
        .detached-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            transition: background 0.2s;
        }
        .detached-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        .detached-webview {
            flex: 1;
            border: none;
            background: white;
        }
        .drop-zone-indicator {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 40px;
            background: linear-gradient(45deg, #3b82f6, #1d4ed8);
            opacity: 0;
            transition: opacity 0.3s ease;
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 14px;
            font-weight: 500;
        }
        .drop-zone-indicator.active {
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="detached-container">
        <div class="drop-zone-indicator" id="dropZone">
            拖拽到这里可以合并回主窗口
        </div>
        <div class="detached-header">
            <div class="detached-title">${title || '分离窗口'}</div>
            <div class="detached-controls">
                <button class="detached-btn" onclick="window.electronAPI?.mergeBackToMain?.('${windowId}', '${tabId}')">
                    合并回主窗口
                </button>
                <button class="detached-btn" onclick="window.close()">
                    关闭
                </button>
            </div>
        </div>
        <webview 
            id="detachedWebview"
            class="detached-webview"
            src="${url}"
            partition="${partition}"
            nodeintegration="false"
            disablewebsecurity="true"
            allowpopups="true">
        </webview>
    </div>
    
    <script>
        let isNearMainWindow = false;
        let dragCheckInterval = null;
        
        // 监听窗口移动
        function startDragDetection() {
            if (dragCheckInterval) return;
            
            dragCheckInterval = setInterval(async () => {
                const bounds = await window.electronAPI?.getWindowBounds?.();
                const mainBounds = await window.electronAPI?.getMainWindowBounds?.();
                
                if (bounds && mainBounds) {
                    // 检查是否接近主窗口的标签栏区域
                    const isNear = checkNearMainWindow(bounds, mainBounds);
                    
                    if (isNear !== isNearMainWindow) {
                        isNearMainWindow = isNear;
                        const dropZone = document.getElementById('dropZone');
                        if (dropZone) {
                            dropZone.classList.toggle('active', isNear);
                        }
                        
                        // 通知主进程
                        window.electronAPI?.setWindowNearMain?.('${windowId}', isNear);
                    }
                }
            }, 100);
        }
        
        function stopDragDetection() {
            if (dragCheckInterval) {
                clearInterval(dragCheckInterval);
                dragCheckInterval = null;
            }
        }
        
        function checkNearMainWindow(bounds, mainBounds) {
            // 检查窗口顶部是否接近主窗口的标签栏区域（顶部50像素）
            const tabBarArea = {
                x: mainBounds.x,
                y: mainBounds.y,
                width: mainBounds.width,
                height: 100 // 标签栏区域高度
            };
            
            const threshold = 20; // 接近阈值
            
            return (
                bounds.x + bounds.width > tabBarArea.x - threshold &&
                bounds.x < tabBarArea.x + tabBarArea.width + threshold &&
                bounds.y + 20 > tabBarArea.y - threshold &&
                bounds.y < tabBarArea.y + tabBarArea.height + threshold
            );
        }
        
        // 页面加载完成后开始监听
        document.addEventListener('DOMContentLoaded', () => {
            console.log('🎯 分离窗口已加载，开始拖拽检测');
            
            // 监听鼠标按下事件（开始拖拽）
            document.addEventListener('mousedown', startDragDetection);
            
            // 监听鼠标释放事件（结束拖拽）
            document.addEventListener('mouseup', stopDragDetection);
            
            // 页面卸载时清理
            window.addEventListener('beforeunload', stopDragDetection);
        });
    </script>
</body>
</html>`;

    // 将HTML写入临时文件
    const tempDir = join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    const tempHtmlPath = join(tempDir, `detached-${windowId}.html`);
    fs.writeFileSync(tempHtmlPath, detachedHtml, 'utf8');

    // 加载临时HTML文件
    await detachedWindow.loadFile(tempHtmlPath);

    // 窗口关闭时清理
    detachedWindow.on('closed', () => {
      detachedWindows.delete(windowId);
      // 清理临时文件
      try {
        if (fs.existsSync(tempHtmlPath)) {
          fs.unlinkSync(tempHtmlPath);
        }
      } catch (error) {
        console.warn('清理临时文件失败:', error);
      }
    });

    // 显示窗口
    detachedWindow.show();
    detachedWindow.focus();

    console.log('✅ 分离窗口创建成功:', windowId);
    return { success: true, windowId };

  } catch (error) {
    console.error('❌ 创建分离窗口失败:', error);
    return { success: false, error: (error as Error).message };
  }
});

// 获取窗口位置信息
ipcMain.handle("get-window-bounds", async (event) => {
  const webContents = event.sender;
  const window = BrowserWindow.fromWebContents(webContents);
  if (window) {
    return window.getBounds();
  }
  return null;
});

// 获取主窗口位置信息
ipcMain.handle("get-main-window-bounds", async () => {
  if (mainWindow) {
    return mainWindow.getBounds();
  }
  return null;
});

// 设置窗口接近主窗口状态
ipcMain.handle("set-window-near-main", async (event, windowId, isNear) => {
  console.log(`窗口 ${windowId} ${isNear ? '接近' : '远离'} 主窗口`);
  
  if (isNear) {
    // 可以在这里添加视觉提示，比如让主窗口的标签栏高亮
    mainWindow?.webContents.send('detached-window-near', { windowId, isNear });
  }
});

// 合并分离窗口回主窗口
ipcMain.handle("merge-back-to-main", async (event, windowId, tabId) => {
  try {
    console.log('🔄 合并窗口回主窗口:', { windowId, tabId });
    
    const detachedWindow = detachedWindows.get(windowId);
    if (!detachedWindow) {
      return { success: false, error: '未找到分离窗口' };
    }

    // 获取分离窗口中的WebView信息
    const webviewInfo = await detachedWindow.webContents.executeJavaScript(`
      const webview = document.getElementById('detachedWebview');
      if (webview) {
        ({
          url: webview.src,
          title: webview.getTitle ? webview.getTitle() : document.title,
          canGoBack: webview.canGoBack ? webview.canGoBack() : false,
          canGoForward: webview.canGoForward ? webview.canGoForward() : false
        });
      } else {
        null;
      }
    `);

    if (webviewInfo) {
      // 通知主窗口恢复标签页
      mainWindow?.webContents.send('restore-detached-tab', {
        windowId,
        tabId,
        webviewInfo
      });
      
      // 关闭分离窗口
      detachedWindow.close();
      
      return { success: true };
    } else {
      return { success: false, error: '无法获取WebView信息' };
    }

  } catch (error) {
    console.error('❌ 合并窗口失败:', error);
    return { success: false, error: (error as Error).message };
  }
});
