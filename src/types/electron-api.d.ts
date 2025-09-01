export {};

declare global {
  interface Window {
    mainAPI: {
      ping: () => Promise<any>;
    };
    electronAPI: {
      isProduction: boolean;
      isDevelopment: boolean;
      platform: string;
      closeApp: () => void;
      
      // 系统认证相关API
      systemAuthGetCurrentUser: () => Promise<{
        success: boolean;
        username?: string;
        platform?: string;
        supported?: boolean;
        error?: string;
      }>;
      systemAuthVerifyPassword: (password: string, username?: string) => Promise<{
        success: boolean;
        username?: string;
        error?: string;
      }>;
      systemAuthCheckSupport: () => Promise<{
        success: boolean;
        supported?: boolean;
        platform?: string;
        arch?: string;
        release?: string;
        error?: string;
      }>;
      systemAuthCheckUserPassword: (username?: string) => Promise<{
        success: boolean;
        username?: string;
        error?: string;
      }>;
    };
    webviewAPI: {
      clearCache: (webContentsId: number) => Promise<boolean>;
      deletePartitionStorage: (partitionName: string) => Promise<boolean>;
      onWebviewOpen: (callback: (data: { url: string; webContentsId: number; sourceURL: string }) => void) => void;
    };
    sqliteAPI: {
      // 打开或创建数据库文件
      openDB: (filePath: string) => Promise<void>;
      // 执行不返回结果集的 SQL（如 INSERT/UPDATE/DELETE）
      run: (sql: string, params?: any[]) => Promise<{ changes: number }>;
      // 查询多行结果
      all: (sql: string, params?: any[]) => Promise<any[]>;
      // 查询单行结果
      get: (sql: string, params?: any[]) => Promise<any>;
    };
    cryptoAPI: {
      // 加密脚本
      encryptScript: (text: string) => Promise<{ success: boolean; encrypted?: string; error?: string }>;
      // 解密脚本
      decryptScript: (encryptedText: string) => Promise<{ success: boolean; decrypted?: string; error?: string }>;
    };
    systemAPI: {
      // 获取系统资源统计信息
      getSystemStats: () => Promise<{
        memory: {
          total: number; // GB
          used: number; // GB
          free: number; // GB
          percent: number;
          app: {
            mb: number;
            percent: number;
          };
        };
        webviews: {
          count: number;
          total: number;
        };
      } | null>;
      // 强制关闭非活跃的webview
      forceCloseInactiveWebviews: (activeWebContentsIds: number[]) => Promise<{ success: boolean; closedCount?: number; error?: string }>;
      // 强制关闭所有webview（内存保护）
      forceCloseAllWebviews: () => Promise<{ success: boolean; closedCount?: number; error?: string }>;
    };
  }
}
