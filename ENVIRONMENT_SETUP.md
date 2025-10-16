# 🔐 Environment Variables Setup

## 📋 Kritische Daten die ausgelagert wurden:

### ✅ **Supabase Konfiguration:**
- `SUPABASE_URL` - Supabase Projekt URL
- `SUPABASE_ANON_KEY` - Public Anon Key (sicher für Frontend)

### ✅ **Restaurant Konfiguration:**
- `RESTAURANT_SLUG` - Eindeutiger Restaurant-Identifier

### ✅ **App Konfiguration:**
- `APP_NAME` - Anwendungsname

## 🚀 Setup für verschiedene Umgebungen:

### **1. Development (Lokal)**
```bash
# Kopiere das Template
cp env.example .env

# Bearbeite die Werte
SUPABASE_URL=https://gcanfodziyqrfpobwmyb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjYW5mb2R6aXlxcmZwb2J3bXliIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQyMTI1NTIsImV4cCI6MjA2OTc4ODU1Mn0.PS0lhRf9UXXohS-VglMNwtbHbyeeaTPOktpJhdErRvc
RESTAURANT_SLUG=eiscafe-remi
APP_NAME=SuperMenu Angular
NODE_ENV=development
```

### **2. Production (Azure Static Web Apps)**

#### Option A: Azure Static Web Apps Environment Variables
```bash
# In Azure Portal → Static Web App → Configuration → Application Settings
SUPABASE_URL=https://gcanfodziyqrfpobwmyb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESTAURANT_SLUG=eiscafe-remi
APP_NAME=SuperMenu Angular
NODE_ENV=production
```

#### Option B: GitHub Secrets (für GitHub Actions)
```bash
# In GitHub Repository → Settings → Secrets and variables → Actions
SUPABASE_URL=https://gcanfodziyqrfpobwmyb.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
RESTAURANT_SLUG=eiscafe-remi
```

## 🔧 Build-Konfiguration anpassen:

### **angular.json erweitern:**
```json
{
  "projects": {
    "supermenu-angular": {
      "architect": {
        "build": {
          "configurations": {
            "production": {
              "fileReplacements": [
                {
                  "replace": "src/environments/environment.ts",
                  "with": "src/environments/environment.prod.ts"
                }
              ]
            }
          }
        }
      }
    }
  }
}
```

### **Environment-basierte Builds:**
```bash
# Development Build
npm run build --configuration=development

# Production Build mit Environment Variables
npm run build --configuration=production
```

## 🔐 Sicherheitshinweise:

### ✅ **Sicher für Frontend:**
- `SUPABASE_URL` - Öffentlich sichtbar (OK)
- `SUPABASE_ANON_KEY` - Öffentlich sichtbar (OK)
- `RESTAURANT_SLUG` - Öffentlich sichtbar (OK)

### ❌ **NICHT hier verwenden:**
- Service Role Keys (nur Backend)
- Database Passwords
- API Keys mit Admin-Rechten

## 📊 Environment-spezifische Konfiguration:

### **Development (environment.ts):**
```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://gcanfodziyqrfpobwmyb.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  restaurantSlug: 'eiscafe-remi',
  appName: 'SuperMenu Angular',
  debug: true,
  logLevel: 'debug'
};
```

### **Production (environment.prod.ts):**
```typescript
export const environment = {
  production: true,
  supabaseUrl: process.env['SUPABASE_URL'] || 'https://gcanfodziyqrfpobwmyb.supabase.co',
  supabaseAnonKey: process.env['SUPABASE_ANON_KEY'] || 'fallback-key',
  restaurantSlug: process.env['RESTAURANT_SLUG'] || 'eiscafe-remi',
  appName: process.env['APP_NAME'] || 'SuperMenu Angular',
  debug: false,
  logLevel: 'error'
};
```

## 🚀 Deployment mit Environment Variables:

### **Azure Static Web Apps:**
1. **Azure Portal** → Static Web App → Configuration
2. **Application Settings** hinzufügen
3. **Environment Variables** setzen
4. **Redeploy** auslösen

### **GitHub Actions:**
```yaml
# .github/workflows/azure-static-web-apps.yml
- name: Build with Environment Variables
  env:
    SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
    SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
    RESTAURANT_SLUG: ${{ secrets.RESTAURANT_SLUG }}
  run: npm run build --configuration=production
```

## 🔍 Verwendung in der App:

### **Service Injection:**
```typescript
import { environment } from '../environments/environment';

// Verwende environment.supabaseUrl statt hardcoded URLs
const url = `${environment.supabaseUrl}/storage/v1/object/public/...`;
```

### **Conditional Logic:**
```typescript
if (environment.production) {
  // Production-spezifische Logik
  console.log('Production mode');
} else {
  // Development-spezifische Logik
  console.log('Development mode');
}
```

## ✅ Checkliste:

- [ ] `env.example` erstellt
- [ ] Environment Files konfiguriert
- [ ] Services auf Environment Variables umgestellt
- [ ] Hardcoded URLs entfernt
- [ ] Build-Konfiguration angepasst
- [ ] Azure Static Web Apps Environment Variables gesetzt
- [ ] GitHub Secrets konfiguriert (optional)

---

**🔐 Deine App ist jetzt sicher konfiguriert mit Environment Variables!**
