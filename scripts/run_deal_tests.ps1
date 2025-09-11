Param(
  [string]$Service = "https://retotalai-site.onrender.com"
)
$headers = @{ "Content-Type" = "application/json"; "Origin" = "https://r-etotal-ai-site.vercel.app" }

Function Post-Deal($body) {
  $json = $body | ConvertTo-Json -Depth 6
  $resp = Invoke-RestMethod -Method Post -Uri "$Service/api/deals" -Headers $headers -Body $json
  return $resp.id
}
Function Open-Pdf($id) {
  Start-Process "$Service/api/deals/$id/report"
}

Write-Host "Running tests against: $Service"
Write-Host "===================================================="

$id1 = Post-Deal @{
  property = @{ address="123 Oak Lane, Dallas, TX"; type="Single Family" }
  numbers = @{ purchase=150000; arv=160000; rehab=10000; rent=1300; taxes=2500; insurance=900; hoa=0; vacancyPct=5; maintenancePct=5; managementPct=8; otherMonthly=25; downPct=20; ratePct=7.0; termYears=30 }
}; Write-Host "[1] Deal ID: $id1"; Open-Pdf $id1

$id2 = Post-Deal @{
  property = @{ address="742 Evergreen Terrace, Springfield, USA"; type="Single Family" }
  numbers = @{ purchase=180000; arv=220000; rehab=15000; rent=1950; taxes=3600; insurance=1200; hoa=0; vacancyPct=5; maintenancePct=5; managementPct=8; otherMonthly=50; downPct=20; ratePct=7.0; termYears=30 }
}; Write-Host "[2] Deal ID: $id2"; Open-Pdf $id2

$id3 = Post-Deal @{
  property = @{ address="456 Maple St, Atlanta, GA"; type="Fix & Flip" }
  numbers = @{ purchase=220000; arv=320000; rehab=60000; downPct=15; ratePct=8.5; holdingMonths=6; carryOtherMonthly=200; sellingCostPct=8; closingCostPct=2 }
}; Write-Host "[3] Deal ID: $id3"; Open-Pdf $id3

$id4 = Post-Deal @{
  property = @{ address="456 Maple St, Atlanta, GA"; type="Fix & Flip" }
  numbers = @{ purchase=220000; arv=360000; rehab=60000; downPct=15; ratePct=8.5; holdingMonths=6; carryOtherMonthly=200; sellingCostPct=8; closingCostPct=2 }
}; Write-Host "[4] Deal ID: $id4"; Open-Pdf $id4

$id5 = Post-Deal @{
  property = @{ address="999 Long Report Way, Phoenix, AZ"; type="Single Family" }
  numbers = @{ purchase=275000; arv=375000; rehab=65000; rent=2600; taxes=6200; insurance=1800; hoa=150; vacancyPct=7; maintenancePct=8; managementPct=9; otherMonthly=100; downPct=20; ratePct=7.25; termYears=30; holdingMonths=7; carryOtherMonthly=250; sellingCostPct=8; closingCostPct=2 }
}; Write-Host "[5] Deal ID: $id5"; Open-Pdf $id5

$id6 = Post-Deal @{
  property = @{ address="No Rent Test, Miami, FL"; type="Condo" }
  numbers = @{ purchase=300000; arv=360000; rehab=40000; downPct=20; ratePct=7.0; termYears=30; holdingMonths=6; sellingCostPct=7; closingCostPct=2 }
}; Write-Host "[6] Deal ID: $id6"; Open-Pdf $id6

Write-Host "===================================================="
Write-Host "All tests posted. PDFs opened."

