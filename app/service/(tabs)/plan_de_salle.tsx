import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Pressable, ActivityIndicator, Alert } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Table, Room } from '@/app/firebase/room&table/types';
import { getAllTables, updateTable } from '@/app/firebase/room&table/table';
import { getRooms } from '@/app/firebase/room&table/room';
import { SafeAreaView } from 'react-native-safe-area-context';
import Header from '@/app/components/Header';
import { saveSelectedRoomName, getSelectedRoomName } from '@/app/asyncstorage/roomStorage';
import { TableShapeRenderer, getStatusColor, getStatusText, getNextStatus } from '../components/Table';
import { WorkspaceContainer, useWorkspaceSize } from '../components/Workspace';
import { RoomSelector } from '../components/RoomSelector';
import RestaurantStorage from '@/app/asyncstorage/restaurantStorage';
import AutoRedirect from '@/app/restaurant/AutoRedirect';

export default function PlanDeSalle() {
  const router = useRouter();
  const [CurrentRestaurantId, setCurrentRestaurantId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'plan' | 'liste'>('liste');
  const [tables, setTables] = useState<Table[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoomId, setCurrentRoomId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingRoomChange, setLoadingRoomChange] = useState<string>('');
  const { size: workspaceSize } = useWorkspaceSize();

  // Hooks end here. Derived variables and utility functions below.
  const TABLE_SIZE_RATIO = 0.08; // 8% de la taille du workspace
  const tableSize = workspaceSize * TABLE_SIZE_RATIO;

  // Fonction utilitaire pour dénormaliser les positions (même logique que map_settings.tsx)
  const denormalizePosition = (normalizedPosition: { x: number, y: number }, workspaceSize: number) => {
    return {
      x: normalizedPosition.x * workspaceSize,
      y: normalizedPosition.y * workspaceSize
    };
  };

  // Fonction pour déterminer si une position est normalisée (0-1) ou absolue
  const isNormalizedPosition = (position: { x: number, y: number }) => {
    return position.x <= 1 && position.y <= 1 && position.x >= 0 && position.y >= 0;
  };

  // Charger l'ID du restaurant depuis AsyncStorage
  useEffect(() => {
    const loadRestaurantId = async () => {
      try {
        const savedId = await RestaurantStorage.GetSelectedRestaurantId();
        if (savedId) {
          setCurrentRestaurantId(savedId);
        }
      } catch (error) {
        console.error('Erreur chargement restaurant ID:', error);
      }
    };
    loadRestaurantId();
  }, []);

  // Charger les rooms et tables au démarrage
  useEffect(() => {
    const loadRoomsAndTables = async () => {
      if (!CurrentRestaurantId) {
        console.warn('Aucun restaurant sélectionné');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Charger les rooms d'abord
        const roomsData = await getRooms(CurrentRestaurantId);
        setRooms(roomsData);
        
        // Si aucune room n'existe, rediriger vers map_settings pour la création
        if (roomsData.length === 0) {
          console.log('Aucune salle trouvée, redirection vers map_settings pour configuration');
          Alert.alert(
            'Configuration requise',
            'Aucune salle n\'est configurée pour ce restaurant. Vous allez être redirigé vers la page de configuration.',
            [
              {
                text: 'OK',
                onPress: () => router.replace('/service/commande/map_settings')
              }
            ]
          );
          return;
        }
        
        // Essayer de récupérer la dernière room sélectionnée depuis AsyncStorage
        let selectedRoomId = '';
        try {
          const lastSelectedRoomName = await getSelectedRoomName();
          if (lastSelectedRoomName) {
            // Trouver l'ID de la room correspondant au nom sauvegardé
            const foundRoom = roomsData.find(room => room.name === lastSelectedRoomName);
            if (foundRoom && foundRoom.id) {
              selectedRoomId = foundRoom.id;
              console.log(`📱 [PLAN_DE_SALLE] Room récupérée depuis le storage: ${lastSelectedRoomName} (ID: ${selectedRoomId})`);
            } else {
              console.log(`📱 [PLAN_DE_SALLE] Room "${lastSelectedRoomName}" non trouvée, utilisation de la première room disponible`);
            }
          }
        } catch (error) {
          console.error('Erreur lors de la récupération de la room sauvegardée:', error);
        }
        
        // Si aucune room sauvegardée ou room non trouvée, utiliser la première room disponible
        if (!selectedRoomId && roomsData[0]?.id) {
          selectedRoomId = roomsData[0].id;
        }
        
        if (!selectedRoomId) {
          console.error('Room ID manquant pour la première salle');
          router.replace('/service/commande/map_settings');
          return;
        }
        
        setCurrentRoomId(selectedRoomId);
        const tablesData = await getAllTables(selectedRoomId, true, CurrentRestaurantId);
        setTables(tablesData);
        
        // Sauvegarder la room sélectionnée dans AsyncStorage si elle n'était pas déjà sauvegardée
        const currentRoom = roomsData.find(room => room.id === selectedRoomId);
        if (currentRoom) {
          const savedRoomName = await getSelectedRoomName();
          if (savedRoomName !== currentRoom.name) {
            await saveSelectedRoomName(currentRoom.name);
            console.log(`📱 [PLAN_DE_SALLE] Room initiale "${currentRoom.name}" sauvegardée dans le storage`);
          }
        }
        
      } catch (error) {
        console.error("Erreur lors du chargement des rooms/tables:", error);
        // En cas d'erreur, rediriger aussi vers map_settings
        router.replace('/service/commande/map_settings');
      } finally {
        setLoading(false);
      }
    };
    
    loadRoomsAndTables();
  }, [CurrentRestaurantId, router]);

  const handleTablePress = (tableId: number, tablenumber: string) => {
    router.push({
      pathname: "../commande/commande_Table",
      params: { tableId: tableId, tablenumber: tablenumber }
    });
  };

  // Changer le statut de la table (appui long)
  const handleTableLongPress = async (tableId: number, currentStatus: Table['status']) => {
    if (!CurrentRestaurantId || !currentRoomId) {
      alert("Aucun restaurant ou salle sélectionné");
      return;
    }

    try {
      const nextStatus = getNextStatus(currentStatus);
      await updateTable(tableId, { status: nextStatus }, currentRoomId, CurrentRestaurantId);
      
      setTables(prevTables => 
        prevTables.map(table => 
          table.id === tableId ? { ...table, status: nextStatus } : table
        )
      );
    } catch (error) {
      console.error("Erreur lors de la modification du statut:", error);
      alert("Erreur lors de la modification du statut");
    }
  };

  // Fonction pour changer de salle
  const handleChangeRoom = useCallback(async (roomId: string) => {
    if (!CurrentRestaurantId || roomId === currentRoomId) return;

    try {
      setLoadingRoomChange(roomId);
      setCurrentRoomId(roomId);
      
      // Trouver le nom de la room pour la sauvegarde
      const selectedRoom = rooms.find(room => room.id === roomId);
      if (selectedRoom) {
        // Sauvegarder la room sélectionnée dans AsyncStorage
        await saveSelectedRoomName(selectedRoom.name);
        console.log(`📱 [PLAN_DE_SALLE] Room "${selectedRoom.name}" sauvegardée dans le storage`);
      }
      
      // Charger les tables pour la nouvelle salle
      const tablesData = await getAllTables(roomId, true, CurrentRestaurantId);
      setTables(tablesData);
    } catch (error) {
      console.error('Erreur lors du changement de salle:', error);
      Alert.alert('Erreur', 'Impossible de charger les tables de cette salle');
    } finally {
      setLoadingRoomChange('');
    }
  }, [CurrentRestaurantId, currentRoomId, rooms]);

  // Trier les tables par numéro pour la vue liste
  const sortedTables = [...tables].sort((a, b) => {
    const numA = parseInt(a.numero.replace(/\D/g, ''));
    const numB = parseInt(b.numero.replace(/\D/g, ''));
    return numA - numB;
  });

  // Vue plan avec workspace
  const renderPlanView = () => (
    <WorkspaceContainer style={{ flex: 1 }}>
      {tables.map((table) => {
        // Déterminer la position finale à utiliser
        let finalPosition = { x: table.position?.x || 0, y: table.position?.y || 0 };
        
        // Si la position est normalisée (0-1), la dénormaliser
        if (isNormalizedPosition(table.position)) {
          finalPosition = denormalizePosition(table.position, workspaceSize);
        }
        // Sinon, utiliser la position absolue directement (rétrocompatibilité)

        return (
          <TouchableOpacity
            key={table.id}
            style={[styles.tableContainer, { 
              left: finalPosition.x,
              top: finalPosition.y,
            }]}
            onPress={() => handleTablePress(table.id, table.numero)}  
            onLongPress={() => handleTableLongPress(table.id, table.status)}
            delayLongPress={500}
            activeOpacity={0.8}
          >
            <TableShapeRenderer
              table={table}
              size={tableSize}
              backgroundColor={getStatusColor(table.status)}
              textColor="#194A8D"
              showText={true}
            />
          </TouchableOpacity>
        );
      })}
    </WorkspaceContainer>
  );

  // Vue liste des tables
  const renderListView = () => {
    if (sortedTables.length === 0) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Aucune table disponible dans cette salle.</Text>
        </View>
      );
    }
    return (
      <ScrollView style={styles.listContainer}>
        {sortedTables.map((table) => (
          <TouchableOpacity
            key={table.id}
            style={[styles.tableListItem, { backgroundColor: getStatusColor(table.status) }]}
            onPress={() => handleTablePress(table.id, table.numero)}
            onLongPress={() => handleTableLongPress(table.id, table.status)}
            delayLongPress={500}
            activeOpacity={0.8}
          >
            <View style={styles.tableListInfo}>
              <View style={styles.tableListLeft}>
                <TableShapeRenderer
                  table={table}
                  size={tableSize * 0.5} // 50% de la taille normale pour la vue liste
                  backgroundColor={getStatusColor(table.status)}
                  textColor="#194A8D"
                  showText={true}
                />
              </View>
              <View style={styles.tableListDetails}>
                <Text style={styles.tableListNumero}>{table.numero}</Text>
              </View>
            </View>
            <Text style={styles.tableListStatus}>{getStatusText(table.status)}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  // Boutons de basculement vue plan/liste
  const renderToggleButton = (mode: 'liste' | 'plan', text: string) => (
    <Pressable
      style={[styles.toggleButton, viewMode === mode && styles.activeToggle]}
      onPress={() => {
        setViewMode(mode);
      }}
    >
      <Text style={styles.toggleButtonText}>{text}</Text>
    </Pressable>
  );

  // Menu items pour le composant réglage
  const reglageMenuItems = [
    {
      label: 'Modifier le plan',
      onPress: () => router.push('/service/commande/map_settings' as any)
    },
    {
      label: 'Profil',
      onPress: () => router.push('/Profil/avatar' as any)
    },
    {
      label: 'Paramètres',
      onPress: () => {}
    },
    {
      label: 'Déconnexion',
      onPress: () => {},
      isLogout: true
    },
  ];

  return (
    <AutoRedirect 
      requireAnyAccess={true}
      loadingMessage="Vérification des accès restaurant..."
      fallbackRoute="/connexion"
    >
      <SafeAreaView style={styles.container}>
        <Header 
          title="Plan de Salle" 
          showBackButton={true}
          backgroundColor="#194A8D"
          textColor="#FFFFFF"
          useHeadComponent={true}
          customBackRoute="/service"
          showReglage={true}
          reglageMenuItems={reglageMenuItems}
        />
        
        <View style={styles.contentWrapper}>
          <View style={styles.toggleContainer}>
            {renderToggleButton('liste', 'Liste')}
            <RoomSelector
              rooms={rooms}
              currentRoomId={currentRoomId}
              currentRestaurant={CurrentRestaurantId}
              loadingRoomChange={loadingRoomChange}
              onRoomSelect={handleChangeRoom}
            />
            {renderToggleButton('plan', 'Plan')}
          </View>

          <View style={styles.contentContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#194A8D" />
                <Text style={styles.loadingText}>Chargement des tables...</Text>
              </View>
            ) : (
              viewMode === 'plan' ? renderPlanView() : renderListView()
            )}
          </View>
        </View>
      </SafeAreaView>
    </AutoRedirect>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#194A8D',
  },
  contentWrapper: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    margin: 5,
    borderRadius: 25,
  },
  contentContainer: {
    flex: 1,
    zIndex: 1,
  },
  toggleContainer: {
    margin: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
    zIndex: 999999,
    position: 'relative',
    
  },
  toggleButton: {
    alignContent: 'center',
    backgroundColor: '#CAE1EF',
    paddingVertical: 10,
    paddingHorizontal: 2,
    borderRadius: 25,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 2,
  },
  activeToggle: {
    backgroundColor: '#EFBC51',
  },
  toggleButtonText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 16,
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'center',        // Centre les éléments horizontalement
    alignItems: 'center',            // Centre les éléments verticalement
    marginBottom: 15,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    elevation: 2,
    boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.2)',
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 15,
    height: 15,
    borderRadius: 3,
    marginRight: 5,
  },
  legendeText: {
    color: '#194A8D',
    fontSize: 12,
    fontWeight: '500',
  },
  tableContainer: {
    position: 'absolute',
  },
  listContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tableListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    marginVertical: 4,
    borderRadius: 15,
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  tableListInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableListLeft: {
    marginRight: 15,
  },
  tableListDetails: {
    flex: 1,
  },
  tableListNumero: {
    color: '#194A8D',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  tableListMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tableListPlaces: {
    color: '#194A8D',
    fontSize: 14,
    marginLeft: 6,
    marginRight: 8,
  },
  tableListShape: {
    color: '#194A8D',
    fontSize: 12,
    fontStyle: 'italic',
    opacity: 0.8,
  },
  tableListStatus: {
    color: '#194A8D',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    minWidth: 80,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  loadingText: {
    marginTop: 15,
    color: '#194A8D',
    fontSize: 16,
    fontWeight: '500',
  },
  // Styles pour le sélecteur de salles
  roomSelector: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    elevation: 2,
    boxShadow: '0px 1px 2.22px rgba(0, 0, 0, 0.22)',
  },
  roomSelectorLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#194A8D',
    marginBottom: 10,
  },
  roomSelectorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  roomDropdownContainer: {
    flex: 1,
    marginRight: 10,
  },
  roomOption: {
    backgroundColor: '#F3EFEF',
    padding: 12,
    borderRadius: 8,
    marginBottom: 5,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  roomOptionActive: {
    backgroundColor: '#194A8D',
    borderColor: '#194A8D',
  },
  roomOptionLoading: {
    opacity: 0.6,
  },
  roomOptionContent: {
    flex: 1,
    marginLeft: 8,
  },
  roomOptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#194A8D',
    flex: 1,
  },
  roomOptionTextActive: {
    color: '#fff',
  },
  roomTableCount: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  roomTableCountActive: {
    color: '#194A8D',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  roomOptionDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  manageRoomsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CAE1EF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 15,
    alignSelf: 'flex-start',
  },
  manageRoomsButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#194A8D',
    marginLeft: 4,
  },
  // Styles pour le sélecteur de salle déroulant
  roomSelectorButton: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 25,
    elevation: 3,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    flex: 1.2,
    alignItems: 'center',
    marginHorizontal: 5,
    borderWidth: 1,
    borderColor: '#194A8D',
  },
  roomSelectorContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roomSelectorText: {
    color: '#194A8D',
    fontWeight: '600',
    fontSize: 14,
    marginRight: 5,
    textAlign: 'center',
  },
  roomSelectorCount: {
    fontSize: 10,
    color: '#666',
    marginTop: 2,
    textAlign: 'center',
  },
});