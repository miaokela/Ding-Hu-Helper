<template>
  <div class="system-auth-overlay" v-if="showAuth">
    <div class="auth-modal">
      <div class="auth-header">
        <div class="lock-icon">🔐</div>
        <h2>系统用户验证</h2>
        <p class="auth-subtitle">请输入当前系统用户的登录密码</p>
      </div>

      <div class="auth-body">
        <div class="user-info">
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <div class="username">{{ currentUser || '获取中...' }}</div>
            <div class="platform">{{ platformInfo }}</div>
          </div>
        </div>

        <div class="password-field">
          <label for="password">密码</label>
          <div class="password-input-container">
            <input
              id="password"
              ref="passwordInput"
              :type="showPassword ? 'text' : 'password'"
              v-model="password"
              placeholder="请输入系统登录密码"
              :disabled="verifying"
              @keyup.enter="handleVerify"
              @input="clearError"
            />
            <button
              type="button"
              class="password-toggle"
              @click="togglePasswordVisibility"
              :disabled="verifying"
            >
              {{ showPassword ? '🙈' : '👁️' }}
            </button>
          </div>
        </div>

        <div class="error-message" v-if="errorMessage">
          ⚠️ {{ errorMessage }}
        </div>

        <!-- 浏览器环境提示 -->
        <div v-if="platformName === 'web'" class="demo-notice">
          🌐 <strong>演示模式：</strong>
          <span v-if="simulateNoPassword">
            模拟检测到无密码用户，将自动通过认证...
          </span>
          <span v-else>
            模拟有密码用户，输入任意密码即可体验网页内部弹窗效果
          </span>
        </div>

        <div class="auth-actions">
          <button
            class="verify-btn"
            :class="{ loading: verifying }"
            :disabled="!password.trim() || verifying"
            @click="handleVerify"
          >
            <span v-if="verifying" class="loading-spinner">⏳</span>
            {{ verifying ? '验证中...' : '验证密码' }}
          </button>
          
          <button
            class="cancel-btn"
            :disabled="verifying"
            @click="handleCancel"
          >
            取消
          </button>
          
          <!-- 浏览器环境测试按钮 -->
          <div v-if="platformName === 'web'" class="test-buttons">
            <button
              class="test-btn"
              @click="testNoPassword"
              :disabled="verifying"
            >
              🆓 测试无密码用户
            </button>
            <button
              class="test-btn"
              @click="testWithPassword"
              :disabled="verifying"
            >
              🔐 测试有密码用户
            </button>
          </div>
        </div>
      </div>

      <div class="auth-footer">
        <div class="security-note">
          🔒 此验证确保只有系统用户本人才能使用此应用
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, computed, watch } from 'vue'

// Props
interface Props {
  visible: boolean
  autoShow?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  autoShow: true
})

// Emits
const emit = defineEmits<{
  success: [username: string]
  cancel: []
  error: [error: string]
}>()

// Reactive data
const showAuth = ref(false)
const password = ref('')
const showPassword = ref(false)
const verifying = ref(false)
const errorMessage = ref('')
const currentUser = ref('')
const platformName = ref('')
const platformArch = ref('')
const supported = ref(false)

// 浏览器环境模拟：是否模拟无密码用户（为了演示，随机决定）
const simulateNoPassword = ref(Math.random() > 0.5)

// Computed
const platformInfo = computed(() => {
  if (!platformName.value) return '检测中...'
  const platformNames: Record<string, string> = {
    'win32': 'Windows',
    'darwin': 'macOS', 
    'linux': 'Linux',
    'web': '浏览器环境'
  }
  return `${platformNames[platformName.value] || platformName.value} (${platformArch.value})`
})

// Refs
const passwordInput = ref<HTMLInputElement>()

// Methods
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value
}

const clearError = () => {
  errorMessage.value = ''
}

