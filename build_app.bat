@echo off
chcp 65001 >nul
title Сборка Зайцев-Интерактив 2.0

echo =============================================
echo   Сборка desktop-приложения
echo   Зайцев-Интерактив 2.0
echo =============================================
echo.

:: Проверяем, установлен ли Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ОШИБКА] Python не найден. Установите Python 3 с python.org
    echo (не забудьте отметить "Add Python to PATH" при установке)
    pause
    exit /b 1
)

:: Проверяем, установлен ли PyInstaller
pyinstaller --version >nul 2>&1
if %errorlevel% neq 0 (
    echo PyInstaller не найден. Устанавливаю...
    pip install pyinstaller
    if %errorlevel% neq 0 (
        echo [ОШИБКА] Не удалось установить PyInstaller.
        pause
        exit /b 1
    )
    echo.
    echo PyInstaller установлен.
    echo.
)

echo Собираю приложение...

pyinstaller ^
    --onefile ^
    --windowed ^
    --name "ZaytsevInteractive" ^
    --icon NONE ^
    --add-data "index.html;." ^
    --add-data "css;css" ^
    --add-data "js;js" ^
    --add-data "vendor;vendor" ^
    --add-data "assets;assets" ^
    --add-data "материалы;материалы" ^
    --add-data "README.md;." ^
    --distpath "." ^
    --workpath "build_temp" ^
    --specpath "." ^
    launcher.py

echo.
if %errorlevel% equ 0 (
    echo =============================================
    echo   Готово!
    echo =============================================
    echo.
    echo Файл: ZaytsevInteractive.exe
    echo Размер: смотрите в проводнике
    echo.
    echo Просто запустите ZaytsevInteractive.exe
    echo Чтобы войти в систему.
    echo.
    echo Временные файлы сборки: build_temp\
    echo Их можно удалить вручную.
    echo.
) else (
    echo [ОШИБКА] Сборка не удалась. Проверьте вывод выше.
)

rmdir /s /q "build_temp" 2>nul
del "launcher.spec" 2>nul

pause