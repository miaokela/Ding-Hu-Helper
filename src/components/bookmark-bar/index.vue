<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted, computed, watch } from 'vue';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { Modal } from 'ant-design-vue';
import { Bookmark, getAllBookmarks, deleteBookmark, updateBookmark, addBookmark, getBookmarksByAccountId } from '../../utils/db';

const props = defineProps<{
  currentUrl?: string;
  account?: any; // 当前账户信息
}>();

// 定义事件
const emit = defineEmits<{
  bookmarkClicked: [url: string]
}>();

// 书签列表
const bookmarks = ref<Bookmark[]>([]);
// 加载状态
const loading = ref(false);
// 编辑模式
const editMode = ref(false);
// 添加书签弹窗
const showAddModal = ref(false);
// 编辑书签弹窗
const showEditModal = ref(false);
// 当前编辑的书签
const currentBookmark = ref<Bookmark | null>(null);
// 右键菜单状态
const contextMenuVisible = ref(false);
const contextMenuBookmark = ref<Bookmark | null>(null);
const contextMenuPosition = ref({ x: 0, y: 0 });

// 表单数据
const formData = reactive({
  name: '',
  url: ''
});

// 加载书签
async function loadBookmarks() {
  loading.value = true;
  try {
    if (props.account?.id) {
      console.log(`📚 加载账户 ${props.account.id} 的书签`);
      bookmarks.value = await getBookmarksByAccountId(props.account.id);
    } else {
      console.log('📚 没有指定账户，加载所有书签');
      bookmarks.value = await getAllBookmarks();
    }
  } catch (error) {
    console.error('Failed to load bookmarks:', error);
  } finally {
    loading.value = false;
  }
}

// 导航到书签
const navigateToBookmark = (bookmark: Bookmark) => {
  emit('bookmarkClicked', bookmark.url);
};

// 显示右键菜单
function showContextMenu(event: MouseEvent, bookmark: Bookmark) {
  event.preventDefault();
  contextMenuBookmark.value = bookmark;
  contextMenuPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  contextMenuVisible.value = true;
}

// 隐藏右键菜单
function hideContextMenu() {
  contextMenuVisible.value = false;
  contextMenuBookmark.value = null;
}

// 右键菜单：编辑书签
function contextEditBookmark() {
  if (contextMenuBookmark.value) {
    showEditBookmark(contextMenuBookmark.value);
  }
  hideContextMenu();
}

// 右键菜单：删除书签
function contextDeleteBookmark() {
  if (contextMenuBookmark.value) {
    // 显示确认对话框
    const bookmark = contextMenuBookmark.value;
    hideContextMenu();
    
    // 使用 ant-design-vue 的确认对话框
    const { confirm } = Modal;
    confirm({
      title: '⚡ 确认删除',
      content: `确定要删除书签 "${bookmark.name}" 吗？此操作无法撤销。`,
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      class: 'tech-confirm-modal',
      onOk() {
        removeBookmark(bookmark);
      },
    });
  }
}

// 删除书签
async function removeBookmark(bookmark: Bookmark) {
  try {
    await deleteBookmark(bookmark.id);
    await loadBookmarks();
  } catch (error) {
    console.error('Failed to delete bookmark:', error);
  }
}

// 显示添加书签弹窗
function showAddBookmark() {
  formData.name = '';
  formData.url = props.currentUrl || '';
  showAddModal.value = true;
}

// 显示编辑书签弹窗
function showEditBookmark(bookmark: Bookmark) {
  currentBookmark.value = bookmark;
  formData.name = bookmark.name;
  formData.url = bookmark.url;
  showEditModal.value = true;
}

// 保存新书签
async function saveNewBookmark() {
  if (!formData.name.trim() || !formData.url.trim()) {
    return;
  }
  
  try {
    await addBookmark(formData.name.trim(), formData.url.trim(), props.account?.id);
    await loadBookmarks();
    showAddModal.value = false;
    formData.name = '';
    formData.url = '';
  } catch (error) {
    console.error('Failed to add bookmark:', error);
  }
}

