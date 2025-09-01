<template>
  <!-- 系统认证界面 - 需要认证时显示 -->
  <div v-if="!isAuthenticated" class="flex h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
    <div class="text-center">
      <div class="mb-4">
        <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
          MB
        </div>
      </div>
      <h1 class="text-2xl font-bold text-white mb-2">Multi-Browser</h1>
      
      <!-- 根据认证状态显示不同内容 -->
      <div v-if="!showSystemAuth">
        <p class="text-gray-300 mb-6">正在初始化应用...</p>
        <div class="flex items-center justify-center mb-4">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
        
        <!-- 开发环境测试按钮 -->
        <div v-if="!isElectronEnv" class="mt-6">
          <p class="text-gray-400 text-sm mb-3">开发环境 - 测试系统认证功能</p>
          <button 
            @click="showSystemAuth = true"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            📱 测试系统认证对话框
          </button>
        </div>
      </div>
      
      <div v-else>
        <p class="text-gray-300 mb-6">系统认证</p>
        <p class="text-gray-400 text-sm">请完成系统用户身份验证以继续使用</p>
      </div>
    </div>
    
    <!-- 系统认证模态框 -->
    <SystemAuthModal
      :visible="showSystemAuth"
      :auto-show="true"
      @success="handleAuthSuccess"
      @cancel="handleAuthCancel"
      @error="handleAuthError"
    />
  </div>

  <!-- 主应用界面 - 只在认证成功后显示 -->
  <div v-if="isAuthenticated" class="flex h-screen overflow-hidden">
    <!-- 左侧菜单 -->
    <div :class="['flex-shrink-0 relative flex flex-col transition-all duration-300', state.collapsed ? 'w-16' : 'w-55']">
      <!-- 菜单背景效果 -->
      <div class="absolute inset-0 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900"></div>
      <div class="absolute inset-0 bg-gradient-to-r from-blue-900/20 to-transparent"></div>
      <div class="absolute inset-0">
        <div class="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/50 to-transparent"></div>
        <div class="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-400/30 to-transparent"></div>
      </div>
      
      <!-- 菜单主体 -->
      <div class="flex-1 overflow-hidden">
        <a-menu
          v-model:openKeys="state.openKeys"
          v-model:selectedKeys="state.selectedKeys"
          mode="inline"
          theme="dark"
          :inline-collapsed="state.collapsed"
          :items="menuItems"
          class="h-full overflow-hidden relative z-10 bg-transparent border-r-0"
          @select="handleSelect"
        ></a-menu>
      </div>
      
      <!-- 内存监控 -->
      <div class="relative z-10">
        <MemoryMonitor 
          :collapsed="state.collapsed" 
          :lastClosedTabsCount="lastClosedTabsCount"
          @forceCleanup="handleForceCleanup" 
          @closeInactiveTabs="handleCloseInactiveTabs" 
        />
      </div>
      
      <!-- 折叠按钮 -->
      <div :class="['relative z-10 border-t border-gray-700/50', state.collapsed ? 'p-2' : 'p-3']">
        <button
          @click="toggleCollapsed"
          :class="[
            'w-full flex items-center justify-center rounded-lg bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 transition-all duration-200 text-gray-300 hover:text-white focus:outline-none focus:ring-2 focus:ring-blue-400/50',
            state.collapsed ? 'h-8' : 'h-8'
          ]"
          :title="state.collapsed ? '展开菜单' : '折叠菜单'"
        >
          <template v-if="!state.collapsed">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7"></path>
            </svg>
          </template>
          <template v-else>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
            </svg>
          </template>
        </button>
      </div>
    </div>

    <!-- 右侧内容区域 -->
    <div class="flex-1 flex flex-col h-screen overflow-hidden starfield-container">
      <!-- 顶部状态栏 -->
      <div v-if="currentLabel" class="flex-shrink-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 px-4 py-2 flex justify-between items-center">
        <div class="text-sm text-gray-600">
          {{ currentLabel }}
        </div>
        <VersionCountdown />
      </div>
      
      <!-- 域名导航栏 -->
      <DomainNav
        v-if="currentView === 'browser'"
        :currentDomain="currentConfig"
        :openDomains="openDomains"
        @switchDomain="handleSwitchDomain"
        @backToDomainManager="backToDomainManager"
        @closeDomain="handleCloseDomain"
        @clearDomainCache="handleClearDomainCache"
        @reorderDomains="handleReorderDomains"
        @detachDomain="handleDetachDomain"
        class="flex-shrink-0"
      />
      
      <!-- Domain 管理组件 -->
      <MDomain 
        :active="currentView === 'domain'"
        @openDomain="handleOpenDomain"
        @updateDomain="handleUpdateDomain"
        :currentDomain="currentConfig"
        class="flex-1 overflow-hidden"
      />

      <!-- Account 管理组件 -->
      <MAccount 
        :active="currentView === 'account'"
        @account-updated="handleAccountUpdated"
        class="flex-1 overflow-hidden"
      />

      <!-- Script 管理组件 -->
      <MScript 
        :active="currentView === 'script'"
        class="flex-1 overflow-hidden"
      />
      <!-- 浏览器页面组件 - 始终保持挂载以保持tabs状态 -->
      <BrowserPage
        v-show="currentView === 'browser'"
        ref="browserPageRef"
        :active="currentView === 'browser'"
        :partition="currentConfig.partition"
        :start-url="currentConfig.url"
        :account="currentConfig.account"
        :script="currentConfig.script"
        class="flex-1 overflow-hidden"
      />
    </div>
  </div>
