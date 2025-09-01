// 版本类型定义
export enum VersionType {
  TRIAL = 'trial',      // 试用版：3天
  QUARTERLY = 'quarterly', // 季度版：90天
  TEST = 'test',        // 功能测试版：5分钟
  PERMANENT = 'permanent' // 永久版本：无限制
}

// 全局变量声明
declare const __BUILD_TIME__: string;
declare const __VERSION_TYPE__: string;

// 版本配置接口
export interface VersionConfig {
  type: VersionType;
  buildTime: number;    // 打包时间戳
  expireTime: number;   // 到期时间戳
  daysLimit: number;    // 限制天数（对于分钟级版本，这个值为0）
  minutesLimit?: number; // 限制分钟数（用于测试版）
}

// 获取版本配置（简化版本）
export function getVersionConfig(): VersionConfig {
  let buildTime = Date.now();
  let versionType = VersionType.PERMANENT;
  
  // 直接访问全局常量
  try {
    if (typeof (globalThis as any).__BUILD_TIME__ !== 'undefined') {
      buildTime = parseInt((globalThis as any).__BUILD_TIME__);
      console.log('✅ 成功读取 __BUILD_TIME__:', buildTime);
    }
    
    if (typeof (globalThis as any).__VERSION_TYPE__ !== 'undefined') {
      const typeStr = (globalThis as any).__VERSION_TYPE__;
      if (Object.values(VersionType).includes(typeStr as VersionType)) {
        versionType = typeStr as VersionType;
        console.log('✅ 成功读取 __VERSION_TYPE__:', versionType);
      }
    }
  } catch (e) {
    console.log('全局访问失败，尝试其他方式:', e);
  }
  
  // 备用方法：直接使用常量值
  if (versionType === VersionType.PERMANENT && buildTime === Date.now()) {
    // 说明没有读取到配置，手动设置test版本用于测试
    versionType = VersionType.TEST;
    buildTime = 1755440676475; // 从vite.config.ts中的值
    console.log('⚠️ 使用硬编码的测试配置');
  }

  let daysLimit = 0;
  let minutesLimit = 0;
  let expireTime = 0;

  if (versionType === VersionType.TRIAL) {
    daysLimit = 3;
    expireTime = buildTime + (daysLimit * 24 * 60 * 60 * 1000);
  } else if (versionType === VersionType.QUARTERLY) {
    daysLimit = 90;
    expireTime = buildTime + (daysLimit * 24 * 60 * 60 * 1000);
  } else if (versionType === VersionType.TEST) {
    minutesLimit = 5;
    expireTime = buildTime + (minutesLimit * 60 * 1000);
  } else if (versionType === VersionType.PERMANENT) {
    // 永久版本：无到期时间
    expireTime = 0; // 0 表示永不过期
  }

  console.log('版本配置:', {
    versionType,
    buildTime,
    expireTime,
    currentTime: Date.now(),
    isExpired: expireTime > 0 && Date.now() > expireTime
  });

  return {
    type: versionType,
    buildTime,
    expireTime,
    daysLimit,
    minutesLimit
  };
}

// 获取版本名称
export function getVersionName(): string {
  const config = getVersionConfig();
  if (config.type === VersionType.TRIAL) {
    return '试用版';
  } else if (config.type === VersionType.QUARTERLY) {
    return '季度版';
  } else if (config.type === VersionType.TEST) {
    return '功能测试版';
  } else if (config.type === VersionType.PERMANENT) {
    return '永久版本';
  }
  return '永久版本'; // 默认返回永久版本
}
