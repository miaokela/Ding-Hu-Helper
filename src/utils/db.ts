// Domain 类型定义
export interface Domain {
  id: number;
  url: string;
  name: string;
  page_id: string;
  account_id?: number | null;
  script_id?: number | null;
}

// Account 类型定义
export interface Account {
  id: number;
  username: string;
  password: string;
  name: string;
}

// Script 类型定义
export interface Script {
  id: number;
  name: string;
  code: string;
  description?: string;
  preset_script_id?: string | null;
}

// Bookmark 类型定义
export interface Bookmark {
  id: number;
  name: string;
  url: string;
  account_id?: number | null;
  created_at: string;
  sort_order: number;
}

// 生成 UUID
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// 初始化数据库
export async function initDatabase() {
  try {
    console.log(`开始初始化数据库（使用默认路径）`);

    try {
      // 打开数据库连接 - 传递空字符串使用默认路径
      console.log("尝试打开数据库连接...");
      const openResult = (await window.sqliteAPI.openDB("")) as any;
      console.log("数据库连接结果:", openResult);

      if (!openResult || !openResult.success) {
        throw new Error("数据库连接失败: " + (openResult?.error || "未知错误"));
      }
    } catch (openError) {
      console.error("打开数据库连接失败:", openError);
      throw openError;
    }

    try {
      // 创建表结构
      console.log("尝试创建表结构...");

      // 创建域名表
      const createDomainTableSQL = `
        CREATE TABLE IF NOT EXISTS domain (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          url TEXT NOT NULL,
          name TEXT NOT NULL,
          page_id TEXT NOT NULL,
          account_id INTEGER,
          script_id INTEGER
        )
      `;

      // 创建账户表
      const createAccountTableSQL = `
        CREATE TABLE IF NOT EXISTS account (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL
        )
      `;

      // 创建脚本表
      const createScriptTableSQL = `
        CREATE TABLE IF NOT EXISTS script (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          code TEXT NOT NULL,
          description TEXT,
          preset_script_id TEXT
        )
      `;

      // 创建书签表
      const createBookmarkTableSQL = `
        CREATE TABLE IF NOT EXISTS bookmark (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          url TEXT NOT NULL,
          account_id INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          sort_order INTEGER DEFAULT 0,
          FOREIGN KEY (account_id) REFERENCES account (id) ON DELETE CASCADE
        )
      `;

      // 首先创建域名表
      const createDomainResult = (await window.sqliteAPI.run(
        createDomainTableSQL
      )) as any;
      console.log("域名表创建结果:", createDomainResult);

      console.log("执行SQL - 账户表:", createAccountTableSQL);
      const createAccountResult = (await window.sqliteAPI.run(
        createAccountTableSQL
      )) as any;
      console.log("账户表创建结果:", createAccountResult);

      console.log("执行SQL - 脚本表:", createScriptTableSQL);
      const createScriptResult = (await window.sqliteAPI.run(
        createScriptTableSQL
      )) as any;
      console.log("脚本表创建结果:", createScriptResult);

      console.log("执行SQL - 书签表:", createBookmarkTableSQL);
      const createBookmarkResult = (await window.sqliteAPI.run(
        createBookmarkTableSQL
      )) as any;
      console.log("书签表创建结果:", createBookmarkResult);

      if (
        !createDomainResult ||
        !createDomainResult.success ||
        !createAccountResult ||
        !createAccountResult.success ||
        !createScriptResult ||
        !createScriptResult.success ||
        !createBookmarkResult ||
        !createBookmarkResult.success
      ) {
        throw new Error(
          "创建表失败: " +
            (createDomainResult?.error ||
              createAccountResult?.error ||
              createScriptResult?.error ||
              createBookmarkResult?.error ||
              "未知错误")
        );
      }

      // 迁移逻辑：为现有的 script 表添加 preset_script_id 字段
      try {
        console.log("开始检查并添加 preset_script_id 字段...");

        // 检查字段是否已存在
        const columnCheckResult = (await window.sqliteAPI.all(
          "PRAGMA table_info(script)"
        )) as any;

        if (
          columnCheckResult &&
          columnCheckResult.success &&
          columnCheckResult.rows
        ) {
          const hasPresetScriptIdColumn = columnCheckResult.rows.some(
            (column: any) => column.name === "preset_script_id"
          );

          if (!hasPresetScriptIdColumn) {
            console.log("添加 preset_script_id 字段到 script 表...");
            const alterTableResult = (await window.sqliteAPI.run(
              "ALTER TABLE script ADD COLUMN preset_script_id TEXT"
            )) as any;
            console.log("字段添加结果:", alterTableResult);
          } else {
            console.log("preset_script_id 字段已存在，跳过添加");
          }
        }
      } catch (migrationError) {
        console.warn("字段迁移失败，但不影响主要功能:", migrationError);
      }

      // 验证表是否创建成功
      const domainTableCheckResult = (await window.sqliteAPI.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='domain'"
      )) as any;
      const accountTableCheckResult = (await window.sqliteAPI.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='account'"
      )) as any;
      const scriptTableCheckResult = (await window.sqliteAPI.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='script'"
      )) as any;
      const bookmarkTableCheckResult = (await window.sqliteAPI.all(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='bookmark'"
      )) as any;
      console.log("域名表检查结果:", domainTableCheckResult);
      console.log("账户表检查结果:", accountTableCheckResult);
      console.log("脚本表检查结果:", scriptTableCheckResult);
      console.log("书签表检查结果:", bookmarkTableCheckResult);

      if (
        domainTableCheckResult &&
        domainTableCheckResult.success &&
        domainTableCheckResult.rows &&
        domainTableCheckResult.rows.length > 0 &&
        accountTableCheckResult &&
        accountTableCheckResult.success &&
        accountTableCheckResult.rows &&
        accountTableCheckResult.rows.length > 0 &&
        scriptTableCheckResult &&
        scriptTableCheckResult.success &&
        scriptTableCheckResult.rows &&
        scriptTableCheckResult.rows.length > 0 &&
        bookmarkTableCheckResult &&
        bookmarkTableCheckResult.success &&
        bookmarkTableCheckResult.rows &&
        bookmarkTableCheckResult.rows.length > 0
      ) {
        console.log("验证所有表创建成功");
      } else {
        console.warn("表可能未完全创建成功，但没有抛出错误");
      }
    } catch (tableError) {
      console.error("创建表结构失败:", tableError);
      throw tableError;
    }

    return true;
  } catch (error) {
    console.error("Database initialization failed:", error);
    return false;
  }
}

