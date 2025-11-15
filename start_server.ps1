$ErrorActionPreference = "Stop"

$port = 3003
$processName = "python"

Write-Host "Проверка порта $port..." -ForegroundColor Yellow
$existingProcess = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue

if ($existingProcess) {
    Write-Host "Остановка процесса на порту $port (PID: $existingProcess)..." -ForegroundColor Yellow
    Stop-Process -Id $existingProcess -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Запуск веб-сервера..." -ForegroundColor Green
$scriptPath = Join-Path $PSScriptRoot "webserver.py"
Start-Process python -ArgumentList $scriptPath -WindowStyle Hidden

Start-Sleep -Seconds 3

$checkProcess = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
if ($checkProcess) {
    Write-Host "Сервер успешно запущен на порту $port" -ForegroundColor Green
    Write-Host "Доступен по адресу: http://localhost:$port" -ForegroundColor Cyan
} else {
    Write-Host "Ошибка: сервер не запустился" -ForegroundColor Red
}

