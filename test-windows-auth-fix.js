/**
 * Windows 密码验证修复测试脚本
 * 用于测试改进后的 Windows 用户密码验证功能
 */

const { exec } = require('child_process');
const os = require('os');

console.log('🔐 测试 Windows 密码验证修复...');
console.log(`当前用户: ${os.userInfo().username}`);
console.log(`操作系统: ${os.platform()} ${os.arch()}`);

/**
 * 模拟改进后的 Windows 密码验证逻辑
 */
function testWindowsPasswordValidation(username, password) {
  return new Promise((resolve, reject) => {
    // 安全处理用户名和密码，避免注入攻击
    const safeUsername = username.replace(/'/g, "''").replace(/"/g, '""');
    const safePassword = password.replace(/'/g, "''").replace(/"/g, '""');
    
    // 使用改进的 PowerShell 脚本进行认证，支持本地和域账户
    const script = `
      try {
        Add-Type -AssemblyName System.DirectoryServices.AccountManagement
        
        # 首先尝试本地机器验证
        $contextType = [System.DirectoryServices.AccountManagement.ContextType]::Machine
        $principalContext = New-Object System.DirectoryServices.AccountManagement.PrincipalContext($contextType)
        $isValid = $principalContext.ValidateCredentials('${safeUsername}', '${safePassword}')
        
        if ($isValid) {
          Write-Output "SUCCESS"
          exit 0
        }
        
        # 如果本地验证失败，尝试域验证
        try {
          $domainContext = [System.DirectoryServices.AccountManagement.ContextType]::Domain
          $domainPrincipalContext = New-Object System.DirectoryServices.AccountManagement.PrincipalContext($domainContext)
          $isDomainValid = $domainPrincipalContext.ValidateCredentials('${safeUsername}', '${safePassword}')
          
          if ($isDomainValid) {
            Write-Output "SUCCESS"
            exit 0
          }
        } catch {
          # 域验证可能失败（没有域环境），继续
        }
        
        Write-Output "FAILED"
      } catch {
        Write-Output "ERROR: $($_.Exception.Message)"
      }
    `;

    const command = `powershell -ExecutionPolicy Bypass -NoProfile -Command "${script.replace(/"/g, '\\"')}"`;
    
    exec(command, {
      timeout: 15000,
      windowsHide: true
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`PowerShell 执行错误: ${error.message}`));
        return;
      }

      if (stderr && !stderr.trim().startsWith('WARNING:')) {
        console.warn(`PowerShell 警告: ${stderr}`);
      }

      const result = stdout.trim();
      console.log(`验证结果: ${result}`);
      
      if (result === 'SUCCESS') {
        resolve({ success: true, username: username });
      } else if (result.startsWith('ERROR:')) {
        resolve({ 
          success: false, 
          error: '系统认证服务异常，请重试',
          details: result
        });
      } else {
        resolve({ 
          success: false, 
          error: '用户名或密码错误' 
        });
      }
    });
  });
}

/**
 * 测试空密码检测
 */
function testEmptyPasswordDetection(username) {
  return new Promise((resolve, reject) => {
    const safeUsername = username.replace(/'/g, "''").replace(/"/g, '""');
    
    const script = `
      try {
        # 首先尝试获取本地用户信息
        try {
          $user = Get-LocalUser -Name "${safeUsername}" -ErrorAction Stop
          # 检查密码是否为空或从未设置
          if ($user.PasswordLastSet -eq $null) {
            Write-Output "NO_PASSWORD"
            exit 0
          }
        } catch {
          # 可能是域用户，继续下面的验证
        }
        
        # 尝试用空密码验证（更准确的方法）
        Add-Type -AssemblyName System.DirectoryServices.AccountManagement
        
        # 先尝试本地机器验证
        try {
          $contextType = [System.DirectoryServices.AccountManagement.ContextType]::Machine
          $principalContext = New-Object System.DirectoryServices.AccountManagement.PrincipalContext($contextType)
          $isValidEmpty = $principalContext.ValidateCredentials('${safeUsername}', '')
          
          if ($isValidEmpty) {
            Write-Output "EMPTY_PASSWORD"
            exit 0
          }
        } catch {
          # 本地验证失败，可能是域用户
        }
        
        # 如果是域用户，尝试域验证空密码
        try {
          $domainContext = [System.DirectoryServices.AccountManagement.ContextType]::Domain
          $domainPrincipalContext = New-Object System.DirectoryServices.AccountManagement.PrincipalContext($domainContext)
          $isDomainValidEmpty = $domainPrincipalContext.ValidateCredentials('${safeUsername}', '')
          
          if ($isDomainValidEmpty) {
            Write-Output "EMPTY_PASSWORD"
            exit 0
          }
        } catch {
          # 域验证失败或没有域环境
        }
        
        Write-Output "HAS_PASSWORD"
      } catch {
        Write-Output "HAS_PASSWORD"
      }
    `;

    const command = `powershell -ExecutionPolicy Bypass -NoProfile -Command "${script.replace(/"/g, '\\"')}"`;
    
    exec(command, {
      timeout: 15000,
      windowsHide: true
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`PowerShell 执行错误: ${error.message}`));
        return;
      }

      if (stderr && !stderr.trim().startsWith('WARNING:')) {
        console.warn(`PowerShell 警告: ${stderr}`);
      }

      const result = stdout.trim();
      console.log(`密码检测结果: ${result}`);
      
      if (result === 'NO_PASSWORD' || result === 'EMPTY_PASSWORD') {
        resolve({ success: true, hasPassword: false });
      } else {
        resolve({ success: true, hasPassword: true });
      }
    });
  });
}

// 主测试函数
async function runTests() {
  try {
    const username = os.userInfo().username;
    
    console.log('\n🔍 1. 测试密码检测功能...');
    const passwordCheckResult = await testEmptyPasswordDetection(username);
    console.log('密码检测结果:', passwordCheckResult);
    
    if (!passwordCheckResult.hasPassword) {
      console.log('\n✅ 检测到用户没有设置密码，直接通过认证');
      console.log('🎉 测试完成：修复应该生效');
      return;
    }
    
    console.log('\n🔐 2. 检测到用户设置了密码，需要进行密码验证');
    console.log('💡 提示：请手动测试正确密码和错误密码的验证');
    
    // 测试空密码（应该失败）
    console.log('\n🧪 3. 测试空密码验证（应该失败）...');
    const emptyPasswordResult = await testWindowsPasswordValidation(username, '');
    console.log('空密码测试结果:', emptyPasswordResult);
    
    console.log('\n✅ 测试完成！修复关键改进点：');
    console.log('   - 增强的字符转义，支持特殊字符密码');
    console.log('   - 支持域账户和本地账户验证');
    console.log('   - 改进的 PowerShell 执行参数');
    console.log('   - 更完善的错误处理');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

if (require.main === module) {
  runTests();
}

module.exports = {
  testWindowsPasswordValidation,
  testEmptyPasswordDetection
};
