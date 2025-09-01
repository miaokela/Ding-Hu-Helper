<script setup lang="ts">
import { ref, watch, nextTick, computed, onMounted, onUnmounted } from "vue";
import { HomeOutlined, ReloadOutlined } from "@ant-design/icons-vue";

const props = defineProps<{
  currentDomain?: { url: string; partition: string; name?: string };
  openDomains: Array<{
    url: string;
    partition: string;
    name: string;
    account_id?: number;
    script_id?: number;
  }>;
}>();

// 拖拽相关状态
const dragState = ref({
  isDragging: false,
  draggedDomain: null as any,
  dragOverIndex: -1,
  dragStartIndex: -1,
  startX: 0,
  startY: 0,
  dragElement: null as HTMLElement | null,
  isDetached: false, // 标记是否已经脱离容器
  cloneElement: null as HTMLElement | null
});

// 20种浏览器图标颜色配置
const browserColors = [
  { bg: 'bg-blue-500', text: 'text-white' },
  { bg: 'bg-green-500', text: 'text-white' },
  { bg: 'bg-red-500', text: 'text-white' },
  { bg: 'bg-purple-500', text: 'text-white' },
  { bg: 'bg-orange-500', text: 'text-white' },
  { bg: 'bg-yellow-500', text: 'text-black' },
  { bg: 'bg-pink-500', text: 'text-white' },
  { bg: 'bg-indigo-500', text: 'text-white' },
  { bg: 'bg-teal-500', text: 'text-white' },
  { bg: 'bg-cyan-500', text: 'text-black' },
  { bg: 'bg-emerald-500', text: 'text-white' },
  { bg: 'bg-lime-500', text: 'text-black' },
  { bg: 'bg-amber-500', text: 'text-black' },
  { bg: 'bg-rose-500', text: 'text-white' },
  { bg: 'bg-violet-500', text: 'text-white' },
  { bg: 'bg-fuchsia-500', text: 'text-white' },
  { bg: 'bg-sky-500', text: 'text-white' },
  { bg: 'bg-slate-500', text: 'text-white' },
  { bg: 'bg-gray-500', text: 'text-white' },
  { bg: 'bg-zinc-500', text: 'text-white' }
];

// 为每个域名分配颜色的计算属性
const getDomainColor = computed(() => {
  return (index: number) => {
    return browserColors[index % browserColors.length];
  };
});

const emit = defineEmits([
  "switchDomain",
  "backToDomainManager",
  "closeDomain",
  "clearDomainCache",
  "reorderDomains",
  "detachDomain"
]);

// 拖拽开始
function onDragStart(event: DragEvent, domain: any, index: number) {
  console.log('开始拖拽域名:', domain.name, '索引:', index);
  
  dragState.value.isDragging = true;
  dragState.value.draggedDomain = domain;
  dragState.value.dragStartIndex = index;
  dragState.value.startX = event.clientX;
  dragState.value.startY = event.clientY;
  dragState.value.dragElement = event.target as HTMLElement;
  dragState.value.isDetached = false;
  
  // 添加全局拖拽类来强制覆盖光标
  document.body.classList.add('dragging-active');
  
  // 设置拖拽数据和效果
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'copyMove';
    event.dataTransfer.dropEffect = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify(domain));
    event.dataTransfer.setData('application/x-domain-tab', domain.partition);
    
    // 创建自定义拖拽图像
    const dragElement = event.target as HTMLElement;
    const clone = dragElement.cloneNode(true) as HTMLElement;
    clone.style.transform = 'rotate(5deg)';
    clone.style.opacity = '0.8';
    clone.style.backgroundColor = '#ffffff';
    clone.style.boxShadow = '0 10px 25px rgba(0,0,0,0.2)';
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

