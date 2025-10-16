# 🚀 Azure Static Web Apps Deployment Guide

## 📋 Voraussetzungen

1. **Azure Account** - Mit aktivem Subscription
2. **GitHub Account** - Für automatisches Deployment
3. **Node.js 18+** - Für lokale Entwicklung
4. **Azure CLI** - Für lokales Deployment (optional)

## 🌐 Azure Static Web App erstellen

### 1. Azure Portal
1. Gehe zu [Azure Portal](https://portal.azure.com)
2. Erstelle eine neue **Static Web App**
3. Wähle dein **Subscription** und **Resource Group**
4. Gib einen **App Name** ein (z.B. `supermenu-angular`)
5. Wähle **GitHub** als Source
6. Verbinde dein GitHub Repository
7. Setze:
   - **Branch**: `master`
   - **App location**: `/`
   - **Output location**: `dist/supermenu-angular/browser`

### 2. GitHub Actions Setup
Nach der Erstellung wird automatisch:
- ✅ GitHub Actions Workflow erstellt
- ✅ `AZURE_STATIC_WEB_APPS_API_TOKEN` Secret hinzugefügt
- ✅ Automatisches Deployment bei Push zu `master`

## 🔧 Lokales Deployment (Optional)

### PowerShell Script verwenden:
```powershell
# Script bearbeiten - App Name und Resource Group anpassen
.\deploy.ps1
```

### Manuell:
```bash
# Build erstellen
npm run build --configuration production

# Mit Azure CLI deployen
az staticwebapp deploy \
  --name "deine-app-name" \
  --source "dist/supermenu-angular" \
  --resource-group "deine-resource-group"
```

## 📁 Build Output

Der Production Build erstellt folgende Struktur in `dist/supermenu-angular/`:

```
dist/supermenu-angular/
├── index.html
├── main-*.js          # Hauptbundle (~927 KB)
├── styles-*.css       # Styles (~113 KB)
├── polyfills-*.js     # Polyfills (~35 KB)
├── chunk-*.js         # Lazy-loaded chunks
└── assets/            # Statische Assets
```

## ⚙️ Konfiguration

### `staticwebapp.config.json`
- **Routes**: SPA Routing für Angular
- **Navigation Fallback**: Alle Routes zu `index.html`
- **Cache Headers**: Optimierte Performance
- **MIME Types**: Korrekte Content-Types

### Budget Limits (angular.json)
```json
{
  "type": "initial",
  "maximumWarning": "2MB",
  "maximumError": "3MB"
}
```

## 🔐 Authentication

Für Admin-Bereich (`/admin/*`):
1. **Azure Static Web Apps** unterstützt automatisch:
   - GitHub Authentication
   - Azure Active Directory
   - Custom Authentication

2. **Konfiguration** in `staticwebapp.config.json`:
```json
{
  "routes": [
    {
      "route": "/admin/*",
      "allowedRoles": ["authenticated"]
    }
  ]
}
```

## 📊 Monitoring

### Azure Portal:
- **Overview**: Deployment Status
- **Functions**: API Logs (falls verwendet)
- **Authentication**: User Management
- **Custom Domains**: Custom Domain Setup

### GitHub Actions:
- **Actions Tab**: Deployment Logs
- **Workflow Runs**: Build/Deploy Status

## 🚀 Deployment Process

### Automatisch (GitHub Actions):
1. **Push zu `master`** → Trigger Deployment
2. **GitHub Actions** → Build & Deploy
3. **Azure Static Web Apps** → Live Site Update

### Manuell:
1. **Lokaler Build** → `npm run build`
2. **Azure CLI** → `az staticwebapp deploy`
3. **Azure Portal** → Manual Upload

## 🔍 Troubleshooting

### Build Errors:
```bash
# Bundle zu groß
npm run build --configuration production --verbose

# Budget Limits anpassen in angular.json
```

### Deployment Errors:
```bash
# Azure CLI Login
az login

# Check Static Web App Status
az staticwebapp show --name "deine-app-name"
```

### Performance:
- **Bundle Size**: 1.25 MB (optimiert für Angular + Material)
- **Lazy Loading**: Admin-Module werden nur bei Bedarf geladen
- **Cache**: Assets werden 1 Jahr gecacht

## 📈 Performance Optimierung

### Implementiert:
- ✅ **Tree Shaking**: Unused Code entfernt
- ✅ **Minification**: JavaScript/CSS komprimiert
- ✅ **Lazy Loading**: Route-based Code Splitting
- ✅ **Cache Headers**: Optimierte Browser-Caching

### Zusätzliche Optimierungen:
- **Image Optimization**: WebP Format
- **CDN**: Azure Static Web Apps CDN
- **Compression**: Gzip/Brotli automatisch

## 🎯 Next Steps

1. **Custom Domain** hinzufügen
2. **SSL Certificate** konfigurieren
3. **Environment Variables** für verschiedene Stages
4. **API Integration** mit Azure Functions
5. **Monitoring** mit Application Insights

---

**🎉 Deine Angular App ist jetzt bereit für Azure Static Web Apps!**
