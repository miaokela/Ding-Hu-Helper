<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch, nextTick } from "vue";
import {
  LeftOutlined,
  RightOutlined,
  ReloadOutlined,
  PlusOutlined,
  ClearOutlined,
} from "@ant-design/icons-vue";
import BookmarkBar from "../bookmark-bar/index.vue";
import { isBookmarked, addBookmark, deleteBookmark, updateBookmark, getAllBookmarks } from "../../utils/db";
import juliangqianchuanScript from "../../preset_scripts/juliangqianchuan.js";
import douyinScript from "../../preset_scripts/douyin.js";

// ✅ 外部传入 partition 名和起始 url，以及账户和脚本信息
const props = defineProps<{
  partition: string;
  startUrl: string;
  account?: any;
  script?: any;
  active?: boolean; // 添加 active 属性来感知是否当前可见
}>();

interface Tab {
  id: number;
  url: string;
  originalUrl?: string; // 用户输入的原始URL（用于书签等功能）
  title: string;
  partition: string; // 添加partition字段以区分不同域名的tab
}

onMounted(() => {
  console.log('=== BrowserPage组件挂载 ===');
  console.log('初始props:', props);
  console.log('挂载时tabs状态:', tabs.length);
  
  // 监听页面中所有可能的协议触发
  const handleBeforeUnload = (e: BeforeUnloadEvent) => {
    console.log('页面即将卸载/导航，可能的协议触发');
  };
  
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target && target.closest && target.closest('a')) {
      const link = target.closest('a') as HTMLAnchorElement;
      console.log('检测到链接点击:', link.href);
      
      // 检查是否是危险协议
      if (link.href && (link.href.startsWith('bytedance:') || link.href.startsWith('javascript:') || link.href.startsWith('data:'))) {
        console.warn('阻止点击危险协议链接:', link.href);
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }
  };
  
  // 全局拖拽事件处理，防止"不允许"图标
  const handleGlobalDragOver = (e: DragEvent) => {
    e.preventDefault();
    if (dragState.value.isDragging && e.dataTransfer) {
      // 检查拖拽是否在主应用容器外
      const appContainer = document.querySelector('.flex.h-screen');
      if (appContainer) {
        const rect = appContainer.getBoundingClientRect();
        const isOutside = e.clientY < rect.top - 30 || 
                         e.clientY > rect.bottom + 30 ||
                         e.clientX < rect.left - 30 ||
                         e.clientX > rect.right + 30;
        
        if (isOutside) {
          e.dataTransfer.dropEffect = 'copy'; // 外部显示复制图标（分离）
          document.body.classList.remove('dragging-active');
          document.body.classList.add('dragging-detached');
          if (!dragState.value.isDetached) {
            dragState.value.isDetached = true;
            console.log('🪟 进入分离模式');
          }
        } else {
          e.dataTransfer.dropEffect = 'move'; // 内部显示移动图标
          document.body.classList.remove('dragging-detached');
          document.body.classList.add('dragging-active');
          if (dragState.value.isDetached) {
            dragState.value.isDetached = false;
            console.log('🔄 退出分离模式');
          }
        }
      }
    }
  };
  
  const handleGlobalDrop = (e: DragEvent) => {
    e.preventDefault();
    if (dragState.value.isDragging && dragState.value.draggedTab && dragState.value.isDetached) {
      console.log('🪟 在外部区域放置，执行分离操作');
      detachTabToNewWindow(dragState.value.draggedTab);
      resetTabDragState();
    }
  };
  
  // 添加全局监听器
  window.addEventListener('beforeunload', handleBeforeUnload);
  document.addEventListener('click', handleClick, true);
  document.addEventListener('dragover', handleGlobalDragOver);
  document.addEventListener('drop', handleGlobalDrop);
  
  // 清理函数
  const cleanup = () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    document.removeEventListener('click', handleClick, true);
    document.removeEventListener('dragover', handleGlobalDragOver);
    document.removeEventListener('drop', handleGlobalDrop);
  };
  
  // 设置webview事件监听器
  (window as any).webviewAPI?.onWebviewOpen((data: { url: string; webContentsId: number }) => {
    console.log('收到外链请求:', data.url);
    
    addTab(data.url, props.partition);
  });
  
  // 确保每个domain都有至少一个tab
  console.log('检查是否需要创建初始tab...');
  console.log('当前partition:', props.partition);
  console.log('startUrl:', props.startUrl);
  
  // 立即检查并创建
  const currentPartitionTabs = tabs.filter(tab => tab.partition === props.partition);
  if (currentPartitionTabs.length === 0) {
    console.log('没有tabs，创建默认tab');
    addTab(props.startUrl, props.partition);
  } else {
    console.log('已有tabs，切换到第一个');
    const firstTab = currentPartitionTabs[0];
    activeTabId.value = firstTab.id;
    currentUrl.value = firstTab.url;
    // 记录该partition的活跃tab
    partitionActiveTabMap[props.partition] = firstTab.id;
  }
  
  console.log('=== BrowserPage组件挂载完成 ===');
});

// 计算属性：获取当前partition的tabs，按照排序索引排序
const currentPartitionTabs = computed(() => {
  const currentTabs = tabs.filter(tab => tab.partition === props.partition);
  // 使用tabOrderMap进行排序，如果没有排序索引则使用原始顺序
  const sortedTabs = currentTabs.sort((a, b) => {
    const orderA = tabOrderMap[a.id] ?? a.id;
    const orderB = tabOrderMap[b.id] ?? b.id;
    return orderA - orderB;
  });
  console.log('当前partition的tabs:', sortedTabs.map(t => ({ id: t.id, title: t.title, partition: t.partition })));
  return sortedTabs;
});

// 使用响应式的tabs数组，不预先创建tab
const tabs = reactive<Tab[]>([]);
const activeTabId = ref<number>(0);
const currentUrl = ref<string>("");
const readyMap = reactive<Record<number, boolean>>({});
const tabContainerRef = ref<HTMLElement | null>(null);

// 用于保存所有创建过的tab，保持webview DOM稳定性
const allCreatedTabs = reactive<Tab[]>([]);

// 用于控制tab显示顺序的索引映射，避免直接操作tabs数组影响webview DOM
const tabOrderMap = reactive<Record<number, number>>({});

// 记录每个partition的最后活跃tab ID
const partitionActiveTabMap = reactive<Record<string, number>>({});

// 拖拽相关状态
const dragState = ref({
  isDragging: false,
  draggedTab: null as Tab | null,
  dragOverIndex: -1,
  dragStartIndex: -1,
  startX: 0,
  startY: 0,
  dragElement: null as HTMLElement | null,
  isDetached: false, // 标记是否已经脱离容器
  cloneElement: null as HTMLElement | null
});

// 右键菜单状态
const contextMenu = reactive({
  visible: false,
  x: 0,
  y: 0,
  targetTabId: 0
});

// 书签相关状态
const bookmarkBarRef = ref<InstanceType<typeof BookmarkBar> | null>(null);
const currentPageBookmarked = ref(false);
const showBookmarkModal = ref(false);
const bookmarkForm = reactive({
  name: '',
  url: ''
});