</template><script lang="ts" setup>
import { reactive, ref, watch, computed, h, onMounted, nextTick } from "vue";
import {
  GlobalOutlined,
  UserOutlined,
  CodeOutlined,
  FileTextOutlined,
} from "@ant-design/icons-vue";
import BrowserPage from "./components/browser-page/index.vue";
import MDomain from "./components/m-domain/index.vue";
import MAccount from "./components/m-account/index.vue";
import MScript from "./components/m-script/index.vue";
import DomainNav from "./components/domain-nav/index.vue";
import VersionCountdown from "./components/version-countdown/index.vue";
import MemoryMonitor from "./components/memory-monitor/index.vue";
import SystemAuthModal from "./components/system-auth/SystemAuthModal.vue";
import { initDatabase, getAccountById, getScriptById } from "./utils/db";

// 菜单状态
const state = reactive({
  collapsed: false,
  selectedKeys: ["domain"],
  openKeys: [],
  preOpenKeys: [],
});

// 当前视图
const currentView = ref("domain");

// 系统认证状态
const showSystemAuth = ref(false);
const isAuthenticated = ref(false);
const authenticatedUser = ref<string>('');

// 检测是否在 Electron 环境
const isElectronEnv = ref(typeof window !== 'undefined' && window.electronAPI !== undefined);

// 菜单项配置
const menuItems = [
  {
    key: "domain",
    icon: () => h(GlobalOutlined),
    label: "多浏览器",
    title: "多浏览器",
  },
  {
    key: "account",
    icon: () => h(UserOutlined),
    label: "账户管理",
    title: "账户管理",
  },
  {
    key: "script",
    icon: () => h(CodeOutlined),
    label: "脚本管理",
    title: "脚本管理",
  }
];

// 当前选中菜单项的标签
const currentLabel = computed(() => {
  const item = menuItems.find((i) => i.key === state.selectedKeys[0]);
  return item?.label || "";
});

// 监听菜单展开/收起状态
watch(
  () => state.openKeys,
  (_val, oldVal) => {
    state.preOpenKeys = oldVal;
  }
);

// 切换菜单收起状态
const toggleCollapsed = () => {
  state.collapsed = !state.collapsed;
  state.openKeys = state.collapsed ? [] : state.preOpenKeys;
};

