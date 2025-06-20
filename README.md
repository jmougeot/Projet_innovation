# 🍽️ Application de Gestion Restaurant

Application React Native/Expo pour la gestion complète d'un restaurant avec système de rôles et sécurité avancée.

## 🚀 Démarrage Rapide

### 1. Installation des dépendances

```bash
npm install
cd functions && npm install
```

### 2. Configuration Firebase

```bash
# Configurer le projet Firebase
firebase login
firebase use --add

# Démarrer les émulateurs (développement)
firebase emulators:start
```

### 3. Lancement de l'application

```bash
# Mode développement
npx expo start

# Mode web
npx expo start --web

# Mode production
npx expo start --no-dev --minify
```

## 🔐 Système de Sécurité

### Authentification et Autorisation

- **Firebase Authentication** : Authentification des utilisateurs
- **Custom Claims** : Gestion des rôles par restaurant
- **Firebase Functions** : Contrôle d'accès centralisé
- **Firestore Rules** : Protection des données au niveau base

### Hiérarchie des Rôles

```
🔴 Super-Admin
├── Accès à tous les restaurants
├── Peut créer des managers
└── Peut déclencher des lockdowns

🟠 Manager (par restaurant)
├── Gestion des employés
├── Accès complet aux données
└── Lockdown d'urgence

🟡 Chef
├── Gestion cuisine et stock
└── Mise à jour des commandes

🟢 Serveur
├── Gestion des commandes
└── Encaissement

🔵 Agent d'entretien
├── Visualisation des missions
└── Mise à jour du statut
```

### 📊 Collections de Données

```
restaurants/{id}
├── userAccess/{userId}     # Accès utilisateurs
├── orders/{orderId}        # Commandes
├── menus/{menuId}          # Cartes et menus
├── stock/{itemId}          # Gestion du stock
├── missions/{missionId}    # Missions de nettoyage
└── accounting/{docId}      # Comptabilité

users/{userId}              # Profils utilisateurs
audit-logs/{logId}          # Logs d'audit
security-events/{eventId}   # Événements sécurité
```

## 🛠️ Scripts de Développement

### Debugging et Tests

```bash
# Script de debugging général
./debug-project.sh

# Test des Firebase Functions
./test-firebase-functions.sh

# Test de sécurité complet
./test-firebase-functions.sh security
```

### Déploiement

```bash
# Déploiement des functions
./deployfunction.sh

# Déploiement complet
./deploy.sh
```

## 🏗️ Architecture

### Frontend (React Native/Expo)
- **App Router** : Navigation par fichiers
- **Context API** : Gestion d'état globale (Restaurant)
- **AsyncStorage** : Cache local
- **Expo** : Plateforme de développement

### Backend (Firebase)
- **Functions** : API serverless sécurisée
- **Firestore** : Base de données NoSQL
- **Authentication** : Gestion des utilisateurs
- **Hosting** : Hébergement web

### Sécurité
- **Custom Claims** : Rôles et permissions
- **Firestore Rules** : Protection des données
- **Audit Logs** : Traçabilité complète
- **Emergency Lockdown** : Sécurité d'urgence

## 📚 Documentation

- **[SECURITY.md](./SECURITY.md)** : Documentation de sécurité complète
- **[firestore.rules](./firestore.rules)** : Règles de sécurité Firestore
- **[functions/src/index.ts](./functions/src/index.ts)** : API Functions commentée

## 🚨 Procédures d'Urgence

### Lockdown d'un Restaurant

```javascript
// Via l'interface manager ou directement
emergencyLockdown({ restaurantId: 'restaurant-id' })
```

### Lever un Lockdown

```javascript
// Managers uniquement
liftEmergencyLockdown({ restaurantId: 'restaurant-id' })
```

### Contact Sécurité

- **Email** : security@restaurant-app.com
- **Documentation** : [SECURITY.md](./SECURITY.md)

## 🔧 Configuration

### Variables d'Environnement

```bash
# functions/.env
FIREBASE_PROJECT_ID=your-project-id
ADMIN_EMAIL=admin@restaurant.com
```

### Expo Configuration

```json
// app.json
{
  "expo": {
    "name": "Restaurant Manager",
    "scheme": "restaurant-app"
  }
}
```

## 📱 Plateformes Supportées

- ✅ **iOS** : Application native
- ✅ **Android** : Application native  
- ✅ **Web** : Progressive Web App
- ✅ **Desktop** : Via navigateur

## 🧪 Tests et Qualité

```bash
# Linting
npm run lint

# Tests unitaires
npm test

# Tests de sécurité
./test-firebase-functions.sh all

# Audit des dépendances
npm audit
```

## 📈 Monitoring

- **Firebase Analytics** : Métriques d'usage
- **Crashlytics** : Rapports de crash
- **Performance** : Monitoring des performances
- **Security Events** : Alertes de sécurité

---

**Version** : 2.0  
**Dernière mise à jour** : Décembre 2024  
**Équipe** : DevTeam Restaurant