// 检查当前页面是否已收藏
async function checkCurrentPageBookmarked() {
  if (currentUrl.value) {
    try {
      currentPageBookmarked.value = await isBookmarked(currentUrl.value);
    } catch (error) {
      console.error('检查收藏状态失败:', error);
      currentPageBookmarked.value = false;
    }
  } else {
    currentPageBookmarked.value = false;
  }
}

// 收藏当前页面
async function bookmarkCurrentPage() {
  const currentTab = tabs.find(t => t.id === activeTabId.value);
  if (!currentTab) return;
  
  bookmarkForm.name = currentTab.title || '新书签';
  bookmarkForm.url = currentTab.url; // 使用当前实际访问的地址
  showBookmarkModal.value = true;
}

// 保存书签
async function saveBookmark() {
  console.log('🔖 开始保存书签...');
  console.log('📝 书签表单数据:', bookmarkForm);
  console.log('👤 当前账户信息:', props.account);
  
  if (!bookmarkForm.name.trim() || !bookmarkForm.url.trim()) {
    console.warn('⚠️ 书签名称或网址为空');
    return;
  }
  
  try {
    console.log('💾 调用 addBookmark 函数...');
    // 传入当前域名关联的账户ID
    const accountId = props.account?.id;
    console.log(`🆔 使用账户ID: ${accountId}`);
    
    const result = await addBookmark(bookmarkForm.name.trim(), bookmarkForm.url.trim(), accountId);
    console.log('✅ addBookmark 结果:', result);
    
    if (result) {
      console.log('🎉 书签保存成功');
      showBookmarkModal.value = false;
      bookmarkForm.name = '';
      bookmarkForm.url = '';
      await checkCurrentPageBookmarked();
      bookmarkBarRef.value?.loadBookmarks();
    } else {
      console.error('❌ 书签保存失败，addBookmark 返回 false');
    }
  } catch (error) {
    console.error('💥 保存书签失败:', error);
  }
}

// 取消书签弹窗
function cancelBookmarkModal() {
  showBookmarkModal.value = false;
  bookmarkForm.name = '';
  bookmarkForm.url = '';
}

// 处理书签栏导航 - 新开标签页
function handleBookmarkNavigate(url: string) {
  addTab(url, props.partition);
}

// 监听partition变化
watch(() => props.partition, (newPartition, oldPartition) => {
  console.log('检测到partition变化:', { oldPartition, newPartition });
  
  // 如果是初始化（oldPartition为undefined），跳过
  if (oldPartition === undefined) {
    console.log('初始化阶段，跳过partition变化处理');
    return;
  }
  
  // 如果partition确实发生了变化
  if (newPartition !== oldPartition) {
    console.log('处理partition变化从', oldPartition, '到', newPartition);
    handlePartitionSwitch(newPartition);
  }
});

// 监听 active 状态变化，当重新显示浏览器页面时刷新书签栏
watch(() => props.active, (newActive, oldActive) => {
  if (newActive && !oldActive) {
    console.log('🔄 浏览器页面重新激活，刷新书签栏');
    nextTick(() => {
      bookmarkBarRef.value?.loadBookmarks();
    });
  }
});

// 处理partition切换的独立函数
function handlePartitionSwitch(newPartition: string) {
  console.log('=== handlePartitionSwitch 开始 ===');
  console.log('目标partition:', newPartition);
  console.log('当前所有tabs:', tabs.map(t => ({ id: t.id, partition: t.partition, title: t.title, url: t.url })));
  console.log('当前activeTabId:', activeTabId.value);
  console.log('partition活跃tab记录:', partitionActiveTabMap);
  
  // 过滤出属于目标partition的tabs
  const targetPartitionTabs = tabs.filter(tab => tab.partition === newPartition);
  console.log('属于目标partition的tabs数量:', targetPartitionTabs.length);
  console.log('目标partition的tabs详情:', targetPartitionTabs);
  
  if (targetPartitionTabs.length > 0) {
    // 检查是否有保存的活跃tab
    const savedActiveTabId = partitionActiveTabMap[newPartition];
    let targetTab;
    
    if (savedActiveTabId) {
      // 查找保存的活跃tab是否还存在
      targetTab = targetPartitionTabs.find(tab => tab.id === savedActiveTabId);
      if (targetTab) {
        console.log('使用保存的活跃tab:', targetTab);
      } else {
        console.log('保存的活跃tab不存在，使用第一个tab');
        targetTab = targetPartitionTabs[0];
      }
    } else {
      console.log('没有保存的活跃tab，使用第一个tab');
      targetTab = targetPartitionTabs[0];
    }
    
    // 使用activateTab函数来安全地切换，而不是直接设置activeTabId
    // 这样可以利用activateTab中的所有安全检查和焦点设置逻辑
    if (activeTabId.value !== targetTab.id) {
      activateTab(targetTab.id);
    } else {
      console.log('目标tab已经是激活状态');
    }
    
    console.log('切换完成，当前activeTabId:', activeTabId.value);
  } else {
    console.log('目标partition没有任何tabs，创建默认tab');
    // 这种情况下，我们需要为该partition创建第一个tab
    addTab(props.startUrl, newPartition);
  }
  
  console.log('=== handlePartitionSwitch 结束 ===');
}

// 监听startUrl变化 - 仅在必要时处理
watch(() => props.startUrl, (newUrl, oldUrl) => {
  console.log('检测到startUrl变化:', { oldUrl, newUrl });
  
  // 跳过相同URL或初始化
  if (newUrl === oldUrl || oldUrl === undefined) {
    console.log('URL相同或初始化，跳过处理');
    return;
  }
  
  // 获取当前partition的tabs
  const currentPartitionTabs = tabs.filter(tab => tab.partition === props.partition);
  console.log('当前partition的tabs:', currentPartitionTabs);
  
  if (currentPartitionTabs.length === 0) {
    // 只有在没有tabs时才处理，有tabs的情况下不要自动更新URL
    console.log('当前partition没有tabs，URL变化表示需要创建新tab');
    // 这种情况下让handlePartitionSwitch或onMounted来处理
  } else {
    console.log('当前partition已有tabs，不自动更新URL以避免刷新');
  }
}, { immediate: false });

// 用于存储每个tab的稳定初始URL
const initialSrcMap = reactive<Record<number, string>>({});

// 为每个tab计算稳定的初始URL，确保只设置一次
const getStableInitialUrl = (tab: Tab) => {
  // 使用tab的id作为key，确保每个tab的URL只计算一次
  if (!initialSrcMap[tab.id]) {
    // 第一次计算时存储结果
    const initialUrl = tab.url && tab.url !== 'about:blank' ? tab.url : '';
    initialSrcMap[tab.id] = initialUrl;
    console.log(`首次计算tab ${tab.id} 的稳定URL:`, initialUrl);
    return initialUrl;
  }
  
  // 后续调用直接返回已存储的值，确保稳定性
  return initialSrcMap[tab.id];
};

const canGoBack = computed(() => {
  const webview = getWebview();
  // 检查webview是否存在且已经就绪
  if (!webview || !readyMap[activeTabId.value]) {
    return false;
  }
  try {
    return webview.canGoBack();
  } catch (error) {
    console.warn('canGoBack调用失败:', error);
    return false;
  }
});

const canGoForward = computed(() => {
  const webview = getWebview();
  // 检查webview是否存在且已经就绪
  if (!webview || !readyMap[activeTabId.value]) {
    return false;
  }
  try {
    return webview.canGoForward();
  } catch (error) {
    console.warn('canGoForward调用失败:', error);
    return false;
  }
});

