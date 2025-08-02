@echo off
REM Script to run Electron tests in headless mode on Windows
REM Usage: scripts\test-headless.bat

echo Running Electron tests in headless mode on Windows...

set HEADLESS=1
npm run test:electron:headless

echo Headless test run completed!