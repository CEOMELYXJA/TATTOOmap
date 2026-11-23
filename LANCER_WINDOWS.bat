@echo off
setlocal
cd /d "%~dp0"

rem Verifier que la commande trouve vraiment Python 3, pas seulement un alias.
py -3 -c "import sys; sys.exit(sys.version_info.major != 3)" >nul 2>&1
if not errorlevel 1 (
  set "PY=py -3"
  goto launch
)
python -c "import sys; sys.exit(sys.version_info.major != 3)" >nul 2>&1
if not errorlevel 1 (
  set "PY=python"
  goto launch
)
echo ERREUR : Python 3 est introuvable ou ne fonctionne pas.
echo Installez Python 3, puis relancez TATTOOmap.
pause
exit /b 1

:launch
echo ------------------------------------------
echo TATTOOmap - MELISA FORTIN
echo ------------------------------------------
echo Interface 3D : http://127.0.0.1:8765/02_peaufine/
echo Prototype : http://127.0.0.1:8765/01_prototype/
echo Pour arreter : Ctrl+C ou fermez cette fenetre.
echo.
rem Le port est reserve avant l'ouverture du navigateur : si un autre
rem programme l'occupe, aucune page provenant de ce programme ne s'ouvre.
%PY% -u -c "import http.server, socket, webbrowser; http.server.ThreadingHTTPServer.allow_reuse_address=False; server=http.server.ThreadingHTTPServer(('127.0.0.1',8765), http.server.SimpleHTTPRequestHandler, bind_and_activate=False); server.socket.setsockopt(socket.SOL_SOCKET, socket.SO_EXCLUSIVEADDRUSE, 1); server.server_bind(); server.server_activate(); print('Serveur local pret sur 127.0.0.1:8765', flush=True); webbrowser.open('http://127.0.0.1:8765/02_peaufine/'); server.serve_forever()"
if errorlevel 1 (
  echo.
  echo ERREUR : le serveur local n'a pas pu demarrer ou s'est arrete.
  echo Si le port 8765 est deja utilise, fermez l'autre serveur puis reessayez.
  pause
  exit /b 1
)
endlocal
