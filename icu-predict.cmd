@echo off
title ICU Mortality Prediction Engine
echo =========================================================
echo   Launching ICU Mortality Prediction (MIMIC-III & eICU)
echo =========================================================
cd /d "%~dp0"
python run_project.py
pause
