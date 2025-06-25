import { serverTimestamp } from 'firebase/firestore';
import { PlatQuantite, TicketData, UpdateTicketData } from './types';

// ====== UTILITAIRES POUR TRACKER LES MODIFICATIONS ======

/**
 * 🔍 Compare deux listes de plats et retourne les plats supprimés
 */
export const findDeletedPlats = (
  originalPlats: PlatQuantite[], 
  newPlats: PlatQuantite[]
): PlatQuantite[] => {
  console.log('🔍 [findDeletedPlats] Comparaison des plats:', {
    originalCount: originalPlats.length,
    newCount: newPlats.length,
    originalIds: originalPlats.map(p => p.plat.id).filter(Boolean),
    newIds: newPlats.map(p => p.plat.id).filter(Boolean)
  });

  const newPlatsIds = new Set(newPlats.map(plat => plat.plat.id).filter(Boolean));
  const deletedPlats = originalPlats.filter(plat => plat.plat.id && !newPlatsIds.has(plat.plat.id));
  
  console.log('🔍 [findDeletedPlats] Résultat:', {
    deletedCount: deletedPlats.length,
    deletedPlats: deletedPlats.map(p => ({ id: p.plat.id, name: p.plat.name, quantite: p.quantite }))
  });

  return deletedPlats;
};

/**
 * 🆕 Compare deux listes de plats et retourne les plats ajoutés
 */
export const findAddedPlats = (
  originalPlats: PlatQuantite[], 
  newPlats: PlatQuantite[]
): PlatQuantite[] => {
  console.log('🆕 [findAddedPlats] Comparaison des plats:', {
    originalCount: originalPlats.length,
    newCount: newPlats.length
  });

  const originalPlatsIds = new Set(originalPlats.map(plat => plat.plat.id).filter(Boolean));
  const addedPlats = newPlats.filter(plat => plat.plat.id && !originalPlatsIds.has(plat.plat.id));
  
  console.log('🆕 [findAddedPlats] Résultat:', {
    addedCount: addedPlats.length,
    addedPlats: addedPlats.map(p => ({ id: p.plat.id, name: p.plat.name, quantite: p.quantite }))
  });

  return addedPlats;
};

/**
 * ✏️ Compare deux listes de plats et retourne les plats avec quantités modifiées
 */
export const findModifiedPlats = (
  originalPlats: PlatQuantite[], 
  newPlats: PlatQuantite[]
): Array<{
  plat: PlatQuantite;
  ancienneQuantite: number;
  nouvelleQuantite: number;
}> => {
  console.log('✏️ [findModifiedPlats] Analyse des quantités:', {
    originalCount: originalPlats.length,
    newCount: newPlats.length
  });

  const modifications: Array<{
    plat: PlatQuantite;
    ancienneQuantite: number;
    nouvelleQuantite: number;
  }> = [];

  // Créer une map des quantités originales
  const originalQuantities = new Map<string, number>();
  originalPlats.forEach(plat => {
    if (plat.plat.id) {
      originalQuantities.set(plat.plat.id, plat.quantite);
    }
  });

  console.log('✏️ [findModifiedPlats] Quantités originales:', 
    Array.from(originalQuantities.entries()).map(([id, qty]) => ({ id, quantite: qty }))
  );

  // Vérifier les changements de quantités
  newPlats.forEach(newPlat => {
    if (newPlat.plat.id) {
      const originalQuantity = originalQuantities.get(newPlat.plat.id);
      if (originalQuantity !== undefined && originalQuantity !== newPlat.quantite) {
        console.log('✏️ [findModifiedPlats] Quantité modifiée détectée:', {
          platId: newPlat.plat.id,
          platName: newPlat.plat.name,
          ancienneQuantite: originalQuantity,
          nouvelleQuantite: newPlat.quantite
        });
        
        modifications.push({
          plat: newPlat,
          ancienneQuantite: originalQuantity,
          nouvelleQuantite: newPlat.quantite
        });
      }
    }
  });

  console.log('✏️ [findModifiedPlats] Résultat:', {
    modificationsCount: modifications.length,
    modifications: modifications.map(m => ({
      id: m.plat.plat.id,
      name: m.plat.plat.name,
      ancien: m.ancienneQuantite,
      nouveau: m.nouvelleQuantite
    }))
  });

  return modifications;
};

/**
 * 📊 Analyse complète des changements entre deux versions d'un ticket
 */
