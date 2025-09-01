<script setup lang="ts">
import { ref, reactive, onMounted, watch, computed } from 'vue';
import { PlusOutlined, EditOutlined, DeleteOutlined, CopyOutlined, SearchOutlined } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import { Account, getAllAccounts, addAccount, updateAccount, deleteAccount, hasBookmarksForAccount, deleteBookmarksByAccountId } from '../../utils/db';

const props = defineProps<{
  active: boolean;
}>();

// 定义事件
const emit = defineEmits<{
  accountUpdated: []
}>();

// 账户列表
const accounts = ref<Account[]>([]);
// 显示模态框
const isModalVisible = ref(false);
// 加载状态
const loading = ref(false);
// 当前编辑的账户
const currentAccount = ref<Account | null>(null);
// 搜索关键词
const searchKeyword = ref('');
// 表单模型
const formState = reactive({
  username: '',
  password: '',
  name: '',
  id: 0,
  isEdit: false,
  isCopy: false,
});

// 组件挂载时加载数据
onMounted(() => {
  if (props.active) {
    loadAccounts();
  }
});

// 监听 active 属性变化，当切换到账户管理时重新加载数据
watch(() => props.active, (newActive) => {
  if (newActive) {
    loadAccounts();
  }
});

// 加载所有账户
async function loadAccounts() {
  loading.value = true;
  try {
    accounts.value = await getAllAccounts();
  } catch (error) {
    console.error('加载账户失败:', error);
  } finally {
    loading.value = false;
  }
}

// 显示模态框
function showModal() {
  formState.username = '';
  formState.password = '';
  formState.name = '';
  formState.id = 0;
  formState.isEdit = false;
  formState.isCopy = false;
  currentAccount.value = null;
  isModalVisible.value = true;
}

// 编辑账户
function editAccount(account: Account) {
  formState.username = account.username;
  formState.password = account.password;
  formState.name = account.name;
  formState.id = account.id;
  formState.isEdit = true;
  formState.isCopy = false;
  currentAccount.value = account;
  isModalVisible.value = true;
}

// 复制账户
function copyAccount(account: Account) {
  formState.username = account.username;
  formState.password = account.password;
  formState.name = account.name + ' - 副本';
  formState.id = 0;
  formState.isEdit = false;
  formState.isCopy = true;
  currentAccount.value = account;
  isModalVisible.value = true;
}

// 删除账户
async function removeAccount(account: Account) {
  try {
    // 检查账户是否有关联的书签
    const hasBookmarks = await hasBookmarksForAccount(account.id);
    
    if (hasBookmarks) {
      // 如果有书签，显示确认对话框
      Modal.confirm({
        title: '确认删除账户',
        content: `删除账户 "${account.name}" 将同时删除该账户下的所有书签。此操作不可撤销，确定要继续吗？`,
        okText: '确定删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            // 先删除关联的书签
            await deleteBookmarksByAccountId(account.id);
            // 再删除账户
            await deleteAccount(account.id);
            await loadAccounts();
            // 发送账户更新事件
            emit('accountUpdated');
            console.log(`✅ 已删除账户 "${account.name}" 及其关联的书签`);
          } catch (error) {
            console.error('删除账户及书签失败:', error);
          }
        }
      });
    } else {
      // 如果没有书签，直接删除
      Modal.confirm({
        title: '确认删除账户',
        content: `确定要删除账户 "${account.name}" 吗？`,
        okText: '确定删除',
        okType: 'danger',
        cancelText: '取消',
        onOk: async () => {
          try {
            await deleteAccount(account.id);
            await loadAccounts();
            // 发送账户更新事件
            emit('accountUpdated');
            console.log(`✅ 已删除账户 "${account.name}"`);
          } catch (error) {
            console.error('删除账户失败:', error);
          }
        }
      });
    }
  } catch (error) {
    console.error('检查账户书签失败:', error);
  }
}

// 表单提交
async function handleOk() {
  if (!formState.username || !formState.name) {
    return;
  }

  const accountData = {
    username: formState.username,
    password: formState.password,
    name: formState.name,
  };

  try {
    if (formState.isEdit && currentAccount.value) {
      // 更新账户 - 检查用户名是否发生变化
      const oldUsername = currentAccount.value.username;
      const newUsername = accountData.username;
      
      if (oldUsername !== newUsername) {
        // 用户名发生了变化，检查是否有关联的书签
        const hasBookmarks = await hasBookmarksForAccount(currentAccount.value.id);
        
        if (hasBookmarks) {
          // 显示警告对话框
          Modal.confirm({
            title: '用户名已更改',
            content: `用户名从 "${oldUsername}" 更改为 "${newUsername}"。此操作将删除该账户下的所有书签。确定要继续吗？`,
            okText: '确定保存',
            okType: 'danger',
            cancelText: '取消',
            onOk: async () => {
              try {
                // 先删除关联的书签
                await deleteBookmarksByAccountId(currentAccount.value!.id);
                // 再更新账户
                const updatedAccount = {
                  ...currentAccount.value!,
                  ...accountData,
                };
                await updateAccount(updatedAccount);
                await loadAccounts();
                isModalVisible.value = false;
                // 发送账户更新事件
                emit('accountUpdated');
                console.log(`✅ 已更新账户 "${accountData.name}" 并删除关联的书签`);
              } catch (error) {
                console.error('更新账户失败:', error);
              }
            }
          });
          return; // 等待用户确认，不继续执行
        }
      }
      
      // 用户名没有变化或没有书签，直接更新
      const updatedAccount = {
        ...currentAccount.value,
        ...accountData,
      };
      await updateAccount(updatedAccount);
      console.log(`✅ 已更新账户 "${accountData.name}"`);
    } else {
      // 添加新账户
      await addAccount(accountData.username, accountData.password, accountData.name);
      console.log(`✅ 已添加账户 "${accountData.name}"`);
    }
    
    // 重新加载数据
    await loadAccounts();
    
    // 发送账户更新事件
    emit('accountUpdated');
    
    // 关闭模态框
    isModalVisible.value = false;
  } catch (error) {
    console.error('保存账户失败:', error);
  }
}

