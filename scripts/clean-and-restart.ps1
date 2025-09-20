# Script para limpiar cache y reiniciar la aplicación

Write-Host "🧹 Limpiando cache de Vite y dependencias..." -ForegroundColor Yellow

# Detener procesos existentes si están corriendo
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*SmartAlpacaUpgrade*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Limpiar cache de npm
Write-Host "Limpiando cache de npm..." -ForegroundColor Blue
npm cache clean --force

# Limpiar node_modules de Vite
Write-Host "Limpiando node_modules/.vite..." -ForegroundColor Blue
if (Test-Path "node_modules/.vite") {
    Remove-Item -Recurse -Force "node_modules/.vite"
}

# Limpiar dist si existe
Write-Host "Limpiando dist..." -ForegroundColor Blue
if (Test-Path "dist") {
    Remove-Item -Recurse -Force "dist"
}

Write-Host "✅ Limpieza completada!" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Para reiniciar la aplicación:" -ForegroundColor Cyan
Write-Host "npm run dev" -ForegroundColor White