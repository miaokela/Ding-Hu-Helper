# 🛡️ 360安全软件兼容性指南

## 问题原因分析

360安全软件将您的应用标记为不安全主要由于以下原因：

1. **协议注册** - 应用注册了多个自定义协议处理器
2. **代码签名缺失** - 没有有效的数字证书签名
3. **行为特征** - 某些功能类似恶意软件行为模式
4. **白名单机制** - 应用不在360信任的白名单中

## 解决方案

### ✅ 已实施的安全优化

1. **移除协议注册**
   - 完全移除 `app.setAsDefaultProtocolClient()` 调用
   - 删除 `open-url` 事件处理器
   - 改用纯客户端对话框拦截机制

2. **降低权限要求**
   - 设置 `requestedExecutionLevel: "asInvoker"`
   - 禁用管理员权限提升 `allowElevation: false`
   - 不修改系统注册表

3. **添加应用程序清单**
   - 明确声明权限需求
   - 标识为生产力工具
   - 设置兼容性信息

4. **优化安装程序**
   - 禁用一键安装，允许用户选择安装位置
   - 设置安装后不自动运行
   - 添加详细的产品信息

### 🔐 代码签名解决方案

#### 方案一：购买代码签名证书（推荐）

1. **购买证书**
   - DigiCert, Sectigo, GlobalSign 等CA机构
   - 费用：约300-800美元/年
   - 需要企业营业执照

2. **配置证书**
   ```json
   "win": {
     "certificateFile": "build/certificate.p12",
     "certificatePassword": "your_password",
     "publisherName": "Your Company Name"
   }
   ```

3. **时间戳服务器**
   ```json
   "win": {
     "timeStampServer": "http://timestamp.digicert.com"
   }
   ```

#### 方案二：自签名证书（临时方案）

```bash
# 创建自签名证书
openssl req -x509 -newkey rsa:4096 -keyout private.key -out certificate.crt -days 365 -nodes
# 转换为p12格式
openssl pkcs12 -export -out certificate.p12 -inkey private.key -in certificate.crt
```

**注意：** 自签名证书仍会被360标记，但误报程度较低。

### 🏗️ 构建安全版本

运行安全构建命令：
```bash
npm run build:secure
```

这将：
- 验证所有安全配置
- 生成安全信息文件
- 构建360友好版本

### 📋 360安全软件白名单申请

1. **申请白名单**
   - 访问：360开发者平台
   - 提交应用审核
   - 提供详细功能说明

2. **准备材料**
   - 应用功能说明书
   - 企业资质证明
   - 代码签名证书
   - 安全扫描报告

### 🔍 验证安全性

#### 检查清单

- [ ] 移除所有协议注册代码
- [ ] 设置asInvoker权限级别
- [ ] 添加应用程序清单文件
- [ ] 配置代码签名证书
- [ ] 设置正确的产品信息
- [ ] 禁用管理员权限要求
- [ ] 添加时间戳服务器

#### 测试方法

1. **本地测试**
   ```bash
   # 构建测试版本
   npm run build:secure
   
   # 检查生成的exe文件属性
   # 右键 -> 属性 -> 数字签名
   ```

2. **360安全扫描**
   - 使用360安全卫士全盘扫描
   - 检查是否还有误报
   - 验证安装过程

3. **其他安全软件测试**
   - 腾讯电脑管家
   - Windows Defender
   - 火绒安全软件

### 🚀 发布流程

1. **预发布检查**
   ```bash
   # 生成安全版本
   npm run build:secure
   
   # 验证构建产物
   node -e "console.log(require('./build/security-info.json'))"
   ```

2. **签名验证**
   ```bash
   # Windows: 检查签名
   signtool verify /pa /v dist/Multi-Browser.exe
   
   # macOS: 检查签名  
   codesign -vvv --deep --strict dist/Multi-Browser.app
   ```

3. **分发策略**
   - 官网直接下载
   - 软件管家平台
   - GitHub Releases
   - 企业内部分发

### 📞 技术支持

如果仍然遇到360安全软件误报：

1. **联系360客服**
   - 报告误报情况
   - 提供应用详细信息
   - 申请人工审核

2. **用户指导**
   - 提供安装指南
   - 说明如何添加信任
   - 设置360白名单

3. **备选方案**
   - 绿色版本（免安装）
   - 便携版本
   - 在线版本

## 📊 效果评估

实施上述优化后，360安全软件误报率应该显著降低：

- **协议注册风险**：已完全消除 ✅
- **权限提升风险**：已完全消除 ✅  
- **注册表修改风险**：已完全消除 ✅
- **代码签名风险**：需要购买证书 ⚠️
- **白名单风险**：需要申请审核 ⚠️

## 🔄 持续优化

- 定期更新代码签名证书
- 监控安全软件检测规则变化
- 收集用户反馈并持续改进
- 关注行业最佳实践
