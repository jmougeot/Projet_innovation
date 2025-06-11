# 🏪 Firebase Restaurant Structure

## Overview

This new Firebase structure organizes all restaurant data under a parent "Restaurant" collection, providing better data organization, easier management, and improved scalability.

## 📁 Structure Overview

```
restaurants/
└── main-restaurant/
    ├── (restaurant metadata)
    ├── rooms/
    │   ├── room-1/
    │   └── room-2/
    ├── tables/
    │   ├── table-1/
    │   └── table-2/
    ├── menu/
    │   ├── dish-1/
    │   └── dish-2/
    ├── stock/
    │   ├── item-1/
    │   └── item-2/
    ├── active_orders/
    │   ├── order-1/
    │   └── order-2/
    ├── completed_orders/
    │   ├── order-1/
    │   └── order-2/
    └── analytics/
        ├── daily-2025-06-10/
        └── monthly-2025-06/
```

## 🚀 Quick Start

### 1. Initialize Restaurant

```typescript
import { initializeRestaurant, quickSetup } from '@/app/firebase/restaurantUtils';

// Method 1: Simple initialization
const restaurantId = await initializeRestaurant({
  name: "Mon Super Restaurant",
  address: "123 Rue de la Gastronomie",
  phone: "+33 1 23 45 67 89"
});

// Method 2: Quick setup with migration
const restaurant = await quickSetup({
  restaurantName: "Mon Restaurant",
  migrate: true,
  force: false
});
```

### 2. Get Restaurant Data

```typescript
import { getRestaurant } from '@/app/firebase/firebaseRestaurant';

const restaurant = await getRestaurant();
console.log(`Restaurant: ${restaurant.name}`);
console.log(`Salles: ${restaurant.rooms.length}`);
console.log(`Commandes actives: ${restaurant.active_orders.length}`);
```

### 3. Update Restaurant Settings

```typescript
import { updateRestaurantSettings } from '@/app/firebase/firebaseRestaurant';

await updateRestaurantSettings('main-restaurant', {
  business_hours: {
    open_time: "09:00",
    close_time: "23:00",
    days_of_week: ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  },
  table_service_time: 120, // 2 hours
  currency: "EUR",
  tax_rate: 0.20
});
```

## 📊 Data Types

### Restaurant Interface

```typescript
interface Restaurant {
  id: string;
  name: string;
  manager_id?: string;
  address?: string;
  phone?: string;
  email?: string;
  created_at: Timestamp;
  updated_at: Timestamp;
  settings: RestaurantSettings;
  analytics: RestaurantAnalytics;
  rooms: Room[];
  active_orders: CommandeData[];
  completed_orders: CommandeTerminee[];
  stock: StockData[];
  menu: Plat[];
  is_active: boolean;
  last_sync: Timestamp;
}
```

### Restaurant Settings

```typescript
interface RestaurantSettings {
  business_hours: {
    open_time: string;
    close_time: string;
    days_of_week: string[];
  };
  table_service_time: number; // minutes
  kitchen_capacity: number;
  currency: string;
  tax_rate: number;
  service_charge: number;
  default_room_name: string;
}
```

### Restaurant Analytics

```typescript
interface RestaurantAnalytics {
  daily_revenue: number;
  monthly_revenue: number;
  yearly_revenue: number;
  total_orders: number;
  popular_dishes: string[];
  average_order_value: number;
  peak_hours: { hour: number; order_count: number }[];
  last_updated: Timestamp;
}
```

## 🔄 Migration from Old Structure

### Automatic Migration

```typescript
import { migrateAndSetupRestaurant } from '@/app/firebase/restaurantUtils';

// This will migrate all existing data:
// - tables → restaurants/main-restaurant/tables/
// - menu → restaurants/main-restaurant/menu/
// - stock → restaurants/main-restaurant/stock/
// - commandes_en_cours → restaurants/main-restaurant/active_orders/
// - commandes_terminees → restaurants/main-restaurant/completed_orders/

const restaurant = await migrateAndSetupRestaurant("Mon Restaurant");
```

### Manual Migration Steps

```typescript
import { 
  initializeRestaurant, 
  migrateExistingDataToRestaurant 
} from '@/app/firebase/firebaseRestaurant';

// Step 1: Create restaurant
const restaurantId = await initializeRestaurant({
  name: "Mon Restaurant"
});

// Step 2: Migrate data
await migrateExistingDataToRestaurant(restaurantId);
```

## 📈 Working with Sub-Collections

### Tables

```typescript
import { getRestaurantTables } from '@/app/firebase/firebaseRestaurant';

// Get all tables for the restaurant
const tables = await getRestaurantTables();

// Tables are now organized under: restaurants/main-restaurant/tables/
```

