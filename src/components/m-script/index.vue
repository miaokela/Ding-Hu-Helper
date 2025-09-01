<script setup lang="ts">
import { ref, reactive, onMounted, watch, nextTick } from "vue";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CopyOutlined,
  FormatPainterOutlined,
} from "@ant-design/icons-vue";
import {
  Script,
  getAllScripts,
  addScript,
  updateScript,
  deleteScript,
} from "../../utils/db";
import juliangqianchuanScript from "../../preset_scripts/juliangqianchuan.js";
import douyinScript from "../../preset_scripts/douyin.js";
import windowsInputFixer from "../../utils/windows-input-fixer";

// 预设脚本配置
interface PresetScript {
  id: string;
  name: string;
  description: string;
  encryptedCode: string; // 已加密的代码
}

const props = defineProps<{
  active: boolean;
}>();

// 脚本列表
const scripts = ref<Script[]>([]);
// 显示模态框
const isModalVisible = ref(false);
// 加载状态
const loading = ref(false);
// 当前编辑的脚本
const currentScript = ref<Script | null>(null);
// 预设脚本列表
const presetScripts = ref<PresetScript[]>([]);
// 选中的预设脚本
const selectedPresetScript = ref<PresetScript | null>(null);

// Tooltip状态
const tooltipVisible = ref(false);
const tooltipContent = ref('');
const tooltipPosition = ref({ x: 0, y: 0 });

// 表单模型
const formState = reactive({
  name: "",
  code: "",
  description: "",
  id: 0,
  isEdit: false,
  isCopy: false,
});

// 初始化预设脚本
async function initPresetScripts() {
  try {
    console.log("🔄 开始初始化预设脚本...");
    
    // 调试：检查导入的脚本对象
    console.log("📦 巨量千川脚本对象:", juliangqianchuanScript);
    console.log("📦 抖音脚本对象:", douyinScript);
    
    // 确保导入的脚本对象存在
    const scripts: PresetScript[] = [];
    
    // 巨量千川脚本（默认导出就是 presetScript 对象）
    if (juliangqianchuanScript && juliangqianchuanScript.id) {
      console.log("✅ 巨量千川脚本验证通过:", juliangqianchuanScript);
      scripts.push(juliangqianchuanScript);
    } else if (juliangqianchuanScript && juliangqianchuanScript.presetScript) {
      console.log("✅ 巨量千川脚本验证通过（通过presetScript属性）:", juliangqianchuanScript.presetScript);
      scripts.push(juliangqianchuanScript.presetScript);
    } else {
      console.warn("❌ 巨量千川脚本导入失败或格式不正确");
      console.log("- juliangqianchuanScript:", juliangqianchuanScript);
    }
    
    // 抖音脚本（默认导出就是 presetScript 对象）
    if (douyinScript && douyinScript.id) {
      console.log("✅ 抖音脚本验证通过:", douyinScript);
      scripts.push(douyinScript);
    } else if (douyinScript && douyinScript.presetScript) {
      console.log("✅ 抖音脚本验证通过（通过presetScript属性）:", douyinScript.presetScript);
      scripts.push(douyinScript.presetScript);
    } else {
      console.warn("❌ 抖音脚本导入失败或格式不正确");
      console.log("- douyinScript:", douyinScript);
    }
    
    presetScripts.value = scripts;
    
    console.log("✅ 预设脚本初始化完成:", presetScripts.value.length, "个");
    console.log("✅ 预设脚本列表:", presetScripts.value);
  } catch (error) {
    console.error("❌ 初始化预设脚本失败:", error);
    // 确保即使出错也有一个空数组
    presetScripts.value = [];
  }
}

// 页面加载和属性变化时加载脚本
onMounted(() => {
  initPresetScripts();
  loadScripts();
});

// 监听 active 属性变化，当切换到脚本管理时重新加载数据
watch(
  () => props.active,
  (newActive) => {
    if (newActive) {
      loadScripts();
    }
  }
);

// 加载所有脚本
async function loadScripts() {
  loading.value = true;
  try {
    scripts.value = await getAllScripts();
  } catch (error) {
    console.error("Failed to load scripts:", error);
  } finally {
    loading.value = false;
  }
}

