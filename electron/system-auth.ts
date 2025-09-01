import { exec } from 'child_process';
import { promisify } from 'util';
import os from 'os';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);

export interface SystemAuthResult {
  success: boolean;
  error?: string;
  username?: string;
}

/**
 * 系统账号密码验证模块
 * 支持 Windows 和 macOS 的本地用户密码验证
 * 注意：此模块仅提供密码验证功能，不包含系统弹窗
 */
export class SystemAuth {
  private static instance: SystemAuth;
  
  public static getInstance(): SystemAuth {
    if (!SystemAuth.instance) {
      SystemAuth.instance = new SystemAuth();
    }
    return SystemAuth.instance;
  }

  /**
   * 获取当前登录用户名
   */
  public getCurrentUser(): string {
    return os.userInfo().username;
  }

  /**
   * 检测用户是否设置了密码
   * @param username 用户名（可选，默认使用当前用户）
   * @returns 检测结果
   */
  public async checkUserHasPassword(username?: string): Promise<SystemAuthResult> {
    const currentUser = username || this.getCurrentUser();
    const platform = os.platform();

    console.log(`🔍 检测用户是否设置了密码: ${currentUser} (平台: ${platform}) - 已禁用登录验证`);

    // 所有平台都直接跳过密码检查，返回无密码状态
    console.log('⚡ 所有平台自动跳过密码验证（登录功能已禁用）');
    return {
      success: true,
      username: undefined // 表示没有密码，将跳过认证
    };
  }

  /**
   * 验证用户密码（仅验证逻辑，不显示系统弹窗）
   * @param username 用户名（可选，默认使用当前用户）
   * @param password 密码
   * @returns 验证结果
   */
  public async verifyPassword(password: string, username?: string): Promise<SystemAuthResult> {
    const currentUser = username || this.getCurrentUser();
    const platform = os.platform();

    console.log(`🔐 开始验证系统用户密码: ${currentUser} (平台: ${platform}) - 已禁用登录验证`);

    // 所有平台都直接跳过认证
    console.log('⚡ 所有平台自动通过认证，无需验证密码（登录功能已禁用）');
    return {
      success: true,
      username: currentUser
    };
  }