### Menu

```typescript
import { getRestaurantMenu } from '@/app/firebase/firebaseRestaurant';

// Get restaurant menu
const menu = await getRestaurantMenu();

// Menu items are now under: restaurants/main-restaurant/menu/
```

### Orders

```typescript
import { getRestaurantActiveOrders } from '@/app/firebase/firebaseRestaurant';

// Get active orders
const activeOrders = await getRestaurantActiveOrders();

// Orders are now under: restaurants/main-restaurant/active_orders/
```

### Stock

```typescript
import { getRestaurantStock } from '@/app/firebase/firebaseRestaurant';

// Get stock items
const stock = await getRestaurantStock();

// Stock is now under: restaurants/main-restaurant/stock/
```

## 🛠️ Utility Functions

### Check Restaurant Status

```typescript
import { getRestaurantStatus } from '@/app/firebase/restaurantUtils';

const status = await getRestaurantStatus();
console.log('Restaurant exists:', status.exists);
console.log('Summary:', status.summary);
```

### Validate Data

```typescript
import { validateRestaurantData } from '@/app/firebase/restaurantUtils';

const validation = await validateRestaurantData();
if (!validation.isValid) {
  console.log('Errors:', validation.errors);
  console.log('Warnings:', validation.warnings);
}
```

### Sync Data

```typescript
import { syncRestaurantData } from '@/app/firebase/firebaseRestaurant';

// Sync data between old and new structures
await syncRestaurantData();
```

## 🎯 Benefits

### 1. **Organized Data Structure**
- All restaurant data in one place
- Clear hierarchy and relationships
- Easy to backup and restore

### 2. **Better Performance**
- Optimized queries within restaurant scope
- Reduced unnecessary data loading
- Improved caching strategies

### 3. **Multi-Restaurant Support**
- Easy to extend for multiple restaurants
- Restaurant-specific configurations
- Isolated data per restaurant

### 4. **Enhanced Security**
- Restaurant-level security rules
- Better access control
- Data isolation

### 5. **Analytics and Reporting**
- Restaurant-specific analytics
- Historical data tracking
- Performance monitoring

## 🔒 Security Rules (Firestore)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Restaurant access rules
    match /restaurants/{restaurantId} {
      allow read, write: if request.auth != null && 
        (request.auth.uid == resource.data.manager_id || 
         hasManagerRole(request.auth.uid));
      
      // Sub-collections inherit parent permissions
      match /{collection}/{document=**} {
        allow read, write: if request.auth != null && 
          hasRestaurantAccess(request.auth.uid, restaurantId);
      }
    }
  }
}
```

## 📝 Usage Examples

### Complete Restaurant Setup

```typescript
import { quickSetup, validateRestaurantData } from '@/app/firebase/restaurantUtils';

async function setupMyRestaurant() {
  try {
    // 1. Setup with migration
    const restaurant = await quickSetup({
      restaurantName: "Chez Pierre",
      migrate: true
    });
    
    // 2. Validate data
    const validation = await validateRestaurantData();
    if (!validation.isValid) {
      console.error('Data validation failed:', validation.errors);
      return;
    }
    
    // 3. Restaurant is ready to use!
    console.log(`Restaurant "${restaurant.name}" is ready!`);
    console.log(`Revenue today: €${restaurant.analytics.daily_revenue}`);
    
  } catch (error) {
    console.error('Setup failed:', error);
  }
}
```

### Daily Operations

```typescript
import { 
  getRestaurant, 
  updateRestaurantAnalytics 
} from '@/app/firebase/firebaseRestaurant';

async function dailyOperations() {
  const restaurant = await getRestaurant();
  
  // Check active orders
  console.log(`${restaurant.active_orders.length} commandes en cours`);
  
  // Check stock levels
  const lowStock = restaurant.stock.filter(item => item.quantity < 10);
  if (lowStock.length > 0) {
    console.log(`⚠️ ${lowStock.length} articles en stock faible`);
  }
  
  // Update daily revenue
  const todayRevenue = calculateDailyRevenue(restaurant.active_orders);
  await updateRestaurantAnalytics('main-restaurant', {
    daily_revenue: todayRevenue
  });
}
```

## 🚀 Next Steps

1. **Initialize your restaurant** using `quickSetup()`
2. **Validate the migration** with `validateRestaurantData()`
3. **Update your existing code** to use the new structure
4. **Set up periodic sync** for data consistency
5. **Implement restaurant-specific features** as needed

This new structure provides a solid foundation for your restaurant management system with better organization, performance, and scalability.
