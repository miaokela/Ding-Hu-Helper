#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

// 解析命令行参数
const args = process.argv.slice(2);
const tablesToClear = args.length > 0 ? args : ['bookmark', 'account', 'script', 'domain'];

console.log(`🧹 选择性清空数据库表: ${tablesToClear.join(', ')}`);

async function clearSelectedTables() {
  try {
    // 使用与 Electron 应用相同的数据库路径
    const userDataPath = path.join(os.homedir(), 'Library', 'Application Support', 'multi-brower');
    const domainsDbPath = path.join(userDataPath, 'app.db');
    
    // 同时清理项目根目录下的数据库文件
    const rootDbPath = path.join(__dirname, '..', 'domains.db');
    
    const dbPaths = [domainsDbPath, rootDbPath];
    
    for (const dbPath of dbPaths) {
      if (fs.existsSync(dbPath)) {
        console.log(`📍 正在清空数据库: ${dbPath}`);
        await clearDatabaseFile(dbPath, tablesToClear);
      } else {
        console.log(`⚠️  数据库文件不存在: ${dbPath}`);
      }
    }
    
    console.log('✅ 选择性数据库清空完成!');
  } catch (error) {
    console.error('❌ 清空数据库时出错:', error);
    process.exit(1);
  }
}

async function clearDatabaseFile(dbPath, tables) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    let completed = 0;
    const total = tables.length;
    
    tables.forEach(tableName => {
      // 先检查表是否存在
      db.get(
        "SELECT name FROM sqlite_master WHERE type='table' AND name=?",
        [tableName],
        (err, row) => {
          if (err) {
            console.error(`❌ 检查表 ${tableName} 时出错:`, err);
            completed++;
            if (completed === total) {
              db.close();
              resolve();
            }
            return;
          }
          
          if (row) {
            // 表存在，清空记录
            db.run(`DELETE FROM ${tableName}`, (err) => {
              if (err) {
                console.error(`❌ 清空表 ${tableName} 时出错:`, err);
              } else {
                console.log(`✅ 已清空表: ${tableName}`);
              }
              
              completed++;
              if (completed === total) {
                db.close();
                resolve();
              }
            });
          } else {
            console.log(`⚠️  表 ${tableName} 不存在，跳过`);
            completed++;
            if (completed === total) {
              db.close();
              resolve();
            }
          }
        }
      );
    });
  });
}

// 如果直接运行此脚本
if (require.main === module) {
  clearSelectedTables();
}

module.exports = { clearSelectedTables };
