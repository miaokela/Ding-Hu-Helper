<script setup lang="ts">
import { ref, reactive, onMounted, computed, watch } from 'vue';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { Domain, getAllDomains, addDomain, updateDomain, deleteDomain, Account, getAllAccounts, Script, getAllScripts } from '../../utils/db';

const props = defineProps<{
  active: boolean;
}>();

const emit = defineEmits(['openDomain', 'updateDomain']);

// 新标签页列表
const domains = ref<Domain[]>([]);
// 账户列表
const accounts = ref<Account[]>([]);
// 脚本列表
const scripts = ref<Script[]>([]);
// 显示模态框
const isModalVisible = ref(false);
// 加载状态
const loading = ref(false);
// 当前编辑的新标签页
const currentDomain = ref<Domain | null>(null);
// 搜索关键词
const searchKeyword = ref('');

// Tooltip状态
const tooltipVisible = ref(false);
const tooltipContent = ref('');
const tooltipPosition = ref({ x: 0, y: 0 });

// 表单状态
const formState = reactive({
  name: '',
  url: 'https://www.',
  account_id: null as number | null,
  script_id: null as number | null,
  id: 0,
  isEdit: false,
  isCopy: false,
});

// 快捷URL填充配置
const quickUrlOptions = [
  {
    name: '巨量千川',
    url: 'https://business.oceanengine.com/login',
    icon: '📜'
  },
  {
    name: '抖音',
    url: 'https://www.douyin.com/',
    icon: '🎵'
  }
];

// 快捷填充URL
function fillQuickUrl(url: string, name: string) {
  formState.url = url;
  // 直接覆盖建议的名称
  formState.name = name + "-某某某";
}

// 组件挂载时加载数据
onMounted(() => {
  if (props.active) {
    loadDomains();
    loadAccounts();
    loadScripts();
  }
});

// 监听 active 属性变化，当切换到新标签页管理时重新加载数据
watch(() => props.active, (newActive) => {
  if (newActive) {
    loadDomains();
    loadAccounts();
    loadScripts();
  }
});

// 加载所有新标签页
async function loadDomains() {
  loading.value = true;
  try {
    domains.value = await getAllDomains();
  } catch (error) {
    console.error('加载新标签页失败:', error);
  } finally {
    loading.value = false;
  }
}

// 加载所有账户
async function loadAccounts() {
  try {
    accounts.value = await getAllAccounts();
  } catch (error) {
    console.error('加载账户失败:', error);
  }
}

// 加载所有脚本
async function loadScripts() {
  try {
    scripts.value = await getAllScripts();
  } catch (error) {
    console.error('加载脚本失败:', error);
  }
}

// 获取新标签页关联的账户名称
function getAccountName(accountId: number | null | undefined): string {
  if (!accountId) return '未绑定';
  const account = accounts.value.find(acc => acc.id === accountId);
  return account ? account.name : '未绑定';
}

// 获取新标签页关联的脚本名称列表
function getScriptNames(scriptId: number | null | undefined): string {
  if (!scriptId) return '无脚本';
  const script = scripts.value.find(s => s.id === scriptId);
  return script ? script.name : '无脚本';
}

// 显示模态框
function showModal() {
  formState.name = '';
  formState.url = 'https://www.';
  formState.account_id = null;
  formState.script_id = null;
  formState.id = 0;
  formState.isEdit = false;
  formState.isCopy = false;
  currentDomain.value = null;
  isModalVisible.value = true;
}

// 编辑新标签页
function editDomain(domain: Domain) {
  formState.name = domain.name;
  formState.url = domain.url;
  formState.account_id = domain.account_id || null;
  formState.script_id = domain.script_id || null;
  formState.id = domain.id;
  formState.isEdit = true;
  formState.isCopy = false;
  currentDomain.value = domain;
  isModalVisible.value = true;
}

// 复制新标签页
function copyDomain(domain: Domain) {
  formState.name = domain.name + ' - 副本';
  formState.url = domain.url;
  formState.account_id = domain.account_id || null;
  formState.script_id = domain.script_id || null;
  formState.id = 0;
  formState.isEdit = false;
  formState.isCopy = true;
  currentDomain.value = domain;
  isModalVisible.value = true;
}

// 删除新标签页
async function removeDomain(domain: Domain) {
  try {
    await deleteDomain(domain.id);
    await loadDomains();
  } catch (error) {
    console.error('删除新标签页失败:', error);
  }
}

// 打开新标签页
function openDomain(domain: Domain) {
  emit('openDomain', {
    url: domain.url,
    partition: domain.page_id,
    name: domain.name,
    account_id: domain.account_id,
    script_id: domain.script_id
  });
}