// 选择预设脚本
async function selectPresetScript(preset: PresetScript) {
  try {
    // 使用主进程的解密功能
    try {
      const decryptResult = await (window as any).cryptoAPI.decryptScript(preset.encryptedCode);
      if (decryptResult.success && decryptResult.decrypted) {
        formState.code = decryptResult.decrypted;
        console.log("✅ 预设脚本解密成功");
      } else {
        console.error('❌ 预设脚本解密失败:', decryptResult.error);
        return;
      }
    } catch (decryptError) {
      console.error('❌ 调用解密服务失败:', decryptError);
      // 回退到简单的base64解码
      try {
        const decryptedScript = atob(preset.encryptedCode);
        formState.code = decryptedScript;
        console.log("✅ 使用base64解码成功（回退方案）");
      } catch (base64Error) {
        console.error('❌ base64解码也失败:', base64Error);
        return;
      }
    }
    
    selectedPresetScript.value = preset;
    
    // 🎯 自动填充预设脚本的名称和描述（直接覆盖）
    formState.name = preset.name;
    formState.description = preset.description;
    console.log("✅ 已直接覆盖预设脚本名称和描述");
    
    // 保持代码输入框可见，允许用户编辑预设脚本
    
    // 应用输入修复，确保文本域可以正常使用
    nextTick(() => {
      setTimeout(() => {
        const modal = document.querySelector('.ant-modal');
        if (modal) {
          windowsInputFixer.fixContainer(modal as HTMLElement);
          
          // 额外修复：直接针对输入框进行焦点修复
          const inputs = modal.querySelectorAll('input, textarea');
          inputs.forEach(input => {
            const element = input as HTMLElement;
            element.style.pointerEvents = 'auto';
            element.style.userSelect = 'auto';
            element.style.position = 'relative';
            element.style.zIndex = '999';
            
            // 移除可能阻止输入的属性
            element.removeAttribute('readonly');
            element.removeAttribute('disabled');
            
            // 确保可以获得焦点
            if (element.tabIndex < 0) {
              element.tabIndex = 0;
            }
          });
          
          console.log('🔧 已修复预选脚本模态框中的输入元素');
        }
      }, 200); // 增加延迟时间到200ms
    });
  } catch (error) {
    console.error("解密脚本失败:", error);
    alert("解密脚本失败，请重试");
  }
}

// 根据预设脚本ID获取名称
function getPresetScriptName(presetScriptId: string): string {
  if (!presetScriptId || !presetScripts.value || presetScripts.value.length === 0) {
    return "未知预设脚本";
  }
  
  const preset = presetScripts.value.find((p) => p && p.id === presetScriptId);
  return preset ? preset.name : "未知预设脚本";
}

// 取消选择预设脚本
function unselectPresetScript() {
  selectedPresetScript.value = null;
  formState.code = 'alert("恭喜发财");';
  
  // 应用输入修复
  nextTick(() => {
    setTimeout(() => {
      const modal = document.querySelector('.ant-modal');
      if (modal) {
        windowsInputFixer.fixContainer(modal as HTMLElement);
        
        // 额外修复：直接针对输入框进行焦点修复
        const inputs = modal.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          const element = input as HTMLElement;
          element.style.pointerEvents = 'auto';
          element.style.userSelect = 'auto';
          element.style.position = 'relative';
          element.style.zIndex = '999';
          
          // 移除可能阻止输入的属性
          element.removeAttribute('readonly');
          element.removeAttribute('disabled');
          
          // 确保可以获得焦点
          if (element.tabIndex < 0) {
            element.tabIndex = 0;
          }
        });
        
        console.log('🔧 已修复取消预选脚本后的输入元素');
      }
    }, 200); // 增加延迟时间到200ms
  });
}

