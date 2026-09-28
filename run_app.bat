@echo off
title Quantora - Inicializador
cd /d "%~dp0"

echo ====================================================
echo             QUANTORA - MENTAL MATH SUITE
echo ====================================================
echo.
echo [1] Iniciar no Navegador Web (Recomendado)
echo [2] Iniciar como App Desktop Windows (Electron)
echo.
set /p opt="Escolha uma opcao [1 ou 2] (Pressione Enter para 1): "

if "%opt%"=="2" (
    echo.
    echo Iniciando Quantora Desktop (Electron)...
    npm run electron:dev
) else (
    echo.
    echo Iniciando Quantora Web...
    start http://localhost:5173
    npm run dev
)
pause
