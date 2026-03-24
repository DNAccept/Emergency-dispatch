@echo off
echo Stopping all frontend services...

:: This command will terminate all running node.exe processes
:: which includes all the frontends (vite/preview servers) you launched.
taskkill /IM node.exe /F

echo All frontend services have been shut down!
