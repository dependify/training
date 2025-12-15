param(
  [string]$ProjectRef = "cspehwoxnixxyuyuwjkh",
  [string]$AppUrl = "https://register.uslaccafrica.org",
  [string]$DbUrl
)

Write-Host "Linking to Supabase project $ProjectRef"
npx supabase link --project-ref $ProjectRef

if ($DbUrl) {
  Write-Host "Ensuring database exists and extensions are set"
  node ./scripts/create-db.js $DbUrl
  Write-Host "Pushing database migrations to provided DB URL"
  $env:SUPABASE_DB_URL = $DbUrl
  npx supabase db push
} else {
  Write-Host "Pushing database migrations"
  npx supabase db push
}

Write-Host "Setting edge function secrets"
npx supabase secrets set APP_URL=$AppUrl
npx supabase secrets set SUPABASE_URL="https://$ProjectRef.supabase.co"

if (-not $env:SUPABASE_SERVICE_ROLE_KEY) { Write-Warning "Set SUPABASE_SERVICE_ROLE_KEY in environment before running." }
if (-not $env:BREVO_SMTP_LOGIN) { Write-Warning "Set BREVO_SMTP_LOGIN in environment before running." }
if (-not $env:BREVO_SMTP_PASSWORD) { Write-Warning "Set BREVO_SMTP_PASSWORD in environment before running." }
if (-not $env:ADMIN_SEED_TOKEN) { Write-Warning "Set ADMIN_SEED_TOKEN in environment before running." }

if ($env:SUPABASE_SERVICE_ROLE_KEY) { npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=$env:SUPABASE_SERVICE_ROLE_KEY }
if ($env:BREVO_SMTP_LOGIN) { npx supabase secrets set BREVO_SMTP_LOGIN=$env:BREVO_SMTP_LOGIN }
if ($env:BREVO_SMTP_PASSWORD) { npx supabase secrets set BREVO_SMTP_PASSWORD=$env:BREVO_SMTP_PASSWORD }
if ($env:ADMIN_SEED_TOKEN) { npx supabase secrets set ADMIN_SEED_TOKEN=$env:ADMIN_SEED_TOKEN }

Write-Host "Deploying edge functions"
npx supabase functions deploy send-registration-email --project-ref $ProjectRef
npx supabase functions deploy verify-email --project-ref $ProjectRef
npx supabase functions deploy seed-admin --project-ref $ProjectRef

Write-Host "Done"

