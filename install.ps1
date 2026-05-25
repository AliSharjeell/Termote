# Termote Desktop Installer
# Installs Termote desktop app with all prerequisites

param(
    [switch]$Uninstall
)

$ErrorActionPreference = "Continue"

function Write-Banner {
    Write-Host ""
    Write-Host "  ████████╗███████╗██████╗ ███╗   ███╗██████╗ ████████╗███████╗" -ForegroundColor Cyan
    Write-Host "  ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██╔═══██╗╚══██╔══╝██╔════╝" -ForegroundColor Cyan
    Write-Host "     ██║   █████╗  ██████╔╝██╔████╔██║██║   ██║   ██║   █████╗  " -ForegroundColor Cyan
    Write-Host "     ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║██║   ██║   ██║   ██╔══╝  " -ForegroundColor Cyan
    Write-Host "     ██║   ███████╗██║  ██║██║ ╚═╝ ██║╚██████╔╝   ██║   ███████╗" -ForegroundColor Cyan
    Write-Host "     ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝ ╚═════╝    ╚═╝   ╚══════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  Lightweight Agent Development Environment" -ForegroundColor Gray
    Write-Host "  One-click install, anywhere access." -ForegroundColor Gray
    Write-Host ""
}

function Test-Prerequisite {
    param($Name, $Test)
    Write-Host "  Checking $Name..." -ForegroundColor Gray -NoNewline
    $result = & $Test
    if ($result) {
        Write-Host " OK" -ForegroundColor Green
        return $true
    } else {
        Write-Host " MISSING" -ForegroundColor Yellow
        return $false
    }
}

function Install-WebView2 {
    Write-Host "  Installing Microsoft WebView2..." -ForegroundColor Yellow
    try {
        $url = "https://go.microsoft.com/fwlink/p/?LinkId=2124703"
        $outFile = "$env:TEMP\MicrosoftEdgeWebView2Setup.exe"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
        Start-Process -FilePath $outFile -ArgumentList "/silent","/install" -Wait
        Remove-Item $outFile -Force -ErrorAction SilentlyContinue
        Write-Host "    WebView2 installed!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "    Failed: $_" -ForegroundColor Red
        return $false
    }
}