// 获取所有域名记录
export async function getAllDomains(): Promise<Domain[]> {
  try {
    console.log("获取所有域名记录...");
    const result = (await window.sqliteAPI.all(
      "SELECT * FROM domain ORDER BY name"
    )) as any;
    console.log("获取到的域名记录:", result);

    if (result && result.success && result.rows) {
      return result.rows;
    }
    return [];
  } catch (error) {
    console.error("Error fetching domains:", error);
    return [];
  }
}

// 添加新域名
export async function addDomain(
  url: string,
  name: string,
  accountId?: number,
  scriptId?: number
): Promise<Domain | null> {
  try {
    console.log(
      `添加新域名: ${name}, ${url}, 账户ID: ${accountId}, 脚本ID: ${scriptId}`
    );
    const page_id = generateUUID();
    console.log(`生成的page_id: ${page_id}`);

    const result = (await window.sqliteAPI.run(
      "INSERT INTO domain (url, name, page_id, account_id, script_id) VALUES (?, ?, ?, ?, ?)",
      [url, name, page_id, accountId || null, scriptId || null]
    )) as any;
    console.log("插入结果:", result);

    if (result && result.success) {
      // 获取新添加的记录
      console.log("获取新添加的记录...");
      const newDomainResult = (await window.sqliteAPI.get(
        "SELECT * FROM domain WHERE rowid = last_insert_rowid()"
      )) as any;
      console.log("新添加的记录:", newDomainResult);

      if (newDomainResult && newDomainResult.success && newDomainResult.row) {
        return newDomainResult.row;
      }
    }
    return null;
  } catch (error) {
    console.error("Error adding domain:", error);
    return null;
  }
}

