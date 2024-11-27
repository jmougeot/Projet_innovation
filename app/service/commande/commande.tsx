import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { globalStyles } from '../../styles/globalStyles';
import { PLAT, Plat } from './Plats';

interface CommandeParTable {
    tableId: number;
    plats: Plat[];
}

export default function Commande() {
    const { tableId } = useLocalSearchParams();
    const [commandesParTable, setCommandesParTable] = useState<CommandeParTable[]>([]);
    const [platsSelectionnes, setPlatsSelectionnes] = useState<Plat[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const platsFilters = PLAT.filter(plat => 
        plat.nom.toLowerCase().includes(searchQuery.toLowerCase())
      );

    // Charger la commande existante pour la table
    useEffect(() => {
        const commandeExistante = commandesParTable.find(cmd => cmd.tableId === Number(tableId));
        if (commandeExistante) {
            setPlatsSelectionnes(commandeExistante.plats);
        } else {
            setPlatsSelectionnes([]);
        }
    }, [tableId]);

    // Mettre à jour la commande pour la table
    useEffect(() => {
        if (tableId) {
            setCommandesParTable(prev => {
                const index = prev.findIndex(cmd => cmd.tableId === Number(tableId));
                if (index >= 0) {
                    const newCommandes = [...prev];
                    newCommandes[index] = { tableId: Number(tableId), plats: platsSelectionnes };
                    return newCommandes;
                } else {
                    return [...prev, { tableId: Number(tableId), plats: platsSelectionnes }];
                }
            });
        }
    }, [platsSelectionnes, tableId]);

    const ajouterPlat = (plat: Plat) => {
        setPlatsSelectionnes((plats) => {
            const index = plats.findIndex((p) => p.id === plat.id);
            if (index >= 0) {
                const platsMisesAJour = [...plats];
                platsMisesAJour[index].nombre = (platsMisesAJour[index].nombre || 0) + 1;
                return platsMisesAJour;
            } else {
                return [...plats, { ...plat, nombre: 1 }];
            }        })
    };

    const supprimerPlat = (platToDelete:Plat) => {
        const index =platsSelectionnes.findIndex((plat) => plat.id === platToDelete.id);
        if (index==1){
            setPlatsSelectionnes(platsSelectionnes.filter((plat) => plat !== platToDelete));
        }
        else{
            const platsMisesAJour = [...platsSelectionnes];
            platsMisesAJour[index].nombre = (platsMisesAJour[index].nombre || 0) - 1;
            if (platsMisesAJour[index].nombre === 0) {
                platsMisesAJour.splice(index, 1);
            }
            setPlatsSelectionnes(platsMisesAJour);
        };
    }
    const validerCommande = () => {
        alert('Commande envoyée');
    }

    const calculerTotal = () => {
        return platsSelectionnes.reduce((total, plat) => total + plat.prix * (plat.nombre || 0), 0).toFixed(2);
    };

    return (
        <View style={styles.container}>
            <Text style={globalStyles.h1}> Table {tableId}</Text>
            
            <View style={styles.section}>
                <Text style={globalStyles.h2}>Plats sélectionnés</Text>
                <ScrollView style={styles.scrollView}>
                    {platsSelectionnes.map((plat, index) => (
                        <Pressable key={index} 
                        style={styles.platItem}
                        onPress={() => supprimerPlat(plat)} >
                        
                            <View style={styles.platInfo}>
                                <Text style={styles.nomPlat}>{plat.nom} x{plat.nombre}</Text>
                            </View>
                            <Text style={styles.prixPlat}>{plat.prix.toFixed(2)} €</Text>
                        </Pressable>
                    ))}
                </ScrollView>
                <View style={styles.totalSection}>
                        <Text style={styles.totalText}>Total: {calculerTotal()} €</Text>
                </View>
                <Pressable onPress={validerCommande}>
                    <Text>Envoyer la commande</Text>
                </Pressable>
            </View>

            <View style={styles.section2}>
                <Text style={globalStyles.h2}>Liste des plats</Text>
                <ScrollView style={styles.scrollView}>
                    {PLAT.map((plat, index) => (
                        <Pressable 
                            key={plat.id} 
                            style={styles.platItem}
                            onPress={() => ajouterPlat(plat)}
                        >
                            <View style={styles.platInfo}>
                                <Text style={styles.nomPlat}>{plat.nom}</Text>
                                {plat.description && (
                                    <Text style={styles.description}>{plat.description}</Text>
                                )}
                            </View>
                            <Text style={styles.prixPlat}>{plat.prix.toFixed(2)} €</Text>
                        </Pressable>
                    ))}
                </ScrollView>
 {/*            <View style={styles.searchBar}>
            <TextInput
                style={styles.searchInput}
                placeholder="Rechercher un plat..."
                value={searchQuery}
                onChangeText={setSearchQuery}/>
            </View>
            <ScrollView style={styles.scrollView}>
            {platsFilters.map((plat, index) => (
                <Pressable 
                    key={plat.id} 
                    style={styles.platItem}
                    onPress={() => ajouterPlat(plat)}
                >
                    <View style={styles.platInfo}>
                        <Text style={styles.nomPlat}>{plat.nom}</Text>
                        {plat.description && (
                            <Text style={styles.description}>{plat.description}</Text>
                        )}
                    </View>
                    <Text style={styles.prixPlat}>{plat.prix.toFixed(2)} €</Text>
                </Pressable>
            ))}
            </ScrollView> */}
            </View>
    
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#f5f5f5',
    },
    section: {
        flex: 0.6,
        marginBottom: 20,
    },
    section2: {
        flex: 1,
        marginBottom: 20,
    },
    scrollView: {
        backgroundColor: 'white',
        borderRadius: 8,
        padding: 10,
    },
    platItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    platInfo: {
        flex: 1,
    },
    platSelectionne: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    nomPlat: {
        fontSize: 16,
        fontWeight: '500',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    prixPlat: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2196F3',
    },
    totalSection: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: '#eee',
        paddingTop: 10,
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'right',
    },
    searchBar: {
        backgroundColor: 'white',
        borderRadius: 8,
        marginBottom: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      searchInput: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
      },
});
