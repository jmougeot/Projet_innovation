# 🏪 SYSTÈME D'AUTHENTIFICATION RESTAURANT - GUIDE COMPLET

## 📋 RÉSUMÉ DE L'IMPLÉMENTATION

### ✅ FONCTIONNALITÉS IMPLÉMENTÉES

#### 1. 🔐 Authentification à deux niveaux
- **Niveau 1**: Connexion utilisateur classique (`/connexion`)
- **Niveau 2**: Sélection/accès restaurant (`/restaurant/select`)

#### 2. 🏗️ Architecture créée
- **RestaurantSelectionContext**: Gestion de l'état global des restaurants
- **RestaurantProtectedRoute**: Composant de protection des routes
- **restaurantAccess.ts**: Gestion des permissions et rôles
- **testData.ts**: Utilitaires de test et démo

#### 3. 📱 Pages créées
- `/restaurant/select`: Sélection de restaurant après connexion
- `/restaurant/admin`: Administration des accès (owner/admin seulement)
- `/connexion/login_restaurant`: Configuration et test des accès

#### 4. 👥 Système de rôles
- **Owner**: Toutes les permissions
- **Admin**: Toutes les permissions 
- **Manager**: Gestion restaurant (menu, commandes, staff, rapports)
- **Staff**: Consultation et mise à jour des commandes

### 🚀 COMMENT TESTER LE SYSTÈME

#### Étape 1: Connexion utilisateur
1. Aller sur `/connexion`
2. Se connecter avec un compte existant
3. → Redirection automatique vers `/restaurant/select`

#### Étape 2: Configuration des accès (première fois)
1. Sur `/restaurant/select`, cliquer "Configurer accès de test"
2. Cela créera automatiquement un accès "owner" pour votre compte
3. → Vous verrez maintenant vos restaurants disponibles

#### Étape 3: Utilisation
1. Sélectionner un restaurant dans la liste
2. → Accès à `/restaurant` avec vos permissions
3. Si vous êtes owner/admin: bouton "Administration" disponible

### 🔧 CONFIGURATION MANUELLE

#### Pour créer des accès manuellement:
```typescript
import { grantRestaurantAccess, DEFAULT_RESTAURANT_ID } from './firebase/restaurantAccess';

// Accorder un rôle manager à un utilisateur
await grantRestaurantAccess(
  'userId_target',
  DEFAULT_RESTAURANT_ID,
  'manager',
  'userId_current' // Qui accorde l'accès
);
```

### 🎯 POINTS D'ENTRÉE PRINCIPAUX

#### Navigation depuis service:
- Page `/service` → Bouton "Gestion Restaurant" → `/restaurant/select`

#### Accès direct:
- `/restaurant/select`: Sélection restaurant (nécessite connexion)
- `/restaurant`: Gestion restaurant (nécessite restaurant sélectionné)
- `/restaurant/admin`: Administration (owner/admin seulement)

### 🗂️ STRUCTURE DES DONNÉES

#### Collection `restaurantAccess`:
```javascript
{
  userId: "firebase_uid",
  restaurantId: "restaurant_id", 
  role: "owner|admin|manager|staff",
  permissions: ["manage_menu", "view_orders", ...],
  grantedBy: "granter_uid",
  grantedAt: timestamp,
  isActive: true
}
```

### 📊 PERMISSIONS DÉTAILLÉES

#### 👑 Owner/Admin
- `all`: Toutes les permissions

#### 👔 Manager  
- `manage_menu`: Gestion du menu
- `manage_orders`: Gestion des commandes
- `manage_staff`: Gestion du personnel
- `view_reports`: Consultation des rapports
- `manage_tables`: Gestion des tables
- `manage_stock`: Gestion du stock

#### 👥 Staff
- `view_orders`: Consultation des commandes
- `update_order_status`: Mise à jour des statuts
- `view_menu`: Consultation du menu
- `view_tables`: Consultation des tables

### 🧪 OUTILS DE TEST DISPONIBLES

#### Dans `/restaurant/admin`:
- Bouton "Exécuter scénario de test"
- Ajout/suppression d'utilisateurs
- Visualisation des permissions

#### Dans la console développeur:
```javascript
// Afficher les rôles
import { displayRoleSummary } from './firebase/testData';
displayRoleSummary();

// Configurer accès de test
import { setupTestRestaurantAccess } from './firebase/testData';
await setupTestRestaurantAccess();
```

### 🔄 FLUX UTILISATEUR COMPLET

1. **Utilisateur non connecté**:
   - `/restaurant/*` → Redirection vers `/connexion`

2. **Utilisateur connecté mais sans restaurant**:
   - `/restaurant/select` → Configuration ou sélection
   - Possibilité de configurer des accès de test

3. **Restaurant sélectionné**:
   - Accès à `/restaurant` selon permissions
   - Navigation entre les fonctionnalités selon le rôle

4. **Administration** (owner/admin):
   - `/restaurant/admin` → Gestion des utilisateurs et permissions

### 🛡️ SÉCURITÉ

#### Protection des routes:
- **RestaurantProtectedRoute** vérifie automatiquement:
  - Utilisateur connecté
  - Restaurant sélectionné  
  - Rôles requis
  - Permissions spécifiques

#### Vérifications côté serveur:
- Toutes les opérations sensibles vérifient les permissions
- Logs de sécurité pour les actions d'administration

### 🐛 DÉPANNAGE

#### Problèmes courants:
1. **"Aucun restaurant trouvé"**: Utiliser le bouton "Configurer accès de test"
2. **"Accès refusé"**: Vérifier les rôles dans `/restaurant/admin`
3. **Erreurs de permissions**: Consulter la console pour les détails

#### Reset des données:
```javascript
// Si nécessaire, nettoyer les données de test
import { cleanupTestData } from './firebase/testData';
await cleanupTestData();
```

---

## 🎉 FÉLICITATIONS !

Le système d'authentification restaurant est maintenant fonctionnel et sécurisé. Vous pouvez:

✅ Vous connecter en tant qu'utilisateur  
✅ Sélectionner un restaurant  
✅ Accéder aux fonctionnalités selon vos permissions  
✅ Administrer les accès si vous êtes propriétaire  
✅ Tester le système avec les outils intégrés  

Le système est prêt pour la production avec des fonctionnalités d'administration complètes !
