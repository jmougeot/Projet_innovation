import { router } from 'expo-router';

export interface ServiceMenuItem {
  label: string;
  onPress: () => void;
  isLogout?: boolean;
}

export const getServiceMenuItems = (): ServiceMenuItem[] => [
  {
    label: 'Profil',
    onPress: () => {
      router.push('/Profil/avatar' as any);
    }
  },
  {
    label: 'Paramètres',
    onPress: () => {
      // TODO: Implémenter la page des paramètres
      console.log('Paramètres à implémenter');
    }
  },
  {
    label: 'Accueil Service',
    onPress: () => {
      router.push('/service' as any);
    }
  },
  {
    label: 'Plan de Salle',
    onPress: () => {
      router.push('/service/(tabs)/plan_de_salle' as any);
    }
  },
  {
    label: 'Missions',
    onPress: () => {
      router.push('/service/(tabs)/AffichageMission' as any);
    }
  },
  {
    label: 'Cuisine Service',
    onPress: () => {
      router.push('/service/(tabs)' as any);
    }
  },
  {
    label: 'Modifier le Plan',
    onPress: () => {
      router.push('/service/commande/map_settings' as any);
    }
  },
  {
    label: 'Déconnexion',
    onPress: () => {
      router.replace('/connexion/connexion' as any);
    },
    isLogout: true
  },
];

export const getPlanDeSalleMenuItems = (): ServiceMenuItem[] => [
  {
    label: 'Profil',
    onPress: () => {
      router.push('/Profil/avatar' as any);
    }
  },
  {
    label: 'Paramètres',
    onPress: () => {
      console.log('Paramètres à implémenter');
    }
  },
  {
    label: 'Accueil Service',
    onPress: () => {
      router.push('/service' as any);
    }
  },
  {
    label: 'Modifier le plan',
    onPress: () => {
      router.push('/service/commande/map_settings' as any);
    }
  },
  {
    label: 'Déconnexion',
    onPress: () => {
      router.replace('/connexion/connexion' as any);
    },
    isLogout: true
  },
];

export const getMissionMenuItems = (): ServiceMenuItem[] => [
  {
    label: 'Profil',
    onPress: () => {
      router.push('/Profil/avatar' as any);
    }
  },
  {
    label: 'Paramètres',
    onPress: () => {
      console.log('Paramètres à implémenter');
    }
  },
  {
    label: 'Accueil Service',
    onPress: () => {
      router.push('/service' as any);
    }
  },
  {
    label: 'Toutes les missions',
    onPress: () => {
      router.push('/mission/pages/AllMissionsPage' as any);
    }
  },
  {
    label: 'Créer mission',
    onPress: () => {
      router.push('/mission/pages/CreateMissionPage' as any);
    }
  },
  {
    label: 'Déconnexion',
    onPress: () => {
      router.replace('/connexion/connexion' as any);
    },
    isLogout: true
  },
];

export const getCuisineServiceMenuItems = (): ServiceMenuItem[] => [
  {
    label: 'Profil',
    onPress: () => {
      router.push('/Profil/avatar' as any);
    }
  },
  {
    label: 'Paramètres',
    onPress: () => {
      console.log('Paramètres à implémenter');
    }
  },
  {
    label: 'Accueil Service',
    onPress: () => {
      router.push('/service' as any);
    }
  },
  {
    label: 'Plan de Salle',
    onPress: () => {
      router.push('/service/(tabs)/plan_de_salle' as any);
    }
  },
  {
    label: 'Déconnexion',
    onPress: () => {
      router.replace('/connexion/connexion' as any);
    },
    isLogout: true
  },
];