function getWebview() {
  return document.getElementById(
    `webview-${activeTabId.value}`
  ) as Electron.WebviewTag;
}

function addTab(url = props.startUrl, partition = props.partition) {
  console.log('=== addTab开始 ===');
  console.log('请求创建新tab:', { url, partition });
  console.log('当前props:', { startUrl: props.startUrl, partition: props.partition });
  
  // 确保有有效的URL和partition
  if (!url) {
    url = props.startUrl || 'about:blank';
  }
  if (!partition) {
    partition = props.partition;
  }
  
  // 保存原始URL
  const originalUrl = url;
  
  // 过滤掉不安全的协议
  if (url) {
    const dangerousProtocols = ['bytedance:', 'javascript:', 'data:', 'vbscript:', 'chrome:', 'chrome-extension:', 'moz-extension:'];
    const hasUnsafeProtocol = dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol));
    
    if (hasUnsafeProtocol) {
      console.warn('阻止创建包含不安全协议的标签页:', url);
      // 重置为安全的URL或搜索
      url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
  }
  
  console.log('最终参数:', { url, originalUrl, partition });
  
  const id = Date.now();
  const newTab = { 
    id, 
    url,
    originalUrl, // 保存原始URL用于书签等功能
    title: "新标签", 
    partition 
  };
  
  tabs.push(newTab);
  // 同时添加到allCreatedTabs，用于稳定webview渲染
  if (!allCreatedTabs.find(t => t.id === id)) {
    allCreatedTabs.push(newTab);
  }
  
  // 为新tab设置排序索引（使用当前时间戳确保排在最后）
  tabOrderMap[id] = Date.now();
  
  activeTabId.value = id;
  currentUrl.value = url;
  
  // 记录该partition的活跃tab
  partitionActiveTabMap[partition] = id;
  
  console.log('新tab已创建:', newTab);
  console.log('更新后的tabs:', tabs.map(t => ({ id: t.id, partition: t.partition, title: t.title })));
  console.log('更新后的partition活跃tab记录:', partitionActiveTabMap);
  
  // 等待DOM更新后更新样式
  nextTick(() => {
    updateTabStyle();
  });
  
  console.log('=== addTab结束 ===');
}

function closeTab(id: number) {
  const idx = tabs.findIndex((t) => t.id === id);
  if (idx < 0) return;
  
  const tabToClose = tabs[idx];
  tabs.splice(idx, 1);
  
  // 清理相关的映射数据
  delete initialSrcMap[id];
  delete readyMap[id];
  delete tabOrderMap[id]; // 清理排序索引
  
  // 从allCreatedTabs中移除，这会触发webview的真正销毁
  const allTabsIdx = allCreatedTabs.findIndex(t => t.id === id);
  if (allTabsIdx >= 0) {
    allCreatedTabs.splice(allTabsIdx, 1);
  }
  
  // 如果关闭的是该partition的活跃tab，需要更新记录
  if (partitionActiveTabMap[tabToClose.partition] === id) {
    // 尝试找到同一个partition的其他tab
    const samePartitionTab = tabs.find(tab => tab.partition === tabToClose.partition);
    if (samePartitionTab) {
      partitionActiveTabMap[tabToClose.partition] = samePartitionTab.id;
    } else {
      // 如果没有同partition的tab了，删除记录
      delete partitionActiveTabMap[tabToClose.partition];
    }
  }
  
  console.log(`清理tab ${id} 的相关数据，更新后的partition记录:`, partitionActiveTabMap);
  
  if (activeTabId.value === id) {
    // 尝试找到同一个partition的其他tab
    const samePartitionTab = tabs.find(tab => tab.partition === tabToClose.partition);
    if (samePartitionTab) {
      activeTabId.value = samePartitionTab.id;
      currentUrl.value = samePartitionTab.url;
    } else {
      // 如果没有同partition的tab，选择最近的tab
      const next = tabs[idx] || tabs[idx - 1];
      activeTabId.value = next?.id ?? 0;
      currentUrl.value = next?.url ?? "";
    }
  }
  nextTick(() => updateTabStyle());
}

// 标签页拖拽开始
function onTabDragStart(event: DragEvent, tab: Tab, index: number) {
  console.log('开始拖拽标签页:', tab.title, '索引:', index);
  
  dragState.value.isDragging = true;
  dragState.value.draggedTab = tab;
  dragState.value.dragStartIndex = index;
  dragState.value.startX = event.clientX;
  dragState.value.startY = event.clientY;
  dragState.value.dragElement = event.target as HTMLElement;
  dragState.value.isDetached = false;
  
  // 添加全局拖拽类来强制覆盖光标
  document.body.classList.add('dragging-active');
  
  // 设置拖拽数据和效果
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copyMove'; // 允许复制和移动
    event.dataTransfer.dropEffect = 'move'; // 设置为移动效果
    event.dataTransfer.setData('text/plain', JSON.stringify({
      type: 'webview-tab',
      tab: tab,
      index: index
    }));
    
    // 创建自定义拖拽图像
    const dragElement = event.target as HTMLElement;
    const clone = dragElement.cloneNode(true) as HTMLElement;
    clone.style.transform = 'rotate(5deg)';
    clone.style.opacity = '0.8';
    clone.style.backgroundColor = '#ffffff';
    clone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
    clone.style.zIndex = '9999';
    clone.style.pointerEvents = 'none';
    
    // 将克隆元素添加到body（临时）
    clone.style.position = 'fixed';
    clone.style.top = '-1000px';
    clone.style.left = '-1000px';
    document.body.appendChild(clone);
    dragState.value.cloneElement = clone;
    
    // 设置拖拽图像
    event.dataTransfer.setDragImage(clone, 60, 16);
    
    // 延迟删除克隆元素
    setTimeout(() => {
      if (clone.parentNode) {
        clone.parentNode.removeChild(clone);
      }
    }, 100);
  }
}

// 标签页拖拽经过
function onTabDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  
  if (event.dataTransfer) {
    // 检查是否拖拽到了容器外部
    const containerRect = (event.currentTarget as HTMLElement).closest('.flex')?.getBoundingClientRect();
    if (containerRect) {
      const isOutside = event.clientY < containerRect.top - 50 || 
                       event.clientY > containerRect.bottom + 50 ||
                       event.clientX < containerRect.left - 50 ||
                       event.clientX > containerRect.right + 50;
      
      if (isOutside && !dragState.value.isDetached) {
        dragState.value.isDetached = true;
        dragState.value.dragOverIndex = -1;
        event.dataTransfer.dropEffect = 'copy'; // 外部区域显示复制图标
        console.log('检测到拖拽到外部区域，准备分离窗口');
      } else if (!isOutside && dragState.value.isDetached) {
        dragState.value.isDetached = false;
        event.dataTransfer.dropEffect = 'move'; // 内部区域显示移动图标
      }
    }
    
    if (!dragState.value.isDetached) {
      dragState.value.dragOverIndex = index;
      event.dataTransfer.dropEffect = 'move';
    }
  }
}

// 标签页拖拽进入
function onTabDragEnter(event: DragEvent, index: number) {
  event.preventDefault();
  if (!dragState.value.isDetached) {
    dragState.value.dragOverIndex = index;
  }
}

