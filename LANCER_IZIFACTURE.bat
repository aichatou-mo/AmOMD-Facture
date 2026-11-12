@echo off
title iziFACTURE - Serveur Local
echo ========================================================
echo          Lancement de iziFACTURE en Local
echo ========================================================
cd /d "%~dp0"
set NODE_OPTIONS=--max-old-space-size=2048
start http://localhost:3000
call npm.cmd run dev
pause

