import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { globalStyles } from '../../styles/globalStyles';
import {Plat, get_plats} from '@/app/firebase/firebaseMenu';
import {CommandeData, PlatQuantite, getCommandeByTableId, CommandeEncaisse} from '@/app/firebase/firebaseCommande';

export default function Commande() {
    const { tableId } = useLocalSearchParams();
    const [Idcommande, setIdcommande] = useState<string>("");
    const [plats, setPlats] = useState<PlatQuantite[]>([]);  
    const [commandesParTable, setCommandesParTable] = useState<CommandeData | null>(null);
    const [PlatsSelectione, setPlatsSelectione] = useState<PlatQuantite[]>([]);
    const [PlatEncaissé, setPlatEncaissé] = useState<PlatQuantite[]>([]);


    useEffect(() => {
        const fetchCommande = async () => {
          try {
            const commande = await getCommandeByTableId(Number(tableId));
            if (commande) {
              setCommandesParTable(commande);
              setPlats(commande.plats);
              setIdcommande(commande.id);
              console.log("Commande existante:",Idcommande);
            }
          } catch (error) {
            console.error("Erreur lors du chargement de la commande:", error);
          }
        };
        
        if (tableId) {
          fetchCommande();
        }
      }, [tableId]);

    const EncaisserPlat = (plat: Plat) => {
        // Retirer le plat des plats à encaisser
        setPlats(prevPlats => {
            const updatedPlats = prevPlats.filter(p => p.plat.id !== plat.id);
            return updatedPlats;
        });

        // Ajouter le plat aux plats sélectionnés
        setPlatsSelectione(prev => {
            const existingPlat = prev.find(p => p.plat.id === plat.id);
            if (existingPlat) {
                return prev.map(p => 
                    p.plat.id === plat.id 
                    ? { ...p, quantite: p.quantite + 1 }
                    : p
                );
            }
            return [...prev, { plat: plat, quantite: 1, status: 'new', tableId: Number(tableId) }];
        });
    };

    const Commande_Encaisse = () => {
        CommandeEncaisse(Number(tableId));
        console.log("Encaissement:");
        router.replace('/service/(tabs)/plan_de_salle')
    }



    const validerEncaissement = (plat: Plat) => {
        // Retirer le plat des plats sélectionnés
        setPlatsSelectione(prev => 
            prev.filter(p => p.plat.id !== plat.id)
        );

        // Ajouter le plat aux plats encaissés
        setPlatEncaissé(prev => {
            const existingPlat = prev.find(p => p.plat.id === plat.id);
            if (existingPlat) {
                return prev.map(p => 
                    p.plat.id === plat.id 
                    ? { ...p, quantite: p.quantite + 1 }
                    : p
                );
            }
            return [...prev, { plat: plat, quantite: 1, status: 'new', tableId: Number(tableId) }];
        });
    };

    return (
        <View style={styles.container}>
            <Text style={globalStyles.h1}>Table {tableId}</Text>
            <View style={styles.section}>
                <Text style={globalStyles.h2}>Plats à encaisser</Text>
                <ScrollView style={styles.scrollView}>
                    {plats.map((plat, index) => (
                        <Pressable key={index} 
                        style={styles.platItem}
                        onPress={() => EncaisserPlat(plat.plat)} >
                        
                            <View style={styles.platInfo}>
                                <Text style={styles.nomPlat}>{plat.plat.name} x{plat.quantite}</Text>
                            </View>
                            <Text style={styles.prixPlat}>{plat.plat.price} €</Text>
                        </Pressable>
                    ))}
                </ScrollView>
                <View style={styles.totalSection}>
                        <Text style={styles.totalText}>Total: {commandesParTable?.totalPrice || 0} €</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={globalStyles.h2}>Plats selectionés </Text>
                <ScrollView style={styles.scrollView}>
                    {PlatsSelectione.map((plat, index) => (
                        <Pressable key={index} 
                        style={styles.platItem}
                        onPress={() => validerEncaissement(plat.plat)} >
                        
                            <View style={styles.platInfo}>
                                <Text style={styles.nomPlat}>{plat.plat.name} x{plat.quantite}</Text>
                            </View>
                            <Text style={styles.prixPlat}>{plat.plat.price} €</Text>
                        </Pressable>
                    ))}
                </ScrollView>
                <View style={styles.totalSection}>
                        <Text style={styles.totalText}>Total: {commandesParTable?.totalPrice || 0} €</Text>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={globalStyles.h2}>Plats encaissés </Text>
                <ScrollView style={styles.scrollView}>
                    {PlatEncaissé.map((plat, index) => (
                        <Pressable key={index} 
                        style={styles.platItem}>
                        
                            <View style={styles.platInfo}>
                                <Text style={styles.nomPlat}>{plat.plat.name} x{plat.quantite}</Text>
                            </View>
                            <Text style={styles.prixPlat}>{plat.plat.price} €</Text>
                        </Pressable>
                    ))}
                </ScrollView>
                <View style={styles.totalSection}>
                        <Text style={styles.totalText}>Total: {commandesParTable?.totalPrice || 0} €</Text>
                </View>
            </View>
            <Pressable onPress={() => Commande_Encaisse()}>
                <Text>Valider la commande</Text>
            </Pressable>
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