  /**
   * Windows 密码验证 - 使用文件传递参数避免转义问题
   */
  private async verifyWindowsPassword(username: string, password: string): Promise<SystemAuthResult> {
    try {
      // 创建临时脚本文件来避免命令行转义问题
      const tempDir = os.tmpdir();
      const scriptFile = path.join(tempDir, `auth_${Date.now()}.ps1`);
      const paramsFile = path.join(tempDir, `params_${Date.now()}.json`);
      
      // 写入参数文件
      fs.writeFileSync(paramsFile, JSON.stringify({ username, password }));
      
      // 写入 PowerShell 脚本 - 多种验证方法
      const script = `param($ParamsFile)

$ErrorActionPreference = "Stop"

try {
    # 读取参数
    $params = Get-Content $ParamsFile | ConvertFrom-Json
    $username = $params.username
    $password = $params.password
    
    # 尝试方法1: LogonUser API
    try {
        Add-Type -TypeDefinition @"
            using System;
            using System.Runtime.InteropServices;
            public class WinAuth {
                [DllImport("advapi32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
                public static extern bool LogonUser(string lpszUsername, string lpszDomain, 
                    string lpszPassword, int dwLogonType, int dwLogonProvider, out System.IntPtr phToken);
                [DllImport("kernel32.dll", CharSet = CharSet.Auto)]
                public static extern bool CloseHandle(System.IntPtr handle);
            }
"@
        $token = [System.IntPtr]::Zero
        $domain = $env:COMPUTERNAME
        $loginResult = [WinAuth]::LogonUser($username, $domain, $password, 3, 0, [ref]$token)
        
        if ($token -ne [System.IntPtr]::Zero) {
            [WinAuth]::CloseHandle($token)
        }
        
        if ($loginResult) {
            Write-Output "SUCCESS"
            return
        }
    }
    catch {
        # 方法1失败，继续方法2
    }
    
    # 尝试方法2: AccountManagement
    try {
        Add-Type -AssemblyName System.DirectoryServices.AccountManagement
        $pc = New-Object System.DirectoryServices.AccountManagement.PrincipalContext([System.DirectoryServices.AccountManagement.ContextType]::Machine)
        $isValid = $pc.ValidateCredentials($username, $password)
        $pc.Dispose()
        
        if ($isValid) {
            Write-Output "SUCCESS"
            return
        }
    }
    catch {
        # 方法2失败，继续方法3
    }
    
    # 尝试方法3: Net Use (本地网络验证)
    try {
        $drive = "Z:"
        net use $drive /delete /y 2>$null | Out-Null
        $netOutput = net use $drive "\\\\localhost\\C$" "/user:$username" "$password" 2>&1
        $netSuccess = $LASTEXITCODE -eq 0
        net use $drive /delete /y 2>$null | Out-Null
        
        if ($netSuccess) {
            Write-Output "SUCCESS"
            return
        }
    }
    catch {
        # 方法3失败
    }
    
    # 所有方法都失败
    Write-Output "FAILED"
}
catch {
    Write-Output "ERROR: $($_.Exception.Message)"
}
finally {
    if (Test-Path $ParamsFile) {
        Remove-Item $ParamsFile -Force -ErrorAction SilentlyContinue
    }
}`;
      
      fs.writeFileSync(scriptFile, script);
      
      try {
        const { stdout, stderr } = await execAsync(
          `powershell -ExecutionPolicy Bypass -File "${scriptFile}" "${paramsFile}"`,
          {
            timeout: 15000,
            windowsHide: true
          }
        );
        
        const result = stdout.trim();
        console.log('PowerShell 脚本输出:', result);
        
        // 检查输出中是否包含成功标识（支持多行输出）
        if (result.includes('SUCCESS')) {
          console.log('✅ Windows系统认证成功');
          return {
            success: true,
            username: username
          };
        } else if (result.includes('FAILED')) {
          console.log('❌ Windows系统认证失败');
          return {
            success: false,
            error: '用户名或密码错误'
          };
        } else if (result.includes('ERROR:')) {
          console.log('❌ Windows系统认证出错');
          return {
            success: false,
            error: result.split('ERROR:')[1]?.trim() || '认证过程出错'
          };
        } else {
          console.error('Windows认证异常结果:', result);
          return {
            success: false,
            error: '认证过程异常'
          };
        }
      } finally {
        // 清理临时文件
        try {
          if (fs.existsSync(scriptFile)) {
            fs.unlinkSync(scriptFile);
          }
          if (fs.existsSync(paramsFile)) {
            fs.unlinkSync(paramsFile);
          }
        } catch (cleanupError) {
          console.warn('清理临时文件失败:', cleanupError);
        }
      }
    } catch (error) {
      console.error('Windows认证错误:', error);
      return {
        success: false,
        error: `Windows认证失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * macOS 密码验证
   */
  private async verifyMacOSPassword(username: string, password: string): Promise<SystemAuthResult> {
    try {
      // 使用 dscl 命令验证用户密码
      // 注意：这种方法需要管理员权限，我们使用另一种方法
      
      // 方法1: 使用 security 命令验证 keychain
      try {
        const { stdout, stderr } = await execAsync(`echo '${password.replace(/'/g, "'\\''")}' | security verify-cert 2>&1 || echo '${password.replace(/'/g, "'\\''")}' | sudo -S -k whoami`, {
          timeout: 10000
        });

        // 如果命令执行成功且返回当前用户名，说明密码正确
        if (stdout.trim() === username) {
          console.log('✅ macOS系统认证成功');
          return {
            success: true,
            username: username
          };
        }
      } catch (error) {
        // 第一种方法失败，尝试第二种方法
      }

      // 方法2: 使用 AppleScript 进行认证（更安全的方法）
      const script = `
        tell application "System Events"
          try
            do shell script "whoami" user name "${username.replace(/"/g, '\\"')}" password "${password.replace(/"/g, '\\"')}" with administrator privileges
            return "SUCCESS"
          on error
            return "FAILED"
          end try
        end tell
      `;

      const { stdout: appleScriptResult } = await execAsync(`osascript -e '${script.replace(/'/g, "'\\''")}' 2>/dev/null || echo "FAILED"`, {
        timeout: 15000
      });