// 删除域名
export async function deleteDomain(id: number): Promise<boolean> {
  try {
    console.log(`删除域名ID: ${id}`);
    const result = (await window.sqliteAPI.run(
      "DELETE FROM domain WHERE id = ?",
      [id]
    )) as any;
    console.log("删除结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error deleting domain:", error);
    return false;
  }
}

// 更新域名
export async function updateDomain(domain: Domain): Promise<boolean> {
  try {
    console.log(`更新域名: ${JSON.stringify(domain)}`);
    const result = (await window.sqliteAPI.run(
      "UPDATE domain SET url = ?, name = ?, account_id = ?, script_id = ? WHERE id = ?",
      [
        domain.url,
        domain.name,
        domain.account_id || null,
        domain.script_id || null,
        domain.id,
      ]
    )) as any;
    console.log("更新结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error updating domain:", error);
    return false;
  }
}

// 获取所有账户记录
export async function getAllAccounts(): Promise<Account[]> {
  try {
    console.log("获取所有账户记录...");
    const result = (await window.sqliteAPI.all(
      "SELECT * FROM account ORDER BY name"
    )) as any;
    console.log("获取到的账户记录:", result);

    if (result && result.success && result.rows) {
      return result.rows;
    }
    return [];
  } catch (error) {
    console.error("Error fetching accounts:", error);
    return [];
  }
}

// 添加新账户
export async function addAccount(
  username: string,
  password: string,
  name: string
): Promise<Account | null> {
  try {
    console.log(`添加新账户: ${name}, ${username}`);

    const result = (await window.sqliteAPI.run(
      "INSERT INTO account (username, password, name) VALUES (?, ?, ?)",
      [username, password, name]
    )) as any;
    console.log("插入结果:", result);

    if (result && result.success) {
      // 获取新添加的记录
      console.log("获取新添加的账户记录...");
      const newAccountResult = (await window.sqliteAPI.get(
        "SELECT * FROM account WHERE rowid = last_insert_rowid()"
      )) as any;
      console.log("新添加的账户记录:", newAccountResult);

      if (
        newAccountResult &&
        newAccountResult.success &&
        newAccountResult.row
      ) {
        return newAccountResult.row;
      }
    }
    return null;
  } catch (error) {
    console.error("Error adding account:", error);
    return null;
  }
}

// 删除账户
export async function deleteAccount(id: number): Promise<boolean> {
  try {
    console.log(`删除账户ID: ${id}`);
    const result = (await window.sqliteAPI.run(
      "DELETE FROM account WHERE id = ?",
      [id]
    )) as any;
    console.log("删除结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error deleting account:", error);
    return false;
  }
}

// 更新账户
export async function updateAccount(account: Account): Promise<boolean> {
  try {
    console.log(`更新账户: ${JSON.stringify(account)}`);
    const result = (await window.sqliteAPI.run(
      "UPDATE account SET username = ?, password = ?, name = ? WHERE id = ?",
      [account.username, account.password, account.name, account.id]
    )) as any;
    console.log("更新结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error updating account:", error);
    return false;
  }
}

// 根据ID获取账户信息
export async function getAccountById(id: number): Promise<Account | null> {
  try {
    console.log(`获取账户ID: ${id}`);
    const result = (await window.sqliteAPI.get(
      "SELECT * FROM account WHERE id = ?",
      [id]
    )) as any;
    console.log("获取账户结果:", result);

    if (result && result.success && result.row) {
      return result.row;
    }
    return null;
  } catch (error) {
    console.error("Error fetching account:", error);
    return null;
  }
}

// 获取所有脚本记录
export async function getAllScripts(): Promise<Script[]> {
  try {
    console.log("获取所有脚本记录...");
    const result = (await window.sqliteAPI.all(
      "SELECT * FROM script ORDER BY name"
    )) as any;
    console.log("获取到的脚本记录:", result);

    if (result && result.success && result.rows) {
      return result.rows;
    }
    return [];
  } catch (error) {
    console.error("Error fetching scripts:", error);
    return [];
  }
}

