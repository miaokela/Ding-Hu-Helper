// Windows 输入修复工具
export class WindowsInputFixer {
  private static instance: WindowsInputFixer;
  private observer: MutationObserver | null = null;
  private isWindows: boolean = false;

  constructor() {
    this.isWindows = typeof window !== 'undefined' && 
                     (navigator.platform.toLowerCase().includes('win') || 
                      navigator.userAgent.toLowerCase().includes('windows'));
    
    if (this.isWindows) {
      console.log('🔧 Windows 输入修复器已启动');
      this.init();
    }
  }

  static getInstance(): WindowsInputFixer {
    if (!WindowsInputFixer.instance) {
      WindowsInputFixer.instance = new WindowsInputFixer();
    }
    return WindowsInputFixer.instance;
  }

  private init() {
    // 等待 DOM 就绪
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setupFixes());
    } else {
      this.setupFixes();
    }
  }

  private setupFixes() {
    // 立即修复现有输入元素
    this.fixExistingInputs();
    
    // 设置变更观察器监听新添加的输入元素
    this.setupMutationObserver();
    
    // 添加全局事件监听器
    this.addGlobalEventListeners();
    
    console.log('✅ Windows 输入修复已应用');
  }

  private fixExistingInputs() {
    const inputs = document.querySelectorAll('input, textarea, [contenteditable]');
    inputs.forEach(input => this.fixInputElement(input as HTMLElement));
  }

  private fixInputElement(element: HTMLElement) {
    if (!element) return;

    // 移除可能阻止输入的属性
    element.removeAttribute('readonly');
    element.removeAttribute('disabled');
    
    // 强制重置样式属性
    const style = element.style;
    style.pointerEvents = 'auto';
    style.userSelect = 'auto';
    style.webkitUserSelect = 'auto';
    // @ts-ignore - 兼容性属性
    style.msUserSelect = 'auto';
    // @ts-ignore - 兼容性属性
    style.mozUserSelect = 'auto';
    
    // 确保层级不被遮挡
    style.position = 'relative';
    style.zIndex = '999';
    
    // 确保可以获得焦点
    if (element.tabIndex < 0) {
      element.tabIndex = 0;
    }
    
    // 特殊处理 Ant Design 组件
    if (element.classList.contains('ant-input') || 
        element.classList.contains('ant-textarea')) {
      style.backgroundColor = 'white';
      style.border = '1px solid #d1d5db';
      
      // 处理父容器
      const wrapper = element.closest('.ant-input-wrapper, .ant-form-item-control-input');
      if (wrapper) {
        (wrapper as HTMLElement).style.pointerEvents = 'auto';
        (wrapper as HTMLElement).style.zIndex = '999';
      }
    }
    
    // 强制触发重绘
    element.offsetHeight;
  }

  private setupMutationObserver() {
    this.observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const element = node as Element;
            
            // 检查是否是输入元素
            if (this.isInputElement(element)) {
              this.fixInputElement(element as HTMLElement);
            }
            
            // 检查子元素中的输入元素
            const inputs = element.querySelectorAll('input, textarea, [contenteditable]');
            inputs.forEach(input => this.fixInputElement(input as HTMLElement));
          }
        });
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['readonly', 'disabled', 'style']
    });
  }

  private isInputElement(element: Element): boolean {
    const tagName = element.tagName.toLowerCase();
    return tagName === 'input' || 
           tagName === 'textarea' || 
           element.hasAttribute('contenteditable');
  }

  private addGlobalEventListeners() {
    // 点击事件：确保输入元素能够获得焦点
    document.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      if (this.isInputElement(target)) {
        // 轻微延迟以确保其他事件处理完成
        setTimeout(() => {
          this.fixInputElement(target);
          target.focus();
        }, 10);
      }
    });

    // 焦点事件：确保输入元素状态正确
    document.addEventListener('focusin', (e) => {
      const target = e.target as HTMLElement;
      if (this.isInputElement(target)) {
        this.fixInputElement(target);
      }
    });

    // 鼠标悬停事件：预防性修复
    document.addEventListener('mouseover', (e) => {
      const target = e.target as HTMLElement;
      if (this.isInputElement(target)) {
        this.fixInputElement(target);
      }
    });

    // 监听模态框显示事件
    document.addEventListener('DOMNodeInserted', (e) => {
      const target = e.target as HTMLElement;
      if (target.classList && target.classList.contains('ant-modal')) {
        setTimeout(() => {
          this.fixContainer(target);
        }, 100);
      }
    });

    // 监听DOM变化，特别是预选脚本选择后的变化
    document.addEventListener('DOMSubtreeModified', (e) => {
      const target = e.target as HTMLElement;
      if (target && target.classList && target.classList.contains('ant-modal')) {
        setTimeout(() => {
          this.fixContainer(target);
        }, 50);
      }
    });

    // 减少定期检查频率，但增加针对性检查
    setInterval(() => {
      // 特别检查模态框中的输入元素
      const modals = document.querySelectorAll('.ant-modal');
      modals.forEach(modal => {
        this.fixContainer(modal as HTMLElement);
      });
      
      // 全局输入元素检查
      this.fixExistingInputs();
    }, 5000); // 从10秒改回5秒，但增加了针对性
  }

  // 手动修复特定元素
  public fixElement(element: HTMLElement) {
    if (this.isWindows) {
      this.fixInputElement(element);
    }
  }

  // 修复特定容器内的所有输入元素
  public fixContainer(container: HTMLElement) {
    if (this.isWindows) {
      const inputs = container.querySelectorAll('input, textarea, [contenteditable]');
      inputs.forEach(input => this.fixInputElement(input as HTMLElement));
    }
  }

  // 销毁观察器
  public destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }
}

// 自动启动修复器
const fixer = WindowsInputFixer.getInstance();

// 导出实例供外部使用
export default fixer;