// 保存编辑的书签
async function saveEditBookmark() {
  if (!currentBookmark.value || !formData.name.trim() || !formData.url.trim()) {
    return;
  }
  
  try {
    const updatedBookmark: Bookmark = {
      ...currentBookmark.value,
      name: formData.name.trim(),
      url: formData.url.trim()
    };
    await updateBookmark(updatedBookmark);
    await loadBookmarks();
    showEditModal.value = false;
    currentBookmark.value = null;
  } catch (error) {
    console.error('Failed to update bookmark:', error);
  }
}

// 取消弹窗
function cancelModal() {
  showAddModal.value = false;
  showEditModal.value = false;
  currentBookmark.value = null;
  formData.name = '';
  formData.url = '';
}

// 切换编辑模式
function toggleEditMode() {
  editMode.value = !editMode.value;
}

// 获取网站图标占位符
function getFaviconPlaceholder(url: string) {
  try {
    const domain = new URL(url).hostname;
    return domain.charAt(0).toUpperCase();
  } catch {
    return '🔗';
  }
}

// 计算显示的书签（限制数量以防止溢出）
const displayBookmarksLimit = ref(10);
const displayBookmarks = computed(() => {
  return bookmarks.value.slice(0, displayBookmarksLimit.value);
});

const hasMoreBookmarks = computed(() => {
  return bookmarks.value.length > displayBookmarksLimit.value;
});

onMounted(() => {
  loadBookmarks();
  
  // 点击其他地方时隐藏右键菜单
  document.addEventListener('click', hideContextMenu);
  document.addEventListener('contextmenu', (e) => {
    // 如果不是在书签上右键，则隐藏菜单
    if (!e.target || !(e.target as Element).closest('.bookmark-item')) {
      hideContextMenu();
    }
  });
});

// 监听账户变化，重新加载书签
watch(() => props.account?.id, (newAccountId, oldAccountId) => {
  if (newAccountId !== oldAccountId) {
    console.log(`📚 账户切换: ${oldAccountId} -> ${newAccountId}，重新加载书签`);
    loadBookmarks();
  }
});

// 组件卸载时移除事件监听
onUnmounted(() => {
  document.removeEventListener('click', hideContextMenu);
  document.removeEventListener('contextmenu', hideContextMenu);
});

// 暴露添加书签方法给父组件
defineExpose({
  addCurrentPageBookmark: showAddBookmark,
  loadBookmarks
});
</script>

