// 测试全局常量
console.log('Testing global constants:');

try {
  // @ts-ignore
  console.log('__BUILD_TIME__:', typeof __BUILD_TIME__, __BUILD_TIME__);
} catch (e) {
  console.error('__BUILD_TIME__ not available:', e.message);
}

try {
  // @ts-ignore
  console.log('__VERSION_TYPE__:', typeof __VERSION_TYPE__, __VERSION_TYPE__);
} catch (e) {
  console.error('__VERSION_TYPE__ not available:', e.message);
}

// 测试 version.ts 函数
import { getVersionConfig } from './utils/version';

try {
  const config = getVersionConfig();
  console.log('getVersionConfig() success:', config);
} catch (e) {
  console.error('getVersionConfig() failed:', e.message);
}
