// 测试版本导出
import { VERSION_TYPE, getVersionName } from './src/utils/version.ts';

console.log('测试版本导出:');
console.log('VERSION_TYPE:', VERSION_TYPE);
console.log('版本名称:', getVersionName());

// 测试打包替换功能
if (VERSION_TYPE === 'quarterly') {
  console.log('✅ 季度版本配置正确');
} else if (VERSION_TYPE === 'test') {
  console.log('✅ 测试版本配置正确');
} else if (VERSION_TYPE === 'trial') {
  console.log('✅ 试用版本配置正确');
} else if (VERSION_TYPE === 'permanent') {
  console.log('✅ 永久版本配置正确');
} else {
  console.log('❌ 未知版本类型:', VERSION_TYPE);
}