// 取消表单
function handleCancel() {
  isModalVisible.value = false;
}

// 过滤后的账户列表（根据搜索关键词进行过滤）
const filteredAccounts = computed(() => {
  if (!searchKeyword.value.trim()) {
    return accounts.value;
  }
  
  const keyword = searchKeyword.value.toLowerCase().trim();
  
  return accounts.value.filter(account => {
    // 账户名称匹配
    const nameMatch = account.name.toLowerCase().includes(keyword);
    // 用户名匹配
    const usernameMatch = account.username.toLowerCase().includes(keyword);
    
    return nameMatch || usernameMatch;
  });
});
</script>

<template>
  <div v-show="active" class="starfield-container p-6 h-full overflow-auto">
    <!-- 标题栏 -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 mb-1 flex items-center">
          账户管理
        </h1>
        <p class="text-gray-500 text-sm">管理你的用户账户和登录凭据</p>
      </div>
      <button @click="showModal()" class="inline-flex items-center px-4 py-2 bg-blue-500 border-0 outline-none text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50">
        <PlusOutlined class="mr-2" />
        添加账户
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
            placeholder="搜索账户名称或用户名..."
            class="tech-search-input w-full pl-12 pr-4 py-3 bg-white/80 backdrop-blur-sm border border-blue-200/50 rounded-xl text-gray-700 placeholder-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
          />
        </div>
      </div>
    </div>

    <!-- 账户卡片网格 -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <!-- 账户卡片 -->
      <div 
        v-for="account in filteredAccounts" 
        :key="account.id"
        class="tech-card overflow-hidden group"
      >
        <!-- 卡片头部 -->
        <div class="p-4 border-b border-gray-100/50">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <!-- 账户图标和名称 -->
              <div class="flex items-center mb-3">
                <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-lg">
                  <span class="emoji-icon text-white">👤</span>
                </div>
                <h3 class="text-lg font-semibold text-gray-800 truncate">{{ account.name }}</h3>
              </div>
              
              <!-- 账户信息 -->
              <div class="space-y-2">
                <div class="flex items-center text-xs text-gray-500">
                  <span class="w-12 flex-shrink-0">用户名:</span>
                  <span class="text-gray-700 truncate">{{ account.username }}</span>
                </div>
                <div class="flex items-center text-xs text-gray-500">
                  <span class="w-12 flex-shrink-0">密码:</span>
                  <span class="text-gray-700">••••••••</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片操作按钮 -->
        <div class="p-4 bg-gray-50/30">
          <div class="flex justify-end space-x-1">
            <button 
              @click="editAccount(account)"
              class="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
              title="编辑"
            >
              <EditOutlined class="text-sm" />
            </button>
            
            <button 
              @click="copyAccount(account)"
              class="p-2 text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-50"
              title="复制"
            >
              <CopyOutlined class="text-sm" />
            </button>
            
            <button 
              @click="removeAccount(account)"
              class="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50"
              title="删除"
            >
              <DeleteOutlined class="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加/编辑账户模态框 -->
    <a-modal
      v-model:open="isModalVisible"
      :title="formState.isEdit ? '编辑账户' : (formState.isCopy ? '复制账户' : '添加账户')"
      @ok="handleOk"
      @cancel="handleCancel"
      :ok-text="formState.isEdit ? '更新' : '添加'"
      cancel-text="取消"
      width="500px"
    >
      <div class="space-y-4 pt-4">
        <!-- 账户名称 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">账户名称</label>
          <a-input
            v-model:value="formState.name"
            placeholder="请输入容易辨认的账户别名"
            class="w-full"
          />
        </div>

        <!-- 用户名 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">用户名</label>
          <a-input
            v-model:value="formState.username"
            placeholder="请输入用于登录的用户名"
            class="w-full"
          />
        </div>

        <!-- 密码 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">密码</label>
          <a-input-password
            v-model:value="formState.password"
            placeholder="请输入用于登录的密码"
            class="w-full"
          />
        </div>
      </div>
    </a-modal>
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
</style>
