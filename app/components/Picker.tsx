import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Dimensions } from 'react-native';

interface PickerProps<T> {
  selectedValue: T;
  onValueChange: (value: T, index: number) => void;
  items: {
    label: string;
    value: T;
  }[];
  placeholder?: string;
  style?: any;
  labelStyle?: any;
  pickerStyle?: any;
  disabled?: boolean;
  modalTitle?: string;
}

function Picker<T>({
  selectedValue,
  onValueChange,
  items,
  placeholder = "Sélectionnez un élément...",
  style,
  labelStyle,
  pickerStyle,
  disabled = false,
  modalTitle = "Choisissez une option"
}: PickerProps<T>) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ label: string, value: T } | null>(null);

  useEffect(() => {
    const currentItem = items.find(item => item.value === selectedValue);
    setSelectedItem(currentItem || null);
  }, [selectedValue, items]);

  const handleSelectItem = (item: { label: string, value: T }, index: number) => {
    setSelectedItem(item);
    onValueChange(item.value, index);
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      <TouchableOpacity 
        style={[styles.pickerButton, pickerStyle, disabled && styles.disabledPicker]} 
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={disabled ? 1 : 0.7}
      >
        <Text style={[styles.pickerText, labelStyle, !selectedItem && styles.placeholderText]}>
          {selectedItem ? selectedItem.label : placeholder}
        </Text>
        <Text style={styles.dropdownIcon}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={items}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  style={[
                    styles.itemContainer,
                    selectedValue === item.value && styles.selectedItem
                  ]}
                  onPress={() => handleSelectItem(item, index)}
                >
                  <Text style={[
                    styles.itemText,
                    selectedValue === item.value && styles.selectedItemText
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
              style={styles.listContainer}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  disabledPicker: {
    backgroundColor: '#f2f2f2',
    opacity: 0.7,
  },
  pickerText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    fontSize: 20,
    color: '#666',
    padding: 5,
  },
  listContainer: {
    flexGrow: 0,
  },
  itemContainer: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedItem: {
    backgroundColor: '#f0f8ff',
  },
  itemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedItemText: {
    fontWeight: 'bold',
    color: '#0066cc',
  }
});

export default Picker;