// 拖拽经过
function onDragOver(event: DragEvent, index: number) {
  event.preventDefault();
  
  if (event.dataTransfer) {
    // 检查是否拖拽到了容器外部
    const containerRect = (event.currentTarget as HTMLElement).parentElement?.getBoundingClientRect();
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

// 拖拽进入
function onDragEnter(event: DragEvent, index: number) {
  event.preventDefault();
  if (!dragState.value.isDetached) {
    dragState.value.dragOverIndex = index;
  }
}

// 拖拽离开
function onDragLeave(event: DragEvent) {
  // 检查是否真的离开了元素
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    dragState.value.dragOverIndex = -1;
  }
}

// 放置
function onDrop(event: DragEvent, index: number) {
  event.preventDefault();
  
  if (!dragState.value.isDragging || !dragState.value.draggedDomain) {
    return;
  }
  
  console.log('放置域名，目标索引:', index, '原始索引:', dragState.value.dragStartIndex);
  
  // 如果是在外部区域放置，触发分离窗口
  if (dragState.value.isDetached) {
    console.log('在外部区域放置，分离为新窗口');
    emit("detachDomain", dragState.value.draggedDomain);
  } else if (index !== dragState.value.dragStartIndex) {
    // 重新排序
    emit("reorderDomains", {
      fromIndex: dragState.value.dragStartIndex,
      toIndex: index,
      domain: dragState.value.draggedDomain
    });
  }
  
  // 重置拖拽状态
  resetDragState();
}

// 拖拽结束
function onDragEnd(event: DragEvent) {
  console.log('拖拽结束');
  
  // 如果拖拽到了外部并且没有被处理，也触发分离
  if (dragState.value.isDetached && dragState.value.draggedDomain) {
    console.log('拖拽结束时检测到外部放置，分离为新窗口');
    emit("detachDomain", dragState.value.draggedDomain);
  }
  
  resetDragState();
}

// 重置拖拽状态
function resetDragState() {
  dragState.value.isDragging = false;
  dragState.value.draggedDomain = null;
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

// 组件挂载时添加全局拖拽监听
onMounted(() => {
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
            console.log('🪟 域名进入分离模式');
          }
        } else {
          e.dataTransfer.dropEffect = 'move'; // 内部显示移动图标
          document.body.classList.remove('dragging-detached');
          document.body.classList.add('dragging-active');
          if (dragState.value.isDetached) {
            dragState.value.isDetached = false;
            console.log('🔄 域名退出分离模式');
          }
        }
      }
    }
  };
  
  const handleGlobalDrop = (e: DragEvent) => {
    e.preventDefault();
    if (dragState.value.isDragging && dragState.value.draggedDomain && dragState.value.isDetached) {
      console.log('🪟 域名在外部区域放置，执行分离操作');
      emit("detachDomain", dragState.value.draggedDomain);
      resetDragState();
    }
  };
  
  // 添加全局监听器
  document.addEventListener('dragover', handleGlobalDragOver);
  document.addEventListener('drop', handleGlobalDrop);
  
  // 组件卸载时清理
  onUnmounted(() => {
    document.removeEventListener('dragover', handleGlobalDragOver);
    document.removeEventListener('drop', handleGlobalDrop);
  });
});

// 切换到指定域名
function switchToDomain(domain: (typeof props.openDomains)[0]) {
  emit("switchDomain", {
    url: domain.url,
    partition: domain.partition,
    name: domain.name,
    account_id: domain.account_id,
    script_id: domain.script_id,
  });
}

// 返回域名管理
function backToDomainManager() {
  emit("backToDomainManager");
}

// 关闭域名实例
function closeDomain(domain: (typeof props.openDomains)[0], event: Event) {
  event.stopPropagation(); // 阻止冒泡，避免触发switchToDomain
  emit("closeDomain", {
    url: domain.url,
    partition: domain.partition,
    name: domain.name,
    account_id: domain.account_id,
    script_id: domain.script_id,
  });
}

// 右键菜单处理函数
function showContextMenu(
  event: MouseEvent,
  domain: (typeof props.openDomains)[0]
) {
  event.preventDefault();
  contextMenu.value.visible = true;
  contextMenu.value.x = event.clientX;
  contextMenu.value.y = event.clientY;
  contextMenu.value.targetDomain = domain;

  // 点击其他地方关闭菜单
  document.addEventListener("click", hideContextMenu, { once: true });
}

