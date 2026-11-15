@echo off
title AmOMD Facture - Serveur Local
echo ========================================================
echo          Lancement de AmOMD Facture en Local
echo ========================================================
cd /d "%~dp0"
set NODE_OPTIONS=--max-old-space-size=2048
start http://localhost:3000
call npm.cmd run dev
pause

