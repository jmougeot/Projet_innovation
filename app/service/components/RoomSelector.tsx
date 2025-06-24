import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Room } from '../../firebase/room&table/types';
import { getAllTables } from '../../firebase/room&table/table';

interface RoomSelectorProps {
  rooms: Room[];
  currentRoomId: string;
  currentRestaurant: string | null;
  loadingRoomChange: string;
  onRoomSelect: (roomId: string) => void;
}

export const RoomSelector: React.FC<RoomSelectorProps> = ({rooms, currentRoomId, currentRestaurant, loadingRoomChange, onRoomSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [roomTableCounts, setRoomTableCounts] = useState<Record<string, number>>({});

  // Charger les compteurs de tables pour toutes les salles
  const loadRoomTableCounts = useCallback(async () => {
    if (!currentRestaurant || rooms.length === 0) return;

    try {
      const counts: Record<string, number> = {};
      for (const room of rooms) {
        if (room.id) {
          const roomTables = await getAllTables(room.id, true, currentRestaurant);
          counts[room.id] = roomTables.length;
        }
      }
      setRoomTableCounts(counts);
    } catch (error) {
      console.error('Erreur lors du chargement des compteurs de tables:', error);
    }
  }, [currentRestaurant, rooms]);

  // Charger les compteurs quand les salles changent
  useEffect(() => {
    loadRoomTableCounts();
  }, [currentRestaurant, rooms]);

  // Derived variables after all hooks
  const currentRoom = rooms.find(room => room.id === currentRoomId);

  const handleRoomSelect = (roomId: string) => {
    onRoomSelect(roomId);
    setIsDropdownOpen(false);
  };

  const handleToggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <View style={styles.container}>
      {/* Bouton sélecteur */}
      <Pressable
        style={styles.roomSelectorButton}
        onPress={handleToggleDropdown}
      >
        <View style={styles.roomSelectorContent}>
          <Text style={styles.roomSelectorText}>
            {currentRoom?.name || 'Sélectionner une salle'}
          </Text>
          <MaterialIcons 
            name={isDropdownOpen ? 'keyboard-arrow-up' : 'keyboard-arrow-down'} 
            size={20} 
            color="#194A8D" 
          />
        </View>
      </Pressable>

      {/* Dropdown */}
      {isDropdownOpen && (
        <View style={styles.roomDropdown}>
          <ScrollView 
            style={styles.roomDropdownScrollView}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled={true}
          >
            {rooms.map((room) => (
              <Pressable
                key={room.id}
                style={[
                  styles.roomDropdownItem,
                  currentRoomId === room.id && styles.roomDropdownItemActive
                ]}
                onPress={() => {
                  if (room.id) {
                    handleRoomSelect(room.id);
                  }
                }}
                disabled={loadingRoomChange === room.id}
              >
                <View style={styles.roomDropdownItemContent}>
                  <Text style={[
                    styles.roomDropdownItemText,
                    currentRoomId === room.id && styles.roomDropdownItemTextActive
                  ]}>
                    {room.name}
                  </Text>
                  {room.description && (
                    <Text style={[
                      styles.roomDropdownItemDescription,
                      currentRoomId === room.id && styles.roomDropdownItemDescriptionActive
                    ]}>
                      {room.description}
                    </Text>
                  )}
                </View>
                <View style={styles.roomDropdownItemRight}>
                  {roomTableCounts[room.id!] !== undefined && (
                    <Text style={[
                      styles.roomDropdownItemCount,
                      currentRoomId === room.id && styles.roomDropdownItemCountActive
                    ]}>
                      {roomTableCounts[room.id!]} table{roomTableCounts[room.id!] > 1 ? 's' : ''}
                    </Text>
                  )}
                  {loadingRoomChange === room.id ? (
                    <ActivityIndicator size="small" color={currentRoomId === room.id ? "#fff" : "#194A8D"} />
                  ) : currentRoomId === room.id ? (
                    <MaterialIcons name="check" size={16} color="#fff" />
                  ) : null}
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 99999,
  },
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
  // Dropdown styles
  roomDropdown: {
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: [{ translateX: -125 }], // -125 = -250/2 pour centrer un dropdown de 250px de large
    backgroundColor: '#fff',
    borderRadius: 10,
    elevation: 20,
    boxShadow: '0px 5px 10px rgba(0, 0, 0, 0.5)',
    marginTop: 5,
    maxHeight: 300,
    zIndex: 11999999,
    width: 250,
  },
  roomDropdownScrollView: {
    flexGrow: 0,
  },
  roomDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  roomDropdownItemActive: {
    backgroundColor: '#194A8D',
  },
  roomDropdownItemContent: {
    flex: 1,
  },
  roomDropdownItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#194A8D',
  },
  roomDropdownItemTextActive: {
    color: '#fff',
  },
  roomDropdownItemDescription: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 2,
  },
  roomDropdownItemDescriptionActive: {
    color: '#CAE1EF',
  },
  roomDropdownItemRight: {
    alignItems: 'flex-end',
    marginLeft: 10,
  },
  roomDropdownItemCount: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    backgroundColor: '#E8E8E8',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    marginBottom: 4,
  },
  roomDropdownItemCountActive: {
    color: '#194A8D',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
});

export default RoomSelector;