// 标签页拖拽离开
function onTabDragLeave(event: DragEvent) {
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    dragState.value.dragOverIndex = -1;
  }
}

// 标签页放置
function onTabDrop(event: DragEvent, index: number) {
  event.preventDefault();
  
  if (!dragState.value.isDragging || !dragState.value.draggedTab) {
    return;
  }
  
  console.log('放置标签页，目标索引:', index, '原始索引:', dragState.value.dragStartIndex);
  
  // 如果是在外部区域放置，分离为新窗口
  if (dragState.value.isDetached) {
    console.log('在外部区域放置，分离为新窗口');
    detachTabToNewWindow(dragState.value.draggedTab);
  } else if (index !== dragState.value.dragStartIndex) {
    // 重新排序标签页
    reorderTabs(dragState.value.dragStartIndex, index);
  }
  
  // 重置拖拽状态
  resetTabDragState();
}

// 标签页拖拽结束
function onTabDragEnd(event: DragEvent) {
  console.log('标签页拖拽结束');
  
  // 如果拖拽到了外部并且没有被处理，也触发分离
  if (dragState.value.isDetached && dragState.value.draggedTab) {
    console.log('拖拽结束时检测到外部放置，分离为新窗口');
    detachTabToNewWindow(dragState.value.draggedTab);
  }
  
  resetTabDragState();
}

// 重新排序标签页 - 使用排序索引而不是修改数组
function reorderTabs(fromIndex: number, toIndex: number) {
  const currentTabs = currentPartitionTabs.value;
  if (fromIndex < 0 || fromIndex >= currentTabs.length || toIndex < 0 || toIndex >= currentTabs.length) {
    return;
  }
  
  console.log('重新排序标签页，从索引', fromIndex, '到索引', toIndex);
  
  // 获取要移动的tab和目标位置的tab
  const draggedTab = currentTabs[fromIndex];
  const targetTab = currentTabs[toIndex];
  
  // 重新计算排序索引
  const allOrderValues = currentTabs.map(tab => tabOrderMap[tab.id] || 0).sort((a, b) => a - b);
  
  // 为每个tab重新分配排序索引
  currentTabs.forEach((tab, index) => {
    if (tab.id === draggedTab.id) {
      // 被拖拽的tab使用目标位置的索引
      tabOrderMap[tab.id] = allOrderValues[toIndex];
    } else if (index < Math.min(fromIndex, toIndex) || index > Math.max(fromIndex, toIndex)) {
      // 不在移动范围内的tab保持原有索引
      tabOrderMap[tab.id] = allOrderValues[index < fromIndex ? index : index];
    } else {
      // 在移动范围内的其他tab需要调整索引
      if (fromIndex < toIndex) {
        // 向后移动，其他tab向前移
        tabOrderMap[tab.id] = allOrderValues[index - 1];
      } else {
        // 向前移动，其他tab向后移
        tabOrderMap[tab.id] = allOrderValues[index + 1];
      }
    }
  });
  
  console.log('标签页重新排序完成，新的排序索引:', tabOrderMap);
  nextTick(() => updateTabStyle());
}

// 分离标签页为新窗口
async function detachTabToNewWindow(tab: Tab) {
  console.log('分离标签页为新窗口:', tab);
  
  try {
    // 使用Electron API创建分离的WebView窗口
    if ((window as any).electronAPI && (window as any).electronAPI.createDetachedWebviewWindow) {
      const result = await (window as any).electronAPI.createDetachedWebviewWindow({
        url: tab.url,
        title: tab.title,
        partition: tab.partition,
        width: 1000,
        height: 700,
        tabId: tab.id.toString()
      });
      
      if (result.success) {
        console.log('✅ 分离窗口创建成功:', result.windowId);
        
        // 关闭原标签页
        closeTab(tab.id);
        
        // 设置恢复标签页的监听器
        if (!(window as any).detachedTabRestoreListener) {
          (window as any).detachedTabRestoreListener = (data: any) => {
            console.log('🔄 恢复分离的标签页:', data);
            restoreDetachedTab(data);
          };
          (window as any).electronAPI.onRestoreDetachedTab((window as any).detachedTabRestoreListener);
        }
        
      } else {
        console.error('❌ 创建分离窗口失败:', result.error);
        // 降级方案：使用传统window.open
        window.open(tab.url, '_blank', 'width=1000,height=700');
        closeTab(tab.id);
      }
    } else {
      console.warn('⚠️ Electron API不可用，使用降级方案');
      // 作为备选方案，使用window.open（虽然功能有限）
      window.open(tab.url, '_blank', 'width=1000,height=700');
      closeTab(tab.id);
    }
  } catch (error) {
    console.error('❌ 分离标签页过程中发生错误:', error);
    // 错误降级
    window.open(tab.url, '_blank', 'width=1000,height=700');
    closeTab(tab.id);
  }
}

// 恢复分离的标签页
function restoreDetachedTab(data: {
  windowId: string;
  tabId: string;
  webviewInfo: {
    url: string;
    title: string;
    canGoBack: boolean;
    canGoForward: boolean;
  };
}) {
  console.log('🔄 恢复分离的标签页到主窗口:', data);
  
  try {
    // 创建新的标签页
    const newTab = {
      id: Date.now(),
      url: data.webviewInfo.url,
      title: data.webviewInfo.title || '恢复的标签页',
      partition: props.partition
    };
    
    // 添加到当前partition的标签页列表
    tabs.push(newTab);
    // 同时添加到allCreatedTabs
    if (!allCreatedTabs.find(t => t.id === newTab.id)) {
      allCreatedTabs.push(newTab);
    }
    
    // 为恢复的tab设置排序索引
    tabOrderMap[newTab.id] = Date.now();
    
    // 激活新创建的标签页
    activeTabId.value = newTab.id;
    currentUrl.value = newTab.url;
    
    // 记录该partition的活跃tab
    partitionActiveTabMap[props.partition] = newTab.id;
    
    console.log('✅ 标签页恢复成功:', newTab);
    
    // 等待DOM更新后更新样式
    nextTick(() => {
      updateTabStyle();
    });
    
  } catch (error) {
    console.error('❌ 恢复标签页失败:', error);
  }
}

// 重置标签页拖拽状态
function resetTabDragState() {
  dragState.value.isDragging = false;
  dragState.value.draggedTab = null;
  dragState.value.dragOverIndex = -1;
  dragState.value.dragStartIndex = -1;
  dragState.value.isDetached = false;
  dragState.value.dragElement = null;
  if (dragState.value.cloneElement) {
    dragState.value.cloneElement.remove();
    dragState.value.cloneElement = null;
  }
  
  // 移除全局拖拽类
  document.body.classList.remove('dragging-active', 'dragging-detached');
}