// 当前浏览器页面配置
const currentConfig = ref({
  partition: "browser_default",
  url: "about:blank",
  name: "",
  account: null as any,
  script: null as any
});

// BrowserPage组件引用
const browserPageRef = ref();

// 内存保护相关
const lastClosedTabsCount = ref(0);

// 记录当前打开的域名实例列表
const openDomains = ref<Array<{
  url: string;
  partition: string;
  name: string;
  account_id?: number;
  script_id?: number;
}>>([]);

// 记录域名访问历史（用于关闭时的切换逻辑）
const domainHistory = ref<string[]>([]);

// 菜单点击处理
function handleSelect({ key }: { key: string }) {
  state.selectedKeys = [key];
  if (key === "domain") {
    currentView.value = "domain";
  } else if (key === "account") {
    currentView.value = "account";
  } else if (key === "script") {
    currentView.value = "script";
  } else {
    currentView.value = "browser";
  }
}

// 处理打开域名
async function handleOpenDomain(config: { url: string, partition: string, name?: string, account_id?: number, script_id?: number }) {
  console.log("打开域名:", config);
  
  // 检查是否已经在打开列表中
  const existingDomainIndex = openDomains.value.findIndex(domain => domain.partition === config.partition);
  if (existingDomainIndex > -1) {
    // 如果已存在，更新域名信息（可能名称、URL等有变化）
    const existingDomain = openDomains.value[existingDomainIndex];
    openDomains.value[existingDomainIndex] = {
      url: config.url,
      partition: config.partition,
      name: config.name || existingDomain.name,
      account_id: config.account_id,
      script_id: config.script_id
    };
    console.log("域名信息已更新:", openDomains.value[existingDomainIndex]);
  } else {
    // 检查是否达到最大打开数量限制（20个）
    if (openDomains.value.length >= 20) {
      console.warn("已达到最大浏览器打开数量限制（20个）");
      alert("已达到最大浏览器打开数量限制！\n最多只能同时打开20个浏览器实例，请先关闭一些浏览器后再试。");
      return;
    }
    
    // 添加到打开的域名列表
    openDomains.value.push({
      url: config.url,
      partition: config.partition,
      name: config.name || "",
      account_id: config.account_id,
      script_id: config.script_id
    });
    console.log("域名已添加到打开列表:", openDomains.value);
  }
  
  // 获取账户和脚本信息
  let account: any = null;
  let script: any = null;
  
  if (config.account_id) {
    try {
      account = await getAccountById(config.account_id);
    } catch (error) {
      console.error('Failed to get account:', error);
    }
  }
  
  if (config.script_id) {
    try {
      script = await getScriptById(config.script_id);
    } catch (error) {
      console.error('Failed to get script:', error);
    }
  }
  
  // 添加到域名历史记录
  addToDomainHistory(config.partition);
  
  // 创建新的配置对象来触发响应式更新
  currentConfig.value = {
    url: config.url,
    partition: config.partition,
    name: config.name || "",
    account,
    script
  };
  currentView.value = "browser";
  // 清除菜单选择状态，因为现在在浏览器视图中
  state.selectedKeys = [];
}

// 处理账户更新事件
async function handleAccountUpdated() {
  console.log('📢 收到账户更新事件，重新加载当前配置');
  
  // 如果当前有配置且有账户ID，重新加载账户信息
  if (currentConfig.value?.account?.id) {
    try {
      const updatedAccount = await getAccountById(currentConfig.value.account.id);
      if (updatedAccount) {
        // 更新当前配置中的账户信息
        currentConfig.value = {
          ...currentConfig.value,
          account: updatedAccount
        };
        console.log('✅ 已更新当前配置的账户信息');
      } else {
        // 账户被删除了，清除账户信息
        currentConfig.value = {
          ...currentConfig.value,
          account: null
        };
        console.log('⚠️ 当前账户已被删除，已清除账户信息');
      }
    } catch (error) {
      console.error('重新加载账户信息失败:', error);
      // 出错时也清除账户信息
      currentConfig.value = {
        ...currentConfig.value,
        account: null
      };
    }
  }
}

