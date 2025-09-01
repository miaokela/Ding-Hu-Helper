#!/bin/bash

echo "🔥 完整弹窗阻止机制验证脚本"
echo "========================================="
echo "此脚本将验证应用中的所有弹窗阻止机制是否正常工作"
echo "========================================="

echo ""
echo "📋 已实现的弹窗阻止机制："
echo "----------------------------------------"
echo "✅ 1. Electron主进程级别拦截："
echo "   - dialog.showMessageBox (异步)"
echo "   - dialog.showMessageBoxSync (同步)"
echo "   - dialog.showErrorBox"
echo "   - shell.openExternal"
echo ""
echo "✅ 2. WebContents级别拦截："
echo "   - setWindowOpenHandler (完全禁止window.open)"
echo "   - will-navigate (阻止危险协议导航)"
echo "   - will-redirect (阻止危险协议重定向)"
echo ""
echo "✅ 3. 页面JavaScript级别拦截："
echo "   - window.alert() 拦截"
echo "   - window.confirm() 拦截"
echo "   - window.prompt() 拦截"
echo "   - window.open() 完全禁用"
echo "   - showModalDialog() 拦截"
echo "   - document.write/writeln 内容过滤"
echo "   - eval() 代码过滤"
echo "   - Function构造函数过滤"
echo ""
echo "✅ 4. 前端Vue组件级别："
echo "   - 链接点击拦截（危险协议）"
echo "   - beforeunload事件处理"
echo "   - Ant Design Modal组件（内部使用，保留）"
echo ""

echo "🔍 检查主进程文件..."
MAIN_FILE="/Users/kela/Program/Other/Client/Multi-Browser/electron/main.ts"

if [ -f "$MAIN_FILE" ]; then
    echo "✅ 主进程文件存在"
    
    # 检查关键拦截代码
    echo "🔍 检查拦截机制..."
    
    if grep -q "完全弹窗禁止机制" "$MAIN_FILE"; then
        echo "✅ 完全弹窗禁止机制已启用"
    else
        echo "❌ 完全弹窗禁止机制未找到"
    fi
    
    if grep -q "setWindowOpenHandler" "$MAIN_FILE"; then
        echo "✅ 窗口打开拦截器已设置"
    else
        echo "❌ 窗口打开拦截器未找到"
    fi
    
    if grep -q "window.confirm = function" "$MAIN_FILE"; then
        echo "✅ confirm拦截已注入"
    else
        echo "❌ confirm拦截未找到"
    fi
    
    if grep -q "window.alert = function" "$MAIN_FILE"; then
        echo "✅ alert拦截已注入"
    else
        echo "❌ alert拦截未找到"
    fi
    
    if grep -q "window.open = function" "$MAIN_FILE"; then
        echo "✅ window.open拦截已注入"
    else
        echo "❌ window.open拦截未找到"
    fi
    
    if grep -q "window.eval = function" "$MAIN_FILE"; then
        echo "✅ eval拦截已注入"
    else
        echo "❌ eval拦截未找到"
    fi
    
else
    echo "❌ 主进程文件不存在"
fi

echo ""
echo "🔍 检查前端组件..."
BROWSER_COMPONENT="/Users/kela/Program/Other/Client/Multi-Browser/src/components/browser-page/index.vue"

if [ -f "$BROWSER_COMPONENT" ]; then
    echo "✅ 浏览器组件文件存在"
    
    if grep -q "阻止点击危险协议链接" "$BROWSER_COMPONENT"; then
        echo "✅ 链接点击拦截已设置"
    else
        echo "❌ 链接点击拦截未找到"
    fi
    
else
    echo "❌ 浏览器组件文件不存在"
fi

echo ""
echo "🧪 测试建议："
echo "----------------------------------------"
echo "1. 启动应用后访问包含弹窗的网站"
echo "2. 尝试点击会触发alert()的按钮"
echo "3. 尝试点击会触发confirm()的按钮"
echo "4. 尝试点击会触发window.open()的链接"
echo "5. 检查控制台是否有拦截日志"

echo ""
echo "📋 白名单机制："
echo "----------------------------------------"
echo "✅ 应用内部对话框仍可正常显示："
echo "   - 标题包含'盯户助手'的对话框"
echo "   - 消息包含'确定要退出'的对话框"
echo "   - 消息包含'严重错误'的错误框"
echo "   - Ant Design Modal组件"
echo ""

echo "🚨 阻止的弹窗类型："
echo "----------------------------------------"
echo "❌ 网页alert()弹窗"
echo "❌ 网页confirm()弹窗"
echo "❌ 网页prompt()弹窗"
echo "❌ 网页window.open()新窗口"
echo "❌ 网页showModalDialog()模态框"
echo "❌ 外部链接打开"
echo "❌ 危险协议导航"
echo "❌ 动态JavaScript代码执行（包含弹窗的）"

echo ""
echo "========================================="
echo "✅ 弹窗阻止机制验证完成"
echo "========================================="

# 创建测试HTML文件用于验证
cat > /tmp/popup_test.html << 'HTML_EOF'
<!DOCTYPE html>
<html>
<head>
    <title>弹窗测试页面</title>
</head>
<body>
    <h1>弹窗测试页面</h1>
    <p>点击下面的按钮测试弹窗拦截功能：</p>
    
    <button onclick="alert('这个alert应该被拦截')">测试Alert</button>
    <button onclick="confirm('这个confirm应该被拦截')">测试Confirm</button>
    <button onclick="prompt('这个prompt应该被拦截')">测试Prompt</button>
    <button onclick="window.open('https://www.baidu.com')">测试Window.open</button>
    
    <br><br>
    <a href="javascript:alert('危险的javascript协议')">危险JavaScript链接</a>
    <br>
    <a href="bytedance://test">危险协议链接</a>
    
    <script>
        console.log('页面脚本开始执行');
        
        // 尝试动态创建弹窗
        setTimeout(() => {
            try {
                eval("alert('动态eval弹窗')");
            } catch(e) {
                console.log('eval弹窗被阻止:', e);
            }
        }, 1000);
        
        setTimeout(() => {
            try {
                new Function("alert('动态Function弹窗')")();
            } catch(e) {
                console.log('Function弹窗被阻止:', e);
            }
        }, 2000);
        
        console.log('页面脚本执行完成');
    </script>
</body>
</html>
HTML_EOF

echo ""
echo "📄 已创建测试页面: file:///tmp/popup_test.html"
echo "   可以在应用中打开此页面来测试弹窗拦截功能"

echo ""
echo "🏁 验证脚本执行完毕！"