function hideContextMenu() {
  contextMenu.value.visible = false;
}

function closeDomainFromMenu() {
  if (contextMenu.value.targetDomain) {
    emit("closeDomain", {
      url: contextMenu.value.targetDomain.url,
      partition: contextMenu.value.targetDomain.partition,
      name: contextMenu.value.targetDomain.name,
      account_id: contextMenu.value.targetDomain.account_id,
      script_id: contextMenu.value.targetDomain.script_id,
    });
  }
  hideContextMenu();
}

function closeOtherDomains() {
  if (contextMenu.value.targetDomain) {
    // 关闭除了当前选择的域名外的所有其他域名
    props.openDomains.forEach((domain) => {
      if (domain.partition !== contextMenu.value.targetDomain.partition) {
        emit("closeDomain", {
          url: domain.url,
          partition: domain.partition,
          name: domain.name,
          account_id: domain.account_id,
          script_id: domain.script_id,
        });
      }
    });
  }
  hideContextMenu();
}

function clearDomainCache() {
  if (contextMenu.value.targetDomain) {
    emit("clearDomainCache", {
      url: contextMenu.value.targetDomain.url,
      partition: contextMenu.value.targetDomain.partition,
      name: contextMenu.value.targetDomain.name,
      account_id: contextMenu.value.targetDomain.account_id,
      script_id: contextMenu.value.targetDomain.script_id,
    });
  }
  hideContextMenu();
}

// 当前选中的域名ID
const currentDomainId = ref<string | null>(null);

// 右键菜单状态
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  targetDomain: null as any,
});

// 监听当前域名变化
watch(
  () => props.currentDomain,
  async (newVal) => {
    console.log("Current domain changed:", newVal);
    console.log("Open domains:", props.openDomains);

    if (newVal && newVal.partition) {
      // 直接使用 partition 作为当前域名ID
      currentDomainId.value = newVal.partition;
      console.log("Set currentDomainId to:", currentDomainId.value);

      // 等待下一次DOM更新
      await nextTick();

      // 打印每个域名的 partition 用于调试
      props.openDomains.forEach((domain) => {
        console.log(
          `Domain: ${domain.name}, partition: ${domain.partition}, matches: ${
            domain.partition === currentDomainId.value
          }`
        );
      });
    } else {
      currentDomainId.value = null;
    }
  },
  { immediate: true }
);

// 监听打开的域名列表变化，确保当前域名ID同步
watch(
  () => props.openDomains,
  async () => {
    if (props.currentDomain && props.currentDomain.partition) {
      currentDomainId.value = props.currentDomain.partition;
      await nextTick();
      console.log(
        "Updated currentDomainId after open domains change:",
        currentDomainId.value
      );
    }
  },
  { immediate: true }
);
</script>

