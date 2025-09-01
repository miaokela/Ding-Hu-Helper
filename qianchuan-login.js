console.log("开始千川自动登录...");

// 邮箱验证函数
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// 清理输入文本中的换行符和回车符
function cleanInputText(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/[\n\r]/g, '').trim();
}

// 检查是否已经登录
function hasLogin() {
    var header = document.querySelector("#bp-header-brand-container");
    return header ? true : false;
}

// 触发输入事件
function keyInput(item) {
    item.dispatchEvent(new Event("input", { bubbles: true }));
    item.dispatchEvent(new Event("change", { bubbles: true }));
}

// 安全设置输入框值
function setInputValue(input, value) {
    const cleanValue = cleanInputText(value);
    input.value = "";
    input.setAttribute("value", cleanValue);
    input.value = cleanValue;
    keyInput(input);
}

// 主要登录执行函数
function exec_login() {
    const username = "{username}";  // 替换为实际的用户名
    const password = "{password}";  // 替换为实际的密码
    
    // 判断是否为邮箱
    const isEmail = isValidEmail(username);
    const mobile = username;
    
    console.log("登录信息:", { username, isEmail });

    // 检查加载完成状态
    function checkLoadFinish() {
        try {
            if (!isEmail) {
                // 手机号登录模式
                clearInterval(iFinish);
                var chk_agree = document.getElementsByClassName("account-center-agreement-check")[0];
                var has_chk_agree = document.querySelector(".account-center-agreement-check.checked");
                if (chk_agree && !has_chk_agree) {
                    chk_agree.dispatchEvent(new MouseEvent("click"));
                }
                return;
            }

            // 邮箱登录模式
            var btn_login = document.getElementsByClassName("account-center-action-button")[0];
            if (btn_login) {
                clearInterval(iFinish);
                var btn_email = document.getElementsByClassName("account-center-switch-button email")[0];
                var chk_agree = document.getElementsByClassName("account-center-agreement-check")[0];
                var has_chk_agree = document.querySelector(".account-center-agreement-check.checked");
                
                if (btn_email) {
                    btn_email.dispatchEvent(new MouseEvent("click"));
                }
                if (chk_agree && !has_chk_agree) {
                    chk_agree.dispatchEvent(new MouseEvent("click"));
                }
                btn_login.dispatchEvent(new Event('click', {"bubbles": true, "cancelable": true}));
            }
        } catch(e) {
            console.error("检查是否登录失败", e);
        }
    }

    // 检查登录状态并切换登录方式
    function checkSwitch() {
        try {
            if (hasLogin()) {
                console.log("已经登录");
                clearInterval(iSwitch);
                return;
            }

            var btn_login = document.getElementsByClassName("account-center-action-button")[0];
            var btn_email = document.getElementsByClassName("account-center-switch-button email")[0];
            var btn_mobile = document.getElementsByClassName("account-center-switch-button mobile")[0];
            var input_email = document.querySelector('input[name="email"]');
            var input_mobile = document.querySelector('input[name="mobile"]');
            var input_pwd = document.querySelector('input[name="password"]');
            var captcha = document.getElementsByClassName("account-center-code-captcha")[0];

            // 切换到邮箱登录
            if (isEmail && btn_email) {
                console.log("切换到邮箱登录");
                btn_email.dispatchEvent(new MouseEvent("click"));
            }
            
            // 切换到手机登录
            if (!isEmail && btn_mobile) {
                console.log("切换到手机登录");
                btn_mobile.dispatchEvent(new MouseEvent("click"));
            }

            // 邮箱登录处理
            if (input_email && input_pwd && isEmail) {
                console.log("邮箱登录模式");
                clearInterval(iSwitch);
                console.log("设置账户:", username);
                
                setInputValue(input_email, username);
                setInputValue(input_pwd, password);
                
                setTimeout(function() {
                    if (btn_login) {
                        btn_login.click();
                    }
                }, 100);
            }
            
            // 手机号登录处理
            if (input_mobile && !isEmail) {
                console.log("手机号登录模式");
                clearInterval(iSwitch);
                
                setInputValue(input_mobile, mobile);
                
                // 点击获取验证码
                setTimeout(function() {
                    if (captcha) {
                        captcha.click();
                    }
                }, 100);
            }
        } catch (e) {
            console.error("切换登录方式失败:", e);
        }
    }

    // 启动定时器
    var iFinish = setInterval(checkLoadFinish, 100);
    var iSwitch = setInterval(checkSwitch, 100);
    
    // 10秒后清理定时器，避免无限循环
    setTimeout(function() {
        clearInterval(iFinish);
        clearInterval(iSwitch);
        console.log("登录脚本执行完成");
    }, 10000);
}

// 延迟执行登录
setTimeout(exec_login, 2000);
