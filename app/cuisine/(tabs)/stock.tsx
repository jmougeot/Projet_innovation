import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import React, { useState } from 'react';
import { Stack } from 'expo-router';

interface StockItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
}

export default function Stock() {
    const [stockItems, setStockItems] = useState<StockItem[]>([
        { id: '1', name: 'Tomates', quantity: 50, unit: 'kg' },
        { id: '2', name: 'Pommes de terre', quantity: 100, unit: 'kg' },
        { id: '3', name: 'Huile d\'olive', quantity: 20, unit: 'L' },
        // Add more items as needed
    ]);

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
});