// 添加或编辑脚本
function showModal(script?: Script) {
  if (script) {
    formState.name = script.name;
    formState.code = script.code;
    formState.description = script.description || "";
    formState.id = script.id;
    formState.isEdit = true;
    formState.isCopy = false;

    // 如果脚本有 preset_script_id，则恢复选中的预设脚本
    if (script.preset_script_id) {
      const preset = presetScripts.value.find(
        (p) => p.id === script.preset_script_id
      );
      if (preset) {
        selectedPresetScript.value = preset;
      } else {
        selectedPresetScript.value = null;
      }
    } else {
      selectedPresetScript.value = null;
    }
  } else {
    formState.name = "";
    formState.code = 'alert("恭喜发财");';
    formState.description = "";
    formState.id = 0;
    formState.isEdit = false;
    formState.isCopy = false;
    // 重置预设脚本选择状态
    selectedPresetScript.value = null;
  }
  isModalVisible.value = true;
  
  // Windows 输入修复：模态框显示后立即修复输入元素
  nextTick(() => {
    setTimeout(() => {
      const modal = document.querySelector('.ant-modal');
      if (modal) {
        windowsInputFixer.fixContainer(modal as HTMLElement);
        
        // 额外修复：直接针对输入框进行焦点修复
        const inputs = modal.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          const element = input as HTMLElement;
          element.style.pointerEvents = 'auto';
          element.style.userSelect = 'auto';
          element.style.position = 'relative';
          element.style.zIndex = '999';
          
          // 移除可能阻止输入的属性
          element.removeAttribute('readonly');
          element.removeAttribute('disabled');
          
          // 确保可以获得焦点
          if (element.tabIndex < 0) {
            element.tabIndex = 0;
          }
        });
        
        console.log('🔧 已修复模态框中的输入元素');
      }
    }, 200); // 增加延迟时间到200ms
  });
}

// 复制脚本
function copyScript(script: Script) {
  formState.name = script.name + " Copy";
  formState.code = script.code;
  formState.description = script.description || "";
  formState.id = 0;
  formState.isEdit = false;
  formState.isCopy = true;
  isModalVisible.value = true;
  
  // Windows 输入修复：模态框显示后立即修复输入元素
  nextTick(() => {
    setTimeout(() => {
      const modal = document.querySelector('.ant-modal');
      if (modal) {
        windowsInputFixer.fixContainer(modal as HTMLElement);
        
        // 额外修复：直接针对输入框进行焦点修复
        const inputs = modal.querySelectorAll('input, textarea');
        inputs.forEach(input => {
          const element = input as HTMLElement;
          element.style.pointerEvents = 'auto';
          element.style.userSelect = 'auto';
          element.style.position = 'relative';
          element.style.zIndex = '999';
          
          // 移除可能阻止输入的属性
          element.removeAttribute('readonly');
          element.removeAttribute('disabled');
          
          // 确保可以获得焦点
          if (element.tabIndex < 0) {
            element.tabIndex = 0;
          }
        });
        
        console.log('🔧 已修复复制脚本模态框中的输入元素');
      }
    }, 200); // 增加延迟时间到200ms
  });
}

// 删除脚本
async function removeScript(script: Script) {
  try {
    await deleteScript(script.id);
    await loadScripts();
  } catch (error) {
    console.error("Failed to delete script:", error);
  }
}

// 确认删除脚本
function confirmRemoveScript(script: Script) {
  if (confirm(`确定要删除脚本 "${script.name}" 吗？`)) {
    removeScript(script);
  }
}

// 格式化代码
function formatCode() {
  try {
    // 简单的 JavaScript 代码格式化
    let code = formState.code;

    // 基本缩进处理
    const lines = code.split("\n");
    let indentLevel = 0;
    const indentSize = 2;

    const formattedLines = lines.map((line) => {
      const trimmed = line.trim();
      if (!trimmed) return "";

      // 减少缩进
      if (
        trimmed.startsWith("}") ||
        trimmed.startsWith("]") ||
        trimmed.startsWith(")")
      ) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      const formatted = " ".repeat(indentLevel * indentSize) + trimmed;

      // 增加缩进
      if (
        trimmed.endsWith("{") ||
        trimmed.endsWith("[") ||
        trimmed.endsWith("(")
      ) {
        indentLevel++;
      }

      return formatted;
    });

    formState.code = formattedLines.join("\n");
  } catch (error) {
    console.error("代码格式化失败:", error);
  }
}

// 处理表单提交
async function handleOk() {
  try {
    if (formState.isEdit) {
      // 更新脚本
      await updateScript({
        id: formState.id,
        name: formState.name,
        code: formState.code,
        description: formState.description,
        preset_script_id: selectedPresetScript.value?.id || undefined,
      });
    } else {
      // 添加或复制脚本
      await addScript(
        formState.name,
        formState.code,
        formState.description,
        selectedPresetScript.value?.id || undefined
      );
    }
    isModalVisible.value = false;
    await loadScripts();
  } catch (error) {
    console.error("Failed to save script:", error);
  }
}

