@echo off
powershell -Command "Start-Process powershell -ArgumentList '-NoExit -Command Set-Location D:\taskflow; C:\Users\KOSTA\AppData\Roaming\npm\claude.cmd -c --dangerously-skip-permissions' -Verb RunAs"