// 处理域名信息更新
function handleUpdateDomain(config: { url: string, partition: string, name?: string, account_id?: number, script_id?: number }) {
  console.log("收到域名更新事件:", config);
  
  // 更新openDomains中对应域名的信息
  const targetIndex = openDomains.value.findIndex(domain => domain.partition === config.partition);
  if (targetIndex > -1) {
    const existingDomain = openDomains.value[targetIndex];
    openDomains.value[targetIndex] = {
      ...existingDomain,
      name: config.name || existingDomain.name,
      url: config.url,
      account_id: config.account_id,
      script_id: config.script_id
    };
    console.log("已更新openDomains中的域名信息:", openDomains.value[targetIndex]);
    
    // 如果更新的是当前显示的域名，也更新currentConfig
    if (currentConfig.value.partition === config.partition) {
      console.log("更新当前显示的域名配置");
      currentConfig.value = {
        ...currentConfig.value,
        name: config.name || currentConfig.value.name,
        url: config.url
      };
    }
  }
}

// 处理切换域名
async function handleSwitchDomain(config: { url: string, partition: string, name?: string, account_id?: number, script_id?: number }) {
  console.log("=== handleSwitchDomain 开始 ===");
  console.log("收到切换域名请求:", config);
  console.log("当前配置:", currentConfig.value);
  console.log("当前openDomains:", openDomains.value.map(d => ({ name: d.name, partition: d.partition })));
  console.log("目标域名在openDomains中的索引:", openDomains.value.findIndex(d => d.partition === config.partition));
  
  // 检查要切换的域名是否在打开列表中
  const targetDomain = openDomains.value.find(domain => domain.partition === config.partition);
  if (!targetDomain) {
    console.warn("尝试切换到未打开的域名:", config.partition);
    return;
  }
  
  // 更新openDomains中对应域名的信息（如果有变化）
  const targetIndex = openDomains.value.findIndex(domain => domain.partition === config.partition);
  if (targetIndex > -1) {
    const existingDomain = openDomains.value[targetIndex];
    if (existingDomain.name !== config.name || 
        existingDomain.url !== config.url ||
        existingDomain.account_id !== config.account_id ||
        existingDomain.script_id !== config.script_id) {
      // 更新域名信息
      openDomains.value[targetIndex] = {
        ...existingDomain,
        name: config.name || existingDomain.name,
        url: config.url,
        account_id: config.account_id,
        script_id: config.script_id
      };
      console.log("已更新openDomains中的域名信息:", openDomains.value[targetIndex]);
    }
  }
  
  // 添加到域名历史记录
  addToDomainHistory(config.partition);
  
  // 如果是相同的partition，只更新URL和名称，不重新创建配置对象
  if (currentConfig.value.partition === config.partition) {
    console.log("相同partition，仅更新URL和名称");
    if (currentConfig.value.url !== config.url) {
      console.log("URL不同，更新URL从", currentConfig.value.url, "到", config.url);
      currentConfig.value.url = config.url;
    }
    if (currentConfig.value.name !== config.name) {
      console.log("名称不同，更新名称从", currentConfig.value.name, "到", config.name);
      currentConfig.value.name = config.name || "";
    }
    console.log("=== handleSwitchDomain 结束（相同partition） ===");
    return;
  }
  
  console.log("不同partition，执行完整切换");
  console.log("从", currentConfig.value.partition, "切换到", config.partition);
  
  // 获取账户和脚本信息
  let account: any = null;
  let script: any = null;
  
  if (config.account_id) {
    try {
      account = await getAccountById(config.account_id);
      console.log("获取到账户信息:", account);
    } catch (error) {
      console.error('Failed to get account:', error);
    }
  }
  
  if (config.script_id) {
    try {
      script = await getScriptById(config.script_id);
      console.log("获取到脚本信息:", script);
    } catch (error) {
      console.error('Failed to get script:', error);
    }
  }
  
  // 创建新的配置对象来触发响应式更新
  const newConfig = {
    url: config.url,
    partition: config.partition,
    name: config.name || "",
    account,
    script
  };
  
  console.log("设置新配置:", newConfig);
  currentConfig.value = newConfig;
  
  currentView.value = "browser";
  console.log("切换完成，当前配置:", currentConfig.value);
  console.log("=== handleSwitchDomain 结束（不同partition） ===");
}

