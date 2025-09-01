#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

// 检查可能的数据库路径
const possiblePaths = [
  // 用户数据路径
  path.join(os.homedir(), 'Library', 'Application Support', 'multi-brower', 'app.db'),
  // root 用户路径
  path.join('/var/root/Library/Application Support/multi-brower', 'app.db'),
  // 系统路径
  path.join('/Library/Application Support/multi-brower', 'app.db'),
];

console.log('🔍 搜索数据库文件...');

async function fixDatabase(dbPath) {
  console.log(`🔧 修复数据库: ${dbPath}`);
  
  const db = new sqlite3.Database(dbPath);
  
  // 使用 Promise 包装数据库操作
  const runQuery = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function(err) {
        if (err) reject(err);
        else resolve(this);
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
  
  try {
    // 检查 script 表是否存在 preset_script_id 列
    const tableInfo = await allQuery("PRAGMA table_info(script)");
    const hasPresetScriptId = tableInfo.some(col => col.name === 'preset_script_id');
    
    if (!hasPresetScriptId) {
      console.log('➕ 添加 preset_script_id 列...');
      await runQuery("ALTER TABLE script ADD COLUMN preset_script_id TEXT");
      console.log('✅ preset_script_id 列已添加');
    } else {
      console.log('✅ preset_script_id 列已存在');
    }
    
    // 关闭数据库连接
    await new Promise((resolve) => {
      db.close((err) => {
        if (err) console.error('关闭数据库失败:', err.message);
        else console.log('✅ 数据库连接已关闭');
        resolve();
      });
    });
    
    return true;
  } catch (error) {
    console.error('❌ 修复数据库失败:', error);
    return false;
  }
}

async function main() {
  let fixed = false;
  
  for (const dbPath of possiblePaths) {
    if (fs.existsSync(dbPath)) {
      console.log(`📁 找到数据库文件: ${dbPath}`);
      try {
        const success = await fixDatabase(dbPath);
        if (success) {
          fixed = true;
          console.log(`🎉 成功修复数据库: ${dbPath}`);
        }
      } catch (error) {
        console.error(`❌ 修复数据库失败 ${dbPath}:`, error);
      }
    } else {
      console.log(`❌ 数据库文件不存在: ${dbPath}`);
    }
  }
  
  if (!fixed) {
    console.error('❌ 未找到可修复的数据库文件');
    process.exit(1);
  } else {
    console.log('🎉 所有数据库修复完成！');
  }
}

main().catch(error => {
  console.error('❌ 执行失败:', error);
  process.exit(1);
});