<template>
  <div class="w-full bg-gray-100 border-b border-gray-200 px-3 py-1">
    <div class="flex items-center h-8 gap-2">
      <!-- 书签列表 -->
      <div class="flex items-center gap-1 overflow-x-auto scrollbar-thin min-w-0" style="flex: 1; max-width: calc(100% - 80px);">
        <div
          v-for="bookmark in displayBookmarks"
          :key="bookmark.id"
          class="relative group flex items-center gap-2 px-2 py-1 rounded-md hover:bg-gray-200 cursor-pointer transition-all duration-150 flex-shrink-0 bookmark-item"
          style="max-width: 120px;"
          @click="navigateToBookmark(bookmark)"
          @contextmenu="showContextMenu($event, bookmark)"
          :title="bookmark.url"
        >
          <!-- 网站图标 -->
          <div class="w-4 h-4 rounded-sm bg-blue-500 text-white text-xs flex items-center justify-center font-medium">
            {{ getFaviconPlaceholder(bookmark.url) }}
          </div>
          
          <!-- 书签名称 -->
          <span class="text-sm text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis" style="max-width: 80px;">
            {{ bookmark.name }}
          </span>
          
          <!-- 编辑模式下的操作按钮 -->
          <div v-if="editMode" class="flex items-center gap-1 ml-1">
            <button
              @click.stop="showEditBookmark(bookmark)"
              class="w-4 h-4 rounded-sm flex items-center justify-center border-0 outline-none text-gray-500 hover:text-blue-600 hover:bg-blue-100 transition-all duration-150 focus:outline-none"
              title="编辑"
            >
              <EditOutlined class="text-xs" />
            </button>
            <button
              @click.stop="removeBookmark(bookmark)"
              class="w-4 h-4 rounded-sm flex items-center justify-center border-0 outline-none text-gray-500 hover:text-red-600 hover:bg-red-100 transition-all duration-150 focus:outline-none"
              title="删除"
            >
              <DeleteOutlined class="text-xs" />
            </button>
          </div>
        </div>
        
        <!-- 更多书签指示器 -->
        <div v-if="hasMoreBookmarks" class="text-xs text-gray-500 px-1 flex-shrink-0">
          +{{ bookmarks.length - displayBookmarksLimit }}
        </div>
        
        <!-- 空状态 -->
        <div v-if="bookmarks.length === 0" class="text-sm text-gray-500 px-1 flex-shrink-0">
          暂无书签
        </div>
      </div>
      
      <!-- 操作按钮组 -->
      <div class="flex items-center gap-1 ml-3 mr-2" style="flex-shrink: 0; min-width: 64px; position: relative;">
        <!-- 添加书签按钮 -->
        <button
          @click="showAddBookmark"
          class="w-6 h-6 rounded-md flex items-center justify-center border-0 outline-none text-gray-600 hover:text-blue-600 hover:bg-blue-100 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
          title="添加书签"
        >
          <PlusOutlined class="text-sm" />
        </button>
        
        <!-- 编辑模式切换按钮 -->
        <button
          @click="toggleEditMode"
          :class="[
            'w-6 h-6 rounded-md flex items-center justify-center border-0 outline-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50',
            editMode ? 'text-blue-600 bg-blue-100' : 'text-gray-600 hover:text-blue-600 hover:bg-blue-100'
          ]"
          title="编辑书签"
        >
          <EditOutlined class="text-sm" />
        </button>
      </div>
    </div>

    <!-- 添加书签弹窗 -->
    <a-modal
      v-model:visible="showAddModal"
      title="添加书签"
      @ok="saveNewBookmark"
      @cancel="cancelModal"
      :width="480"
      :top="'120px'"
      :okText="'确认添加'"
      :cancelText="'取消'"
      class="tech-modal"
    >
      <a-form layout="vertical" class="pt-4 tech-form">
        <a-form-item label="书签名称" required class="tech-form-item">
          <a-input 
            v-model:value="formData.name" 
            placeholder="输入书签名称"
            @keyup.enter="saveNewBookmark"
            class="tech-input"
          />
        </a-form-item>
        <a-form-item label="网站地址" required class="tech-form-item">
          <a-input 
            v-model:value="formData.url" 
            placeholder="https://www.example.com"
            @keyup.enter="saveNewBookmark"
            class="tech-input"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑书签弹窗 -->
    <a-modal
      v-model:visible="showEditModal"
      title="编辑书签"
      @ok="saveEditBookmark"
      @cancel="cancelModal"
      :width="480"
      :top="'120px'"
      :okText="'确认修改'"
      :cancelText="'取消'"
      class="tech-modal"
    >
      <a-form layout="vertical" class="pt-4 tech-form">
        <a-form-item label="书签名称" required class="tech-form-item">
          <a-input 
            v-model:value="formData.name" 
            placeholder="输入书签名称"
            @keyup.enter="saveEditBookmark"
            class="tech-input"
          />
        </a-form-item>
        <a-form-item label="网站地址" required class="tech-form-item">
          <a-input 
            v-model:value="formData.url" 
            placeholder="https://www.example.com"
            @keyup.enter="saveEditBookmark"
            class="tech-input"
          />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 右键菜单 -->
    <teleport to="body">
      <div
        v-if="contextMenuVisible"
        class="fixed z-50 tech-context-menu min-w-32"
        :style="{
          left: contextMenuPosition.x + 'px',
          top: contextMenuPosition.y + 'px'
        }"
        @click.stop
        @contextmenu.prevent
      >
        <div
          class="tech-context-menu-item cursor-pointer flex items-center gap-2"
          @click="contextEditBookmark"
        >
          <EditOutlined class="text-xs" />
          编辑书签
        </div>
        <div
          class="tech-context-menu-item danger cursor-pointer flex items-center gap-2"
          @click="contextDeleteBookmark"
        >
          <DeleteOutlined class="text-xs" />
          删除书签
        </div>
      </div>
    </teleport>
  </div>
</template>