function Install-DevTunnel {
    Write-Host "  Installing Microsoft Dev Tunnels CLI..." -ForegroundColor Yellow
    $devtunnelPath = "$env:LOCALAPPDATA\Termote\bin\devtunnel.exe"

    if (-not (Test-Path (Split-Path $devtunnelPath))) {
        New-Item -Type Directory -Force (Split-Path $devtunnelPath) | Out-Null
    }

    try {
        # Try GitHub releases first
        curl.exe -L --silent --show-error -o $devtunnelPath "https://github.com/microsoft/dev-tunnels/releases/latest/download/devtunnel-win-x64.exe"

        if (-not (Test-Path $devtunnelPath) -or (Get-Item $devtunnelPath).Length -lt 1MB) {
            # Fallback to direct MS link
            [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
            Invoke-WebRequest -Uri "https://aka.ms/TunnelsCliDownload/win-x64" -OutFile $devtunnelPath -UseBasicParsing
        }

        if (Test-Path $devtunnelPath) {
            Write-Host "    Dev Tunnels CLI installed!" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "    Warning: Could not install Dev Tunnels CLI automatically" -ForegroundColor Yellow
    }
    return $false
}

function Install-VisualCppRuntime {
    Write-Host "  Checking Visual C++ Runtime..." -ForegroundColor Yellow
    $key = "HKLM:\SOFTWARE\Microsoft\VisualStudio\14.0\VC\Runtimes\x64"
    if (Test-Path $key) {
        Write-Host "    Already installed" -ForegroundColor Green
        return $true
    }

    try {
        $url = "https://aka.ms/vs/17/release/vc_redist.x64.exe"
        $outFile = "$env:TEMP\vc_redist.x64.exe"
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        Invoke-WebRequest -Uri $url -OutFile $outFile -UseBasicParsing
        Start-Process -FilePath $outFile -ArgumentList "/install","/quiet","/norestart" -Wait
        Remove-Item $outFile -Force -ErrorAction SilentlyContinue
        Write-Host "    Visual C++ Runtime installed!" -ForegroundColor Green
        return $true
    } catch {
        Write-Host "    Warning: Could not install VC Runtime automatically" -ForegroundColor Yellow
        return $false
    }
}

function Add-StartMenuShortcut {
    Write-Host "  Creating Start Menu shortcut..." -ForegroundColor Yellow

    $appPath = "$env:LOCALAPPDATA\Termote\Termote.exe"
    if (-not (Test-Path $appPath)) {
        Write-Host "    App not found at $appPath" -ForegroundColor Yellow
        return $false
    }

    $shell = New-Object -ComObject WScript.Shell
    $startMenu = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs"
    $shortcutPath = "$startMenu\Termote.lnk"

    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $appPath
    $shortcut.WorkingDirectory = "$env:LOCALAPPDATA\Termote"
    $shortcut.Description = "Termote - Agent Development Environment"
    $shortcut.Save()

    Write-Host "    Shortcut created!" -ForegroundColor Green
    return $true
}

function Add-DesktopShortcut {
    Write-Host "  Creating Desktop shortcut..." -ForegroundColor Yellow

    $appPath = "$env:LOCALAPPDATA\Termote\Termote.exe"
    if (-not (Test-Path $appPath)) {
        Write-Host "    App not found at $appPath" -ForegroundColor Yellow
        return $false
    }

    $shell = New-Object -ComObject WScript.Shell
    $desktopPath = [Environment]::GetFolderPath("Desktop")
    $shortcutPath = "$desktopPath\Termote.lnk"

    $shortcut = $shell.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $appPath
    $shortcut.WorkingDirectory = "$env:LOCALAPPDATA\Termote"
    $shortcut.Description = "Termote - Agent Development Environment"
    $shortcut.Save()

    Write-Host "    Desktop shortcut created!" -ForegroundColor Green
    return $true
}

function Add-ContextMenu {
    Write-Host "  Adding Windows Explorer context menu..." -ForegroundColor Yellow

    $appPath = "$env:LOCALAPPDATA\Termote\Termote.exe"

    # Directory background (right-click in empty space)
    $regPath = "HKCU:\Software\Classes\Directory\Background\shell\Termote"
    $cmdPath = "$regPath\command"
    if (-not (Test-Path $regPath)) { New-Item -Path $regPath -Force | Out-Null }
    Set-ItemProperty -Path $regPath -Name "(Default)" -Value "Open with Termote"
    Set-ItemProperty -Path $regPath -Name "Icon" -Value "`"$appPath`",0"
    if (-not (Test-Path $cmdPath)) { New-Item -Path $cmdPath -Force | Out-Null }
    Set-ItemProperty -Path $cmdPath -Name "(Default)" -Value ('"{0}" --cwd "%V"' -f $appPath)

    # Folder icon (right-click on folder)
    $regPath2 = "HKCU:\Software\Classes\Directory\shell\Termote"
    $cmdPath2 = "$regPath2\command"
    if (-not (Test-Path $regPath2)) { New-Item -Path $regPath2 -Force | Out-Null }
    Set-ItemProperty -Path $regPath2 -Name "(Default)" -Value "Open with Termote"
    Set-ItemProperty -Path $regPath2 -Name "Icon" -Value "`"$appPath`",0"
    if (-not (Test-Path $cmdPath2)) { New-Item -Path $cmdPath2 -Force | Out-Null }
    Set-ItemProperty -Path $cmdPath2 -Name "(Default)" -Value ('"{0}" --cwd "%1"' -f $appPath)

    Write-Host "    Context menu installed!" -ForegroundColor Green
    return $true
}

function Add-CommandLineShortcut {
    Write-Host "  Adding 'termote' command to PATH..." -ForegroundColor Yellow

    $appPath = "$env:LOCALAPPDATA\Termote\Termote.exe"
    $shortcutPath = "$env:LOCALAPPDATA\Termote\termote.cmd"

    # Create a batch file that launches the app with current directory
    $batchContent = "@echo off`n"
    $batchContent += "cd /d %CD%`n"
    $batchContent += "start `"`" `"$appPath`" --cwd %CD%`n"
    Set-Content -Path $shortcutPath -Value $batchContent -Encoding ASCII

    # Add to PATH via registry (user-level)
    $userPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    $termotePath = "$env:LOCALAPPDATA\Termote"
    if ($userPath -notlike "*$termotePath*") {
        [Environment]::SetEnvironmentVariable("PATH", "$userPath;$termotePath", "User")
        Write-Host "    Added to PATH. Restart terminals to use 'termote' command." -ForegroundColor Yellow
    }

    Write-Host "    'termote' command shortcut created!" -ForegroundColor Green
    return $true
}

# ==================== UNINSTALL ====================
if ($Uninstall) {
    Write-Banner
    Write-Host "Removing Termote..." -ForegroundColor Yellow

    # Remove shortcuts
    "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Termote.lnk" | Remove-Item -Force -ErrorAction SilentlyContinue
    "$env:USERPROFILE\Desktop\Termote.lnk" | Remove-Item -Force -ErrorAction SilentlyContinue

    # Remove command line shortcut
    "$env:LOCALAPPDATA\Termote\termote.cmd" | Remove-Item -Force -ErrorAction SilentlyContinue

    # Remove context menu
    Remove-Item -Path "HKCU:\Software\Classes\Directory\Background\shell\Termote" -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item -Path "HKCU:\Software\Classes\Directory\shell\Termote" -Recurse -Force -ErrorAction SilentlyContinue

    # Ask to remove app data
    $response = Read-Host "Remove all Termote data? (Y/N)"
    if ($response -eq "Y") {
        Stop-Process -Name "Termote" -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 1
        Remove-Item -Path "$env:LOCALAPPDATA\Termote" -Recurse -Force -ErrorAction SilentlyContinue
        Write-Host "Termote uninstalled." -ForegroundColor Green
    } else {
        Write-Host "Termote app removed. Data kept." -ForegroundColor Yellow
    }
    exit 0
}

# ==================== INSTALL ====================
Write-Banner

Write-Host "Checking prerequisites..." -ForegroundColor White
Write-Host ""

$webview2Installed = Test-Prerequisite "WebView2 Runtime" {
    $key = "HKLM:\SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-AE5E-5F44-9B99-4C82EE5BE080}"
    Test-Path $key
}

$devtunnelInstalled = Test-Prerequisite "Dev Tunnels CLI" {
    $path = "$env:LOCALAPPDATA\Termote\bin\devtunnel.exe"
    Test-Path $path
}

Write-Host "Cleaning up old Termote installations..." -ForegroundColor Gray
# Clean up old termote-bin shim if it exists to prevent conflicts
$oldShimDir = "$env:USERPROFILE\.termote-bin"
if (Test-Path $oldShimDir) {
    Remove-Item -Path $oldShimDir -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "  Removed old .termote-bin scripts." -ForegroundColor Green
}

Write-Host ""
Write-Host "Installing prerequisites..." -ForegroundColor White

if (-not $webview2Installed) {
    Install-WebView2
}

if (-not $devtunnelInstalled) {
    Install-DevTunnel
}

Install-VisualCppRuntime | Out-Null

Write-Host ""
Write-Host "Creating shortcuts..." -ForegroundColor White
Add-StartMenuShortcut
Add-DesktopShortcut
Add-ContextMenu
Add-CommandLineShortcut

Write-Host ""
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Installation complete!" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  To launch Termote:" -ForegroundColor White
Write-Host "  - Click Start Menu -> Termote" -ForegroundColor Cyan
Write-Host "  - Or right-click any folder -> 'Open with Termote'" -ForegroundColor Cyan
Write-Host ""
Write-Host "  For mobile access, click 'Mobile Access' in the app." -ForegroundColor Gray
Write-Host ""

$installedExe = "$env:LOCALAPPDATA\Termote\Termote.exe"
if (Test-Path $installedExe) {
    Write-Host "Launching Termote..." -ForegroundColor Cyan
    Start-Process $installedExe
} else {
    Write-Host "Note: Run this installer from the Termote UI directory to install the app." -ForegroundColor Yellow
}