// 添加到域名历史记录
function addToDomainHistory(partition: string) {
  // 移除已存在的记录
  const index = domainHistory.value.indexOf(partition);
  if (index > -1) {
    domainHistory.value.splice(index, 1);
  }
  // 添加到最前面
  domainHistory.value.unshift(partition);
  console.log("域名历史记录:", domainHistory.value);
}

// 获取前一个域名
function getPreviousDomain(): string | null {
  // 返回历史记录中的第二个（第一个是当前的）
  return domainHistory.value.length > 1 ? domainHistory.value[1] : null;
}

// 返回域名管理页面
function backToDomainManager() {
  currentView.value = "domain";
  state.selectedKeys = ["domain"];
}

// 处理关闭域名实例
async function handleCloseDomain(config: { url: string, partition: string, name?: string, account_id?: number, script_id?: number }) {
  console.log("收到关闭域名实例请求:", config);
  console.log("当前打开的域名列表:", openDomains.value);
  
  // 从打开的域名列表中移除该域名
  const index = openDomains.value.findIndex(domain => domain.partition === config.partition);
  if (index > -1) {
    openDomains.value.splice(index, 1);
    console.log("域名已从打开列表中移除，剩余:", openDomains.value);
  }
  
  // 从历史记录中移除该域名
  const historyIndex = domainHistory.value.indexOf(config.partition);
  if (historyIndex > -1) {
    domainHistory.value.splice(historyIndex, 1);
  }
  
  // 如果不在browser视图，先切换到browser视图
  const wasBrowserView = currentView.value === 'browser';
  if (!wasBrowserView) {
    console.log("切换到browser视图以执行关闭操作");
    currentView.value = 'browser';
  }
  
  // 定义执行关闭的函数
  const executeClose = async () => {
    console.log("开始执行关闭操作");
    
    if (browserPageRef.value && typeof browserPageRef.value.closePartitionTabs === 'function') {
      console.log("调用closePartitionTabs方法");
      const success = await browserPageRef.value.closePartitionTabs(config.partition);
      console.log("关闭操作结果:", success);
      
      // 如果关闭的是当前活跃的域名，需要切换到其他域名或返回管理页面
      if (currentConfig.value.partition === config.partition) {
        console.log("关闭的是当前活跃域名");
        
        if (openDomains.value.length > 0) {
          // 如果还有其他打开的域名，切换到最近访问的
          const previousDomain = getPreviousDomain();
          if (previousDomain) {
            const targetDomain = openDomains.value.find(d => d.partition === previousDomain);
            if (targetDomain) {
              console.log("切换到前一个域名:", targetDomain);
              handleSwitchDomain(targetDomain);
              return;
            }
          }
          
          // 如果没有找到前一个域名，切换到第一个可用域名
          console.log("切换到第一个可用域名:", openDomains.value[0]);
          handleSwitchDomain(openDomains.value[0]);
        } else {
          // 如果没有其他打开的域名，返回域名管理页面
          console.log("没有其他打开的域名，返回域名管理页面");
          setTimeout(() => {
            backToDomainManager();
          }, 200);
        }
      }
    } else {
      console.error("无法调用closePartitionTabs方法");
    }
  };
  
  if (wasBrowserView) {
    await executeClose();
  } else {
    nextTick(async () => {
      setTimeout(async () => {
        await executeClose();
      }, 100);
    });
  }
}

