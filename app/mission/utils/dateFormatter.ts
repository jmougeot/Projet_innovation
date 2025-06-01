/**
 * Utilitaires pour le formatage des dates
 */

/**
 * Formate une date de manière sécurisée pour l'affichage
 */
export const formatDate = (dateValue: any): string => {
  if (!dateValue) return "Date non définie";
  
  try {
    // Gestion des différentes formes possibles de date dans Firestore
    let date: Date;
    
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      // Cas des Timestamp Firestore
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      // Cas des objets Date
      date = dateValue;
    } else {
      // Essayer de convertir depuis une string ou un timestamp
      date = new Date(dateValue);
    }
    
    // Vérifier si la date est valide
    if (isNaN(date.getTime())) {
      return "Date invalide";
    }
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    console.warn("Erreur de formatage de date:", error);
    return "Date invalide";
  }
};

/**
 * Formate une date courte pour l'affichage
 */
export const formatShortDate = (dateValue: any): string => {
  if (!dateValue) return "N/A";
  
  try {
    let date: Date;
    
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      return "N/A";
    }
    
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    console.warn("Erreur de formatage de date courte:", error);
    return "N/A";
  }
};

/**
 * Formate une date avec l'heure
 */
export const formatDateTime = (dateValue: any): string => {
  if (!dateValue) return "Date et heure non définies";
  
  try {
    let date: Date;
    
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }
    
    if (isNaN(date.getTime())) {
      return "Date et heure invalides";
    }
    
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.warn("Erreur de formatage de date et heure:", error);
    return "Date et heure invalides";
  }
};

/**
 * Vérifie si une date est valide
 */
export const isValidDate = (dateValue: any): boolean => {
  try {
    let date: Date;
    
    if (dateValue.toDate && typeof dateValue.toDate === 'function') {
      date = dateValue.toDate();
    } else if (dateValue instanceof Date) {
      date = dateValue;
    } else {
      date = new Date(dateValue);
    }
    
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * Calcule le nombre de jours entre deux dates
 */
export const daysBetween = (date1: any, date2: any): number => {
  try {
    const d1 = date1.toDate ? date1.toDate() : new Date(date1);
    const d2 = date2.toDate ? date2.toDate() : new Date(date2);
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
  } catch (error) {
    console.warn("Erreur de calcul de différence de dates:", error);
    return 0;
  }
};