// 取消表单
function handleCancel() {
  isModalVisible.value = false;
}

// 确保输入框能够获得焦点
function ensureInputFocus(event: Event) {
  const target = event.target as HTMLElement;
  if (target) {
    // 移除可能阻止输入的属性
    target.removeAttribute('readonly');
    target.removeAttribute('disabled');
    
    // 强制重置样式属性
    target.style.pointerEvents = 'auto';
    target.style.userSelect = 'auto';
    target.style.position = 'relative';
    target.style.zIndex = '999';
    
    // 确保可以获得焦点
    if (target.tabIndex < 0) {
      target.tabIndex = 0;
    }
    
    // 应用Windows输入修复
    windowsInputFixer.fixElement(target);
    
    console.log('🔧 手动修复输入框焦点');
  }
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
</script>

<template>
  <div v-show="active" class="starfield-container p-6 h-full overflow-auto">
    <!-- 标题栏 -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h1 class="text-2xl font-semibold text-gray-800 mb-1 flex items-center">
          脚本管理
        </h1>
        <p class="text-gray-500 text-sm">管理你的JavaScript脚本和自动化代码</p>
      </div>
      <button
        @click="showModal()"
        class="inline-flex items-center px-4 py-2 bg-blue-500 border-0 outline-none text-white rounded-lg hover:bg-blue-600 active:bg-blue-700 transition-all duration-200 shadow-sm font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
      >
        <PlusOutlined class="mr-2" />
        添加脚本
      </button>
    </div>

    <!-- 脚本卡片网格 -->
    <div
      class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
    >
      <!-- 脚本卡片 -->
      <div
        v-for="script in scripts"
        :key="script.id"
        class="tech-card overflow-hidden group"
      >
        <!-- 卡片头部 -->
        <div class="p-4 border-b border-gray-100/50">
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <!-- 脚本图标和名称 -->
              <div class="flex items-center mb-2">
                <div
                  class="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mr-3 flex-shrink-0 shadow-lg"
                >
                  <span class="emoji-icon text-white">💻</span>
                </div>
                <h3 
                  class="text-lg font-semibold text-gray-800 truncate cursor-default"
                  @mouseenter="showTooltip($event, script.name)"
                  @mouseleave="hideTooltip"
                >
                  {{ script.name }}
                </h3>
              </div>

              <!-- 脚本描述 -->
              <div class="mb-3" v-if="script.description">
                <p class="text-sm text-gray-600 line-clamp-2">
                  {{ script.description }}
                </p>
              </div>

              <!-- 脚本信息 -->
              <div class="space-y-1">
                <!-- 预设脚本信息 -->
                <div
                  v-if="script.preset_script_id && presetScripts.length > 0"
                  class="flex items-center text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded"
                >
                  <span class="mr-1">🔧</span>
                  <span class="font-medium">{{
                    getPresetScriptName(script.preset_script_id)
                  }}</span>
                </div>
                <!-- 只在没有预设脚本ID时显示代码 -->
                <div
                  v-if="!script.preset_script_id"
                  class="flex items-center text-xs text-gray-500"
                >
                  <span class="w-12 flex-shrink-0">代码:</span>
                  <span class="text-gray-700">{{
                    script.code
                      ? script.code.length > 50
                        ? script.code.substring(0, 50) + "..."
                        : script.code
                      : "无代码"
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 卡片操作按钮 -->
        <div class="p-4 bg-gray-50/30">
          <div class="flex justify-end space-x-1">
            <button
              @click="showModal(script)"
              class="p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-opacity-50"
              title="编辑"
            >
              <EditOutlined class="text-sm" />
            </button>

            <button
              @click="copyScript(script)"
              class="p-2 text-gray-600 hover:text-green-500 hover:bg-green-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-opacity-50"
              title="复制"
            >
              <CopyOutlined class="text-sm" />
            </button>

            <button
              @click="confirmRemoveScript(script)"
              class="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-md transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-opacity-50"
              title="删除"
            >
              <DeleteOutlined class="text-sm" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <a-modal
      v-model:visible="isModalVisible"
      :title="
        formState.isEdit
          ? '💻 编辑脚本'
          : formState.isCopy
          ? '💻 复制脚本'
          : '💻 添加脚本'
      "
      @ok="handleOk"
      @cancel="handleCancel"
      width="800px"
      :body-style="{ maxHeight: '600px', overflow: 'auto' }"
      ok-text="确定"
      cancel-text="取消"
    >
      <a-form :model="formState" layout="vertical">
        <!-- 预设脚本选择区域 -->
        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-3"
            >预设脚本（点击选择）</label
          >
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div
              v-for="preset in presetScripts"
              :key="preset.id"
              @click="selectPresetScript(preset)"
              class="preset-script-card"
              :class="{ selected: selectedPresetScript?.id === preset.id }"
              role="button"
              tabindex="0"
              @keydown.enter="selectPresetScript(preset)"
              @keydown.space="selectPresetScript(preset)"
            >
              <div class="flex items-center space-x-3">
                <div class="preset-icon">📜</div>
                <div class="flex-1">
                  <h3 class="preset-name">{{ preset.name }}</h3>
                  <p class="preset-description">{{ preset.description }}</p>
                </div>
                <div class="preset-arrow">
                  {{ selectedPresetScript?.id === preset.id ? '✓' : '→' }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 已选择的预设脚本显示 -->
        <div
          v-if="selectedPresetScript"
          class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg"
        >
          <div class="flex items-center justify-between">
            <span class="text-green-700 font-medium">
              已选脚本：{{ selectedPresetScript.name }}
            </span>
            <button
              @click="unselectPresetScript"
              class="text-red-500 hover:text-red-700 text-sm"
            >
              取消
            </button>
          </div>
        </div>

        <a-form-item label="脚本名称" name="name">
          <a-input
            v-model:value="formState.name"
            placeholder="请输入脚本名称"
            @click="ensureInputFocus"
            @focus="ensureInputFocus"
          />
        </a-form-item>

        <a-form-item label="描述（可选）" name="description">
          <a-input
            v-model:value="formState.description"
            placeholder="请输入脚本描述"
            @click="ensureInputFocus"
            @focus="ensureInputFocus"
          />
        </a-form-item>

        <a-form-item v-if="!selectedPresetScript" label="JavaScript 代码" name="code">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-gray-500">
              使用 {username} 和 {password} 作为自动登录的占位符
            </span>
            <a-button
              size="small"
              @click="formatCode"
              class="flex items-center"
              title="格式化代码"
            >
              <FormatPainterOutlined />
              格式化
            </a-button>
          </div>
          <a-textarea
            v-model:value="formState.code"
            placeholder="在此输入您的 JavaScript 代码..."
            :rows="15"
            @click="ensureInputFocus"
            @focus="ensureInputFocus"
            style="
              font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
              font-size: 13px;
              line-height: 1.4;
            "
          />
        </a-form-item>
      </a-form>
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
.ant-card {
  transition: all 0.3s ease;
}

.ant-card:hover {
  transform: translateY(-2px);
}

/* 代码输入框样式优化 */
:deep(.ant-input) {
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace !important;
}

/* 预设脚本卡片样式 */
.preset-script-card {
  position: relative;
  padding: 1rem;
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  background-size: 200% 200%;
  /* animation: gradient 3s ease infinite; 已移除 */
  color: white;
  overflow: hidden;
}

.preset-script-card::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  opacity: 0.9;
  border-radius: 10px;
}

.preset-script-card > * {
  position: relative;
  z-index: 1;
}

.preset-script-card:hover {
  transform: translateY(-2px) scale(1.02);
  /* animation: shake 0.5s ease-in-out infinite; 已移除 */
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.preset-script-card.selected {
  border-color: #10b981;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

/* 预设脚本卡片的动画效果已移除 */

.preset-icon {
  font-size: 1.5rem;
  width: 3rem;
  height: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  backdrop-filter: blur(4px);
}

.preset-name {
  font-weight: 600;
  font-size: 1.125rem;
  color: white;
}

.preset-description {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.preset-arrow {
  font-size: 1.25rem;
  font-weight: bold;
  color: rgba(255, 255, 255, 0.8);
  transition: transform 0.3s ease;
}

.preset-script-card:hover .preset-arrow {
  transform: translateX(4px);
}

.code-hidden-display {
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem;
  background-color: #f9fafb;
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
