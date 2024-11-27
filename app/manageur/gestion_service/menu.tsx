import { addmenu, deletemenu, getMenu } from "@/app/firebase/firebaseDatabase";
import { useState, useEffect } from "react";
import { Text, View, StyleSheet, Pressable, ScrollView } from 'react-native';
import { get } from "react-native/Libraries/TurboModule/TurboModuleRegistry";

interface Menu {
    id: string;
    name: string;
}

export default function GestionMenu() {
    const handleAddMenu = () => {
        addmenu();
    };

    const handlegetMenu = () => {
        getMenu();
    };
    const [menus, setMenus] = useState<Menu[]>([]);
    const handleDeleteMenu = () => {
        deletemenu();
    };
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const menuData = await getMenu();
                setMenus(menuData);
            } catch (error) {
                console.error("Erreur:", error);
            }
        };
        
        fetchMenu();
    }, []);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Gestion des Menus</Text>
            </View>
            <ScrollView>
                {menus.map((menu) => (
                    <View key={menu.id}>
                        <Text>{menu.name}</Text>
                    </View>
                ))}
            </ScrollView>

            <View style={styles.buttonContainer}>
                
                <Pressable style={styles.button} onPress={handleAddMenu}>
                    <Text style={styles.buttonText}>Ajouter un menu</Text>
                </Pressable>
                    <Pressable style={styles.button} onPress={handleDeleteMenu}>
                        <Text style={styles.buttonText}>Supprimer un menu</Text>
                    </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: 50,
    },
    logo: {
        width: 120,
        height: 120,
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    buttonContainer: {
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#f8f8f8',
        padding: 10,
        margin: 10,
        borderRadius: 5,
    },
    buttonText: {
        fontSize: 18,
        color: '#333',
    },
});
