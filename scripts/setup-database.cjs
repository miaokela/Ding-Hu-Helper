#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

const rootDir = path.join(__dirname, '..');

// 使用与 Electron 应用相同的数据库路径
function getUserDataPath() {
  const platform = os.platform();
  const homeDir = os.homedir();
  const appName = 'Multi-Browser 试用版'; // 与 package.json 中的 productName 一致
  
  switch (platform) {
    case 'darwin': // macOS
      return path.join(homeDir, 'Library', 'Application Support', appName);
    case 'win32': // Windows
      return path.join(homeDir, 'AppData', 'Roaming', appName);
    case 'linux': // Linux
      return path.join(homeDir, '.config', appName);
    default:
      return path.join(homeDir, '.' + appName);
  }
}

const userDataPath = getUserDataPath();
const domainsDbPath = path.join(userDataPath, 'app.db');

console.log('检查数据库文件...');

async function setupDatabase() {
  try {
    // 确保用户数据目录存在
    if (!fs.existsSync(userDataPath)) {
      fs.mkdirSync(userDataPath, { recursive: true });
      console.log(`✅ 创建用户数据目录: ${userDataPath}`);
    }
    
    console.log(`创建/检查数据库: ${domainsDbPath}`);
    
    const db = new sqlite3.Database(domainsDbPath);
    
    // 使用 Promise 包装数据库操作
    const runQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve(this);
        });
      });
    };
    
    const getQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
    };
    
    const allQuery = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };
    
    console.log('✅ 数据库连接成功');
    
    // 1. 创建域名表（如果不存在）
    await runQuery(`
      CREATE TABLE IF NOT EXISTS domain (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        name TEXT NOT NULL,
        page_id TEXT NOT NULL
      )
    `);
    console.log('✅ 数据表 domain 创建/检查完成');
    
    // 2. 检查域名表是否有 account_id 和 script_id 列
    const domainColumns = await allQuery("PRAGMA table_info(domain)");
    const hasAccountId = domainColumns.some(col => col.name === 'account_id');
    const hasScriptId = domainColumns.some(col => col.name === 'script_id');
    
    if (!hasAccountId) {
      console.log('🔄 为 domain 表添加 account_id 列...');
      await runQuery("ALTER TABLE domain ADD COLUMN account_id INTEGER");
      console.log('✅ account_id 列添加成功');
    } else {
      console.log('✅ domain 表 account_id 列已存在');
    }
    
    if (!hasScriptId) {
      console.log('🔄 为 domain 表添加 script_id 列...');
      await runQuery("ALTER TABLE domain ADD COLUMN script_id INTEGER");
      console.log('✅ script_id 列添加成功');
    } else {
      console.log('✅ domain 表 script_id 列已存在');
    }
    
    // 3. 创建账户表（如果不存在）
    await runQuery(`
      CREATE TABLE IF NOT EXISTS account (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        password TEXT NOT NULL,
        name TEXT NOT NULL
      )
    `);
    console.log('✅ 数据表 account 创建/检查完成');
    
    // 4. 创建脚本表（如果不存在）
    await runQuery(`
      CREATE TABLE IF NOT EXISTS script (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        preset_script_id TEXT
      )
    `);
    console.log('✅ 数据表 script 创建/检查完成');
    
    // 检查并添加 preset_script_id 列（如果不存在）
    try {
      const tableInfo = await allQuery("PRAGMA table_info(script)");
      const hasPresetScriptId = tableInfo.some(col => col.name === 'preset_script_id');
      
      if (!hasPresetScriptId) {
        await runQuery("ALTER TABLE script ADD COLUMN preset_script_id TEXT");
        console.log('✅ script 表 preset_script_id 列已添加');
      } else {
        console.log('✅ script 表 preset_script_id 列已存在');
      }
    } catch (error) {
      console.error('检查/添加 preset_script_id 列失败:', error);
    }

    // 5. 创建书签表（如果不存在）
    await runQuery(`
      CREATE TABLE IF NOT EXISTS bookmark (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        account_id INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        sort_order INTEGER DEFAULT 0,
        FOREIGN KEY (account_id) REFERENCES account (id) ON DELETE CASCADE
      )
    `);
    
    // 检查书签表是否需要迁移 domain_id 到 account_id
    const bookmarkColumns = await allQuery("PRAGMA table_info(bookmark)");
    const hasAccountIdInBookmark = bookmarkColumns.some(col => col.name === 'account_id');
    const hasDomainIdInBookmark = bookmarkColumns.some(col => col.name === 'domain_id');
    
    if (hasDomainIdInBookmark && !hasAccountIdInBookmark) {
      console.log('🔄 迁移书签表从 domain_id 到 account_id...');
      
      // 添加 account_id 列
      await runQuery("ALTER TABLE bookmark ADD COLUMN account_id INTEGER");
      
      // 迁移数据：将 domain_id 对应的 account_id 复制过来
      await runQuery(`
        UPDATE bookmark 
        SET account_id = (
          SELECT domain.account_id 
          FROM domain 
          WHERE domain.id = bookmark.domain_id
        )
        WHERE domain_id IS NOT NULL
      `);
      
      // 删除旧的 domain_id 列（SQLite不支持直接删除列，需要重建表）
      await runQuery(`
        CREATE TABLE bookmark_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          account_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          sort_order INTEGER DEFAULT 0,
          FOREIGN KEY (account_id) REFERENCES account (id) ON DELETE CASCADE
        )
      `);
      
      await runQuery(`
        INSERT INTO bookmark_new (id, name, url, account_id, created_at, sort_order)
        SELECT id, name, url, account_id, created_at, sort_order FROM bookmark
      `);
      
      await runQuery("DROP TABLE bookmark");
      await runQuery("ALTER TABLE bookmark_new RENAME TO bookmark");
      
      console.log('✅ 书签表迁移完成');
    } else if (!hasAccountIdInBookmark) {
      console.log('🔄 为 bookmark 表添加 account_id 列...');
      await runQuery("ALTER TABLE bookmark ADD COLUMN account_id INTEGER");
      console.log('✅ account_id 列添加成功');
    }
    
    console.log('✅ 数据表 bookmark 创建/检查完成');
    
    // 5. 检查是否需要插入示例数据
    const domainCount = await getQuery("SELECT COUNT(*) as count FROM domain");
    console.log(`📊 当前数据库中有 ${domainCount.count} 条域名记录`);
    
    if (domainCount.count === 0) {
      console.log('插入示例域名数据...');
      const sampleDomains = [
        ['https://www.google.com', 'Google', 'page-' + Date.now() + '-1'],
        ['https://www.github.com', 'GitHub', 'page-' + Date.now() + '-2'],
        ['https://www.stackoverflow.com', 'Stack Overflow', 'page-' + Date.now() + '-3']
      ];
      
      for (const [url, name, pageId] of sampleDomains) {
        await runQuery('INSERT INTO domain (url, name, page_id) VALUES (?, ?, ?)', [url, name, pageId]);
        console.log(`✅ 插入域名: ${name} (${url})`);
      }
    }
    
    const accountCount = await getQuery("SELECT COUNT(*) as count FROM account");
    console.log(`📊 当前数据库中有 ${accountCount.count} 条账户记录`);
    
    if (accountCount.count === 0) {
      console.log('插入示例账户数据...');
      const sampleAccounts = [
        ['admin', 'admin123', 'Administrator'],
        ['user1', 'password123', 'Test User 1']
      ];
      
      for (const [username, password, name] of sampleAccounts) {
        await runQuery('INSERT INTO account (username, password, name) VALUES (?, ?, ?)', [username, password, name]);
        console.log(`✅ 插入账户: ${name} (${username})`);
      }
    }
    
    const scriptCount = await getQuery("SELECT COUNT(*) as count FROM script");
    console.log(`📊 当前数据库中有 ${scriptCount.count} 条脚本记录`);

    const bookmarkCount = await getQuery("SELECT COUNT(*) as count FROM bookmark");
    console.log(`📊 当前数据库中有 ${bookmarkCount.count} 条书签记录`);
    
    if (scriptCount.count === 0) {
      console.log('插入示例脚本数据...');
      const sampleScripts = [
        [
          'Auto Login Example',
          `// 自动登录示例脚本
// 等待页面加载完成
setTimeout(() => {
  // 查找用户名输入框
  const usernameInput = document.querySelector('input[type="text"], input[name*="user"], input[id*="user"]');
  if (usernameInput) {
    usernameInput.value = '{username}';
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // 查找密码输入框
  const passwordInput = document.querySelector('input[type="password"]');
  if (passwordInput) {
    passwordInput.value = '{password}';
    passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
  }
  
  // 查找登录按钮并点击
  const loginButton = document.querySelector('button[type="submit"], input[type="submit"], button:contains("登录"), button:contains("Login")');
  if (loginButton) {
    setTimeout(() => loginButton.click(), 500);
  }
}, 1000);`,
          '通用自动登录脚本示例'
        ]
      ];
      
      for (const [name, code, description] of sampleScripts) {
        await runQuery('INSERT INTO script (name, code, description) VALUES (?, ?, ?)', [name, code, description]);
        console.log(`✅ 插入脚本: ${name}`);
      }
    }
    
    if (bookmarkCount.count === 0) {
      console.log('插入示例书签数据...');
      
      // 获取第一个账户的ID作为示例书签的关联账户
      const firstAccount = await getQuery("SELECT id FROM account LIMIT 1");
      const accountId = firstAccount ? firstAccount.id : null;
      
      const sampleBookmarks = [
        ['Google Search', 'https://www.google.com', accountId],
        ['GitHub', 'https://www.github.com', accountId],
        ['MDN Web Docs', 'https://developer.mozilla.org', accountId]
      ];
      
      for (const [name, url, accId] of sampleBookmarks) {
        await runQuery('INSERT INTO bookmark (name, url, account_id, sort_order) VALUES (?, ?, ?, ?)', [name, url, accId, 0]);
        console.log(`✅ 插入书签: ${name} (${url}) - 关联账户ID: ${accId}`);
      }
    }
    
    // 关闭数据库连接
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error('关闭数据库失败:', err.message);
        else console.log('✅ 数据库连接已关闭');
        resolve();
      });
    });
    
    console.log('🎉 数据库设置完成！');
    
  } catch (error) {
    console.error('❌ 数据库设置失败:', error);
    process.exit(1);
  }
}

// 检查数据库文件是否存在
if (fs.existsSync(domainsDbPath)) {
  console.log('📁 找到现有数据库文件');
} else {
  console.log('📁 数据库文件不存在，将创建新文件');
}

setupDatabase()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 执行失败:', error);
    process.exit(1);
  });
