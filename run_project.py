"""
ICU Mortality Prediction Project Launcher
=========================================
Runs Flask backend (port 5000) and Vite frontend (port 3000).
Also opens the browser to the application dashboard.
"""

import os
import sys
import subprocess
import time
import webbrowser

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(BASE_DIR, 'backend')
FRONTEND_DIR = os.path.join(BASE_DIR, 'frontend')

def main():
    print("=" * 65)
    print("  ICU Mortality Prediction Engine")
    print("  Logistic Regression Benchmark on MIMIC-III & eICU-CRD")
    print("=" * 65)
    
    # 1. Start Flask backend process
    print("\n[1/2] Starting Python Flask backend on http://localhost:5000...")
    backend_proc = subprocess.Popen(
        [sys.executable, 'app.py'],
        cwd=BACKEND_DIR
    )
    
    # Give Flask a brief moment to initialize and train initial model
    time.sleep(3)
    
    # 2. Start Vite dev server for frontend
    print("[2/2] Starting React Vite dev server on http://localhost:3000...")
    npm_cmd = 'npm.cmd' if sys.platform == 'win32' else 'npm'
    
    frontend_proc = subprocess.Popen(
        [npm_cmd, 'run', 'dev', '--', '--port', '3000'],
        cwd=FRONTEND_DIR
    )
    
    time.sleep(2)
    url = "http://localhost:3000"
    print(f"\n Application is LIVE at: {url}")
    print(f" Backend REST API at:   http://localhost:5000/api/health")
    print("\nPress Ctrl+C to stop both servers.")
    
    try:
        webbrowser.open(url)
    except Exception:
        pass
        
    try:
        backend_proc.wait()
        frontend_proc.wait()
    except KeyboardInterrupt:
        print("\nStopping servers...")
        backend_proc.terminate()
        frontend_proc.terminate()
        print("Done.")

if __name__ == '__main__':
    main()
