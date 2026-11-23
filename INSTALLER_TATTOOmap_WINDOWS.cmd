@echo off
setlocal
title Installation TATTOOmap
echo ==========================================
echo  TATTOOmap - Installation sur le Bureau
echo ==========================================
echo.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; [Net.ServicePointManager]::SecurityProtocol = [Net.ServicePointManager]::SecurityProtocol -bor [Net.SecurityProtocolType]::Tls12; $scriptPath=Join-Path $env:TEMP 'TATTOOmap_install_windows.ps1'; Invoke-WebRequest -Uri 'https://raw.githubusercontent.com/CEOMELYXJA/TATTOOmap/main/INSTALLER_TATTOOmap_WINDOWS.ps1' -OutFile $scriptPath -UseBasicParsing; & $scriptPath"
if errorlevel 1 (
  echo.
  echo ERREUR : installation interrompue. Aucun ancien dossier n'a ete supprime.
  pause
)
endlocal
