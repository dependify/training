param(
  [Parameter(Mandatory=$true)][string]$Email,
  [string]$ProjectRef = "cspehwoxnixxyuyuwjkh",
  [Parameter(Mandatory=$true)][string]$SeedToken
)

$fnUrl = "https://$ProjectRef.functions.supabase.co/seed-admin"
Write-Host "Granting admin to $Email via $fnUrl"

$body = @{ email = $Email; role = "admin" } | ConvertTo-Json

$headers = @{ "Content-Type" = "application/json"; "x-seed-token" = $SeedToken }

$resp = Invoke-RestMethod -Method Post -Uri $fnUrl -Headers $headers -Body $body -ErrorAction Stop
$resp | ConvertTo-Json -Depth 5

