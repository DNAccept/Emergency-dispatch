@echo off
echo Starting global npm install for all project microservices...

echo ========================================
echo Installing Host App...
cd host_app_frontend && npm install && cd ..

echo ========================================
echo Installing Admin App...
cd admin_app_frontend && npm install && cd ..

echo ========================================
echo Installing Incident App...
cd incident_app_frontend && npm install && cd ..

echo ========================================
echo Installing Dispatch App...
cd dispatch_app_frontend && npm install && cd ..

echo ========================================
echo Installing Analytics App...
cd analytics_app_frontend && npm install && cd ..

echo ========================================
echo Installing Authentication Service...
cd authentication_service && npm install && cd ..

echo ========================================
echo Installing Incident Service...
cd incident_service && npm install && cd ..

echo ========================================
echo Installing Dispatch Service...
cd dispatch_service && npm install && cd ..

echo ========================================
echo Installing Analytics Service...
cd analytics_service && npm install && cd ..

echo ========================================
echo All modules installed successfully!
pause