// 表单提交
async function handleOk() {
  if (!formState.name || !formState.url) {
    return;
  }

  try {
    if (formState.isEdit && currentDomain.value) {
      // 更新新标签页
      const updatedDomain = {
        ...currentDomain.value,
        name: formState.name,
        url: formState.url,
        account_id: formState.account_id,
        script_id: formState.script_id,
      };
      await updateDomain(updatedDomain);
      
      // 通知父组件域名信息已更新，如果该域名已打开则需要更新显示
      emit('updateDomain', {
        url: updatedDomain.url,
        partition: updatedDomain.page_id,
        name: updatedDomain.name,
        account_id: updatedDomain.account_id,
        script_id: updatedDomain.script_id
      });
    } else {
      // 添加新新标签页
      await addDomain(formState.url, formState.name, formState.account_id || undefined, formState.script_id || undefined);
    }
    
    // 重新加载数据
    await loadDomains();
    
    // 关闭模态框
    isModalVisible.value = false;
  } catch (error) {
    console.error('保存新标签页失败:', error);
  }
}

// 取消表单
function handleCancel() {
  isModalVisible.value = false;
}

// Tooltip方法
function showTooltip(event: MouseEvent, content: string) {
  tooltipContent.value = content;
  tooltipPosition.value = {
    x: event.clientX + 10,
    y: event.clientY - 35
  };
  tooltipVisible.value = true;
}

function hideTooltip() {
  tooltipVisible.value = false;
  tooltipContent.value = '';
}