// 添加新脚本
export async function addScript(
  name: string,
  code: string,
  description?: string,
  presetScriptId?: string
): Promise<Script | null> {
  try {
    console.log(`添加新脚本: ${name}`);

    const result = (await window.sqliteAPI.run(
      "INSERT INTO script (name, code, description, preset_script_id) VALUES (?, ?, ?, ?)",
      [name, code, description || "", presetScriptId || null]
    )) as any;
    console.log("插入结果:", result);

    if (result && result.success) {
      // 获取新添加的记录
      console.log("获取新添加的脚本记录...");
      const newScriptResult = (await window.sqliteAPI.get(
        "SELECT * FROM script WHERE rowid = last_insert_rowid()"
      )) as any;
      console.log("新添加的脚本记录:", newScriptResult);

      if (newScriptResult && newScriptResult.success && newScriptResult.row) {
        return newScriptResult.row;
      }
    }
    return null;
  } catch (error) {
    console.error("Error adding script:", error);
    return null;
  }
}

// 删除脚本
export async function deleteScript(id: number): Promise<boolean> {
  try {
    console.log(`删除脚本ID: ${id}`);
    const result = (await window.sqliteAPI.run(
      "DELETE FROM script WHERE id = ?",
      [id]
    )) as any;
    console.log("删除结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error deleting script:", error);
    return false;
  }
}

// 更新脚本
export async function updateScript(script: Script): Promise<boolean> {
  try {
    console.log(
      `更新脚本: ${JSON.stringify({
        ...script,
        code: script.code.substring(0, 100) + "...",
      })}`
    );
    const result = (await window.sqliteAPI.run(
      "UPDATE script SET name = ?, code = ?, description = ?, preset_script_id = ? WHERE id = ?",
      [
        script.name,
        script.code,
        script.description || "",
        script.preset_script_id || null,
        script.id,
      ]
    )) as any;
    console.log("更新结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error updating script:", error);
    return false;
  }
}

// 根据ID获取脚本信息
export async function getScriptById(id: number): Promise<Script | null> {
  try {
    console.log(`获取脚本ID: ${id}`);
    const result = (await window.sqliteAPI.get(
      "SELECT * FROM script WHERE id = ?",
      [id]
    )) as any;
    console.log("获取脚本结果:", result);

    if (result && result.success && result.row) {
      return result.row;
    }
    return null;
  } catch (error) {
    console.error("Error fetching script:", error);
    return null;
  }
}

// ==================== 书签管理函数 ====================

// 获取所有书签
export async function getAllBookmarks(): Promise<Bookmark[]> {
  try {
    console.log("获取所有书签");
    const result = (await window.sqliteAPI.all(
      "SELECT * FROM bookmark ORDER BY sort_order ASC, created_at ASC"
    )) as any;
    console.log("获取书签结果:", result);
    return result && result.success ? (result.rows as Bookmark[]) : [];
  } catch (error) {
    console.error("Error getting all bookmarks:", error);
    return [];
  }
}

// 添加书签
export async function addBookmark(
  name: string,
  url: string,
  accountId?: number
): Promise<boolean> {
  try {
    console.log(`🔖 [addBookmark] 开始添加书签: ${name} - ${url}`);
    console.log(`🔖 [addBookmark] accountId: ${accountId}`);

    // 检查 sqliteAPI 是否存在
    if (!window.sqliteAPI) {
      console.error("❌ [addBookmark] window.sqliteAPI 不存在");
      return false;
    }

    // 获取当前最大的排序号
    console.log("🔍 [addBookmark] 查询最大排序号...");
    const maxSortResult = (await window.sqliteAPI.get(
      "SELECT MAX(sort_order) as max_sort FROM bookmark"
    )) as any;
    console.log("📊 [addBookmark] 最大排序号查询结果:", maxSortResult);

    const nextSortOrder =
      maxSortResult &&
      maxSortResult.success &&
      maxSortResult.row &&
      maxSortResult.row.max_sort
        ? maxSortResult.row.max_sort + 1
        : 0;
    console.log("🔢 [addBookmark] 下一个排序号:", nextSortOrder);

    console.log("💾 [addBookmark] 执行插入操作...");
    const result = (await window.sqliteAPI.run(
      "INSERT INTO bookmark (name, url, account_id, sort_order) VALUES (?, ?, ?, ?)",
      [name, url, accountId || null, nextSortOrder]
    )) as any;
    console.log("✅ [addBookmark] 插入结果:", result);

    const success = result && result.success;
    console.log(`🎯 [addBookmark] 最终结果: ${success ? "成功" : "失败"}`);
    return success;
  } catch (error) {
    console.error("💥 [addBookmark] Error adding bookmark:", error);
    return false;
  }
}