const handleVerify = async () => {
  if (!password.value.trim() || verifying.value) return

  clearError()
  verifying.value = true

  try {
    console.log('🔐 开始验证系统密码...')
    
    // 检查是否在浏览器环境中
    if (!window.electronAPI) {
      console.log('🌐 在浏览器环境中，模拟密码验证')
      // 模拟验证延迟
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 简单的演示验证 - 任何非空密码都通过
      if (password.value.length > 0) {
        console.log('✅ 浏览器环境模拟认证成功')
        emit('success', currentUser.value)
        hideAuth()
        return
      } else {
        errorMessage.value = '请输入密码'
        return
      }
    }
    
    // 调用主进程进行密码验证
    const result = await window.electronAPI.systemAuthVerifyPassword(password.value)
    
    if (result.success) {
      console.log('✅ 系统认证成功')
      emit('success', result.username || currentUser.value)
      hideAuth()
    } else {
      console.log('❌ 系统认证失败:', result.error)
      errorMessage.value = result.error || '密码验证失败'
      password.value = ''
      
      // 重新聚焦到密码输入框
      await nextTick()
      passwordInput.value?.focus()
    }
  } catch (error) {
    console.error('系统认证异常:', error)
    errorMessage.value = '系统认证发生异常，请重试'
    emit('error', error instanceof Error ? error.message : String(error))
  } finally {
    verifying.value = false
  }
}

const handleCancel = () => {
  emit('cancel')
  hideAuth()
}

// 浏览器环境测试方法
const testNoPassword = () => {
  console.log('🆓 测试无密码用户模式')
  simulateNoPassword.value = true
  errorMessage.value = ''
  
  setTimeout(() => {
    console.log('🎉 模拟无密码用户认证成功')
    emit('success', currentUser.value)
    hideAuth()
  }, 1000)
}

const testWithPassword = () => {
  console.log('🔐 测试有密码用户模式')
  simulateNoPassword.value = false
  errorMessage.value = ''
  password.value = ''
}

const showAuthModal = async () => {
  showAuth.value = true
  await nextTick()
  passwordInput.value?.focus()
}

const hideAuth = () => {
  showAuth.value = false
  password.value = ''
  showPassword.value = false
  errorMessage.value = ''
}

const loadUserInfo = async () => {
  try {
    console.log('📋 获取当前用户信息...')
    
    // 检查是否在浏览器环境中
    if (!window.electronAPI) {
      console.log('🌐 在浏览器环境中，使用模拟用户信息')
      currentUser.value = 'demo-user'
      platformName.value = 'web'
      platformArch.value = navigator.platform || 'unknown'
      supported.value = true
      
      // 模拟无密码用户检测
      if (simulateNoPassword.value) {
        console.log('🎉 浏览器环境：模拟检测到无密码用户，自动通过认证')
        setTimeout(() => {
          emit('success', currentUser.value)
          hideAuth()
        }, 1000) // 延迟1秒以便用户看到效果
      } else {
        console.log('🔐 浏览器环境：模拟有密码用户，需要输入密码')
      }
      return
    }
    
    const userInfo = await window.electronAPI.systemAuthGetCurrentUser()
    
    if (userInfo.success) {
      currentUser.value = userInfo.username || ''
      platformName.value = userInfo.platform || ''
      supported.value = userInfo.supported || false
      
      console.log(`✅ 用户信息获取成功: ${userInfo.username} (${userInfo.platform})`)
      
      if (!supported.value) {
        errorMessage.value = `当前平台 (${userInfo.platform}) 不支持系统认证`
        emit('error', '不支持的平台')
        return
      }
      
      // 检测用户是否设置了密码
      console.log('🔍 检测用户密码设置状态...')
      const passwordCheckResult = await window.electronAPI.systemAuthCheckUserPassword()
      
      if (passwordCheckResult.success) {
        const hasPassword = !!passwordCheckResult.username
        console.log(`✅ 密码检测完成: ${hasPassword ? '用户已设置密码' : '用户未设置密码'}`)
        
        if (!hasPassword) {
          console.log('🎉 检测到用户未设置密码，自动通过认证')
          emit('success', currentUser.value)
          hideAuth()
          return
        }
      } else {
        console.warn('⚠️ 密码检测失败，继续正常认证流程:', passwordCheckResult.error)
      }
    } else {
      console.error('❌ 获取用户信息失败:', userInfo.error)
      errorMessage.value = userInfo.error || '无法获取用户信息'
      emit('error', userInfo.error || '获取用户信息失败')
    }
  } catch (error) {
    console.error('获取用户信息异常:', error)
    errorMessage.value = '获取用户信息发生异常'
    emit('error', error instanceof Error ? error.message : String(error))
  }
}

