@echo off
setlocal enabledelayedexpansion

echo Checking compiler environment...

:: Try to detect the custom Winget locations
set "FLEX_DIR=%LOCALAPPDATA%\Microsoft\WinGet\Packages\WinFlexBison.win_flex_bison_Microsoft.Winget.Source_8wekyb3d8bbwe"
set "GCC_DIR=%LOCALAPPDATA%\Microsoft\WinGet\Packages\MartinStorsjo.LLVM-MinGW.UCRT_Microsoft.Winget.Source_8wekyb3d8bbwe\llvm-mingw-20260602-ucrt-x86_64\bin"

if exist "%FLEX_DIR%" (
    echo Adding win_flex to PATH from Winget directory...
    set "PATH=%FLEX_DIR%;%PATH%"
)
if exist "%GCC_DIR%" (
    echo Adding GCC compiler to PATH from Winget directory...
    set "PATH=%GCC_DIR%;%PATH%"
)

:: Test if tools are accessible
where win_flex >nul 2>nul
if !ERRORLEVEL! neq 0 (
    where flex >nul 2>nul
    if !ERRORLEVEL! neq 0 (
        echo ERROR: Flex or win_flex was not found in PATH or Winget directory.
        echo Please install win_flex_bison using: winget install WinFlexBison.win_flex_bison
        exit /b 1
    ) else (
        set "LEX_CMD=flex"
    )
) else (
    set "LEX_CMD=win_flex"
)

where gcc >nul 2>nul
if !ERRORLEVEL! neq 0 (
    echo ERROR: GCC was not found in PATH or Winget directory.
    echo Please install a C compiler like LLVM-MinGW: winget install MartinStorsjo.LLVM-MinGW.UCRT
    exit /b 1
)

echo.
echo Running: %LEX_CMD% lexer.l
call %LEX_CMD% lexer.l
if !ERRORLEVEL! neq 0 (
    echo Lexer compilation failed!
    exit /b !ERRORLEVEL!
)

echo Running: gcc -o lexer.exe lex.yy.c main.c
call gcc -o lexer.exe lex.yy.c main.c
if !ERRORLEVEL! neq 0 (
    echo GCC compilation failed!
    exit /b !ERRORLEVEL!
)

echo.
echo ===================================================
echo BUILD SUCCESSFUL! Created lexer.exe
echo Run it using: lexer.exe test_input.c
echo ===================================================

endlocal