// 删除书签
export async function deleteBookmark(id: number): Promise<boolean> {
  try {
    console.log(`删除书签ID: ${id}`);
    const result = (await window.sqliteAPI.run(
      "DELETE FROM bookmark WHERE id = ?",
      [id]
    )) as any;
    console.log("删除书签结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error deleting bookmark:", error);
    return false;
  }
}

// 更新书签
export async function updateBookmark(bookmark: Bookmark): Promise<boolean> {
  try {
    console.log(`更新书签: ${JSON.stringify(bookmark)}`);
    const result = (await window.sqliteAPI.run(
      "UPDATE bookmark SET name = ?, url = ?, account_id = ?, sort_order = ? WHERE id = ?",
      [
        bookmark.name,
        bookmark.url,
        bookmark.account_id || null,
        bookmark.sort_order,
        bookmark.id,
      ]
    )) as any;
    console.log("更新书签结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error updating bookmark:", error);
    return false;
  }
}

// 更新书签排序
export async function updateBookmarkOrder(
  bookmarkId: number,
  newSortOrder: number
): Promise<boolean> {
  try {
    console.log(`更新书签 ${bookmarkId} 排序为: ${newSortOrder}`);
    const result = (await window.sqliteAPI.run(
      "UPDATE bookmark SET sort_order = ? WHERE id = ?",
      [newSortOrder, bookmarkId]
    )) as any;
    console.log("更新书签排序结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error updating bookmark order:", error);
    return false;
  }
}

// 检查URL是否已收藏
export async function isBookmarked(url: string): Promise<boolean> {
  try {
    console.log(`检查URL是否已收藏: ${url}`);
    const result = (await window.sqliteAPI.get(
      "SELECT id FROM bookmark WHERE url = ? LIMIT 1",
      [url]
    )) as any;
    console.log("检查收藏结果:", result);
    return result && result.success && result.row !== null;
  } catch (error) {
    console.error("Error checking if bookmarked:", error);
    return false;
  }
}

// 根据账户ID获取书签
export async function getBookmarksByAccountId(
  accountId: number
): Promise<Bookmark[]> {
  try {
    console.log(`获取账户 ${accountId} 的书签列表`);
    const result = (await window.sqliteAPI.all(
      "SELECT * FROM bookmark WHERE account_id = ? ORDER BY sort_order ASC",
      [accountId]
    )) as any;
    console.log("获取账户书签结果:", result);
    return result && result.success ? result.rows : [];
  } catch (error) {
    console.error("Error getting bookmarks by account:", error);
    return [];
  }
}

// 根据账户ID删除所有书签
export async function deleteBookmarksByAccountId(
  accountId: number
): Promise<boolean> {
  try {
    console.log(`删除账户 ${accountId} 的所有书签`);
    const result = (await window.sqliteAPI.run(
      "DELETE FROM bookmark WHERE account_id = ?",
      [accountId]
    )) as any;
    console.log("删除账户书签结果:", result);
    return result && result.success;
  } catch (error) {
    console.error("Error deleting bookmarks by account:", error);
    return false;
  }
}

// 检查账户是否有关联的书签
export async function hasBookmarksForAccount(
  accountId: number
): Promise<boolean> {
  try {
    console.log(`检查账户 ${accountId} 是否有书签`);
    const result = (await window.sqliteAPI.get(
      "SELECT COUNT(*) as count FROM bookmark WHERE account_id = ?",
      [accountId]
    )) as any;
    console.log("检查账户书签数量结果:", result);
    return result && result.success && result.row && result.row.count > 0;
  } catch (error) {
    console.error("Error checking bookmarks for account:", error);
    return false;
  }
}
