<template>
  <div class="memory-monitor">
    <!-- 折叠状态显示 -->
    <div v-if="collapsed" class="collapsed-display p-2 space-y-1">
      <div class="flex items-center justify-center">
        <div 
          class="w-3 h-3 rounded-full"
          :class="memoryStatus.color"
          :title="`内存: ${stats?.memory.percent}%`"
        ></div>
      </div>
      <div class="text-xs text-center text-gray-300">
        {{ stats?.memory.percent.toFixed(0) }}%
      </div>
    </div>
    
    <!-- 展开状态显示 -->
    <div v-else class="expanded-display p-3 space-y-2 mx-2">
      <div class="text-xs text-gray-300 font-medium border-b border-gray-600/50 pb-1">
        内存监控
      </div>
      
      <!-- 内存使用情况 -->
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-400">内存</span>
          <span 
            :class="memoryStatus.textColor"
            class="font-medium"
          >
            {{ stats?.memory.percent.toFixed(1) }}%
          </span>
        </div>
        <div class="w-full bg-gray-700 rounded-full h-1.5">
          <div 
            class="h-1.5 rounded-full transition-all duration-300"
            :class="memoryStatus.barColor"
            :style="{ width: `${Math.min(100, stats?.memory.percent || 0)}%` }"
          ></div>
        </div>
        <div class="text-xs text-gray-500">
          {{ stats?.memory.used.toFixed(1) }}GB / {{ stats?.memory.total.toFixed(1) }}GB
        </div>
      </div>
      
      <!-- 应用程序内存 -->
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-400">本应用</span>
          <span class="text-blue-400 font-medium">
            {{ stats?.memory.app.mb.toFixed(0) }}MB
          </span>
        </div>
        <div class="text-xs text-gray-500 pl-2">
          <div class="flex justify-between">
            <span>主进程:</span>
            <span>{{ stats?.memory.app.main.toFixed(0) }}MB</span>
          </div>
          <div class="flex justify-between">
            <span>WebView:</span>
            <span>{{ stats?.memory.app.webviews.toFixed(0) }}MB</span>
          </div>
        </div>
      </div>
      
      <!-- WebView统计 -->
      <div class="space-y-1">
        <div class="flex items-center justify-between text-xs">
          <span class="text-gray-400">WebView</span>
          <span class="text-purple-400 font-medium">
            {{ stats?.webviews.count || 0 }}个
          </span>
        </div>
        <div v-if="stats?.webviews.memoryDetails && stats.webviews.memoryDetails.length > 0" class="text-xs text-gray-500 pl-2">
          <div class="max-h-20 overflow-y-auto">
            <div 
              v-for="detail in stats.webviews.memoryDetails.slice(0, 3)" 
              :key="detail.id"
              class="flex justify-between items-center py-0.5"
            >
              <span class="truncate max-w-16" :title="detail.url">
                {{ getDisplayUrl(detail.url) }}
              </span>
              <span class="text-purple-300">{{ detail.memoryMB.toFixed(0) }}MB</span>
            </div>
            <div v-if="stats.webviews.memoryDetails.length > 3" class="text-gray-600 text-center">
              +{{ stats.webviews.memoryDetails.length - 3 }}个...
            </div>
          </div>
        </div>
      </div>
      
      <!-- 内存分析提示 -->
      <div v-if="stats?.memory.app.percent && stats.memory.app.percent > 10" class="text-xs text-orange-400 bg-orange-900/20 border border-orange-500/30 rounded p-2">
        💡 应用占用{{ stats?.memory.app.percent.toFixed(1) }}%系统内存
      </div>
      
      <!-- 超负荷警告 -->
      <div v-if="isOverloaded" class="mt-2 p-2 bg-red-900/30 border border-red-500/50 rounded text-xs">
        <div class="text-red-400 font-medium mb-1 flex items-center">
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
          </svg>
          内存超负荷
        </div>
        <div class="text-red-300 mb-2">
          系统内存使用率已超过90%
          <span v-if="hasAutoClosedWebviews" class="block text-orange-300 text-xs mt-1">
            🛡️ 已自动关闭非激活标签页以保护系统
          </span>
        </div>
        <button
          @click="forceCleanup"
          :disabled="isCleaningUp"
          class="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-xs py-1 px-2 rounded transition-colors duration-200 flex items-center justify-center"
          title="关闭除当前激活标签页外的所有标签页和webview以释放内存"
        >
          <svg v-if="isCleaningUp" class="animate-spin -ml-1 mr-1 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          {{ isCleaningUp ? '清理中...' : '强制清理标签页' }}
        </button>
      </div>
    </div>
    
    <!-- 内存保护提示弹窗 -->
    <div 
      v-if="showProtectionNotification" 
      class="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm"
      @click="closeProtectionNotification"
    >
      <div 
        class="bg-gradient-to-br from-red-900/90 to-orange-900/90 backdrop-blur-md border border-red-500/50 rounded-xl p-6 max-w-md mx-4 shadow-2xl animate-bounce-in"
        @click.stop
      >
        <!-- 标题 -->
        <div class="flex items-center mb-4">
          <div class="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mr-4">
            <svg class="w-6 h-6 text-red-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>
            <h3 class="text-lg font-bold text-white">🛡️ 内存保护已激活</h3>
            <p class="text-red-200 text-sm">系统内存使用率过高</p>
          </div>
        </div>
        
        <!-- 内容 -->
        <div class="mb-6">
          <div class="bg-black/20 rounded-lg p-4 mb-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-red-200 text-sm">内存使用率</span>
              <span class="text-red-400 font-bold text-lg">{{ stats?.memory.percent.toFixed(1) }}%</span>
            </div>
            <div class="w-full bg-gray-800 rounded-full h-2">
              <div 
                class="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
                :style="{ width: `${Math.min(100, stats?.memory.percent || 0)}%` }"
              ></div>
            </div>
          </div>
          
          <p class="text-white text-sm leading-relaxed">
            为了保护系统稳定性，已自动关闭除当前激活标签页外的所有其他标签页。
            <span class="block mt-2 text-orange-200">
              📊 已释放 <span class="font-semibold">{{ protectionStats.closedTabs }}</span> 个标签页
            </span>
          </p>
        </div>
        
        <!-- 按钮 -->
        <div class="flex space-x-3">
          <button
            @click="closeProtectionNotification"
            class="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            我知道了
          </button>
          <button
            @click="viewMemoryDetails"
            class="flex-1 bg-gray-700/50 hover:bg-gray-600/50 text-gray-200 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center"
          >
            <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 01-2-2z"></path>
            </svg>
            查看详情
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';

