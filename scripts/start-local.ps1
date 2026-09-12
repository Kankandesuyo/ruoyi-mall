$ErrorActionPreference = 'Stop'
$repo = Split-Path $PSScriptRoot -Parent
if (!(Test-Path "$repo/.runtime/initialized")) { throw 'Local database is not initialized.' }
$java = 'C:/Program Files/Eclipse Adoptium/jdk-11.0.29.7-hotspot/bin/java.exe'
function Start-ServiceProcess($Name, $Port, $Exe, $Arguments, $Directory) {
    if (Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue) {
        Write-Host "$Name is already listening on $Port."
        return
    }
    $process = Start-Process $Exe -ArgumentList $Arguments -WorkingDirectory $Directory -WindowStyle Hidden -PassThru -RedirectStandardOutput "$repo/.runtime/logs/$Name.log" -RedirectStandardError "$repo/.runtime/logs/$Name-error.log"
    $process.Id | Set-Content "$repo/.runtime/$Name.pid"
}
Start-ServiceProcess 'mysql' 3308 'C:/Program Files/MySQL/MySQL Server 8.4/bin/mysqld.exe' "--defaults-file=$repo/.runtime/mysql.ini --console" $repo
Start-ServiceProcess 'redis' 6390 'C:/Program Files/Redis/redis-server.exe' "$repo/.runtime/redis.conf" $repo
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
