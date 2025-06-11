# Interface Restaurant

L'interface Restaurant permet de créer et gérer complètement son restaurant avec une structure organisée dans Firebase.

## Fonctionnalités

### 📱 Interface de Gestion
- **Page d'accueil** (`/restaurant`) : Vue d'ensemble du restaurant et options de configuration
- **Création de restaurant** (`/restaurant/create`) : Formulaire complet pour créer un nouveau restaurant
- **Paramètres** (`/restaurant/settings`) : Modification des paramètres du restaurant existant

### 🏗️ Structure Restaurant
L'interface utilise la nouvelle structure Restaurant de Firebase qui organise toutes les données sous un restaurant parent :

```
Restaurant (collection)
├── main-restaurant (document)
    ├── Informations générales (name, address, phone, email)
    ├── Paramètres (settings)
    ├── Analytics (analytics)
    └── Sous-collections :
        ├── rooms (salles)
        ├── tables (tables)
        ├── menu (plats)
        ├── stock (inventaire)
        ├── active_orders (commandes en cours)
        └── completed_orders (commandes terminées)
```

## Navigation

### 🚀 Accès depuis l'espace Service
1. Aller dans **Espace Service** (`/service`)
2. Dans la section **Gestion avancée**, cliquer sur **Mon Restaurant**
3. Cela ouvre l'interface restaurant à `/restaurant`

### 🔧 Options disponibles

#### Si aucun restaurant n'existe :
- **Configuration personnalisée** : Créer un restaurant avec tous les paramètres personnalisés
- **Configuration rapide** : Initialiser avec les paramètres par défaut

#### Si un restaurant existe :
- **Gérer le restaurant** : Accéder aux paramètres et outils de gestion

## Fonctionnalités de l'Interface

### 📝 Création de Restaurant (`create.tsx`)

**Informations générales :**
- Nom du restaurant (obligatoire)
- Adresse
- Téléphone
- Email

**Horaires d'ouverture :**
- Heure d'ouverture (obligatoire)
- Heure de fermeture (obligatoire)

**Configuration opérationnelle :**
- Capacité de la cuisine (nombre de commandes simultanées)
- Nom de la salle par défaut

**Paramètres financiers :**
- Devise (EUR par défaut)
- Taux de TVA (%)
- Frais de service (%)

**Migration des données :**
- Option pour migrer automatiquement les données existantes vers la nouvelle structure

### ⚙️ Paramètres (`settings.tsx`)

**Modification des paramètres :**
- Tous les champs de la création sont modifiables
- Sauvegarde instantanée

**Gestion des données :**
- **Migration** : Migrer les données existantes vers la structure restaurant
- **Synchronisation** : Synchroniser entre ancienne et nouvelle structure
- **Cache** : Vider le cache pour forcer un rechargement

### 🎯 Page d'accueil (`index.tsx`)

**Si restaurant configuré :**
- Affichage des informations du restaurant
- Horaires d'ouverture
- Capacité cuisine
- Devise et TVA
- Bouton d'accès aux paramètres

**Si pas de restaurant :**
- Options de configuration
- Informations sur les fonctionnalités

## Intégration avec le Système Existant

### 🔗 Migration Automatique
- L'interface peut migrer automatiquement les données existantes :
  - Tables → Restaurant/tables
  - Menu → Restaurant/menu
  - Stock → Restaurant/stock
  - Commandes en cours → Restaurant/active_orders
  - Commandes terminées → Restaurant/completed_orders

### 🔄 Compatibilité
- Le système reste compatible avec l'ancienne structure pendant la transition
- Les fonctions de synchronisation permettent de maintenir la cohérence

### 📊 Cache et Performance
- Cache intelligent pour les données du restaurant
- Invalidation automatique lors des modifications
- Rechargement optimisé

## Utilisation

### 1. Première utilisation
1. Aller dans `/restaurant`
2. Choisir "Configuration personnalisée" ou "Configuration rapide"
3. Remplir le formulaire (si personnalisé)
4. Confirmer la création
5. Le restaurant est prêt !

### 2. Modification des paramètres
1. Depuis `/restaurant`, cliquer sur "Gérer le restaurant"
2. Modifier les champs souhaités
3. Cliquer sur "Sauvegarder les paramètres"

### 3. Migration des données
1. Dans les paramètres (`/restaurant/settings`)
2. Section "Gestion des données"
3. Cliquer sur "Migrer les données"
4. Confirmer l'opération

## Architecture Technique

### 📁 Structure des fichiers
```
app/restaurant/
├── _layout.tsx          # Layout avec navigation Stack
├── index.tsx           # Page d'accueil restaurant
├── create.tsx          # Création de restaurant
└── settings.tsx        # Paramètres et gestion
```

### 🔧 Fonctions utilisées
- `initializeRestaurant()` - Création d'un nouveau restaurant
- `getRestaurant()` - Récupération des données avec cache
- `updateRestaurant()` - Mise à jour des informations
- `updateRestaurantSettings()` - Mise à jour des paramètres
- `migrateExistingDataToRestaurant()` - Migration des données
- `syncRestaurantData()` - Synchronisation
- `clearRestaurantCache()` - Gestion du cache

### 🎨 Design
- Interface cohérente avec le design de l'app
- Header avec navigation et menu réglage
- Formulaires avec validation
- Indicateurs de chargement
- Messages de confirmation et d'erreur

## Avantages

### 🚀 Pour l'utilisateur
- Interface intuitive et guidée
- Configuration flexible (rapide ou personnalisée)
- Migration automatique des données existantes
- Gestion centralisée du restaurant

### 🔧 Pour le développement
- Structure Firebase organisée et scalable
- Code modulaire et réutilisable
- Gestion d'erreurs robuste
- Performance optimisée avec cache

### 📈 Pour l'évolutivité
- Structure prête pour multi-restaurants
- Système d'analytics intégré
- Paramètres configurables
- Migration facilitée vers de nouvelles fonctionnalités
