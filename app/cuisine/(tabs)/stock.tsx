import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, Platform, ScrollView } from 'react-native';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/app/firebase/firebaseConfig';
import { addStock } from '@/app/firebase/firebaseStock';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

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
    const [fontsLoaded] = useFonts({
        'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
    });

    useEffect(() => {
        fetchStockItems();
    }, []);

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
            Alert.alert('Erreur', 'Impossible de charger les articles du stock');
        }
    };

    const handleAddItem = async () => {
        try {
            if (!newItem.name || !newItem.quantity || !newItem.price) {
                Alert.alert('Erreur', 'Veuillez remplir tous les champs obligatoires');
                return;
            }

            // Modify the call to match the current function signature
            await addStock(
                newItem.name,
                Number(newItem.quantity),
                Number(newItem.price)
                // Remove the fourth parameter for now
            );

            setModalVisible(false);
            setNewItem({ name: '', quantity: '', price: '', unit: '' });
            fetchStockItems(); // Refresh the list
        } catch (error) {
            console.error("Erreur lors de l'ajout de l'article:", error);
            Alert.alert('Erreur', 'Impossible d\'ajouter l\'article');
        }
    };

    if (!fontsLoaded) {
        return null;
    }

    // Group items by first letter of name for better organization
    const groupedItems = stockItems.reduce((acc, item) => {
        const firstLetter = item.name.charAt(0).toUpperCase();
        if (!acc[firstLetter]) acc[firstLetter] = [];
        acc[firstLetter].push(item);
        return acc;
    }, {} as Record<string, StockItem[]>);

    return (
        <View style={styles.container}>
            <View style={styles.headerSquare}>
                <Text style={styles.headerSquareText}>Gestion du Stock</Text>
            </View>

            <ScrollView style={styles.scrollView}>
                {Object.entries(groupedItems).map(([letter, items]) => (
                    <View key={letter} style={styles.sectionContainer}>
                        <View style={styles.categoryHeader}>
                            <Text style={styles.categoryTitle}>{letter}</Text>
                            <View style={styles.categorySeparatorContainer}>
                                <LinearGradient
                                    colors={['transparent', '#CAE1EF', 'transparent']}
                                    start={{ x: 0, y: 0.5 }}
                                    end={{ x: 1, y: 0.5 }}
                                    style={styles.categorySeparator}
                                />
                            </View>
                        </View>
                        <View style={styles.content}>
                            {items.map((item) => (
                                <TouchableOpacity key={item.id} style={styles.stockItem}>
                                    <View style={styles.itemInfo}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemPrice}>{item.price} €</Text>
                                    </View>
                                    <View style={styles.quantityInfo}>
                                        <Text style={styles.quantityText}>{item.quantity} {item.unit || 'unité(s)'}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                ))}
            </ScrollView>

            <Modal
                animationType="slide"
                transparent={true}
                visible={modalVisible}
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalView}>
                        <Text style={styles.modalTitle}>Nouvel article</Text>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Nom</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Nom de l'article"
                                value={newItem.name}
                                onChangeText={(text) => setNewItem({...newItem, name: text})}
                            />
                        </View>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Quantité</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Quantité"
                                keyboardType="numeric"
                                value={newItem.quantity}
                                onChangeText={(text) => setNewItem({...newItem, quantity: text})}
                            />
                        </View>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Unité</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="kg, L, unité..."
                                value={newItem.unit}
                                onChangeText={(text) => setNewItem({...newItem, unit: text})}
                            />
                        </View>
                        
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Prix</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Prix en €"
                                keyboardType="numeric"
                                value={newItem.price}
                                onChangeText={(text) => setNewItem({...newItem, price: text})}
                            />
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setModalVisible(false)}
                            >
                                <Text style={styles.buttonText}>Annuler</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.confirmButton]}
                                onPress={handleAddItem}
                            >
                                <Text style={styles.buttonText}>Ajouter</Text>
                            </TouchableOpacity>
                        </View>
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
        padding: 10,
        backgroundColor: '#194A8D',
    },
    headerSquare: {
        alignSelf: 'center',
        backgroundColor: '#CAE1EF',
        width: 200,
        height: 35,
        marginBottom: 10,
        borderRadius: 80,
        padding: 0,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                marginTop: 45,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    headerSquareText: {
        color: '#083F8C',
        fontWeight: 'bold',
        fontSize: 18,
    },
    scrollView: {
        flex: 1,
    },
    sectionContainer: {
        backgroundColor: '#F3EFEF',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 15,
        padding: 10,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        marginVertical: 10,
    },
    categoryTitle: {
        fontSize: 20,
        fontWeight: '600',
        fontStyle: 'italic',
        color: '#194A8D',
        textAlign: 'right',
        paddingRight: 15,
        letterSpacing: 1,
        fontFamily: 'AlexBrush',
    },
    categorySeparatorContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    categorySeparator: {
        height: 2,
        width: '100%',
    },
    content: {
        padding: 5,
    },
    stockItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        marginVertical: 5,
        backgroundColor: '#CAE1EF',
        borderRadius: 15,
    },
    itemInfo: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#194A8D',
    },
    itemPrice: {
        fontSize: 14,
        color: '#194A8D',
    },
    quantityInfo: {
        backgroundColor: '#194A8D',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    quantityText: {
        color: 'white',
        fontWeight: 'bold',
    },
    addButton: {
        position: 'absolute',
        right: 30,
        bottom: 30,
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#CAE1EF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    addButtonText: {
        color: '#194A8D',
        fontSize: 30,
        fontWeight: 'bold',
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        width: '80%',
        backgroundColor: '#F3EFEF',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#194A8D',
        marginBottom: 15,
        textAlign: 'center',
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 16,
        color: '#194A8D',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#CAE1EF',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 20,
    },
    modalButton: {
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 15,
        flex: 0.45,
        alignItems: 'center',
    },
    cancelButton: {
        backgroundColor: '#FF6B6B',
    },
    confirmButton: {
        backgroundColor: '#CAE1EF',
    },
    buttonText: {
        fontWeight: 'bold',
        color: '#194A8D',
    },
});