/**
 * 🔧 Page Administration Restaurant - Version Custom Claims
 * 
 * NOUVEAU SYSTÈME SÉCURISÉ:
 * - Protection automatique via AutoRedirect avec rôle "manager" requis
 * - Gestion des membres via Custom Claims (ultra-rapide)
 * - Ajout/suppression de membres avec vérifications automatiques
 * 
 * FONCTIONNALITÉS:
 * - ⚡ Vérification d'accès instantanée (Custom Claims)
 * - 👥 Gestion des membres du restaurant
 * - 🔒 Seuls les managers peuvent accéder
 * - 🚀 Interface moderne et réactive
 * 
 * SÉCURITÉ:
 * - Custom Claims vérifiés côté serveur
 * - Audit automatique de tous les changements
 * - Permissions granulaires par restaurant
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  TextInput,
}  from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Header from '@/app/components/Header';
import AutoRedirect from './AutoRedirect';
import RestaurantStorage from '@/app/asyncstorage/restaurantStorage';
import { addRestaurantMember, removeRestaurantMember } from '../firebase/firebaseRestaurant';

// Type pour un membre du restaurant utilisant Custom Claims
interface RestaurantMember {
  id: string;
  email: string;
  role: 'manager' | 'waiter' | 'chef' | 'cleaner';
  addedAt: number;
  addedBy: string;
}

export default function RestaurantAdminPage() {
  const [currentRestaurantId, setCurrentRestaurantId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<RestaurantMember[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<RestaurantMember['role']>('waiter');
  const [addingUser, setAddingUser] = useState(false);

  // Charger l'ID du restaurant depuis AsyncStorage
  useEffect(() => {
    const loadRestaurantId = async () => {
      try {
        const savedId = await RestaurantStorage.GetSelectedRestaurantId();
        setCurrentRestaurantId(savedId);
        setLoading(false);
      } catch (error) {
        console.error('Erreur chargement restaurant ID:', error);
        setLoading(false);
      }
    };
    loadRestaurantId();
  }, []);

  useEffect(() => {
    if (currentRestaurantId) {
      loadRestaurantUsers();
    }
  }, [currentRestaurantId]);

  const loadRestaurantUsers = async () => {
    if (!currentRestaurantId) return;

    try {
      setLoading(true);
      // TODO: Implémenter une fonction pour récupérer les membres depuis Custom Claims ou Firestore
      // Pour l'instant, on simule une liste vide
      setUsers([]);
      console.log('⚠️ Fonction de récupération des membres à implémenter');
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !currentRestaurantId) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide');
      return;
    }

    try {
      setAddingUser(true);
      
      // ⚡ Utiliser la nouvelle fonction qui accepte email ou UID
      await addRestaurantMember(
        currentRestaurantId, 
        newUserEmail, // Peut maintenant être un email directement !
        selectedRole
      );

      setNewUserEmail('');
      await loadRestaurantUsers();
      Alert.alert('Succès', 'Membre ajouté avec succès via Custom Claims');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible d\'ajouter l\'utilisateur');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!currentRestaurantId) return;

    Alert.alert(
      'Confirmer',
      'Voulez-vous vraiment révoquer l\'accès de cet utilisateur ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Révoquer',
          style: 'destructive',
          onPress: async () => {
            try {
              // ⚡ Utiliser la nouvelle fonction Custom Claims
              await removeRestaurantMember(currentRestaurantId, userId);
              await loadRestaurantUsers();
              Alert.alert('Succès', 'Accès révoqué via Custom Claims');
            } catch (error) {
              console.error('Erreur lors de la révocation:', error);
              Alert.alert('Erreur', error instanceof Error ? error.message : 'Impossible de révoquer l\'accès');
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: RestaurantMember['role']) => {
    switch (role) {
      case 'manager': return '#3182CE';
      case 'waiter': return '#38A169';
      case 'chef': return '#E53E3E';
      case 'cleaner': return '#9F7AEA';
      default: return '#666';
    }
  };

  const getRoleIcon = (role: RestaurantMember['role']) => {
    switch (role) {
      case 'manager': return 'manage-accounts';
      case 'waiter': return 'room-service';
      case 'chef': return 'restaurant';
      case 'cleaner': return 'cleaning-services';
      default: return 'person';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Header 
          title="Administration" 
          showBackButton={true}
          backgroundColor="#194A8D"
          textColor="#FFFFFF"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#194A8D" />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <AutoRedirect 
      restaurantId={currentRestaurantId || undefined}
      requireRole="manager"
      fallbackRoute="/home"
      loadingMessage="Vérification des droits d'administration..."
    >
      <SafeAreaView style={styles.container}>
        <Header 
          title="Administration" 
          showBackButton={true}
          backgroundColor="#194A8D"
          textColor="#FFFFFF"
        />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Restaurant Info */}
          <View style={styles.restaurantInfo}>
            <MaterialIcons name="restaurant" size={32} color="#194A8D" />
            <View style={styles.restaurantDetails}>
              <Text style={styles.restaurantName}>Restaurant ID: {currentRestaurantId}</Text>
              <Text style={styles.restaurantRole}>🔒 Accès Manager </Text>
            </View>
          </View>

          {/* Add User Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>➕ Ajouter un utilisateur</Text>
            
            <View style={styles.addUserForm}>
              <TextInput
                style={styles.input}
                placeholder="Email de l'utilisateur"
                value={newUserEmail}
                onChangeText={setNewUserEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              
              <View style={styles.roleSelector}>
                <Text style={styles.roleLabel}>Rôle:</Text>
                <View style={styles.roleButtons}>
                  {(['manager', 'waiter', 'chef', 'cleaner'] as const).map((role) => (
                    <Pressable
                      key={role}
                      style={[
                        styles.roleButton,
                        selectedRole === role && styles.roleButtonSelected
                      ]}
                      onPress={() => setSelectedRole(role)}
                    >
                      <Text style={[
                        styles.roleButtonText,
                        selectedRole === role && styles.roleButtonTextSelected
                      ]}>
                        {role === 'waiter' ? 'serveur' : 
                         role === 'chef' ? 'cuisinier' : 
                         role === 'cleaner' ? 'nettoyage' : 
                         role === 'manager' ? 'manager' : role}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <Pressable 
                style={[styles.addButton, addingUser && styles.addButtonDisabled]} 
                onPress={handleAddUser}
                disabled={addingUser}
              >
                {addingUser ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <>
                    <MaterialIcons name="person-add" size={20} color="white" />
                    <Text style={styles.addButtonText}>Ajouter</Text>
                  </>
                )}
              </Pressable>
            </View>
          </View>

          {/* Users List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>👥 Utilisateurs ({users.length})</Text>
            
            {users.length > 0 ? (
              <View style={styles.usersList}>
                {users.map((user, index) => (
                  <View key={user.id || index} style={styles.userCard}>
                    <View style={styles.userIcon}>
                      <MaterialIcons 
                        name={getRoleIcon(user.role)} 
                        size={24} 
                        color={getRoleColor(user.role)} 
                      />
                    </View>
                    
                    <View style={styles.userInfo}>
                      <Text style={styles.userName}>{user.email.split('@')[0]}</Text>
                      <Text style={styles.userEmail}>{user.email}</Text>
                      <View style={styles.userMeta}>
                        <View style={[styles.roleBadge, { backgroundColor: getRoleColor(user.role) }]}>
                          <Text style={styles.roleBadgeText}>
                            {user.role === 'waiter' ? 'serveur' : 
                             user.role === 'chef' ? 'cuisinier' : 
                             user.role === 'cleaner' ? 'nettoyage' : 
                             user.role === 'manager' ? 'manager' : user.role}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <Pressable 
                      style={styles.revokeButton}
                      onPress={() => handleRevokeAccess(user.id)}
                    >
                      <MaterialIcons name="remove-circle" size={20} color="#E53E3E" />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <MaterialIcons name="group" size={64} color="#ccc" />
                <Text style={styles.emptyText}>Aucun utilisateur trouvé</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </AutoRedirect>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 3,
  },
  restaurantDetails: {
    marginLeft: 15,
    flex: 1,
  },
  restaurantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  restaurantRole: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  systemInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 2,
  },
  systemItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  systemText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  testButton: {
    backgroundColor: '#9f7aea',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    gap: 10,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  addUserForm: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  roleSelector: {
    marginBottom: 15,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
  },
  roleButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  roleButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f8f9fa',
  },
  roleButtonSelected: {
    backgroundColor: '#194A8D',
    borderColor: '#194A8D',
  },
  roleButtonText: {
    fontSize: 14,
    color: '#666',
    textTransform: 'capitalize',
  },
  roleButtonTextSelected: {
    color: 'white',
  },
  addButton: {
    backgroundColor: '#194A8D',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  addButtonDisabled: {
    opacity: 0.7,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  usersList: {
    gap: 12,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 2,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f8f9fa',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  userMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  userDate: {
    fontSize: 12,
    color: '#999',
  },
  revokeButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
});
