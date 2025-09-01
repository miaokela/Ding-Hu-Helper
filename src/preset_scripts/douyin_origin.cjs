// 巨量千川原始登录脚本
// 注意：此文件不会被打包，仅用于生成加密版本

const douyinScript = `function cleanInputText(text) {
  if (typeof text !== 'string') return text;
  return text.replace(/[\\n\\r]/g, '').trim();
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

function getNotLoginDiv() {
  try {
    const divs = document.querySelectorAll('#douyin-header-menuCt div');

    for (let div of divs) {
      const text = div.textContent ? div.textContent.trim() : '';
      if (text === '登录') {
        return div;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

function getCaptchaSpan() {
  try {
    const spans = document.querySelectorAll('#douyin_login_comp_flat_panel span');

    for (let span of spans) {
      if (span.textContent && span.textContent.includes('获取验证码')) {
        return span;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

function getCaptchaTabSpan() {
  try {
    const spans = document.querySelectorAll('#douyin_login_comp_flat_panel span');

    for (let span of spans) {
      if (span.textContent && span.textContent.includes('验证码')) {
        return span;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

function getPwdSpan() {
  try {
    const spans = document.querySelectorAll('#douyin_login_comp_flat_panel span');

    for (let span of spans) {
      if (span.textContent && span.textContent.includes('密码登录')) {
        return span;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

function getLoginDiv() {
  try {
    const divs = document.querySelectorAll('#douyin_login_comp_flat_panel div');

    for (let div of divs) {
      // 获取元素的直接文本内容，不包括子元素
      let directText = '';
      for (let node of div.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          directText += node.textContent || '';
        }
      }
      
      const text = directText.trim();
      if (text === '登录' || text === '登录/注册') {
        return div;
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

function getMobileInput() {
  try {
    const input = document.querySelector('input[placeholder="请输入手机号"]');
    return input;
  } catch (e) {
    return null;
  }
}

function getPwdInput() {
  try {
    const input = document.querySelector('input[placeholder="请输入密码"]');
    return input;
  } catch (e) {
    return null;
  }
}

function tryClick(element) {
  if (!element) return false;
  
  console.log("尝试点击元素:", element);
  
  // 方法1: 直接调用 click()
  try {
    element.click();
    console.log("✅ 直接 click() 成功");
    return true;
  } catch (e) {
    console.log("❌ 直接 click() 失败:", e);
  }
  
  // 方法2: 触发完整的鼠标事件序列
  try {
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const eventOptions = {
      bubbles: true,
      cancelable: true,
      view: window,
      detail: 1,
      button: 0,
      buttons: 1,
      clientX: x,
      clientY: y
    };
    
    element.dispatchEvent(new MouseEvent("mousedown", eventOptions));
    element.dispatchEvent(new MouseEvent("mouseup", eventOptions));
    element.dispatchEvent(new MouseEvent("click", eventOptions));
    
    console.log("✅ 完整鼠标事件成功");
    return true;
  } catch (e) {
    console.log("❌ 完整鼠标事件失败:", e);
  }
  
  return false;
}

function exec_login() {
  const username = "{username}";
  const password = "{password}";

  const isPwd = Boolean(password);
  const mobile = username;

  console.log("登录信息:", { username, isPwd });

  /** 检查页面是否成功加载 */
  function checkLoadFinish() {
    try {
      if (!isPwd) {
        clearInterval(iFinish);
      }
      // id为douyin_login_comp_flat_panel 的article
      var btn_login = getLoginDiv();
      if (btn_login) {
        clearInterval(iFinish);
        var btn_pwd = getPwdSpan();

        if (btn_pwd) {
          tryClick(btn_pwd)
        }

        tryClick(btn_login);
      }
    } catch (e) {
      console.error("检查是否登录失败", e);
    }
  }

  function checkSwitch() {
    try {
      if (!getNotLoginDiv()) {
        console.log("已经登录");
        clearInterval(iSwitch);
        return;
      }

      var btn_login = getLoginDiv();
      var btn_pwd = getPwdSpan();
      var btn_mobile = getCaptchaTabSpan();
      var input_email = getMobileInput();
      var input_mobile = getMobileInput();
      var input_pwd = getPwdInput();
      var captcha = getCaptchaSpan();

      if (isPwd && btn_pwd) {
        console.log("切换到邮箱登录");
        tryClick(btn_pwd);
      }

      if (!isPwd && btn_mobile) {
        console.log("切换到手机登录");
        tryClick(btn_mobile);
      }

      if (input_email && input_pwd && isPwd) {
        console.log("邮箱登录模式");
        clearInterval(iSwitch);
        console.log("设置账户:", username);
        console.log("设置密码:", password);

        // 使用React/Vue兼容的方式设置手机号
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        nativeInputValueSetter.call(input_email, username);
        input_email.dispatchEvent(new Event('input', { bubbles: true }));
        input_email.dispatchEvent(new Event('change', { bubbles: true }));
        
        // 使用React/Vue兼容的方式设置密码
        nativeInputValueSetter.call(input_pwd, password);
        input_pwd.dispatchEvent(new Event('input', { bubbles: true }));
        input_pwd.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(function () {
          if (btn_login) {
            tryClick(btn_login);
          }
        }, 100);
      }

      if (input_mobile && !isPwd) {
        console.log("手机号登录模式");
        clearInterval(iSwitch);

        setInputValue(input_mobile, mobile);

        setTimeout(function () {
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

  setTimeout(function () {
    clearInterval(iFinish);
    clearInterval(iSwitch);
    console.log("登录脚本执行完成");
  }, 10000);
}

setTimeout(exec_login, 2000);`;

module.exports = douyinScript;
