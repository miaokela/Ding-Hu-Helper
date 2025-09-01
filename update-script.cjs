const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// 数据库路径
const dbPath = '/var/root/Library/Application Support/multi-brower/app.db';

try {
  // 读取修复后的脚本内容
  const scriptContent = fs.readFileSync('./qianchuan-login.js', 'utf8');
  
  // 连接数据库
  const db = new Database(dbPath);
  
  // 更新脚本
  const stmt = db.prepare('UPDATE script SET code = ? WHERE name = ?');
  const result = stmt.run(scriptContent, '千川自动登录');
  
  console.log(`已更新脚本，影响行数: ${result.changes}`);
  
  // 查看更新后的脚本信息
  const selectStmt = db.prepare('SELECT id, name, description FROM script WHERE name = ?');
  const scriptInfo = selectStmt.get('千川自动登录');
  console.log('更新后的脚本信息:', scriptInfo);
  
  db.close();
  console.log('脚本更新完成');
} catch (error) {
  console.error('更新脚本时出错:', error);
}