function activateTab(id: number) {
  console.log('激活标签页:', id);
  console.log('当前激活标签页:', activeTabId.value);
  
  // 只有在切换到不同tab时才更新
  if (activeTabId.value !== id) {
    const tab = tabs.find((t) => t.id === id);
    if (tab) {
      console.log('切换到标签页:', tab);
      
      // 记录该partition的活跃tab
      partitionActiveTabMap[tab.partition] = id;
      console.log('更新partition活跃tab记录:', partitionActiveTabMap);
      
      // 立即更新状态
      activeTabId.value = id;
      currentUrl.value = tab.url;
      
      // 使用nextTick确保DOM更新后设置焦点
      nextTick(() => {
        const webview = document.getElementById(`webview-${id}`) as Electron.WebviewTag;
        if (webview) {
          console.log('webview已找到，检查就绪状态');
          // 检查webview是否已经就绪
          if (readyMap[id]) {
            try {
              console.log('webview已就绪，设置焦点');
              webview.focus();
            } catch (error) {
              console.warn('设置webview焦点失败:', error);
            }
          } else {
            console.log('webview未就绪，等待就绪后设置焦点');
            // 等待webview就绪，最多等待3秒
            let retryCount = 0;
            const maxRetries = 30; // 30次 * 100ms = 3秒
            const checkReady = () => {
              if (readyMap[id]) {
                try {
                  console.log('webview已就绪（延迟检查），设置焦点');
                  webview.focus();
                } catch (error) {
                  console.warn('延迟设置webview焦点失败:', error);
                }
              } else if (retryCount < maxRetries) {
                retryCount++;
                setTimeout(checkReady, 100);
              } else {
                console.warn('webview等待就绪超时，放弃设置焦点');
              }
            };
            setTimeout(checkReady, 100);
          }
        } else {
          console.log('webview未找到:', `webview-${id}`);
        }
      });
    } else {
      console.log('未找到tab:', id);
    }
  } else {
    console.log('已经是当前激活的标签页，无需切换');
  }
}

function goBack() {
  const webview = getWebview();
  if (canGoBack.value && webview && readyMap[activeTabId.value]) {
    try {
      webview.goBack();
    } catch (error) {
      console.warn('goBack调用失败:', error);
    }
  }
}

function goForward() {
  const webview = getWebview();
  if (canGoForward.value && webview && readyMap[activeTabId.value]) {
    try {
      webview.goForward();
    } catch (error) {
      console.warn('goForward调用失败:', error);
    }
  }
}

function reload() {
  const webview = getWebview();
  if (webview && readyMap[activeTabId.value]) {
    try {
      webview.reload();
    } catch (error) {
      console.warn('reload调用失败:', error);
    }
  }
}
function navigateToUrl() {
  if (!readyMap[activeTabId.value]) {
    console.warn("WebView 尚未就绪");
    return;
  }
  
  let url = currentUrl.value.trim();
  if (!url) return;
  
  // 保存原始URL
  const originalUrl = url;
  
  // 过滤掉不安全的协议
  const dangerousProtocols = ['bytedance:', 'javascript:', 'data:', 'vbscript:', 'chrome:', 'chrome-extension:', 'moz-extension:'];
  const hasUnsafeProtocol = dangerousProtocols.some(protocol => url.toLowerCase().startsWith(protocol));
  
  if (hasUnsafeProtocol) {
    console.warn('阻止加载不安全的协议:', url);
    // 重置为安全的URL或搜索
    currentUrl.value = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    url = currentUrl.value;
  }
  
  // URL格式化处理
  if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('file://')) {
    // 如果是域名或IP，添加https://前缀
    if (url.includes('.') || url.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(url)) {
      url = 'https://' + url;
    } else {
      // 如果看起来像搜索词，使用搜索引擎
      url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
  }
  
  const webview = getWebview();
  if (!webview) {
    console.warn("WebView 元素未找到");
    return;
  }
  
  // 更新当前tab的URL和原始URL
  const currentTab = tabs.find(t => t.id === activeTabId.value);
  if (currentTab) {
    currentTab.url = url;
    // 只有在协议被过滤或URL被格式化时才保存原始URL
    if (hasUnsafeProtocol || originalUrl !== url) {
      currentTab.originalUrl = originalUrl;
    }
    console.log('更新tab URL:', url, '原始URL:', originalUrl);
  }
  
  // 更新输入框显示的URL
  currentUrl.value = url;
  
  // 导航到新URL
  try {
    webview.loadURL(url);
    console.log('导航到URL:', url);
  } catch (error) {
    console.warn('loadURL调用失败:', error);
  }
}

function onDomReady(id: number) {
  console.log('WebView DOM 就绪:', id);
  readyMap[id] = true;
  
  // 获取对应的tab信息
  const tab = tabs.find(t => t.id === id);
  if (!tab) {
    console.log('未找到对应的tab:', id);
    return;
  }
  
  console.log('WebView就绪，tab信息:', tab);

  // 不注入任何脚本，保持简单
  console.log('WebView DOM 就绪，tab ID:', id);

  // 如果有脚本需要执行，则执行脚本
  if (props.script && props.script.code) {
    console.log('执行脚本:', props.script.name);
    executeScript(id);
  }
}

// 预设脚本配置接口
interface PresetScript {
  id: string;
  name: string;
  description: string;
  encryptedCode: string;
}

// 获取预设脚本列表
async function getPresetScripts(): Promise<PresetScript[]> {
  try {
    const scripts: PresetScript[] = [];
    
    // 巨量千川脚本（默认导出就是 presetScript 对象）
    if (juliangqianchuanScript && juliangqianchuanScript.id) {
      scripts.push(juliangqianchuanScript);
    } else if (juliangqianchuanScript && juliangqianchuanScript.presetScript) {
      scripts.push(juliangqianchuanScript.presetScript);
    }
    
    // 抖音脚本（默认导出就是 presetScript 对象）
    if (douyinScript && douyinScript.id) {
      scripts.push(douyinScript);
    } else if (douyinScript && douyinScript.presetScript) {
      scripts.push(douyinScript.presetScript);
    }

    return scripts;
  } catch (error) {
    console.error("❌ 获取预设脚本失败:", error);
    return [];
  }
}

// 执行脚本函数
async function executeScript(tabId: number) {
  try {
    const webview = document.getElementById(`webview-${tabId}`) as Electron.WebviewTag;
    if (!webview) {
      console.error('未找到 webview 元素');
      return;
    }
    
    if (!props.script) {
      console.log('没有关联的脚本');
      return;
    }
    
    let processedCode = '';
    
    // 检查是否有预设脚本ID
    if (props.script.preset_script_id) {
      console.log('检测到预设脚本ID:', props.script.preset_script_id);
      
      try {
        // 首先获取预设脚本的加密内容
        const presetScripts = await getPresetScripts();
        const presetScript = presetScripts.find(p => p.id === props.script.preset_script_id);
        
        if (!presetScript) {
          console.error('未找到对应的预设脚本:', props.script.preset_script_id);
          return;
        }
        
        console.log('找到预设脚本，开始解密...');
        
        // 使用主进程的解密功能
        try {
          const decryptResult = await (window as any).cryptoAPI.decryptScript(presetScript.encryptedCode);
          if (decryptResult.success && decryptResult.decrypted) {
            processedCode = decryptResult.decrypted;
            console.log('✅ 预设脚本解密成功');
          } else {
            console.error('❌ 预设脚本解密失败:', decryptResult.error);
            return;
          }
        } catch (decryptError) {
          console.error('❌ 调用解密服务失败:', decryptError);
          // 回退到简单的base64解码
          try {
            processedCode = atob(presetScript.encryptedCode);
            console.log('✅ 使用base64解码成功（回退方案）');
          } catch (base64Error) {
            console.error('❌ base64解码也失败:', base64Error);
            return;
          }
        }
      } catch (error) {
        console.error('解密预设脚本时发生错误:', error);
        return;
      }
    } else {
      // 使用普通脚本内容
      console.log('使用普通脚本内容');
      processedCode = props.script.code;
    }
    
    // 替换账户信息占位符
    if (props.account && processedCode) {
      processedCode = processedCode.replace(/{username}/g, props.account.username);
      processedCode = processedCode.replace(/{password}/g, props.account.password);
      console.log('已替换账户信息占位符');
    }
    
    // 执行脚本
    console.log('即将执行的脚本代码:', processedCode);
    webview.executeJavaScript(processedCode)
      .then(() => {
        console.log(`脚本 "${props.script.name}" 执行成功`);
      })
      .catch((error) => {
        console.error(`脚本 "${props.script.name}" 执行失败:`, error);
      });
      
  } catch (error) {
    console.error('执行脚本时发生错误:', error);
  }
}

