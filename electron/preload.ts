import { contextBridge, ipcRenderer } from "electron";

// 暴露主窗口 API
contextBridge.exposeInMainWorld("mainAPI", {
  ping: () => ipcRenderer.invoke("ping"),
});

// 暴露环境信息 API
contextBridge.exposeInMainWorld("electronAPI", {
  isProduction: process.env.NODE_ENV === "production",
  isDevelopment: process.env.NODE_ENV === "development",
  platform: process.platform,
  closeApp: () => ipcRenderer.invoke("close-app"),
  
  // 系统认证相关API
  systemAuthGetCurrentUser: () => ipcRenderer.invoke("system-auth-get-current-user"),
  systemAuthVerifyPassword: (password: string, username?: string) => 
    ipcRenderer.invoke("system-auth-verify-password", password, username),
  systemAuthCheckSupport: () => ipcRenderer.invoke("system-auth-check-support"),
  systemAuthCheckUserPassword: (username?: string) => 
    ipcRenderer.invoke("system-auth-check-user-password", username),
  
  // WebView分离窗口相关API
  createDetachedWebviewWindow: (data: {
    url: string;
    title: string;
    partition: string;
    width?: number;
    height?: number;
    tabId: string;
  }) => ipcRenderer.invoke("create-detached-webview-window", data),
  
  getWindowBounds: () => ipcRenderer.invoke("get-window-bounds"),
  getMainWindowBounds: () => ipcRenderer.invoke("get-main-window-bounds"),
  setWindowNearMain: (windowId: string, isNear: boolean) => 
    ipcRenderer.invoke("set-window-near-main", windowId, isNear),
  mergeBackToMain: (windowId: string, tabId: string) => 
    ipcRenderer.invoke("merge-back-to-main", windowId, tabId),
    
  // 监听分离窗口相关事件
  onDetachedWindowNear: (callback: (data: { windowId: string; isNear: boolean }) => void) => {
    ipcRenderer.on("detached-window-near", (_event, data) => callback(data));
  },
  
  onRestoreDetachedTab: (callback: (data: {
    windowId: string;
    tabId: string;
    webviewInfo: any;
  }) => void) => {
    ipcRenderer.on("restore-detached-tab", (_event, data) => callback(data));
  },
});

// 暴露 WebView 侧 API：清除缓存 + 接收新窗口通知
contextBridge.exposeInMainWorld("webviewAPI", {
  // 清除指定 webContents 缓存
  clearCache: (id: number) => ipcRenderer.invoke("clear-cache", id),
  
  // 删除指定partition的存储文件夹
  deletePartitionStorage: (partitionName: string) => ipcRenderer.invoke("delete-partition-storage", partitionName),

  // 当主进程拦截到 window.open/ target="_blank" 时触发
  onWebviewOpen: (callback: (data: { url: string; webContentsId: number; sourceURL: string }) => void) => {
    ipcRenderer.on("webview-open-url", (_event, data) => {
      callback(data);
    });
  },
});

contextBridge.exposeInMainWorld("sqliteAPI", {
  openDB: (filePath: string) => ipcRenderer.invoke("sqlite-open", filePath),
  run: (sql: string, params?: any[]) =>
    ipcRenderer.invoke("sqlite-run", sql, params),
  all: (sql: string, params?: any[]) =>
    ipcRenderer.invoke("sqlite-all", sql, params),
  get: (sql: string, params?: any[]) =>
    ipcRenderer.invoke("sqlite-get", sql, params),
});

// 暴露加解密API
contextBridge.exposeInMainWorld("cryptoAPI", {
  encryptScript: (text: string) => ipcRenderer.invoke("encrypt-script", text),
  decryptScript: (encryptedText: string) => ipcRenderer.invoke("decrypt-script", encryptedText),
});

// 暴露系统资源监控API
contextBridge.exposeInMainWorld("systemAPI", {
  getSystemStats: () => ipcRenderer.invoke("get-system-stats"),
  forceCloseInactiveWebviews: (activeWebContentsIds: number[]) => 
    ipcRenderer.invoke("force-close-inactive-webviews", activeWebContentsIds),
  forceCloseAllWebviews: () => ipcRenderer.invoke("force-close-all-webviews"),
});
