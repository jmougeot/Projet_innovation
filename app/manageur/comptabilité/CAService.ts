import { db } from '@/app/firebase/firebaseConfig';
import { collection, doc, getDoc, getDocs, updateDoc, setDoc } from 'firebase/firestore';

// Reprendre l'interface Employee de CA.tsx et la renommer en User
export interface User {
  id: string;
  nom: string;
  prenom: string;
  chiffreAffaire: number;
  poste: string;
}

export interface RestaurantFinances {
  caTotal: number;
  lastUpdated: string;
}

/**
 * Récupère les données du restaurant et des employés
 * @param restaurantId ID du restaurant pour les nouvelles règles de sécurité
 * @returns Les finances du restaurant et la liste des employés
 */
export const fetchFinancialData = async (restaurantId: string): Promise<{ restaurantFinances: RestaurantFinances, employees: User[] }> => {
  try {
    // 🔧 CORRECTION : Utiliser le chemin correct selon les règles de sécurité
    const restaurantRef = doc(db, 'restaurants', restaurantId, 'accounting', 'finances');
    const restaurantDoc = await getDoc(restaurantRef);
    
    let restaurantFinances: RestaurantFinances;
    
    if (restaurantDoc.exists()) {
      restaurantFinances = restaurantDoc.data() as RestaurantFinances;
    } else {
      // Créer un document par défaut si inexistant
      restaurantFinances = {
        caTotal: 0,
        lastUpdated: new Date().toISOString()
      };
      await setDoc(restaurantRef, restaurantFinances);
    }

    // Récupérer les données des employés
    const employeesRef = collection(db, 'users');
    const employeesSnapshot = await getDocs(employeesRef);
    
    const employees: User[] = [];
    employeesSnapshot.forEach((doc) => {
      const data = doc.data();
      employees.push({
        id: doc.id,
        nom: data.nom || '',
        prenom: data.prenom || '',
        chiffreAffaire: data.chiffreAffaire || 0,
        poste: data.poste || ''
      });
    });

    return { restaurantFinances, employees };
  } catch (error) {
    console.error("Erreur lors du chargement des données:", error);
    throw new Error("Impossible de charger les données financières");
  }
};

/**
 * Met à jour le CA du restaurant dans Firestore
 * @param restaurantId ID du restaurant pour les nouvelles règles de sécurité
 * @param newCA Nouveau chiffre d'affaires du restaurant
 */
export const updateRestaurantCA = async (restaurantId: string, newCA: number): Promise<void> => {
  try {
    // 🔧 CORRECTION : Utiliser le chemin correct selon les règles de sécurité
    const restaurantRef = doc(db, 'restaurants', restaurantId, 'accounting', 'finances');
    await updateDoc(restaurantRef, {
      caTotal: newCA,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du CA du restaurant:", error);
    throw error;
  }
};

/**
 * Met à jour le CA d'un employé dans Firestore
 * @param userId ID de l'employé
 * @param chiffreAffaire Nouveau chiffre d'affaires
 */
export const updateUserCA = async (userId: string, chiffreAffaire: number): Promise<void> => {
  try {
    const employeeRef = doc(db, 'users', userId);
    await updateDoc(employeeRef, { chiffreAffaire });
  } catch (error) {
    console.error(`Erreur lors de la mise à jour du CA pour l'employé ${userId}:`, error);
    throw new Error(`Impossible de mettre à jour le CA de l'employé`);
  }
};

/**
 * Sauvegarde les modifications du CA du restaurant et de tous les employés
 * @param restaurantId ID du restaurant pour les nouvelles règles de sécurité
 * @param restaurantCA Le CA total du restaurant
 * @param employees La liste des employés avec leurs CA
 */
export const saveAllChanges = async (restaurantId: string, restaurantCA: number, employees: User[]): Promise<void> => {
  try {
    // Mettre à jour le CA du restaurant
    await updateRestaurantCA(restaurantId, restaurantCA);

    // Mettre à jour le CA de chaque employé
    const updatePromises = employees.map(employee => 
      updateUserCA(employee.id, employee.chiffreAffaire)
    );
    
    await Promise.all(updatePromises);
  } catch (error) {
    console.error("Erreur lors de la sauvegarde des modifications:", error);
    throw new Error("Impossible de sauvegarder les modifications");
  }
};

/**
 * Calcule la somme totale des CA de tous les employés
 * @param employees La liste des employés
 * @returns La somme des CA
 */
export const calculateTotalEmployeesCA = (employees: User[]): number => {
  return employees.reduce((total, emp) => total + emp.chiffreAffaire, 0);
};

/**
 * Filtre et trie la liste des employés selon les critères donnés
 * @param employees Liste complète des employés
 * @param searchQuery Texte de recherche
 * @param sortBy Critère de tri ('name' ou 'ca')
 * @returns Liste filtrée et triée des employés
 */
export const filterAndSortEmployees = (
  employees: User[], 
  searchQuery: string, 
  sortBy: 'name' | 'ca'
): User[] => {
  return employees
    .filter(emp => 
      emp.nom.toLowerCase().includes(searchQuery.toLowerCase()) || 
      emp.prenom.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'name') {
        return `${a.nom} ${a.prenom}`.localeCompare(`${b.nom} ${b.prenom}`);
      } else {
        return b.chiffreAffaire - a.chiffreAffaire;
      }
    });
};


