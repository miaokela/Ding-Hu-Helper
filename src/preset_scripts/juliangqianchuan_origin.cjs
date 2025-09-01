// 巨量千川原始登录脚本
// 注意：此文件不会被打包，仅用于生成加密版本

const juliangqianchuanScript = `console.log("开始千川自动登录...");

function isValidEmail(email) {
    const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
    return emailRegex.test(email);
}

function cleanInputText(text) {
    if (typeof text !== 'string') return text;
    return text.replace(/[\\n\\r]/g, '').trim();
}

function hasLogin() {
    var header = document.querySelector("#bp-header-brand-container");
    return header ? true : false;
}

function keyInput(item) {
    item.dispatchEvent(new Event("input", { bubbles: true }));
    item.dispatchEvent(new Event("change", { bubbles: true }));
}

function setInputValue(input, value) {
    const cleanValue = cleanInputText(value);
    input.value = "";
    input.setAttribute("value", cleanValue);
    input.value = cleanValue;
    keyInput(input);
}

function exec_login() {
    const username = "{username}";
    const password = "{password}";
    
    const isEmail = isValidEmail(username);
    const mobile = username;
    
    console.log("登录信息:", { username, isEmail });

    function checkLoadFinish() {
        try {
            if (!isEmail) {
                clearInterval(iFinish);
                var chk_agree = document.getElementsByClassName("account-center-agreement-check")[0];
                var has_chk_agree = document.querySelector(".account-center-agreement-check.checked");
                if (chk_agree && !has_chk_agree) {
                    chk_agree.dispatchEvent(new MouseEvent("click"));
                }
                return;
            }

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

            if (isEmail && btn_email) {
                console.log("切换到邮箱登录");
                btn_email.dispatchEvent(new MouseEvent("click"));
            }
            
            if (!isEmail && btn_mobile) {
                console.log("切换到手机登录");
                btn_mobile.dispatchEvent(new MouseEvent("click"));
            }

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
            
            if (input_mobile && !isEmail) {
                console.log("手机号登录模式");
                clearInterval(iSwitch);
                
                setInputValue(input_mobile, mobile);
                
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

    var iFinish = setInterval(checkLoadFinish, 100);
    var iSwitch = setInterval(checkSwitch, 100);
    
    setTimeout(function() {
        clearInterval(iFinish);
        clearInterval(iSwitch);
        console.log("登录脚本执行完成");
    }, 10000);
}

setTimeout(exec_login, 2000);`;

module.exports = juliangqianchuanScript;