// 处理清空域名缓存
async function handleClearDomainCache(config: { url: string, partition: string, name?: string, account_id?: number, script_id?: number }) {
  console.log("收到清空域名缓存请求:", config);
  
  // 如果不在browser视图，先切换到browser视图
  const wasBrowserView = currentView.value === 'browser';
  if (!wasBrowserView) {
    console.log("切换到browser视图以执行清空缓存操作");
    currentView.value = 'browser';
  }
  
  // 定义执行清空缓存的函数
  const executeClearCache = () => {
    console.log("开始执行清空缓存操作");
    
    if (browserPageRef.value && typeof browserPageRef.value.clearPartitionCache === 'function') {
      console.log("调用clearPartitionCache方法");
      const success = browserPageRef.value.clearPartitionCache(config.partition);
      console.log("清空缓存操作结果:", success);
      
      if (success) {
        console.log(`域名 "${config.name}" 的浏览器缓存已清空`);
      } else {
        console.warn(`清空域名 "${config.name}" 的浏览器缓存失败`);
      }
    } else {
      console.error("无法调用clearPartitionCache方法");
    }
  };
  
  if (wasBrowserView) {
    executeClearCache();
  } else {
    nextTick(() => {
      setTimeout(executeClearCache, 100);
    });
  }
}

// 处理域名重新排序
function handleReorderDomains(data: { fromIndex: number, toIndex: number, domain: any }) {
  console.log('处理域名重新排序:', data);
  
  if (data.fromIndex >= 0 && data.fromIndex < openDomains.value.length && 
      data.toIndex >= 0 && data.toIndex < openDomains.value.length &&
      data.fromIndex !== data.toIndex) {
    
    // 重新排序openDomains数组
    const [movedDomain] = openDomains.value.splice(data.fromIndex, 1);
    openDomains.value.splice(data.toIndex, 0, movedDomain);
    
    console.log('域名重新排序完成，新顺序:', openDomains.value.map(d => d.name));
  }
}

// 处理域名分离为新窗口
function handleDetachDomain(domain: any) {
  console.log('处理域名分离为新窗口:', domain);
  
  // 使用Electron API创建新窗口
  if ((window as any).electronAPI && (window as any).electronAPI.createNewWindow) {
    (window as any).electronAPI.createNewWindow({
      url: domain.url,
      title: domain.name,
      partition: domain.partition,
      width: 1200,
      height: 800
    }).then(() => {
      // 新窗口创建成功后，关闭当前域名实例
      handleCloseDomain(domain);
      console.log('域名分离为新窗口成功，已关闭原域名实例');
    }).catch((error: any) => {
      console.error('创建新窗口失败:', error);
      // 如果Electron API失败，尝试使用传统方式
      window.open(domain.url, '_blank', 'width=1200,height=800');
      handleCloseDomain(domain);
    });
  } else {
    console.warn('Electron API不可用，使用传统方式打开新窗口');
    // 作为备选方案，使用window.open
    window.open(domain.url, '_blank', 'width=1200,height=800');
    handleCloseDomain(domain);
  }
}

// 强制清理内存 - 关闭非活跃的标签页
async function handleForceCleanup() {
  console.log('🧹 开始强制清理非活跃的标签页...');
  
  try {
    // 确保当前在浏览器视图
    if (currentView.value === 'browser' && browserPageRef.value) {
      const tabs = browserPageRef.value.getTabs();
      const activeTabId = browserPageRef.value.getActiveTabId();
      
      console.log(`当前总标签页数: ${tabs.length}`);
      console.log(`当前激活标签页ID: ${activeTabId}`);
      
      // 获取需要关闭的标签页（所有非活跃标签页）
      const tabsToClose = tabs.filter((tab: any) => tab.id !== activeTabId);
      
      console.log(`计划关闭 ${tabsToClose.length} 个非活跃标签页`);
      
      // 关闭非活跃标签页（webview会随标签页自动销毁）
      let closedCount = 0;
      for (const tab of tabsToClose) {
        try {
          console.log(`关闭标签页 ID:${tab.id} 标题:${tab.title}`);
          await browserPageRef.value.closeTab(tab.id);
          closedCount++;
        } catch (error) {
          console.warn(`关闭标签页 ${tab.id} 失败:`, error);
        }
      }
      
      // 更新关闭的标签页计数
      lastClosedTabsCount.value = closedCount;
      
      console.log(`✅ 强制清理完成，关闭了 ${closedCount} 个标签页`);
    } else {
      console.log('当前不在浏览器视图，无法执行标签页清理');
    }
  } catch (error) {
    console.error('强制清理过程中发生错误:', error);
  }
}

