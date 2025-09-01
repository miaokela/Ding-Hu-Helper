# 数据库清空脚本使用说明

这个项目现在包含了几个用于管理数据库记录的脚本，特别是在打包时自动清空数据库表。

## 自动清空功能

### 打包时自动清空
当你运行 `npm run build` 或 `yarn build` 时，系统会**自动清空所有数据库表**的记录，包括：
- `bookmark` (书签表)
- `account` (账户表) 
- `script` (脚本表)
- `domain` (域名表)

这确保了每次打包的应用都有一个干净的数据库状态。

## 手动清空选项

### 1. 清空所有表
```bash
npm run clear:db
# 或
yarn clear:db
```

### 2. 选择性清空特定表
```bash
# 只清空书签表
npm run clear:bookmarks

# 只清空账户表  
npm run clear:accounts

# 只清空脚本表
npm run clear:scripts

# 只清空域名表
npm run clear:domains
```

### 3. 自定义选择性清空
```bash
# 清空多个指定表
npm run clear:db:selective bookmark account

# 或直接使用脚本
node scripts/clear-selected-tables.cjs bookmark domain
```

## 脚本位置

- **完全清空**: `scripts/clear-database.cjs`
- **选择性清空**: `scripts/clear-selected-tables.cjs`

## 数据库位置

脚本会同时清空以下位置的数据库：
1. 用户数据目录: `~/Library/Application Support/multi-brower/app.db`
2. 项目根目录: `./domains.db`

## 安全提示

⚠️ **注意**: 清空操作是不可逆的！请确保在执行清空操作前已经备份了重要数据。

## 日志输出

脚本会提供详细的日志输出，包括：
- 🧹 开始清空提示
- 📍 当前处理的数据库文件
- ✅ 成功清空的表
- ⚠️ 不存在的表或文件
- ❌ 错误信息

## 使用场景

1. **开发测试**: 需要重置数据库到初始状态
2. **打包发布**: 确保发布版本有干净的数据库
3. **调试问题**: 排除数据相关的问题
4. **演示准备**: 为演示准备干净的环境