interface SystemStats {
  memory: {
    total: number; // GB
    used: number; // GB
    free: number; // GB
    percent: number;
    system: {
      percent: number; // 系统级内存使用率
    };
    app: {
      mb: number; // 应用总内存
      percent: number; // 应用内存占系统百分比
      main: number; // 主进程内存
      webviews: number; // WebView总内存
    };
  };
  webviews: {
    count: number;
    total: number;
    memoryDetails?: Array<{
      id: number;
      url: string;
      memoryMB: number;
    }>;
  };
}

const props = defineProps<{
  collapsed: boolean;
  activeWebviewIds?: number[];
  lastClosedTabsCount?: number; // 添加最后关闭的标签页数量
}>();

const emit = defineEmits(['forceCleanup', 'closeInactiveTabs']);

const stats = ref<SystemStats | null>(null);
const isCleaningUp = ref(false);
const isUpdating = ref(false);
const hasAutoClosedWebviews = ref(false); // 防止重复自动关闭
const showProtectionNotification = ref(false); // 控制保护提示显示
const protectionStats = ref({ closedTabs: 0 }); // 保护统计信息
let updateInterval: number | null = null;

// 内存状态计算
const memoryStatus = computed(() => {
  const percent = stats.value?.memory.percent || 0;
  
  if (percent >= 90) {
    return {
      color: 'bg-red-500',
      textColor: 'text-red-400',
      barColor: 'bg-red-500',
      level: 'critical'
    };
  } else if (percent >= 80) {
    return {
      color: 'bg-orange-500',
      textColor: 'text-orange-400',
      barColor: 'bg-orange-500',
      level: 'warning'
    };
  } else {
    return {
      color: 'bg-green-500',
      textColor: 'text-green-400',
      barColor: 'bg-green-500',
      level: 'normal'
    };
  }
});

// 是否超负荷
const isOverloaded = computed(() => {
  return (stats.value?.memory.percent || 0) >= 90;
});

// 获取系统统计信息
async function updateStats() {
  // 防止重复请求
  if (isUpdating.value) {
    return;
  }
  
  isUpdating.value = true;
  
  try {
    // 设置超时，避免长时间等待
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('获取系统信息超时')), 5000);
    });
    
    const statsPromise = (window as any).systemAPI?.getSystemStats();
    const result = await Promise.race([statsPromise, timeoutPromise]);
    
    if (result) {
      const previousPercent = stats.value?.memory.percent || 0;
      stats.value = result;
      
      // 检查内存使用率
      if (result.memory.percent >= 90) {
        console.warn('🚨 内存使用率超过90%:', result.memory.percent + '%');
        
        // 如果内存超过90%且还没有执行过自动关闭，则自动关闭非激活状态的WebView
        if (!hasAutoClosedWebviews.value) {
          console.warn('🚨 内存超负荷！自动关闭非激活状态的WebView以保护系统');
          hasAutoClosedWebviews.value = true;
          await autoCloseInactiveWebviews();
        }
      } else if (result.memory.percent < 85 && hasAutoClosedWebviews.value) {
        // 当内存降到85%以下时，重置自动关闭标志，允许下次触发
        hasAutoClosedWebviews.value = false;
        console.log('✅ 内存使用率已降至安全水平，重置保护状态');
      }
    }
  } catch (error) {
    console.error('获取系统统计信息失败:', error);
    // 发生错误时不清空现有数据，保持上次的显示
  } finally {
    isUpdating.value = false;
  }
}