export const analyzeTicketChanges = (
  originalTicket: TicketData,
  updateData: UpdateTicketData
) => {
  console.log('📊 [analyzeTicketChanges] Début de l\'analyse:', {
    ticketId: originalTicket.id,
    originalPrix: originalTicket.totalPrice,
    newPrix: updateData.totalPrice,
    originalStatus: originalTicket.status,
    newStatus: updateData.status,
    hasNewPlats: !!updateData.plats
  });

  const changes = {
    hasChanges: false,
    platsAjoutes: [] as PlatQuantite[],
    platsSupprimees: [] as PlatQuantite[],
    platsModifies: [] as Array<{
      plat: PlatQuantite;
      ancienneQuantite: number;
      nouvelleQuantite: number;
    }>,
    prixChange: false,
    statusChange: false,
    originalPrix: originalTicket.totalPrice,
    newPrix: updateData.totalPrice,
    originalStatus: originalTicket.status,
    newStatus: updateData.status
  };

  // Analyser les changements de plats si fournis
  if (updateData.plats) {
    console.log('📊 [analyzeTicketChanges] Analyse des plats...');
    changes.platsAjoutes = findAddedPlats(originalTicket.plats, updateData.plats);
    changes.platsSupprimees = findDeletedPlats(originalTicket.plats, updateData.plats);
    changes.platsModifies = findModifiedPlats(originalTicket.plats, updateData.plats);
    
    changes.hasChanges = changes.platsAjoutes.length > 0 || 
                        changes.platsSupprimees.length > 0 || 
                        changes.platsModifies.length > 0;
    
    console.log('📊 [analyzeTicketChanges] Changements de plats détectés:', {
      ajouts: changes.platsAjoutes.length,
      suppressions: changes.platsSupprimees.length,
      modifications: changes.platsModifies.length,
      hasPlatsChanges: changes.hasChanges
    });
  }

  // Analyser les changements de prix
  if (updateData.totalPrice !== undefined && updateData.totalPrice !== originalTicket.totalPrice) {
    changes.prixChange = true;
    changes.hasChanges = true;
    console.log('📊 [analyzeTicketChanges] Changement de prix détecté:', {
      ancien: originalTicket.totalPrice,
      nouveau: updateData.totalPrice,
      difference: updateData.totalPrice - originalTicket.totalPrice
    });
  }

  // Analyser les changements de statut
  if (updateData.status !== undefined && updateData.status !== originalTicket.status) {
    changes.statusChange = true;
    changes.hasChanges = true;
    console.log('📊 [analyzeTicketChanges] Changement de statut détecté:', {
      ancien: originalTicket.status,
      nouveau: updateData.status
    });
  }

  console.log('📊 [analyzeTicketChanges] Résumé final:', {
    hasChanges: changes.hasChanges,
    typeChanges: {
      plats: changes.platsAjoutes.length > 0 || changes.platsSupprimees.length > 0 || changes.platsModifies.length > 0,
      prix: changes.prixChange,
      statut: changes.statusChange
    }
  });

  return changes;
};

/**
 * 🔄 Prépare les données de mise à jour avec tracking des modifications
 */
export const prepareTicketUpdateWithTracking = (
  originalTicket: TicketData,
  updateData: UpdateTicketData,
  employeeId?: string
): Partial<TicketData> => {
  console.log('🔄 [prepareTicketUpdateWithTracking] Début de la préparation:', {
    ticketId: originalTicket.id,
    employeeId,
    updateFields: Object.keys(updateData)
  });

  const changes = analyzeTicketChanges(originalTicket, updateData);
  
  // Données de base à mettre à jour
  const updatePayload: Partial<TicketData> = {
    ...updateData
  };

  console.log('🔄 [prepareTicketUpdateWithTracking] Payload de base créé:', {
    baseFields: Object.keys(updatePayload)
  });

  // Si il y a des changements significants, marquer comme modifié
  if (changes.hasChanges) {
    console.log('🔄 [prepareTicketUpdateWithTracking] Changements détectés, marquage comme modifié...');
    
    updatePayload.modified = true;
    updatePayload.dateModification = serverTimestamp() as any; // Cast nécessaire pour serverTimestamp

    // Ajouter les plats supprimés à l'historique
    if (changes.platsSupprimees.length > 0) {
      const existingDeletedPlats = originalTicket.platsdeleted || [];
      
      console.log('🔄 [prepareTicketUpdateWithTracking] Ajout des plats supprimés à l\'historique:', {
        existingDeletedCount: existingDeletedPlats.length,
        newDeletedCount: changes.platsSupprimees.length,
        deletedPlats: changes.platsSupprimees.map(p => ({ id: p.plat.id, name: p.plat.name, quantite: p.quantite }))
      });

      updatePayload.platsdeleted = [
        ...existingDeletedPlats,
        ...changes.platsSupprimees.map(plat => ({
          ...plat,
          // Ajouter metadata de suppression
          dateSupression: serverTimestamp(),
          supprimePar: employeeId
        } as any))
      ];
    }

    // Log des changements pour debug
    console.log('🔄 [prepareTicketUpdateWithTracking] Changements détectés dans le ticket:', {
      platsAjoutes: changes.platsAjoutes.length,
      platsSupprimees: changes.platsSupprimees.length,
      platsModifies: changes.platsModifies.length,
      prixChange: changes.prixChange,
      statusChange: changes.statusChange
    });
  } else {
    console.log('🔄 [prepareTicketUpdateWithTracking] Aucun changement significatif détecté');
  }

  console.log('🔄 [prepareTicketUpdateWithTracking] Payload final:', {
    finalFields: Object.keys(updatePayload),
    hasModified: updatePayload.modified,
    hasDeletedPlats: !!updatePayload.platsdeleted
  });

  return updatePayload;
};
