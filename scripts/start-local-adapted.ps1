# Adapted from scripts/start-local.ps1 for this machine:
# - MySQL runs as the system service (MySQL80 @ 3306), no need to start
# - Redis/JDK11 are portable copies under D:/DSH/ruoyi-mall-deploy/tools
$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
if (!(Test-Path "$repo/.runtime/initialized")) { throw 'Local database is not initialized. Run: node scripts/init-local-adapted.cjs' }
$java = 'D:/DSH/ruoyi-mall-deploy/tools/jdk-11.0.32.1+1/bin/java.exe'
if (!(Test-Path $java)) { throw "JDK not found at $java" }
if (!(Test-Path "$repo/.runtime/redis-data")) { New-Item -ItemType Directory -Path "$repo/.runtime/redis-data" | Out-Null }

function Start-ServiceProcess($Name, $Port, $Exe, $Arguments, $Directory) {
    if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) {
        Write-Host "$Name is already listening on $Port."
        return
    }
    $process = Start-Process $Exe -ArgumentList $Arguments -WorkingDirectory $Directory -WindowStyle Hidden -PassThru -RedirectStandardOutput "$repo/.runtime/logs/$Name.log" -RedirectStandardError "$repo/.runtime/logs/$Name-error.log"
    $process.Id | Set-Content "$repo/.runtime/$Name.pid"
}

Start-ServiceProcess 'redis' 6379 'D:/DSH/ruoyi-mall-deploy/tools/redis/redis-server.exe' "$repo/.runtime/redis.conf" $repo
Start-ServiceProcess 'backend' 8080 $java "-jar ruo-yi-mall/ruoyi-admin/target/ruoyi-admin.jar --spring.profiles.active=druid,local --spring.config.additional-location=file:./.runtime/" $repo
Start-ServiceProcess 'client' 5173 (Get-Command node.exe).Source 'node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 --strictPort' "$repo/ruoyi-mall-h5"
if (Test-Path "$repo/ruoyi-mall-vue/node_modules/@vue/cli-service/bin/vue-cli-service.js") {
    $previousNodeOptions = $env:NODE_OPTIONS
    try {
        $env:NODE_OPTIONS = '--openssl-legacy-provider'
        Start-ServiceProcess 'admin' 8099 (Get-Command node.exe).Source 'node_modules/@vue/cli-service/bin/vue-cli-service.js serve' "$repo/ruoyi-mall-vue"
    } finally { $env:NODE_OPTIONS = $previousNodeOptions }
}
Write-Host 'Admin: http://127.0.0.1:8099'
Write-Host 'Client: http://127.0.0.1:5173 ; API: http://127.0.0.1:8080'
Write-Host 'Check .runtime/logs/backend.log for readiness.'