<template>
  <div class="w-full bg-gray-50 border-b border-gray-300 px-1 h-9 shadow-sm">
    <div class="flex items-center h-full">
      <!-- 返回按钮 -->
      <div class="flex items-center gap-2 mr-3 pr-3 border-r border-gray-300">
        <button
          class="flex items-center justify-center w-8 h-8 rounded-md bg-transparent border-0 outline-none text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
          @click="backToDomainManager"
          title="返回我的浏览器"
        >
          <HomeOutlined class="text-sm" />
        </button>
      </div>

      <!-- 域名标签页 -->
      <div
        class="flex items-center gap-0 overflow-x-auto flex-1 h-full scrollbar-thin"
      >
        <div
          v-for="(domain, index) in openDomains"
          :key="domain.partition"
          :class="[
            'relative group flex items-center h-8 cursor-pointer transition-all duration-200 select-none text-sm font-medium rounded-t-xl border-2 border-b-0',
            {
              // 激活状态 - 圆弧样式的白色标签页
              'bg-white text-gray-800 z-10 shadow-lg border-blue-300':
                domain.partition === currentDomainId,
              // 未激活状态 - 圆弧样式的灰色标签页
              'bg-gray-200 text-gray-700 hover:bg-gray-100 border-gray-400':
                domain.partition !== currentDomainId,
              // 拖拽状态样式
              'opacity-50': dragState.isDragging && dragState.draggedDomain?.partition === domain.partition,
              'border-blue-500 bg-blue-50': dragState.dragOverIndex === index && !dragState.isDetached,
              'border-red-500 bg-red-50': dragState.isDetached && dragState.draggedDomain?.partition === domain.partition
            },
          ]"
          :style="{
            minWidth: '120px',
            maxWidth: '220px',
            marginLeft: domain.partition === currentDomainId ? '2px' : '0px',
            marginRight: domain.partition === currentDomainId ? '2px' : '0px',
            transform: dragState.isDragging && dragState.draggedDomain?.partition === domain.partition ? 'scale(0.95)' : 'scale(1)'
          }"
          draggable="true"
          @dragstart="onDragStart($event, domain, index)"
          @dragover="onDragOver($event, index)"
          @dragenter="onDragEnter($event, index)"
          @dragleave="onDragLeave($event)"
          @drop="onDrop($event, index)"
          @dragend="onDragEnd($event)"
          @click="switchToDomain(domain)"
          @contextmenu="showContextMenu($event, domain)"
          :title="`${domain.name} - 右键查看选项 | 拖拽可重新排序或分离窗口`"
        >
          <!-- 激活状态的蓝色指示条 -->
          <div
            v-if="domain.partition === currentDomainId"
            class="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-12 h-0.5 bg-blue-400 rounded-t-sm z-20"
          ></div>
          
          <!-- 标签页内容 -->
          <div
            class="flex items-center w-full px-3 overflow-hidden relative z-10"
          >
            <!-- 浏览器图标 -->
            <div
              :class="[
                'w-4 h-4 mr-2 rounded-sm flex-shrink-0 flex items-center justify-center shadow-sm',
                getDomainColor(index).bg
              ]"
            >
              <svg 
                :class="getDomainColor(index).text" 
                width="10" 
                height="10" 
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
              </svg>
            </div>
            <!-- 标签页标题 -->
            <span
              class="flex-1 whitespace-nowrap overflow-hidden text-ellipsis"
              >{{ domain.name }}</span
            >
            <!-- 关闭按钮 -->
            <button
              class="ml-2 w-4 h-4 rounded-full flex items-center justify-center border-0 outline-none opacity-0 group-hover:opacity-100 hover:bg-gray-400 hover:text-white transition-all duration-150 flex-shrink-0 focus:outline-none focus:opacity-100"
              @click.stop="closeDomain(domain, $event)"
              title="关闭"
            >
              <span class="text-xs leading-none">×</span>
            </button>
          </div>

          <!-- 激活状态的顶部圆角 -->
          <div
            v-if="domain.partition === currentDomainId"
            class="absolute top-0 left-3 w-3 h-3 bg-white"
            style="border-radius: 0 0 8px 0; box-shadow: 8px 0 0 0 #ffffff"
          ></div>
          <div
            v-if="domain.partition === currentDomainId"
            class="absolute top-0 right-3 w-3 h-3 bg-white"
            style="border-radius: 0 0 0 8px; box-shadow: -8px 0 0 0 #ffffff"
          ></div>
        </div>

        <!-- 无域名时的提示 -->
        <div
          v-if="openDomains.length === 0"
          class="text-gray-500 text-sm px-4 py-2"
        >
          暂无打开的域名实例
        </div>
      </div>
    </div>

    <!-- 右键菜单 -->
    <div
      v-if="contextMenu.visible"
      :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }"
      class="fixed z-50 bg-white border border-gray-300 rounded-lg shadow-lg py-1 min-w-[140px] backdrop-blur-sm"
      @click.stop
    >
      <div class="border-t border-gray-200 my-1"></div>
      <div
        class="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-150"
        @click="closeDomainFromMenu"
      >
        关闭
      </div>
      <div
        class="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-150"
        @click="closeOtherDomains"
      >
        关闭其他
      </div>
      <div
        class="px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 cursor-pointer transition-all duration-150"
        @click="clearDomainCache"
      >
        清除缓存
      </div>
    </div>
  </div>
</template>