// 过滤后的域名列表（根据搜索关键词和账户关联进行过滤）
const filteredDomains = computed(() => {
  if (!searchKeyword.value.trim()) {
    return domains.value;
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim();
  
  return domains.value.filter(domain => {
    // 域名名称匹配
    const domainNameMatch = domain.name.toLowerCase().includes(keyword);
    
    // 域名URL匹配
    const domainUrlMatch = domain.url.toLowerCase().includes(keyword);
    
    // 获取关联的账户信息进行匹配
    let accountMatch = false;
    if (domain.account_id) {
      const account = accounts.value.find(acc => acc.id === domain.account_id);
      if (account) {
        // 账户名称匹配
        const accountNameMatch = account.name.toLowerCase().includes(keyword);
        // 账户用户名匹配
        const accountUsernameMatch = account.username.toLowerCase().includes(keyword);
        accountMatch = accountNameMatch || accountUsernameMatch;
      }
    }
    
    return domainNameMatch || domainUrlMatch || accountMatch;
  });
});
</script>

<template>
  <div v-show="active" class="starfield-container p-6 h-full overflow-auto">
    <!-- 标题栏 -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 mb-1 flex items-center">
          我的浏览器
        </h1>
        <p class="text-gray-500 text-sm">设置浏览器新标签页与关联账户、关联脚本</p>
      </div>
      <button @click="showModal()" class="inline-flex items-center px-4 py-2 bg-blue-500 border-0 outline-none text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50">
        <PlusOutlined class="mr-2" />
        添加浏览器
      </button>
    </div>

    <!-- 科技感搜索框 -->
    <div class="mb-6">
      <div class="relative max-w-md">
        <div class="tech-search-container">
          <SearchOutlined class="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 z-10" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索浏览器名称、账户名称或用户名..."
            class="tech-search-input w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
          />
        </div>
      </div>
    </div>

    <!-- 新标签页卡片网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <!-- 新标签页卡片 -->
      <div 
        v-for="domain in filteredDomains" 
        :key="domain.id"
        class="tech-card overflow-hidden group"
      >
        <!-- 卡片头部 -->
        <div class="p-4 border-b border-gray-100/50">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <!-- 新标签页图标和名称 -->
              <div class="flex items-center mb-2">
                <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
                  <span class="emoji-icon text-white">🌐</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 truncate">{{ domain.name }}</h3>
              </div>
              
              <!-- 新标签页URL -->
              <div class="mb-3">
                <a 
                  :href="domain.url" 
                  target="_blank" 
                  @mouseenter="showTooltip($event, domain.url)"
                  @mouseleave="hideTooltip"
                  class="text-sm text-blue-500 hover:text-blue-700 hover:underline truncate block"
                >
                  {{ domain.url }}
                </a>
              </div>

              <!-- 关联信息 -->
              <div class="space-y-1">
                <div class="flex items-center text-xs text-gray-500">
                  <span class="w-12 flex-shrink-0">账户:</span>
                  <span class="text-gray-700">{{ getAccountName(domain.account_id) }}</span>
                </div>
                <div class="flex items-start text-xs text-gray-500">
                  <span class="w-12 flex-shrink-0 mt-0.5">脚本:</span>
                  <span class="text-gray-700 leading-tight">{{ getScriptNames(domain.script_id) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片操作按钮 -->
        <div class="p-4 bg-gray-50/30">
          <div class="flex justify-between">
            <!-- 打开按钮 -->
            <button 
              @click="openDomain(domain)"
              class="flex-1 mr-2 px-3 py-2 bg-blue-500 border-0 outline-none text-white text-sm rounded-md hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
            >
              打开
            </button>

            <!-- 操作按钮组 -->
            <div class="flex space-x-1">
              <button 
                @click="editDomain(domain)"
                class="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
                title="编辑"
              >
                <EditOutlined class="text-sm" />
              </button>
              
              <button 
                @click="copyDomain(domain)"
                class="p-2 text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-50"
                title="复制"
              >
                <CopyOutlined class="text-sm" />
              </button>
              
              <button 
                @click="removeDomain(domain)"
                class="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50"
                title="删除"
              >
                <DeleteOutlined class="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑新标签页模态框 -->
    <a-modal
      v-model:open="isModalVisible"
      :title="formState.isEdit ? '编辑浏览器实例' : (formState.isCopy ? '复制浏览器实例' : '添加浏览器实例')"
      @ok="handleOk"
      @cancel="handleCancel"
      :ok-text="formState.isEdit ? '更新' : '添加'"
      cancel-text="取消"
      width="500px"
    >
      <div class="space-y-4 pt-4">
        <!-- 新标签页名称 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">新标签页名称</label>
          <a-input
            v-model:value="formState.name"
            placeholder="请输入新标签页名称"
            class="w-full"
          />
        </div>

        <!-- 新标签页URL -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">新标签页URL</label>
          
          <!-- 快捷URL选项 -->
          <div class="mb-3">
            <div class="text-xs text-gray-500 mb-2">快捷填充：</div>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="option in quickUrlOptions"
                :key="option.name"
                type="button"
                @click="fillQuickUrl(option.url, option.name)"
                class="inline-flex items-center px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 rounded-md hover:bg-blue-100 hover:border-blue-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
              >
                <span class="mr-1">{{ option.icon }}</span>
                {{ option.name }}
              </button>
            </div>
          </div>
          
          <a-input
            v-model:value="formState.url"
            placeholder="请输入新标签页URL"
            class="w-full"
          />
        </div>

        <!-- 关联账户 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">关联账户</label>
          <a-select
            v-model:value="formState.account_id"
            placeholder="请选择关联账户"
            class="w-full"
            allow-clear
          >
            <a-select-option :value="null">无关联账户</a-select-option>
            <a-select-option 
              v-for="account in accounts" 
              :key="account.id" 
              :value="account.id"
            >
              {{ account.name }}
            </a-select-option>
          </a-select>
        </div>

        <!-- 关联脚本 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">关联脚本</label>
          <a-select
            v-model:value="formState.script_id"
            placeholder="请选择关联脚本"
            class="w-full"
            allow-clear
          >
            <a-select-option :value="null">无关联脚本</a-select-option>
            <a-select-option 
              v-for="script in scripts" 
              :key="script.id" 
              :value="script.id"
            >
              {{ script.name }}
            </a-select-option>
          </a-select>
        </div>
      </div>
    </a-modal>

    <!-- 自定义Tooltip -->
    <div
      v-if="tooltipVisible"
      class="custom-tooltip"
      :style="{
        position: 'fixed',
        left: tooltipPosition.x + 'px',
        top: tooltipPosition.y + 'px',
        zIndex: 9999
      }"
    >
      {{ tooltipContent }}
    </div>
  </div>
</template>

<style scoped>
/* 科技感搜索框样式 */
.tech-search-container {
  position: relative;
}

.tech-search-input {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.9), rgba(248, 250, 252, 0.8));
  box-shadow: 
    0 4px 20px rgba(0, 102, 255, 0.1),
    inset 0 1px 3px rgba(255, 255, 255, 0.5);
  /* 重置z-index避免显示在最上层 */
  z-index: auto !important;
  position: relative !important;
}

.tech-search-input:focus {
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.95), rgba(248, 250, 252, 0.9));
  box-shadow: 
    0 8px 30px rgba(0, 102, 255, 0.15),
    0 0 0 1px rgba(59, 130, 246, 0.5),
    inset 0 1px 3px rgba(255, 255, 255, 0.7);
  transform: translateY(-1px);
}

/* 搜索脉冲动画已移除 */

.tech-search-input:not(:focus):not(:placeholder-shown) {
  /* animation: searchPulse 2s ease-in-out infinite; 已移除 */
  /* 保持原有的阴影效果，但移除动画 */
  box-shadow: 0 4px 20px rgba(0, 102, 255, 0.1);
}

/* 自定义Tooltip样式 */
.custom-tooltip {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 500;
  max-width: 300px;
  word-break: break-all;
  box-shadow: 
    0 4px 15px rgba(0, 0, 0, 0.15),
    0 2px 8px rgba(102, 126, 234, 0.3);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: tooltipFadeIn 0.2s ease-out;
  pointer-events: none;
  z-index: 9999;
}

@keyframes tooltipFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
</style>