function onDidNavigate(id: number, e: any) {
  // 更新对应tab的URL
  const tab = tabs.find(t => t.id === id);
  if (tab) {
    tab.url = e.url;
  }
  
  // 同时更新allCreatedTabs中的URL
  const allTab = allCreatedTabs.find(t => t.id === id);
  if (allTab) {
    allTab.url = e.url;
  }
  
  if (activeTabId.value === id) {
    currentUrl.value = e.url;
    // 检查新URL的收藏状态
    checkCurrentPageBookmarked();
  }
}

function onTitleUpdate(id: number, e: any) {
  const tab = tabs.find((t) => t.id === id);
  if (tab) tab.title = e.title;
  
  // 同时更新allCreatedTabs中的title
  const allTab = allCreatedTabs.find((t) => t.id === id);
  if (allTab) allTab.title = e.title;
}

function onDidFailLoad(id: number, e: any) {
  // 忽略常见的中止错误（用户取消加载）
  if (e.errorCode === -3) return;
  
  // 忽略网络变化引起的错误
  if (e.errorCode === -21) {
    console.log(`标签 ${id} 网络变化，忽略错误`);
    return;
  }
  
  // 忽略GUEST_VIEW相关的错误，这些通常是内部错误
  if (e.errorDescription && e.errorDescription.includes('GUEST_VIEW')) {
    console.log(`标签 ${id} GUEST_VIEW内部错误，忽略`);
    return;
  }
  
  console.error(
    `标签 ${id} 加载失败：`,
    e.errorCode,
    e.errorDescription,
    e.validatedURL
  );
}

function onNewWindow(tabId: number, event: any) {
  console.log('新窗口事件:', event.url);
  event.preventDefault();
  
  // 在当前webview中打开链接，而不是创建新标签页
  const webview = document.getElementById(`webview-${tabId}`) as Electron.WebviewTag;
  if (webview && readyMap[tabId]) {
    console.log('在当前webview中打开链接:', event.url);
    webview.loadURL(event.url);
  } else {
    console.warn('WebView未就绪，无法在当前页面打开链接，回退到创建新标签页');
    // 回退方案：如果webview未就绪，仍然创建新标签页
    addTab(event.url, props.partition);
  }
}

function clearCache() {
  const wv = getWebview();
  if (!wv || !readyMap[activeTabId.value]) {
    console.warn("WebView 尚未就绪，无法清除缓存");
    return;
  }
  
  try {
    // 使用类型断言来访问webviewAPI
    (window as any).webviewAPI?.clearCache(wv.getWebContentsId());
  } catch (error) {
    console.warn('clearCache调用失败:', error);
  }
}

// 关闭指定partition的所有tabs并删除存储文件夹和cookies
async function closePartitionTabs(partition: string) {
  console.log(`开始关闭partition "${partition}" 的所有tabs并删除存储文件夹和cookies`);
  
  // 过滤出属于该partition的tabs
  const partitionTabs = tabs.filter(tab => tab.partition === partition);
  
  // 关闭所有属于该partition的tabs
  partitionTabs.forEach(tab => {
    const index = tabs.findIndex(t => t.id === tab.id);
    if (index > -1) {
      tabs.splice(index, 1);
      delete readyMap[tab.id];
      delete tabOrderMap[tab.id]; // 清理排序索引
    }
    // 同时从allCreatedTabs中移除
    const allTabsIdx = allCreatedTabs.findIndex(t => t.id === tab.id);
    if (allTabsIdx >= 0) {
      allCreatedTabs.splice(allTabsIdx, 1);
    }
  });
  
  // 删除partition存储文件夹和清除所有session数据（包括cookies）
  try {
    const success = await (window as any).webviewAPI?.deletePartitionStorage(`persist:${partition}`);
    if (success) {
      console.log(`✅ 已删除partition "${partition}" 的存储文件夹和所有cookies`);
    } else {
      console.warn(`⚠️ 删除partition "${partition}" 存储数据失败或文件夹不存在`);
    }
  } catch (error) {
    console.error(`❌ 删除partition "${partition}" 存储数据时出错:`, error);
  }
  
  // 重置activeTabId
  if (partitionTabs.some(tab => tab.id === activeTabId.value)) {
    // 如果当前激活的tab被关闭了，选择一个新的tab
    if (tabs.length > 0) {
      const nextTab = tabs[0];
      activeTabId.value = nextTab.id;
      currentUrl.value = nextTab.url;
    } else {
      activeTabId.value = 0;
      currentUrl.value = "";
    }
  }
}

// 清空指定partition的缓存
function clearPartitionCache(partition: string) {
  console.log(`开始清空partition "${partition}" 的缓存`);
  
  // 过滤出属于该partition的tabs
  const partitionTabs = tabs.filter(tab => tab.partition === partition);
  
  let clearedCount = 0;
  let errorCount = 0;
  
  // 清空所有属于该partition的tabs的缓存
  partitionTabs.forEach(tab => {
    if (readyMap[tab.id]) {
      const webview = document.getElementById(`webview-${tab.id}`) as Electron.WebviewTag;
      if (webview) {
        try {
          console.log(`清空tab ${tab.id} 的缓存`);
          (window as any).webviewAPI?.clearCache(webview.getWebContentsId());
          clearedCount++;
        } catch (error) {
          console.warn(`清空tab ${tab.id} 缓存失败:`, error);
          errorCount++;
        }
      }
    }
  });
  
  console.log(`清空partition "${partition}" 缓存完成: 成功 ${clearedCount} 个, 失败 ${errorCount} 个`);
  
  if (clearedCount > 0) {
    console.log(`已清空 ${clearedCount} 个浏览器实例的缓存`);
    return true;
  } else {
    console.warn(`没有找到可清空缓存的浏览器实例`);
    return false;
  }
}

// 右键菜单处理函数
function showContextMenu(event: MouseEvent, tabId: number) {
  event.preventDefault();
  contextMenu.visible = true;
  contextMenu.x = event.clientX;
  contextMenu.y = event.clientY;
  contextMenu.targetTabId = tabId;
  
  // 点击其他地方关闭菜单
  document.addEventListener('click', hideContextMenu, { once: true });
}

function hideContextMenu() {
  contextMenu.visible = false;
}