// 自动关闭非激活状态的标签页（内存保护）
async function autoCloseInactiveWebviews() {
  try {
    console.log('🚨 执行紧急内存保护：关闭除当前激活标签页外的所有标签页...');
    
    // 显示保护提示
    showProtectionNotification.value = true;
    protectionStats.value.closedTabs = 0; // 重置计数
    
    // 通知父组件关闭除当前激活标签页外的所有标签页
    emit('closeInactiveTabs');
    
    console.log('✅ 内存保护信号已发送，等待标签页关闭...');
    
    // 模拟关闭的标签页数量（实际应该从父组件获取）
    setTimeout(() => {
      // 使用props传递的数量，如果没有则估算
      const closedTabs = props.lastClosedTabsCount || Math.max(1, (stats.value?.webviews.count || 1) - 1);
      protectionStats.value.closedTabs = closedTabs;
    }, 1000);
    
    // 延迟更新统计信息，给标签页关闭一些时间
    setTimeout(updateStats, 2000);
    
  } catch (error) {
    console.error('❌ 自动关闭非激活标签页失败:', error);
  }
}

// 关闭保护提示
function closeProtectionNotification() {
  showProtectionNotification.value = false;
}

// 查看内存详情
function viewMemoryDetails() {
  showProtectionNotification.value = false;
  // 这里可以触发展开详细信息或跳转到详情页面
  console.log('📊 查看内存详情');
}

// 自动关闭所有WebView（内存保护）- 保留作为备用
async function autoCloseAllWebviews() {
  try {
    console.log('🚨 执行紧急内存保护：关闭所有WebView实例...');
    const result = await (window as any).systemAPI?.forceCloseAllWebviews();
    
    if (result?.success) {
      console.log(`✅ 内存保护完成，关闭了 ${result.closedCount} 个WebView实例`);
      // 立即更新统计信息
      setTimeout(updateStats, 1000); // 延迟1秒更新，确保关闭操作完成
    } else {
      console.error('❌ 内存保护失败:', result?.error);
    }
  } catch (error) {
    console.error('❌ 自动关闭WebView失败:', error);
  }
}

// 强制清理非活跃webview和标签页 - 通知父组件执行完整清理
async function forceCleanup() {
  if (isCleaningUp.value) return;
  
  isCleaningUp.value = true;
  // 触发父组件的完整清理逻辑（包括标签页管理和webview清理）
  emit('forceCleanup');
  
  try {
    // 等待父组件完成清理后更新统计信息
    setTimeout(async () => {
      try {
        await updateStats();
        console.log('✅ 强制清理统计信息已更新');
      } catch (error) {
        console.error('更新清理后统计信息失败:', error);
      } finally {
        isCleaningUp.value = false;
      }
    }, 2000); // 给足够时间让标签页关闭和webview清理完成
  } catch (error) {
    console.error('强制清理失败:', error);
    isCleaningUp.value = false;
  }
}

// 获取显示用的URL
function getDisplayUrl(url: string): string {
  if (!url || url === 'unknown') return '未知';
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    if (hostname) {
      return hostname.length > 12 ? hostname.substring(0, 12) + '...' : hostname;
    }
    return url.length > 12 ? url.substring(0, 12) + '...' : url;
  } catch {
    return url.length > 12 ? url.substring(0, 12) + '...' : url;
  }
}

onMounted(() => {
  // 立即获取一次统计信息
  updateStats();
  
  // 每2秒更新一次统计信息
  updateInterval = window.setInterval(updateStats, 2000);
});

onUnmounted(() => {
  if (updateInterval) {
    clearInterval(updateInterval);
    updateInterval = null;
  }
});
</script>

<style scoped>
.memory-monitor {
  color: rgb(209 213 219);
}

.collapsed-display {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.expanded-display {
  background-color: rgba(31, 41, 55, 0.3);
  border-radius: 0.5rem;
  border: 1px solid rgba(75, 85, 99, 0.3);
}

/* 弹窗动画 */
@keyframes bounce-in {
  0% {
    opacity: 0;
    transform: scale(0.8) translateY(-20px);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05) translateY(-5px);
  }
  100% {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

.animate-bounce-in {
  animation: bounce-in 0.4s ease-out;
}

/* 背景模糊渐入 */
.fixed.bg-black\/50 {
  animation: fade-in 0.3s ease-out;
}

@keyframes fade-in {
  0% {
    opacity: 0;
  }
  100% {
    opacity: 1;
  }
}
</style>
