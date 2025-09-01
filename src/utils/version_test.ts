// 版本类型定义
export enum VersionType {
  TRIAL = 'trial',      // 试用版：3天
  QUARTERLY = 'quarterly', // 季度版：365天
  TEST = 'test',        // 功能测试版：5分钟
  PERMANENT = 'permanent' // 永久版本：无限制
}

// 版本配置接口
export interface VersionConfig {
  type: VersionType;
  buildTime: number;    // 打包时间戳
  expireTime: number;   // 到期时间戳
  daysLimit: number;    // 限制天数（对于分钟级版本，这个值为0）
  minutesLimit?: number; // 限制分钟数（用于测试版）
}

// 倒计时信息接口
export interface CountdownInfo {
  isExpired: boolean;
  remainingDays: number;
  remainingHours: number;
  remainingMinutes: number;
  remainingSeconds: number;
  totalRemainingMs: number;
}

// 获取当前时间
export function getCurrentTime(): number {
  return Date.now();
}

// 获取版本配置
export function getVersionConfig(): VersionConfig {
  let buildTime = Date.now();
  let versionType = VersionType.PERMANENT;
  
  console.log('🔍 检测版本配置...');
  
  // 尝试读取全局常量
  try {
    // @ts-ignore
    if (typeof __BUILD_TIME__ !== 'undefined') {
      // @ts-ignore
      buildTime = parseInt(__BUILD_TIME__);
      console.log('BUILD_TIME loaded:', buildTime);
    } else {
      console.log('BUILD_TIME not defined, using default');
    }
    
    // @ts-ignore
    if (typeof __VERSION_TYPE__ !== 'undefined') {
      // @ts-ignore
      const typeStr = __VERSION_TYPE__;
      if (Object.values(VersionType).includes(typeStr as VersionType)) {
        versionType = typeStr as VersionType;
        console.log('VERSION_TYPE loaded:', versionType);
      } else {
        console.log('Invalid VERSION_TYPE:', typeStr);
      }
    } else {
      console.log('VERSION_TYPE not defined, using default');
    }
  } catch (e) {
    console.log('Failed to read global constants:', e);
    
    // Manual test configuration
    console.log('Using manual test configuration');
    versionType = VersionType.TEST;
    buildTime = 1755440676475;
  }

  let daysLimit = 0;
  let minutesLimit = 0;
  let expireTime = 0;

  if (versionType === VersionType.TRIAL) {
    daysLimit = 3;
    expireTime = buildTime + (daysLimit * 24 * 60 * 60 * 1000);
  } else if (versionType === VersionType.QUARTERLY) {
    daysLimit = 365;
    expireTime = buildTime + (daysLimit * 24 * 60 * 60 * 1000);
  } else if (versionType === VersionType.TEST) {
    minutesLimit = 5;
    expireTime = buildTime + (minutesLimit * 60 * 1000);
  } else if (versionType === VersionType.PERMANENT) {
    expireTime = 0; // 0 表示永不过期
  }

  console.log('Version config result:', {
    type: versionType,
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

// 计算倒计时信息
export function calculateCountdown(): CountdownInfo {
  const config = getVersionConfig();
  
  // 永久版本永不过期
  if (config.type === VersionType.PERMANENT) {
    return {
      isExpired: false,
      remainingDays: 0,
      remainingHours: 0,
      remainingMinutes: 0,
      remainingSeconds: 0,
      totalRemainingMs: Infinity
    };
  }
  
  const now = getCurrentTime();
  const totalRemainingMs = Math.max(0, config.expireTime - now);
  
  const isExpired = totalRemainingMs <= 0;
  const remainingDays = Math.floor(totalRemainingMs / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor((totalRemainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const remainingMinutes = Math.floor((totalRemainingMs % (1000 * 60 * 60)) / (1000 * 60));
  const remainingSeconds = Math.floor((totalRemainingMs % (1000 * 60)) / 1000);

  return {
    isExpired,
    remainingDays,
    remainingHours,
    remainingMinutes,
    remainingSeconds,
    totalRemainingMs
  };
}

// 获取版本名称
export function getVersionName(): string {
  const config = getVersionConfig();
  switch (config.type) {
    case VersionType.TRIAL:
      return '试用版';
    case VersionType.QUARTERLY:
      return '季度版';
    case VersionType.TEST:
      return '功能测试版';
    case VersionType.PERMANENT:
      return '永久版本';
    default:
      return '永久版本';
  }
}

// 检查是否过期
export function isVersionExpired(): boolean {
  return calculateCountdown().isExpired;
}

// 格式化倒计时显示
export function formatCountdown(countdown: CountdownInfo): string {
  if (countdown.isExpired) {
    return '已过期';
  }
  
  if (countdown.totalRemainingMs === Infinity) {
    return '';
  }
  
  const config = getVersionConfig();
  
  // 对于测试版（分钟级），显示秒数
  if (config.type === VersionType.TEST) {
    if (countdown.remainingDays > 0) {
      return `${countdown.remainingDays}天 ${countdown.remainingHours.toString().padStart(2, '0')}:${countdown.remainingMinutes.toString().padStart(2, '0')}:${countdown.remainingSeconds.toString().padStart(2, '0')}`;
    } else {
      return `${countdown.remainingHours.toString().padStart(2, '0')}:${countdown.remainingMinutes.toString().padStart(2, '0')}:${countdown.remainingSeconds.toString().padStart(2, '0')}`;
    }
  }
  
  // 对于其他版本
  if (countdown.remainingDays > 0) {
    return `${countdown.remainingDays}天 ${countdown.remainingHours.toString().padStart(2, '0')}:${countdown.remainingMinutes.toString().padStart(2, '0')}`;
  } else {
    return `${countdown.remainingHours.toString().padStart(2, '0')}:${countdown.remainingMinutes.toString().padStart(2, '0')}`;
  }
}

// 格式化详细倒计时
export function formatDetailedCountdown(countdown: CountdownInfo): string {
  if (countdown.isExpired) {
    return '已过期';
  }
  
  if (countdown.totalRemainingMs === Infinity) {
    return '永久版本';
  }
  
  if (countdown.remainingDays > 0) {
    return `${countdown.remainingDays}天 ${countdown.remainingHours.toString().padStart(2, '0')}:${countdown.remainingMinutes.toString().padStart(2, '0')}:${countdown.remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${countdown.remainingHours.toString().padStart(2, '0')}:${countdown.remainingMinutes.toString().padStart(2, '0')}:${countdown.remainingSeconds.toString().padStart(2, '0')}`;
  }
}