function closeTabFromMenu() {
  if (contextMenu.targetTabId) {
    closeTab(contextMenu.targetTabId);
  }
  hideContextMenu();
}

function closeOtherTabs() {
  if (contextMenu.targetTabId) {
    const targetTab = tabs.find(tab => tab.id === contextMenu.targetTabId);
    if (targetTab) {
      // 保留当前右键的tab，关闭同一partition的其他tab
      const tabsToClose = tabs.filter(tab => 
        tab.partition === targetTab.partition && tab.id !== contextMenu.targetTabId
      );
      
      tabsToClose.forEach(tab => {
        const index = tabs.findIndex(t => t.id === tab.id);
        if (index > -1) {
          tabs.splice(index, 1);
          delete readyMap[tab.id];
          delete tabOrderMap[tab.id]; // 清理排序索引
        }
        // 同时从allCreatedTabs中移除
        const allTabsIdx = allCreatedTabs.findIndex(t => t.id === tab.id);
        if (allTabsIdx >= 0) {
          allCreatedTabs.splice(allTabsIdx, 1);
        }
      });
      
      // 激活右键的tab
      activateTab(contextMenu.targetTabId);
    }
  }
  hideContextMenu();
}

function duplicateTab() {
  if (contextMenu.targetTabId) {
    const targetTab = tabs.find(tab => tab.id === contextMenu.targetTabId);
    if (targetTab) {
      addTab(targetTab.url, targetTab.partition);
    }
  }
  hideContextMenu();
}

// 暴露方法给父组件
defineExpose({
  closePartitionTabs,
  clearPartitionCache,
  closeTab, // 添加closeTab方法
  // 额外暴露一些调试方法
  getTabs: () => tabs,
  getActiveTabId: () => activeTabId.value,
  getCurrentUrl: () => currentUrl.value
});

// ⬅︎ tab width logic
const tabStyle = ref<Record<string, string>>({});

function updateTabStyle() {
  const currentTabs = currentPartitionTabs.value;
  if (currentTabs.length === 0) {
    tabStyle.value = {};
    return;
  }
  
  const containerWidth = tabContainerRef.value?.offsetWidth ?? 0;
  const estimatedTabWidth = 120;
  const totalWidth = currentTabs.length * estimatedTabWidth;
  if (totalWidth > containerWidth && currentTabs.length > 0) {
    const basis = Math.floor(containerWidth / currentTabs.length);
    tabStyle.value = {
      flexBasis: `${basis}px`,
      flexGrow: "0",
      flexShrink: "0",
    };
  } else {
    tabStyle.value = {};
  }
}

watch(
  () => currentPartitionTabs.value.length,
  () => {
    nextTick(() => updateTabStyle());
  }
);
</script>

