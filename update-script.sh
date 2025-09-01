#!/bin/bash

# 将 JavaScript 文件内容转义并更新到数据库
SCRIPT_CONTENT=$(cat qianchuan-login.js | sed "s/'/''/g")

sudo sqlite3 "/var/root/Library/Application Support/multi-brower/app.db" "UPDATE script SET code = '$SCRIPT_CONTENT' WHERE name = '千川自动登录';"

echo "脚本已更新"

# 验证更新
echo "验证更新结果:"
sudo sqlite3 "/var/root/Library/Application Support/multi-brower/app.db" "SELECT name, length(code) as code_length FROM script WHERE name = '千川自动登录';"
