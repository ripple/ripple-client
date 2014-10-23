@echo off

REM Windows script for running client e2e tests
REM You have to run server and capture browser first
REM
REM Requirements:
REM - NodeJS (http://nodejs.org/)
REM - Protractor (npm install -g Protractor)
REM - Selenium (https://code.google.com/p/selenium/downloads/list)
REM - Java JRE
REM - ChromeDriver (http://code.google.com/p/chromedriver/downloads/list)
set BASE_DIR=%~dp0

cls
node "%BASE_DIR%\..\node_modules\protractor\bin\protractor" "%BASE_DIR%\..\test\protractor.conf.js" %*
REM @echo Destroying leftover instances of chromedriver.exe
REM taskkill /F /IM chromedriver.exe

@echo e2e test suite complete



