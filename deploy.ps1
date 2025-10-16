# Azure Static Web Apps Deployment Script
# Run this script to deploy your Angular app to Azure Static Web Apps

Write-Host "🚀 Starting Azure Static Web Apps Deployment..." -ForegroundColor Green

# Check if Azure CLI is installed
if (!(Get-Command az -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Azure CLI is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli" -ForegroundColor Yellow
    exit 1
}

# Check if user is logged in
$loginStatus = az account show --query "user.name" -o tsv 2>$null
if (!$loginStatus) {
    Write-Host "🔐 Please login to Azure CLI first:" -ForegroundColor Yellow
    az login
}

# Build the Angular app
Write-Host "📦 Building Angular application..." -ForegroundColor Blue
npm run build --configuration production

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Build failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Build completed successfully!" -ForegroundColor Green

# Deploy to Azure Static Web Apps
Write-Host "🌐 Deploying to Azure Static Web Apps..." -ForegroundColor Blue

# You need to replace 'YOUR_APP_NAME' with your actual Static Web App name
$appName = "YOUR_APP_NAME"  # Replace with your actual app name

# Deploy using Azure CLI
az staticwebapp deploy --name $appName --source "dist/supermenu-angular/browser" --resource-group "YOUR_RESOURCE_GROUP"

if ($LASTEXITCODE -eq 0) {
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌍 Your app should be available at: https://$appName.azurestaticapps.net" -ForegroundColor Cyan
} else {
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    exit 1
}

Write-Host "✨ Done! Your Angular app is now deployed to Azure Static Web Apps." -ForegroundColor Green