<template>
  <div class="flex flex-col h-full w-full bg-gray-50 overflow-hidden">
    <!-- 标签栏 -->
    <div
      v-if="currentPartitionTabs.length > 0"
      ref="tabContainerRef"
      class="flex items-stretch bg-gray-200 px-1 overflow-hidden border-b border-gray-300 h-9 relative"
    >
      <div
        v-for="(tab, index) in currentPartitionTabs"
        :key="tab.id"
        :class="[
          'relative group flex items-center cursor-pointer transition-all duration-200 select-none text-sm font-medium',
          'before:absolute before:inset-0 before:border-l before:border-gray-300 first:before:border-l-0',
          activeTabId === tab.id 
            ? 'bg-white text-gray-800 z-10 shadow-sm before:border-transparent' 
            : 'bg-gray-200 text-gray-700 hover:bg-gray-100 before:border-gray-300',
          // 拖拽状态样式
          {
            'opacity-50': dragState.isDragging && dragState.draggedTab?.id === tab.id,
            'border-l-2 border-l-blue-400': dragState.dragOverIndex === index && !dragState.isDetached,
            'border-l-2 border-l-red-400': dragState.isDetached && dragState.draggedTab?.id === tab.id,
            'transform scale-95': dragState.isDragging && dragState.draggedTab?.id === tab.id,
          }
        ]"
        :style="{ 
          ...tabStyle, 
          minWidth: '120px', 
          maxWidth: '220px',
          clipPath: activeTabId === tab.id 
            ? 'polygon(12px 0%, calc(100% - 12px) 0%, 100% 100%, 0% 100%)' 
            : 'polygon(8px 0%, calc(100% - 8px) 0%, 100% 100%, 0% 100%)',
          marginLeft: activeTabId === tab.id ? '4px' : '0px',
          marginRight: activeTabId === tab.id ? '4px' : '0px',
          transform: dragState.isDragging && dragState.draggedTab?.id === tab.id ? 'scale(0.95)' : 'scale(1)'
        }"
        draggable="true"
        @dragstart="onTabDragStart($event, tab, index)"
        @dragover="onTabDragOver($event, index)"
        @dragenter="onTabDragEnter($event, index)"
        @dragleave="onTabDragLeave($event)"
        @drop="onTabDrop($event, index)"
        @dragend="onTabDragEnd($event)"
        @click="activateTab(tab.id)"
        @contextmenu="showContextMenu($event, tab.id)"
        :title="`${tab.title} - 右键查看选项 | 拖拽可重新排序或分离窗口`"
      >
        <!-- 激活状态的蓝色指示条 -->
        <div
          v-if="activeTabId === tab.id"
          class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-400 rounded-t-sm z-20"
        ></div>
        
        <!-- 标签页内容 -->
        <div class="flex items-center w-full px-3 h-8 overflow-hidden relative z-10">
          <!-- 网站图标占位符 -->
          <div class="w-4 h-4 mr-2 rounded-sm bg-gray-400 flex-shrink-0 flex items-center justify-center">
            <div class="w-2 h-2 bg-white rounded-sm"></div>
          </div>
          <!-- 标签页标题 -->
          <span class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis">{{ tab.title }}</span>
          <!-- 关闭按钮 -->
          <button
            class="ml-2 w-4 h-4 rounded-full flex items-center justify-center border-0 outline-none opacity-0 group-hover:opacity-100 hover:bg-gray-400 hover:text-white transition-all duration-150 flex-shrink-0 focus:outline-none focus:opacity-100"
            @click.stop="closeTab(tab.id)"
            title="关闭"
          >
            <span class="text-xs leading-none">×</span>
          </button>
        </div>
        
        <!-- 激活状态的顶部圆角 -->
        <div
          v-if="activeTabId === tab.id"
          class="absolute top-0 left-3 w-3 h-3 bg-white"
          style="border-radius: 0 0 8px 0; box-shadow: 8px 0 0 0 #ffffff;"
        ></div>
        <div
          v-if="activeTabId === tab.id"
          class="absolute top-0 right-3 w-3 h-3 bg-white"
          style="border-radius: 0 0 0 8px; box-shadow: -8px 0 0 0 #ffffff;"
        ></div>
      </div>
      
      <!-- 新建标签页按钮 -->
      <div class="flex items-center justify-center w-10 h-9 cursor-pointer text-gray-600 hover:bg-gray-100 transition-all duration-200 rounded-t-lg" @click="addTab()">
        <PlusOutlined class="text-sm" />
      </div>
    </div>

    <!-- 无标签页时的标签栏 -->
    <div v-else class="flex items-center justify-between bg-gray-200 px-3 h-9 border-b border-gray-300">
      <div class="text-gray-600 text-sm">当前域名下没有打开的标签页</div>
      <div class="flex items-center justify-center w-8 h-8 rounded-md cursor-pointer text-gray-600 hover:bg-gray-100 transition-all duration-200" @click="addTab()">
        <PlusOutlined class="text-sm" />
      </div>
    </div>

    <!-- 导航操作栏 - 类似Chrome的样式 -->
    <div class="flex items-center bg-white px-3 py-2 gap-3 border-b border-gray-200 shadow-sm">
      <!-- 导航按钮组 -->
      <div class="flex items-center gap-1">
        <button 
          class="flex items-center justify-center w-8 h-8 rounded-full bg-transparent border-0 outline-none cursor-pointer text-gray-600 transition-all duration-200 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50" 
          :disabled="!canGoBack"
          @click="goBack"
          title="后退"
        >
          <LeftOutlined class="text-base" />
        </button>
        <button 
          class="flex items-center justify-center w-8 h-8 rounded-full bg-transparent border-0 outline-none cursor-pointer text-gray-600 transition-all duration-200 hover:bg-gray-100 disabled:text-gray-300 disabled:cursor-not-allowed disabled:hover:bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50" 
          :disabled="!canGoForward"
          @click="goForward"
          title="前进"
        >
          <RightOutlined class="text-base" />
        </button>
        <button 
          class="flex items-center justify-center w-8 h-8 rounded-full bg-transparent border-0 outline-none cursor-pointer text-gray-600 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50" 
          @click="reload"
          title="刷新"
        >
          <ReloadOutlined class="text-base" />
        </button>
      </div>

      <!-- 地址栏容器 - 自适应宽度 -->
      <div class="flex-1 relative">
        <div class="relative">
          <!-- 锁图标/安全指示器 -->
          <div class="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 !z-10">
            <svg v-if="currentUrl.startsWith('https://')" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="text-green-600">
              <path d="M18,8h-1V6c0-2.76-2.24-5-5-5S7,3.24,7,6v2H6c-1.1,0-2,0.9-2,2v10c0,1.1,0.9,2,2,2h12c1.1,0,2-0.9,2-2V10C20,8.9,19.1,8,18,8z M12,17c-1.1,0-2-0.9-2-2s0.9-2,2-2s2,0.9,2,2S13.1,17,12,17z M15.1,8H8.9V6c0-1.71,1.39-3.1,3.1-3.1s3.1,1.39,3.1,3.1V8z"/>
            </svg>
            <svg v-else-if="currentUrl.startsWith('http://')" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="text-orange-500">
              <path d="M12,1L3,5V11C3,16.55 6.84,21.74 12,23C17.16,21.74 21,16.55 21,11V5L12,1M12,7C13.33,7 14.67,7.33 15.93,8L12,12L8.07,8C9.33,7.33 10.67,7 12,7Z"/>
            </svg>
            <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="text-gray-400">
              <path d="M14,3V5H17.59L7.76,14.83L9.17,16.24L19,6.41V10H21V3M19,19H5V5H12V3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V12H19V19Z"/>
            </svg>
          </div>
          
          <!-- 地址栏输入框 -->
          <input
            v-model="currentUrl"
            @keyup.enter="navigateToUrl"
            @focus="(e: Event) => (e.target as HTMLInputElement)?.select()"
            class="!z-0 w-full h-10 pl-10 pr-12 text-sm text-gray-800 bg-gray-100 border border-gray-300 rounded-full transition-all duration-200 focus:outline-none focus:bg-white focus:border-blue-400 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.1)] hover:bg-gray-50"
            placeholder="搜索 Google 或输入网址"
          />
          
          <!-- 收藏按钮 - 移到输入框右侧 -->
          <div class="absolute right-2 top-1/2 transform -translate-y-1/2 !z-9999">
            <button 
              class="text-yellow-500 hover:bg-yellow-100 w-8 h-8 rounded-full flex items-center justify-center border-0 outline-none transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50 bg-white relative  !z-9999"
              title="添加收藏"
              @click="bookmarkCurrentPage"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" :fill="currentPageBookmarked ? 'currentColor' : 'none'" :stroke="currentPageBookmarked ? 'none' : 'currentColor'" stroke-width="2" class="relative  !z-9999">
                <path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- 右侧工具按钮 -->
      <div class="flex items-center gap-1">
        <button 
          class="flex items-center justify-center w-8 h-8 rounded-full bg-transparent border-0 outline-none cursor-pointer text-gray-600 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50" 
          @click="clearCache" 
          title="清除缓存"
        >
          <ClearOutlined class="text-base" />
        </button>
        
        <!-- 菜单按钮 -->
        <button class="flex items-center justify-center w-8 h-8 rounded-full bg-transparent border-0 outline-none cursor-pointer text-gray-600 transition-all duration-200 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50" title="自定义及控制">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 书签栏 -->
    <BookmarkBar 
      ref="bookmarkBarRef"
      :account="props.account"
      @bookmark-clicked="handleBookmarkNavigate"
    />

    <!-- Webview 容器 -->
    <div v-if="currentPartitionTabs.length > 0" class="flex-1 relative overflow-hidden">
      <webview
        v-for="tab in allCreatedTabs"
        v-show="tab.id === activeTabId && tab.partition === props.partition && tabs.some(t => t.id === tab.id)"
        :key="`webview-${tab.id}`"
        :id="`webview-${tab.id}`"
        :src="getStableInitialUrl(tab)"
        :partition="`persist:${tab.partition}`"
        class="w-full h-full border-0"
        allowpopups
        disablewebsecurity
        webpreferences="contextIsolation=false,nodeIntegration=false,webSecurity=false"
        useragent="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        @dom-ready="onDomReady(tab.id)"
        @did-navigate="onDidNavigate(tab.id, $event)"
        @page-title-updated="onTitleUpdate(tab.id, $event)"
        @did-fail-load="onDidFailLoad(tab.id, $event)"
        @new-window="onNewWindow(tab.id, $event)"
      />
    </div>

    <!-- 无标签页时的占位符 -->
    <div v-else class="flex-1 flex items-center justify-center bg-white">
      <div class="text-center text-gray-500">
        <div class="text-lg mb-4">当前域名下暂无打开的标签页</div>
        <button 
          class="px-6 py-3 bg-blue-500 border-0 outline-none text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-sm cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
          @click="addTab()"
        >
          新建标签页
        </button>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      class="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-[140px] backdrop-blur-sm"
      @click.stop
    >
      <div
        class="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-150"
        @click="closeTabFromMenu"
      >
        关闭标签页
      </div>
      <div
        class="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-150"
        @click="closeOtherTabs"
      >
        关闭其他标签页
      </div>
      <div
        class="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-150"
        @click="duplicateTab"
      >
        复制标签页
      </div>
    </div>

    <!-- 书签添加/编辑模态框 -->
    <a-modal
      v-model:visible="showBookmarkModal"
      title="添加书签"
      ok-text="保存"
      cancel-text="取消"
      @ok="saveBookmark"
      @cancel="cancelBookmarkModal"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">名称</label>
          <input
            v-model="bookmarkForm.name"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入书签名称"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">网址</label>
          <input
            v-model="bookmarkForm.url"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="请输入网址"
          />
        </div>
      </div>
    </a-modal>
  </div>
</template>