// 关闭除当前激活标签页外的所有标签页（内存保护）
async function handleCloseInactiveTabs() {
  console.log('🚨 内存保护：关闭除当前激活标签页外的所有标签页...');
  
  try {
    // 如果当前是浏览器视图，关闭非激活的标签页
    if (currentView.value === 'browser' && browserPageRef.value) {
      const tabs = browserPageRef.value.getTabs();
      const activeTabId = browserPageRef.value.getActiveTabId();
      
      console.log(`当前总标签页数: ${tabs.length}`);
      console.log(`当前激活标签页ID: ${activeTabId}`);
      
      // 计划关闭的标签页
      const tabsToClose = tabs.filter((tab: any) => tab.id !== activeTabId);
      
      console.log(`计划关闭 ${tabsToClose.length} 个非激活标签页`);
      
      // 更新关闭的标签页数量
      lastClosedTabsCount.value = tabsToClose.length;
      
      // 逐个关闭非激活标签页
      let actualClosedCount = 0;
      for (const tab of tabsToClose) {
        try {
          console.log(`关闭标签页 ID:${tab.id} 标题:${tab.title}`);
          // 调用browser-page组件的关闭标签页方法
          await browserPageRef.value.closeTab(tab.id);
          actualClosedCount++;
        } catch (error) {
          console.warn(`关闭标签页 ${tab.id} 失败:`, error);
        }
      }
      
      // 更新实际关闭的数量
      lastClosedTabsCount.value = actualClosedCount;
      
      console.log(`✅ 内存保护完成：实际关闭了 ${actualClosedCount} 个标签页`);
    } else {
      console.log('ℹ️ 当前不在浏览器视图，无需关闭标签页');
    }
  } catch (error) {
    console.error('❌ 关闭非激活标签页过程中发生错误:', error);
  }
}

// 🔐 系统认证相关方法
const handleAuthSuccess = (username: string) => {
  console.log('✅ 系统认证成功:', username);
  isAuthenticated.value = true;
  authenticatedUser.value = username;
  showSystemAuth.value = false;
  
  // 认证成功后初始化应用
  initializeApp();
}

const handleAuthCancel = () => {
  console.log('❌ 用户取消系统认证');
  // 认证被取消，关闭应用
  if (window.electronAPI?.closeApp) {
    window.electronAPI.closeApp();
  }
}

const handleAuthError = (error: string) => {
  console.error('❌ 系统认证发生错误:', error);
  // 认证失败，显示错误但不关闭应用，允许用户重试
}

const initializeApp = async () => {
  try {
    console.log('🚀 初始化应用...');
    await initDatabase();
    console.log('✅ 应用初始化完成');
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
  }
}

const checkSystemAuth = async () => {
  try {
    console.log('🔍 检查系统认证支持 - 登录功能已完全禁用');
    
    // 直接跳过所有认证，立即初始化应用
    console.log('⚡ 所有平台自动跳过认证，登录功能已禁用');
    isAuthenticated.value = true;
    await initializeApp();
  } catch (error) {
    console.error('❌ 应用初始化失败:', error);
    // 即使出错也继续初始化应用
    isAuthenticated.value = true;
    await initializeApp();
  }
}

// 组件挂载时检查系统认证
onMounted(async () => {
  await checkSystemAuth();
});
</script>

<style>
@import './assets/styles/drag-cursor-override.css';
</style>