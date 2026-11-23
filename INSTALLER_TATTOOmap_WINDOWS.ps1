# TATTOOmap - installation locale Windows (PowerShell 5.1+)
# Source : https://github.com/CEOMELYXJA/TATTOOmap
# Ne modifie ni MFTNVINC ni le site Wix.
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$desktop = [Environment]::GetFolderPath('DesktopDirectory')
if ([string]::IsNullOrWhiteSpace($desktop)) {
    $desktop = Join-Path $env:USERPROFILE 'Desktop'
}
if (-not (Test-Path -LiteralPath $desktop)) {
    throw "Le dossier Bureau Windows est introuvable : $desktop"
}

$target = Join-Path $desktop 'TATTOOmap'
if (Test-Path -LiteralPath $target) {
    $timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    $target = Join-Path $desktop ("TATTOOmap_" + $timestamp)
    if (Test-Path -LiteralPath $target) {
        $target = Join-Path $desktop ("TATTOOmap_" + [guid]::NewGuid().ToString('N').Substring(0,8))
    }
    Write-Host "Un dossier TATTOOmap existe deja. Je le conserve." -ForegroundColor Yellow
}

$work = Join-Path $env:TEMP ("tattoomap_install_" + [guid]::NewGuid().ToString('N'))
$archive = Join-Path $work 'TATTOOmap.zip'
$extracted = Join-Path $work 'extracted'
New-Item -ItemType Directory -Path $extracted -Force | Out-Null

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12
    Write-Host "Telechargement de TATTOOmap depuis GitHub..." -ForegroundColor Cyan
    Invoke-WebRequest -Uri 'https://github.com/CEOMELYXJA/TATTOOmap/archive/refs/heads/main.zip' -OutFile $archive -UseBasicParsing
    Expand-Archive -LiteralPath $archive -DestinationPath $extracted -Force

    $source = Get-ChildItem -LiteralPath $extracted -Directory |
        Where-Object { (Test-Path -LiteralPath (Join-Path $_.FullName 'LANCER_WINDOWS.bat')) -and
                        (Test-Path -LiteralPath (Join-Path $_.FullName '02_peaufine\index.html')) } |
        Select-Object -First 1
    if ($null -eq $source) {
        throw "Archive GitHub inattendue : lanceur ou page 3D manquante."
    }

    Move-Item -LiteralPath $source.FullName -Destination $target
    $launcher = Join-Path $target 'LANCER_WINDOWS.bat'
    $shortcutFile = Join-Path $desktop 'TATTOOmap - Lancer.lnk'
    if (Test-Path -LiteralPath $shortcutFile) {
        $shortcutFile = Join-Path $desktop ("TATTOOmap - Lancer " + (Get-Date -Format 'yyyyMMdd-HHmmss') + '.lnk')
    }

    $shell = New-Object -ComObject WScript.Shell
    $shortcut = $shell.CreateShortcut($shortcutFile)
    $shortcut.TargetPath = $launcher
    $shortcut.WorkingDirectory = $target
    $shortcut.Description = 'Ouvrir le portfolio immersif TATTOOmap'
    $shortcut.Save()

    Write-Host ""
    Write-Host "TATTOOmap installe sur le Bureau : $target" -ForegroundColor Green
    Write-Host "Raccourci : $shortcutFile"

    if (-not (Get-Command py.exe -ErrorAction SilentlyContinue) -and -not (Get-Command python.exe -ErrorAction SilentlyContinue)) {
        Write-Warning "Python 3 est requis pour lancer la galerie. Le projet est installe, mais Python n'a pas ete trouve."
    } else {
        Write-Host "Ouverture du jardin 3D..."
        Start-Process -FilePath $launcher -WorkingDirectory $target
    }
}
finally {
    Remove-Item -LiteralPath $work -Recurse -Force -ErrorAction SilentlyContinue
}