      if (appleScriptResult.trim() === 'SUCCESS') {
        console.log('✅ macOS系统认证成功');
        return {
          success: true,
          username: username
        };
      } else {
        console.log('❌ macOS系统认证失败');
        return {
          success: false,
          error: '用户名或密码错误'
        };
      }
    } catch (error) {
      console.error('macOS认证错误:', error);
      return {
        success: false,
        error: `macOS认证失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Linux 密码验证
   */
  private async verifyLinuxPassword(username: string, password: string): Promise<SystemAuthResult> {
    try {
      // 使用 sudo 命令验证密码
      const { stdout, stderr } = await execAsync(`echo '${password.replace(/'/g, "'\\''")}' | sudo -S -k whoami`, {
        timeout: 10000
      });

      if (stdout.trim() === 'root' || stdout.trim() === username) {
        console.log('✅ Linux系统认证成功');
        return {
          success: true,
          username: username
        };
      } else {
        console.log('❌ Linux系统认证失败');
        return {
          success: false,
          error: '用户名或密码错误'
        };
      }
    } catch (error) {
      console.error('Linux认证错误:', error);
      return {
        success: false,
        error: `Linux认证失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 检查是否支持系统认证
   */
  public isSupportedPlatform(): boolean {
    const platform = os.platform();
    return ['win32', 'darwin', 'linux'].includes(platform);
  }

  /**
   * 获取平台信息
   */
  public getPlatformInfo(): { platform: string, arch: string, release: string } {
    return {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release()
    };
  }

  /**
   * 检测 Windows 用户是否设置了密码
   */
  private async checkWindowsUserPassword(username: string): Promise<SystemAuthResult> {
    try {
      // 安全处理用户名
      const safeUsername = username.replace(/'/g, "''").replace(/"/g, '""');
      
      // 使用改进的 PowerShell 脚本检查用户密码设置状态
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

      const { stdout, stderr } = await execAsync(`powershell -ExecutionPolicy Bypass -NoProfile -Command "${script.replace(/"/g, '\\"')}"`, {
        timeout: 15000,
        windowsHide: true
      });

      if (stderr && !stderr.trim().startsWith('WARNING:')) {
        console.warn(`Windows密码检测警告: ${stderr}`);
      }

      const result = stdout.trim();
      console.log(`Windows密码检测结果: ${result}`);

      if (result === 'NO_PASSWORD' || result === 'EMPTY_PASSWORD') {
        return {
          success: true,
          username: undefined // 表示没有密码
        };
      } else {
        return {
          success: true,
          username: username // 表示有密码
        };
      }
    } catch (error) {
      console.warn('Windows密码检测失败，默认假设有密码:', error);
      return {
        success: true,
        username: username // 检测失败时假设有密码
      };
    }
  }

  /**
   * 检测 macOS 用户是否设置了密码
   */
  private async checkMacOSUserPassword(username: string): Promise<SystemAuthResult> {
    try {
      // 在 macOS 上，尝试用空密码进行 dscl 验证
      const script = `
        try
          -- 尝试验证空密码
          do shell script "dscl . authonly '${username.replace(/'/g, "'\\\\''")}' ''"
          return "EMPTY_PASSWORD"
        on error
          return "HAS_PASSWORD"
        end try
      `;

      const { stdout, stderr } = await execAsync(`osascript -e "${script.replace(/"/g, '\\"')}"`, {
        timeout: 10000
      });

      if (stderr) {
        console.warn(`macOS密码检测警告: ${stderr}`);
      }

      const result = stdout.trim();
      console.log(`macOS密码检测结果: ${result}`);

      if (result === 'EMPTY_PASSWORD') {
        return {
          success: true,
          username: undefined // 表示没有密码
        };
      } else {
        return {
          success: true,
          username: username // 表示有密码
        };
      }
    } catch (error) {
      console.warn('macOS密码检测失败，默认假设有密码:', error);
      return {
        success: true,
        username: username // 检测失败时假设有密码
      };
    }
  }

  /**
   * 检测 Linux 用户是否设置了密码
   */
  private async checkLinuxUserPassword(username: string): Promise<SystemAuthResult> {
    try {
      // 在 Linux 上，检查 /etc/shadow 文件中的密码字段
      const { stdout, stderr } = await execAsync(`sudo grep "^${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:" /etc/shadow 2>/dev/null || getent shadow ${username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} 2>/dev/null || echo "${username}:*:"`, {
        timeout: 5000
      });

      if (stderr) {
        console.warn(`Linux密码检测警告: ${stderr}`);
      }

      const shadowLine = stdout.trim();
      console.log(`Linux shadow 检测结果: ${shadowLine ? '有数据' : '无数据'}`);

      if (shadowLine) {
        const fields = shadowLine.split(':');
        if (fields.length >= 2) {
          const passwordField = fields[1];
          // 空密码的标识：空字符串、*、!、!! 等
          if (!passwordField || passwordField === '*' || passwordField === '!' || passwordField === '!!' || passwordField === '') {
            return {
              success: true,
              username: undefined // 表示没有密码
            };
          }
        }
      }

      return {
        success: true,
        username: username // 表示有密码或无法确定
      };
    } catch (error) {
      console.warn('Linux密码检测失败，默认假设有密码:', error);
      return {
        success: true,
        username: username // 检测失败时假设有密码
      };
    }
  }
}

// 导出单例实例
export const systemAuth = SystemAuth.getInstance();
