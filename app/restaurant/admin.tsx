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
import RestaurantProtectedRoute from './components/RestaurantProtectedRoute';
import { useRestaurant } from './SelectionContext';
import { getUserMembers, addUserMember, updateUserMember, deleteUserMember, type UserMember } from '../firebase/firebaseRestaurant';

export default function RestaurantAdminPage() {
  const { currentRestaurant } = useRestaurant();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserMember[]>([]);
  const [newUserEmail, setNewUserEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserMember['role']>('waiter');
  const [addingUser, setAddingUser] = useState(false);

  useEffect(() => {
    if (currentRestaurant) {
      loadRestaurantUsers();
    }
  }, [currentRestaurant]);

  const loadRestaurantUsers = async () => {
    if (!currentRestaurant) return;

    try {
      setLoading(true);
      const restaurantUsers = await getUserMembers(currentRestaurant.id);
      setUsers(restaurantUsers);
    } catch (error) {
      console.error('Erreur lors du chargement des utilisateurs:', error);
      Alert.alert('Erreur', 'Impossible de charger les utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUserEmail.trim() || !currentRestaurant) {
      Alert.alert('Erreur', 'Veuillez saisir un email valide');
      return;
    }

    try {
      setAddingUser(true);
      
      // Ajouter un nouveau membre avec l'email fourni
      await addUserMember(currentRestaurant.id, {
        name: newUserEmail.split('@')[0], // Utiliser la partie avant @ comme nom
        email: newUserEmail,
        role: selectedRole
      });

      setNewUserEmail('');
      await loadRestaurantUsers();
      Alert.alert('Succès', 'Membre ajouté avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'ajout de l\'utilisateur:', error);
      Alert.alert('Erreur', 'Impossible d\'ajouter l\'utilisateur');
    } finally {
      setAddingUser(false);
    }
  };

  const handleRevokeAccess = async (userId: string) => {
    if (!currentRestaurant) return;

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
              await deleteUserMember(currentRestaurant.id, userId);
              await loadRestaurantUsers();
              Alert.alert('Succès', 'Accès révoqué');
            } catch (error) {
              console.error('Erreur lors de la révocation:', error);
              Alert.alert('Erreur', 'Impossible de révoquer l\'accès');
            }
          }
        }
      ]
    );
  };

  const getRoleColor = (role: UserMember['role']) => {
    switch (role) {
      case 'manager': return '#3182CE';
      case 'waiter': return '#38A169';
      case 'chef': return '#E53E3E';
      case 'cleaner': return '#9F7AEA';
      default: return '#666';
    }
  };

  const getRoleIcon = (role: UserMember['role']) => {
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
    <RestaurantProtectedRoute>
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
              <Text style={styles.restaurantName}>{currentRestaurant?.name}</Text>
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
                      <Text style={styles.userName}>{user.name}</Text>
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
    </RestaurantProtectedRoute>
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
