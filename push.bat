@echo off
cd /d "%~dp0"
echo ========================================================
echo   Mendorong KapitalKula ke GitHub (xenoo-droid/capita)
echo ========================================================
echo.
git push -u origin main
echo.
if %ERRORLEVEL% EQU 0 (
    echo [SUKSES] Berhasil terkirim ke GitHub!
) else (
    echo [INFO] Jika diminta login, silakan ikuti petunjuk login browser di atas.
)
echo.
pause