const checkSupport = async () => {
  try {
    console.log('🔍 检查系统认证支持...')
    const supportInfo = await window.electronAPI.systemAuthCheckSupport()
    
    if (supportInfo.success) {
      supported.value = supportInfo.supported || false
      platformName.value = supportInfo.platform || ''
      platformArch.value = supportInfo.arch || ''
      
      console.log(`✅ 系统认证支持检查完成: ${supportInfo.supported} (${supportInfo.platform})`)
      
      if (!supported.value) {
        errorMessage.value = `当前平台 (${supportInfo.platform}) 不支持系统认证`
        emit('error', '不支持的平台')
      }
    } else {
      console.error('❌ 检查系统认证支持失败:', supportInfo.error)
      errorMessage.value = supportInfo.error || '无法检查系统认证支持'
      emit('error', supportInfo.error || '检查系统认证支持失败')
    }
  } catch (error) {
    console.error('检查系统认证支持异常:', error)
    errorMessage.value = '检查系统认证支持发生异常'
    emit('error', error instanceof Error ? error.message : String(error))
  }
}

// Lifecycle
onMounted(async () => {
  await checkSupport()
  await loadUserInfo()
  
  if (props.autoShow && supported.value) {
    await showAuthModal()
  }
})

// Watch props
watch(() => props.visible, (newVisible) => {
  if (newVisible) {
    showAuthModal()
  } else {
    hideAuth()
  }
})

// Expose methods
defineExpose({
  show: showAuthModal,
  hide: hideAuth,
  isSupported: () => supported.value
})
</script>

<style scoped>
.system-auth-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.auth-modal {
  background: linear-gradient(145deg, #ffffff, #f8f9fa);
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  width: 440px;
  max-width: 90vw;
  overflow: hidden;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.auth-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 24px;
  text-align: center;
}

.lock-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.auth-header h2 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.auth-subtitle {
  margin: 0;
  opacity: 0.9;
  font-size: 14px;
}

.auth-body {
  padding: 24px;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 12px;
  border: 1px solid #e9ecef;
}

.user-avatar {
  font-size: 32px;
  margin-right: 16px;
  background: #e9ecef;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.user-details {
  flex: 1;
}

.username {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 4px;
}

.platform {
  font-size: 13px;
  color: #6c757d;
}

.password-field {
  margin-bottom: 16px;
}

.password-field label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #495057;
  font-size: 14px;
}

.password-input-container {
  position: relative;
  display: flex;
  align-items: center;
}

.password-input-container input {
  flex: 1;
  padding: 12px 50px 12px 16px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  font-size: 14px;
  transition: all 0.2s ease;
  background: white;
}

.password-input-container input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.password-input-container input:disabled {
  background: #f8f9fa;
  opacity: 0.7;
}

.password-toggle {
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.password-toggle:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.05);
}

.password-toggle:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.error-message {
  color: #dc3545;
  font-size: 13px;
  margin-bottom: 16px;
  padding: 12px;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 6px;
  border-left: 4px solid #dc3545;
}

.auth-actions {
  display: flex;
  gap: 12px;
}

.verify-btn {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.verify-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.verify-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.verify-btn.loading {
  background: #6c757d;
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.cancel-btn {
  background: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover:not(:disabled) {
  background: #5a6268;
  transform: translateY(-1px);
}

.cancel-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.test-buttons {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-direction: column;
}

.test-btn {
  padding: 8px 16px;
  border: 1px solid #6c757d;
  border-radius: 6px;
  background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
  color: #495057;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.test-btn:hover {
  background: linear-gradient(135deg, #e9ecef 0%, #dee2e6 100%);
  border-color: #495057;
  transform: translateY(-1px);
}

.test-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.auth-footer {
  background: #f8f9fa;
  padding: 16px 24px;
  border-top: 1px solid #e9ecef;
}

.security-note {
  font-size: 12px;
  color: #6c757d;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

/* 响应式设计 */
@media (max-width: 480px) {
  .auth-modal {
    width: 100%;
    max-width: 90vw;
    margin: 20px;
  }
  
  .auth-header, .auth-body, .auth-footer {
    padding: 16px;
  }
  
  .user-info {
    flex-direction: column;
    text-align: center;
    gap: 12px;
  }
  
  .user-avatar {
    margin: 0 auto 8px auto;
  }
  
  .auth-actions {
    flex-direction: column;
  }
}

.demo-notice {
  margin-top: 16px;
  padding: 12px;
  background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
  border: 1px solid #2196f3;
  border-radius: 8px;
  color: #1976d2;
  font-size: 14px;
  line-height: 1.5;
}

.demo-notice strong {
  color: #1565c0;
}
</style>