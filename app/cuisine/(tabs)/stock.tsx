import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';
import {addStock } from '@/app/firebase/firebaseStock';

interface StockItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    price: number;
    date: string;
}

export default function Stock() {
    const [stockItems, setStockItems] = useState<StockItem[]>([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        quantity: '',
        price: '',
        unit: ''
    });

    useEffect(() => {
        const fetchStockItems = async () => {
            try {
                const querySnapshot = await getDocs(collection(db, "stock"));
                const items = querySnapshot.docs.map((doc) => {
                    const data = doc.data() as Omit<StockItem, 'id'>;
                    return {
                        id: doc.id,
                        ...data,
                    };
                });
                setStockItems(items);
            } catch (error) {
                console.error("Erreur lors de la récupération du stock : ", error);
            }
        };
        fetchStockItems();
    }, []);

    const handleAddItem = async () => {
        try {
            if (!newItem.name || !newItem.quantity || !newItem.price) {
                Alert.alert('Erreur', 'Veuillez remplir tous les champs');
                return;
            }

            await addStock(
                newItem.name,
                Number(newItem.quantity),
                Number(newItem.price)
            );

            setModalVisible(false);
            setNewItem({ name: '', quantity: '', price: '', unit: '' });
            // Rafraîchir la liste
            const querySnapshot = await getDocs(collection(db, "stock"));
            const items = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...(doc.data() as Omit<StockItem, 'id'>)
            }));
            setStockItems(items);
        } catch (error) {
            Alert.alert('Erreur', 'Impossible d\'ajouter l\'article');
        }
    };

    const renderItem = ({ item }: { item: StockItem }) => (
        <TouchableOpacity style={styles.itemContainer}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemQuantity}>
                {item.quantity} {item.unit}
            </Text>
            
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <Stack.Screen options={{ title: 'Gestion du Stock' }} />
            <View style={styles.header}>
                <Text style={styles.title}>État du Stock</Text>
            </View>
            <FlatList
                data={stockItems}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                style={styles.list}
            />

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalView}>
                    <Text style={styles.modalTitle}>Ajouter un article</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Nom"
                        value={newItem.name}
                        onChangeText={(text) => setNewItem({...newItem, name: text})}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Quantité"
                        keyboardType="numeric"
                        value={newItem.quantity}
                        onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Prix"
                        keyboardType="numeric"
                        value={newItem.price}
                        onChangeText={(text) => setNewItem({...newItem, price: text})}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Unité (kg, L, etc.)"
                        value={newItem.unit}
                        onChangeText={(text) => setNewItem({...newItem, unit: text})}
                    />
                    <View style={styles.modalButtons}>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonClose]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.textStyle}>Annuler</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSubmit]}
                            onPress={handleAddItem}
                        >
                            <Text style={styles.textStyle}>Ajouter</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setModalVisible(true)}
            >
                <Text style={styles.addButtonText}>+</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#ccc',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    list: {
        flex: 1,
        padding: 16,
    },
    itemContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemName: {
        fontSize: 18,
    },
    itemQuantity: {
        fontSize: 16,
        color: '#666',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 35,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        marginTop: 100
    },
    input: {
        width: '100%',
        marginBottom: 15,
        padding: 10,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%'
    },
    button: {
        borderRadius: 5,
        padding: 10,
        elevation: 2,
        marginHorizontal: 10
    },
    buttonClose: {
        backgroundColor: '#FF6B6B',
    },
    buttonSubmit: {
        backgroundColor: '#4CAF50',
    },
    textStyle: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center'
    },
    modalTitle: {
        marginBottom: 15,
        textAlign: 'center',
        fontSize: 20,
        fontWeight: 'bold'
    },
    addButton: {
        position: 'absolute',
        right: 30,
        bottom: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#4CAF50',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
    },
    addButtonText: {
        color: 'white',
        fontSize: 30,
        fontWeight: 'bold'
    },
});