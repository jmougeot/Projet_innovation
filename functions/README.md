# 🔧 Configuration Firebase Functions - Restaurant App

## 📋 Guide d'installation et déploiement

### 1. Installation des dépendances
```bash
cd functions
npm install
```

### 2. Configuration Firebase CLI
```bash
# Si pas encore installé
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Initialiser le projet (si pas déjà fait)
firebase init
```

### 3. Déploiement des fonctions
```bash
# Déployer toutes les fonctions
npm run deploy

# Ou déployer une fonction spécifique
firebase deploy --only functions:setRestaurantAccess
```

### 4. Test en local
```bash
# Démarrer l'émulateur local
npm run serve

# Les fonctions seront disponibles sur :
# http://localhost:5001/VOTRE-PROJECT-ID/us-central1/FONCTION_NAME
```

## 🔗 Fonctions disponibles

### `setRestaurantAccess`
**Usage :** Accorder l'accès à un restaurant avec un rôle spécifique
```typescript
const result = await httpsCallable(functions, 'setRestaurantAccess')({
  restaurantId: 'restaurant_123',
  role: 'manager'
});
```

### `removeRestaurantAccess`
**Usage :** Supprimer l'accès à un restaurant
```typescript
const result = await httpsCallable(functions, 'removeRestaurantAccess')({
  restaurantId: 'restaurant_123'
});
```

### `getUserRestaurantAccess`
**Usage :** Lister tous les restaurants accessibles par l'utilisateur
```typescript
const result = await httpsCallable(functions, 'getUserRestaurantAccess')();
```

### `emergencyLockdown`
**Usage :** Verrouillage d'urgence d'un restaurant (déconnexion massive)
```typescript
const result = await httpsCallable(functions, 'emergencyLockdown')({
  restaurantId: 'restaurant_123'
});
```

### `liftEmergencyLockdown`
**Usage :** Lever le verrouillage d'urgence
```typescript
const result = await httpsCallable(functions, 'liftEmergencyLockdown')({
  restaurantId: 'restaurant_123'
});
```

### `debugUserClaims`
**Usage :** Debug des custom claims (développement)
```typescript
const result = await httpsCallable(functions, 'debugUserClaims')();
```

## 🔐 Sécurité

- ✅ Toutes les fonctions requièrent une authentification Firebase
- ✅ Validation des paramètres d'entrée
- ✅ Logging complet des actions pour audit
- ✅ Gestion automatique des expirations
- ✅ Protection contre les attaques par déni de service

## 📊 Monitoring

Les logs sont automatiquement envoyés à Firebase Console :
- Actions d'authentification
- Erreurs et exceptions
- Événements de sécurité
- Performance des fonctions

Pour voir les logs :
```bash
firebase functions:log
```

## 🚀 Intégration dans votre app

Ajoutez dans votre fichier `firebaseConfig.ts` :
```typescript
import { getFunctions, httpsCallable } from 'firebase/functions';

export const functions = getFunctions();

// Fonction helper pour appeler les Cloud Functions
export const callRestaurantFunction = (functionName: string) => 
  httpsCallable(functions, functionName);
```

Puis utilisez dans vos composants :
```typescript
import { callRestaurantFunction } from './firebaseConfig';

const grantAccess = async (restaurantId: string, role: string) => {
  try {
    const setAccess = callRestaurantFunction('setRestaurantAccess');
    const result = await setAccess({ restaurantId, role });
    console.log('✅ Accès accordé:', result.data);
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
};
```

## 📝 Logs et debugging

Chaque fonction génère des logs détaillés :
- `🔐` : Actions d'authentification
- `✅` : Succès des opérations
- `❌` : Erreurs et échecs
- `🚨` : Événements de sécurité critique
- `⏰` : Expirations automatiques

## 🔧 Maintenance

### Rotation des accès
Les accès restaurant expirent automatiquement après 24h. Pour les renouveler :
```typescript
await callRestaurantFunction('setRestaurantAccess')({
  restaurantId: 'restaurant_123',
  role: 'manager',
  expiresAt: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 jours
});
```

### Nettoyage automatique
La fonction `getUserRestaurantAccess` nettoie automatiquement les accès expirés.

### Backup des logs
Les logs d'audit sont conservés indéfiniment dans Firestore. Pour archiver :
```bash
firebase firestore:delete --recursive --collection audit-logs
```
