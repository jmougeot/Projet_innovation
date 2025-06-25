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

/**
 * 📋 Génère un résumé des modifications pour logging/notification
 */
export const generateModificationSummary = (
  originalTicket: TicketData,
  updateData: UpdateTicketData
): string => {
  console.log('📋 [generateModificationSummary] Génération du résumé pour ticket:', originalTicket.id);
  
  const changes = analyzeTicketChanges(originalTicket, updateData);
  
  if (!changes.hasChanges) {
    console.log('📋 [generateModificationSummary] Aucune modification détectée');
    return 'Aucune modification détectée';
  }

  const summaryParts: string[] = [];

  if (changes.platsAjoutes.length > 0) {
    summaryParts.push(`${changes.platsAjoutes.length} plat(s) ajouté(s)`);
  }

  if (changes.platsSupprimees.length > 0) {
    summaryParts.push(`${changes.platsSupprimees.length} plat(s) supprimé(s)`);
  }

  if (changes.platsModifies.length > 0) {
    summaryParts.push(`${changes.platsModifies.length} quantité(s) modifiée(s)`);
  }

  if (changes.prixChange) {
    summaryParts.push(`Prix: ${changes.originalPrix}€ → ${changes.newPrix}€`);
  }

  if (changes.statusChange) {
    summaryParts.push(`Statut: ${changes.originalStatus} → ${changes.newStatus}`);
  }

  const summary = summaryParts.join(', ');
  console.log('📋 [generateModificationSummary] Résumé généré:', summary);
  
  return summary;
};

/**
 * 🛡️ Validation basique des modifications (défense en profondeur)
 */
export const validateTicketUpdate = (
  originalTicket: TicketData,
  updateData: UpdateTicketData
): { isValid: boolean; errors: string[] } => {
  console.log('🛡️ [validateTicketUpdate] Début de la validation:', {
    ticketId: originalTicket.id,
    updateFields: Object.keys(updateData),
    hasPlats: !!updateData.plats,
    hasTotalPrice: updateData.totalPrice !== undefined,
    hasStatus: !!updateData.status
  });

  const errors: string[] = [];

  // Validation du prix si des plats sont modifiés
  if (updateData.plats && updateData.totalPrice !== undefined) {
    console.log('🛡️ [validateTicketUpdate] Validation prix vs plats...');
    
    const calculatedPrice = updateData.plats.reduce((total, plat) => {
      return total + (plat.plat.price * plat.quantite);
    }, 0);
    
    console.log('🛡️ [validateTicketUpdate] Calcul du prix:', {
      platsDetails: updateData.plats.map(p => ({
        name: p.plat.name,
        price: p.plat.price,
        quantite: p.quantite,
        sousTotal: p.plat.price * p.quantite
      })),
      calculatedPrice,
      providedPrice: updateData.totalPrice,
      difference: Math.abs(calculatedPrice - updateData.totalPrice)
    });
    
    // Tolérance de 0.01€ pour les arrondis
    if (Math.abs(calculatedPrice - updateData.totalPrice) > 0.01) {
      const error = `Prix incohérent: calculé=${calculatedPrice}€, fourni=${updateData.totalPrice}€`;
      errors.push(error);
      console.error('🛡️ [validateTicketUpdate] Erreur de prix:', error);
    } else {
      console.log('🛡️ [validateTicketUpdate] ✅ Prix cohérent');
    }
  }

  // Validation des quantités
  if (updateData.plats) {
    console.log('🛡️ [validateTicketUpdate] Validation des quantités...');
    
    updateData.plats.forEach((plat, index) => {
      console.log(`🛡️ [validateTicketUpdate] Validation plat ${index + 1}:`, {
        name: plat.plat.name,
        quantite: plat.quantite,
        price: plat.plat.price
      });

      if (plat.quantite < 0) {
        const error = `Quantité négative pour le plat ${index + 1}`;
        errors.push(error);
        console.error('🛡️ [validateTicketUpdate] Erreur quantité négative:', error);
      }
      if (plat.quantite > 100) { // Limite raisonnable
        const error = `Quantité excessive pour le plat ${index + 1}: ${plat.quantite}`;
        errors.push(error);
        console.error('🛡️ [validateTicketUpdate] Erreur quantité excessive:', error);
      }
    });
    
    console.log('🛡️ [validateTicketUpdate] ✅ Validation des quantités terminée');
  }

  // Validation du statut
  const validStatuses = ['en_attente', 'en_preparation', 'prete', 'servie', 'encaissee'];
  if (updateData.status && !validStatuses.includes(updateData.status)) {
    const error = `Statut invalide: ${updateData.status}`;
    errors.push(error);
    console.error('🛡️ [validateTicketUpdate] Erreur statut invalide:', error);
  } else if (updateData.status) {
    console.log('🛡️ [validateTicketUpdate] ✅ Statut valide:', updateData.status);
  }

  const result = {
    isValid: errors.length === 0,
    errors
  };

  console.log('🛡️ [validateTicketUpdate] Résultat de la validation:', {
    isValid: result.isValid,
    errorsCount: errors.length,
    errors: errors
  });

  return result;
};

/**
 * 🔒 Version sécurisée de prepareTicketUpdateWithTracking
 */
export const prepareTicketUpdateWithTrackingSecure = (
  originalTicket: TicketData,
  updateData: UpdateTicketData,
  employeeId?: string
): { updatePayload: Partial<TicketData>; isValid: boolean; errors: string[] } => {
  console.log('🔒 [prepareTicketUpdateWithTrackingSecure] Début du processus sécurisé:', {
    ticketId: originalTicket.id,
    employeeId,
    updateFields: Object.keys(updateData)
  });

  // 1. Validation d'abord
  console.log('🔒 [prepareTicketUpdateWithTrackingSecure] Étape 1: Validation...');
  const validation = validateTicketUpdate(originalTicket, updateData);
  
  if (!validation.isValid) {
    console.warn('🔒 [prepareTicketUpdateWithTrackingSecure] ⚠️ Validation échouée:', {
      errorsCount: validation.errors.length,
      errors: validation.errors
    });
    
    return {
      updatePayload: {},
      isValid: false,
      errors: validation.errors
    };
  }

  console.log('🔒 [prepareTicketUpdateWithTrackingSecure] ✅ Validation réussie, passage au tracking...');

  // 2. Si valide, procéder au tracking normal
  console.log('🔒 [prepareTicketUpdateWithTrackingSecure] Étape 2: Tracking...');
  const updatePayload = prepareTicketUpdateWithTracking(originalTicket, updateData, employeeId);
  
  const result = {
    updatePayload,
    isValid: true,
    errors: []
  };

  console.log('🔒 [prepareTicketUpdateWithTrackingSecure] ✅ Processus terminé avec succès:', {
    payloadFields: Object.keys(updatePayload),
    hasModifications: !!updatePayload.modified
  });
  
  return result;
};
