// 简单的版本管理
export const VERSION_TYPE = 'quarterly'; // 这个会在打包时被替换

// 版本名称映射
const VERSION_NAMES: Record<string, string> = {
  'trial': '试用版',
  'quarterly': '季度版', 
  'test': '功能测试版',
  'permanent': '永久版本'
};

// 获取版本名称
export function getVersionName(): string {
  return VERSION_NAMES[VERSION_TYPE] || '永久版本';
}
