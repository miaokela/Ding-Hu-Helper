<template>
  <div class="version-countdown">
    <div class="flex items-center space-x-2 text-sm">
      <span class="px-2 py-1 rounded text-xs font-medium"
            :class="versionTypeClass">
        {{ versionName }}
      </span>
      
      <!-- 倒计时显示 -->
      <span v-if="countdownText" 
            class="px-2 py-1 rounded text-xs font-medium"
            :class="countdownClass">
        {{ countdownText }}
      </span>
    </div>

    <!-- 过期弹窗 -->
    <a-modal
      v-model:open="showExpiredModal"
      title="软件已过期"
      :closable="false"
      :maskClosable="false"
      :keyboard="false"
      :footer="null"
      :width="400"
      class="expired-modal"
    >
      <div class="text-center py-6">
        <div class="mb-4">
          <div class="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 class="text-lg font-semibold text-gray-800 mb-2">软件使用期限已到</h3>
          <p class="text-gray-600 mb-4">{{ versionName }}的使用期限已过期，请联系管理员获取新的授权。</p>
        </div>
        
        <div class="bg-gray-50 p-4 rounded-lg mb-4">
          <div class="text-sm text-gray-600">
            <div>版本类型：{{ versionName }}</div>
            <div>过期时间：{{ expiredTimeText }}</div>
          </div>
        </div>

        <button
          @click="handleCloseApp"
          class="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
        >
          确定退出
        </button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import { Modal } from 'ant-design-vue';
import { 
  getVersionName,
  calculateCountdown,
  formatDetailedCountdown,
  isVersionExpired,
  getVersionConfig
} from '../../utils/version_test';

// 版本名称
const versionName = getVersionName();

// 倒计时状态
const countdownInfo = ref(calculateCountdown());
const countdownText = computed(() => {
  if (countdownInfo.value.totalRemainingMs === Infinity) {
    return ''; // 永久版本不显示倒计时
  }
  return formatDetailedCountdown(countdownInfo.value);
});

// 过期弹窗状态
const showExpiredModal = ref(false);

// 过期时间文本
const expiredTimeText = computed(() => {
  const config = getVersionConfig();
  if (config.expireTime === 0) {
    return '永不过期';
  }
  return new Date(config.expireTime).toLocaleString();
});

// 定时器
let timer: NodeJS.Timeout | null = null;

// 更新倒计时
const updateCountdown = () => {
  countdownInfo.value = calculateCountdown();
  
  // 检查是否过期，如果过期且不是永久版本，显示弹窗
  if (countdownInfo.value.isExpired && 
      countdownInfo.value.totalRemainingMs !== Infinity && 
      !showExpiredModal.value) {
    showExpiredModal.value = true;
  }
  
  // 如果已过期，清除定时器
  if (countdownInfo.value.isExpired) {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
};

// 关闭应用
const handleCloseApp = () => {
  // 通过Electron IPC关闭应用
  if ((window as any).electronAPI) {
    (window as any).electronAPI.closeApp();
  } else {
    // 开发环境下的处理
    window.close();
  }
};

// 版本类型样式
const versionTypeClass = computed(() => {
  const config = calculateCountdown();
  if (config.isExpired) {
    return 'bg-red-100 text-red-800 border border-red-200';
  }
  
  const versionType = getVersionName();
  if (versionType === '试用版') {
    return 'bg-orange-100 text-orange-800 border border-orange-200';
  } else if (versionType === '季度版') {
    return 'bg-blue-100 text-blue-800 border border-blue-200';
  } else if (versionType === '功能测试版') {
    return 'bg-purple-100 text-purple-800 border border-purple-200';
  }
  return 'bg-gray-100 text-gray-800 border border-gray-200';
});

// 倒计时样式
const countdownClass = computed(() => {
  if (countdownInfo.value.isExpired) {
    return 'bg-red-100 text-red-800 border border-red-200';
  }
  
  // 根据剩余时间设置不同的颜色
  const totalMs = countdownInfo.value.totalRemainingMs;
  const oneDayMs = 24 * 60 * 60 * 1000;
  const oneHourMs = 60 * 60 * 1000;
  
  if (totalMs < oneHourMs) {
    return 'bg-red-100 text-red-800 border border-red-200'; // 少于1小时，红色警告
  } else if (totalMs < oneDayMs) {
    return 'bg-orange-100 text-orange-800 border border-orange-200'; // 少于1天，橙色提醒
  } else {
    return 'bg-green-100 text-green-800 border border-green-200'; // 充足时间，绿色
  }
});

// 生命周期
onMounted(() => {
  // 立即检查一次过期状态
  updateCountdown();
  
  // 每秒更新一次倒计时
  timer = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
});
</script>

<style scoped>
.version-countdown {
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
