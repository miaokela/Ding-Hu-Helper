const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// 读取千川登录脚本内容
const scriptPath = path.join(__dirname, 'qianchuan-login.js');
const scriptContent = fs.readFileSync(scriptPath, 'utf8');

// 数据库路径
const dbPath = '/var/root/Library/Application Support/multi-brower/app.db';

console.log('准备插入千川登录脚本到数据库...');

// 连接数据库
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('连接数据库失败:', err.message);
    process.exit(1);
  }
  console.log('✅ 数据库连接成功');
});

// 检查是否已经存在千川登录脚本
db.get("SELECT id FROM script WHERE name = ?", ['千川自动登录'], (err, row) => {
  if (err) {
    console.error('查询失败:', err.message);
    process.exit(1);
  }
  
  if (row) {
    console.log('🔄 千川登录脚本已存在，更新内容...');
    // 更新现有脚本
    db.run("UPDATE script SET code = ?, description = ? WHERE name = ?", 
      [scriptContent, '千川平台自动登录脚本，支持邮箱和手机号登录', '千川自动登录'], 
      function(err) {
        if (err) {
          console.error('更新脚本失败:', err.message);
        } else {
          console.log('✅ 千川登录脚本更新成功');
        }
        db.close();
      });
  } else {
    console.log('➕ 插入新的千川登录脚本...');
    // 插入新脚本
    db.run("INSERT INTO script (name, code, description) VALUES (?, ?, ?)", 
      ['千川自动登录', scriptContent, '千川平台自动登录脚本，支持邮箱和手机号登录'], 
      function(err) {
        if (err) {
          console.error('插入脚本失败:', err.message);
        } else {
          console.log('✅ 千川登录脚本插入成功，ID:', this.lastID);
        }
        db.close();
      });
  }
});
