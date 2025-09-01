#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const os = require('os');
const sqlite3 = require('sqlite3').verbose();

console.log('🧹 清空数据库表记录...');

async function clearDatabase() {
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
        await clearDatabaseFile(dbPath);
      } else {
        console.log(`⚠️  数据库文件不存在: ${dbPath}`);
      }
    }
    
    console.log('✅ 数据库清空完成!');
  } catch (error) {
    console.error('❌ 清空数据库时出错:', error);
    process.exit(1);
  }
}

async function clearDatabaseFile(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath);
    
    // 要清空的表
    const tablesToClear = [
      'bookmark',
      'account', 
      'script',
      'domain'
    ];
    
    let completed = 0;
    const total = tablesToClear.length;
    
    tablesToClear.forEach(tableName => {
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
  clearDatabase();
}

module.exports = { clearDatabase };
