# Hachage des Tickets - Documentation

## 🔐 Vue d'ensemble

Le système de hachage des tickets a été implémenté pour assurer l'intégrité et la traçabilité des données. Chaque ticket est hashé avec SHA-256 **uniquement lors de sa terminaison** (statut `encaissee`).

## 🏗️ Architecture

### Champs ajoutés à `TicketData`
```typescript
export interface TicketData {
  // ... champs existants ...
  hashe?: string;         // Hash SHA-256 du ticket terminé
  chainIndex?: number;    // Index dans la chaîne de hachage
  previousHash?: string;  // Hash du ticket précédent
}
```

### Fonctions principales

#### `calculateTicketHash(ticket: TicketData): string`
- Calcule le hash SHA-256 d'un ticket
- Exclut les champs de hachage pour éviter la récursion
- Trie les clés JSON pour assurer la cohérence
- Retourne un hash hexadécimal de 64 caractères

#### `getLastTerminatedTicketHash(restaurantId: string)`
- Récupère le dernier ticket terminé et hashé
- Utilisé pour construire la chaîne de hachage
- Retourne `{ hash: string, index: number }` ou `null`

#### `terminerTicket()` - Modifiée
- Calcule automatiquement le hash lors de la terminaison
- Met à jour `chainIndex` et `previousHash`
- Stocke le hash final dans le champ `hashe`

## 🔄 Flux de hachage

1. **Création de ticket** : Aucun hash calculé
2. **Pendant le service** : Aucun hash calculé
3. **Terminaison du ticket** :
   - Récupération du dernier ticket hashé
   - Calcul du `chainIndex` (+ 1) et `previousHash`
   - Calcul du hash du ticket actuel
   - Stockage en base de données

## 💡 Exemple d'utilisation

```typescript
import { terminerTicket } from './firebaseCommandeOptimized';

// Terminer un ticket (le hash sera calculé automatiquement)
await terminerTicket('ticket-123', 'restaurant-456', 5, 'Client satisfait');

// Le ticket aura maintenant :
// - hashe: "f00fb4d36e4539120ae8a0d75b92218c98a1d9d38845bc8dc7fabfcec000bd4c"
// - chainIndex: 1 (ou suivant dans la chaîne)
// - previousHash: "..." (hash du ticket précédent)
```

## 🛡️ Sécurité

- **Intégrité** : Toute modification du ticket change son hash
- **Traçabilité** : Chaîne de hachage impossible à falsifier
- **Cohérence** : Tri des clés JSON pour hash reproductible
- **Performance** : Hash calculé uniquement à la terminaison

## ⚠️ Important

- Les tickets actifs n'ont **pas** de hash
- Le hash est calculé avec CryptoJS (compatible React Native)
- La chaîne démarre à l'index 1 (premier ticket)
- Le `previousHash` est vide pour le premier ticket (Genesis)

## 🧪 Test

Un fichier de test `test-hachage.js` est disponible pour vérifier :
```bash
node test-hachage.js
```

## 🔍 Vérification d'intégrité

Pour vérifier l'intégrité d'un ticket :
```typescript
import { calculateTicketHash } from './firebaseCommandeOptimized';

// Recalculer le hash et comparer
const currentHash = calculateTicketHash(ticket);
const isValid = currentHash === ticket.hashe;
```
