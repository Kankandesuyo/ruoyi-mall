$ErrorActionPreference = 'Stop'
try {
    & "$PSScriptRoot/start-local.ps1"
    $pending = @('http://127.0.0.1:8080', 'http://127.0.0.1:5173', 'http://127.0.0.1:8099')
    $deadline = (Get-Date).AddMinutes(3)
    while ($pending.Count -gt 0 -and (Get-Date) -lt $deadline) {
        $pending = @($pending | Where-Object {
            try {
                $response = Invoke-WebRequest -Uri $_ -UseBasicParsing -TimeoutSec 3
                $response.StatusCode -ne 200
            } catch { $true }
        })
        if ($pending.Count -gt 0) { Start-Sleep -Seconds 2 }
    }
    if ($pending.Count -gt 0) {
        throw "Services did not become ready: $($pending -join ', '). Check .runtime/logs."
    }
    Start-Process 'http://127.0.0.1:5173'
    Start-Process 'http://127.0.0.1:8099'
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    Read-Host 'Press Enter to close'
    exit 1
}
