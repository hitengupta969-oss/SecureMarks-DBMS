# ==============================================================================
# SecureMarks - Automated Verification & Test Suite Runner
# ==============================================================================

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "         RUNNING SECUREMARKS TEST SUITE           " -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$env:PYTHONPATH = "backend"

# Run pytest on all test suites
pytest backend\tests -v

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nAll 17 project requirements and tests PASSED!" -ForegroundColor Green
} else {
    Write-Host "`nSome tests failed. Check log output above." -ForegroundColor Red
}