export const addToCA = async (target: string, amount: number, restaurantId: string): Promise<number> => {
  try {
    if (target === 'restaurant') {
      // 🔧 CORRECTION : Utiliser le chemin correct selon les règles de sécurité
      // restaurants/{restaurantId}/accounting/finances
      const restaurantRef = doc(db, 'restaurants', restaurantId, 'accounting', 'finances');
      const restaurantDoc = await getDoc(restaurantRef);
      
      if (restaurantDoc.exists()) {
        const finances = restaurantDoc.data() as RestaurantFinances;
        const newCA = finances.caTotal + amount;
        
        await updateDoc(restaurantRef, {
          caTotal: newCA,
          lastUpdated: new Date().toISOString()
        });
        
        return newCA;
      } else {
        // Si le document n'existe pas, le créer avec le montant comme CA initial
        const newCA = amount > 0 ? amount : 0; // Éviter un CA négatif si premier montant < 0
        
        await setDoc(restaurantRef, {
          caTotal: newCA,
          lastUpdated: new Date().toISOString()
        });
        
        return newCA;
      }
    } else {
      // Ajouter au CA d'un employé
      const employeeRef = doc(db, 'users', target);
      const employeeDoc = await getDoc(employeeRef);
      
      if (employeeDoc.exists()) {
        const userData = employeeDoc.data();
        const currentCA = userData.chiffreAffaire || 0;
        const newCA = currentCA + amount;
        
        // Éviter un CA négatif
        const finalCA = newCA >= 0 ? newCA : 0;
        
        await updateDoc(employeeRef, { 
          chiffreAffaire: finalCA 
        });
        
        return finalCA;
      } else {
        // 🔧 CORRECTION : Créer le document utilisateur s'il n'existe pas
        console.warn(`⚠️ Document utilisateur ${target} inexistant, création automatique`);
        
        const initialCA = amount > 0 ? amount : 0;
        
        // Créer un document utilisateur basique avec le CA initial
        await setDoc(employeeRef, {
          chiffreAffaire: initialCA,
          createdAt: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          // Données par défaut pour éviter les erreurs futures
          nom: 'Employé',
          prenom: 'Nouveau',
          poste: 'Service'
        });
        
        console.log(`✅ Document utilisateur ${target} créé avec CA initial: ${initialCA}€`);
        return initialCA;
      }
    }
  } catch (error) {
    console.error(`Erreur lors de l'ajout au CA ${target}:`, error);
    throw new Error(`Impossible de modifier le CA: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Distribue un montant entre le CA du restaurant et celui d'un employé
 * @param employeeId ID de l'employé à créditer
 * @param amount Montant total à ajouter
 * @param restaurantId ID du restaurant (requis pour les nouvelles règles de sécurité)
 * @returns Un objet avec les nouveaux CA du restaurant et de l'employé
 */
export const distributeAmount = async (employeeId: string, amount: number, restaurantId: string): Promise<{ 
  restaurantCA: number, 
  employeeCA: number 
}> => {
  try {
    // Ajouter le montant au CA total du restaurant
    const newRestaurantCA = await addToCA('restaurant', amount, restaurantId);
    
    // Ajouter le même montant au CA de l'employé
    const newEmployeeCA = await addToCA(employeeId, amount, restaurantId);
    
    return {
      restaurantCA: newRestaurantCA,
      employeeCA: newEmployeeCA
    };
  } catch (error) {
    console.error("Erreur lors de la distribution du montant:", error);
    throw new Error("Impossible de distribuer le montant");
  }
};

// Ajouter un export par défaut pour Expo Router
export default {
  fetchFinancialData,
  updateRestaurantCA,
  updateUserCA,
  saveAllChanges,
  calculateTotalEmployeesCA,
  filterAndSortEmployees,
  addToCA,
  distributeAmount
};
