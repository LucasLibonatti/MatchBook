$ErrorActionPreference = "Stop"

Write-Host "== MatchBook QA Check ==" -ForegroundColor Cyan

Write-Host "`n[1/4] Checking Git for tracked .env files..." -ForegroundColor Yellow
$trackedEnv = git ls-files ".env" ".env.*" | Where-Object { $_ -ne ".env.example" }
if ($trackedEnv) {
    Write-Error "CRITICAL: Secret env file is tracked by Git: $trackedEnv"
    exit 1
}
Write-Host "OK: No secret .env files tracked." -ForegroundColor Green

Write-Host "`n[2/4] Running Oxlint..." -ForegroundColor Yellow
npm run lint
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[3/4] Running Vitest unit tests..." -ForegroundColor Yellow
npm test
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`n[4/4] Running Typecheck & Production Build..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

Write-Host "`nAll QA checks passed!" -ForegroundColor Green
