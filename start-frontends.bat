@echo off
echo Starting Admin App (Port 5001)...
start cmd /k "cd admin_app_frontend && npm run build && npm run preview"

echo Starting Incident App (Port 5002)...
start cmd /k "cd incident_app_frontend && npm run build && npm run preview"

echo Starting Dispatch App (Port 5003)...
start cmd /k "cd dispatch_app_frontend && npm run build && npm run preview"

echo Starting Analytics App (Port 5004)...
start cmd /k "cd analytics_app_frontend && npm run build && npm run preview"

echo Starting Host App (Port 5000)...
start cmd /k "cd host_app_frontend && npm run dev"

echo All frontend services started. Open http://localhost:5000 in your browser.
