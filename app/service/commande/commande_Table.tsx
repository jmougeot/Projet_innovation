import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { globalStyles } from '../../styles/globalStyles';
import {Plat, get_plats} from '@/app/firebase/firebaseMenu';
import { addCommande, CommandeData, PlatQuantite, getCommandeByTableId, updateCommande} from '@/app/firebase/firebaseCommande';

export default function Commande() {
    const { tableId } = useLocalSearchParams();
    const [Idcommande, setIdcommande] = useState<string>("");
    const [plats, setPlats] = useState<PlatQuantite[]>([]);  
    const [commandeExistante , setCommandeExistante] = useState<boolean>(false);
    const [commandesParTable, setCommandesParTable] = useState<CommandeData | null>(null);
    const [listPlats, setListPlats] = useState<Plat[]>([]);

    useEffect(() => {
        const fetchPlats = async () => {
            const platsData = await get_plats();
            setListPlats(platsData);
        };
        fetchPlats();
    }, []);

    useEffect(() => {
        const fetchCommande = async () => {
          try {
            const commande = await getCommandeByTableId(Number(tableId));
            if (commande) {
              setCommandesParTable(commande);
              setPlats(commande.plats);
              setCommandeExistante(true);
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

    const ajouterPlat = (plat: Plat) => {
        setPlats(prevPlats => {
            const platIndex = prevPlats.findIndex(p => p.plat.id === plat.id);
            if (platIndex >= 0) {
                const updatedPlats = [...prevPlats];
                updatedPlats[platIndex].quantite += 1;
                return updatedPlats;
            }
            return [...prevPlats, { plat, quantite: 1, status: "en attente", tableId: Number(tableId) }];
        });
        setCommandesParTable((prevCommande): CommandeData => {
            if (!prevCommande || !prevCommande.plats || prevCommande.plats.length === 0) {
                return {
                    id: Date.now().toString(),
                    employeeId: "default",
                    plats: [{ plat, quantite: 1, status: "en attente", tableId: Number(tableId) }],
                    totalPrice: plat.price,
                    status: "en attente",
                    timestamp: new Date(),
                    tableId: Number(tableId)
                };
            }
            const commande = { ...prevCommande };
            const platIndex = commande.plats.findIndex(p => p.plat.id === plat.id);

            if (platIndex >= 0) {
                const updatedCommande = { ...commande };
                updatedCommande.plats[platIndex].quantite += 1;
                updatedCommande.totalPrice = commande.plats.reduce((total, p) => total + p.plat.price * p.quantite, 0);
                return updatedCommande;
            }
            
            const updatedCommande = { ...commande };
            updatedCommande.plats = [...commande.plats, { plat, quantite: 1, status: "en attente", tableId: Number(tableId) }];
            updatedCommande.totalPrice = updatedCommande.plats.reduce((total, p) => total + p.plat.price * p.quantite, 0);
            return updatedCommande;
        })
    }

    const supprimerPlat = (plat: Plat) => {
        setCommandesParTable(prevCommandes => {
            if (!prevCommandes || !prevCommandes.plats) return prevCommandes;
            
            const commande = prevCommandes;
            const platIndex = commande.plats.findIndex(p => p.plat.id === plat.id);
            if (platIndex < 0) {
                return prevCommandes;
            }
            const updatedCommande = { ...commande };
            updatedCommande.plats = [...commande.plats];
            updatedCommande.plats[platIndex].quantite -= 1;
            if (updatedCommande.plats[platIndex].quantite === 0) {
                updatedCommande.plats.splice(platIndex, 1);
            }
            updatedCommande.totalPrice = updatedCommande.plats.reduce((total, p) => total + p.plat.price * p.quantite, 0);
            return updatedCommande;
        });
    }

    const validerCommande = (commandesParTable: CommandeData) => {
        if (commandeExistante){
            updateCommande(Idcommande, commandesParTable);
        }
        else{
            addCommande(commandesParTable)
        }
        alert('Commande envoyée');
        router.replace("/service/(tabs)/plan_de_salle");
    }

    return (
        <View style={styles.container}>
            <Text style={globalStyles.h1}> Table {tableId}</Text>
            
            <View style={styles.section}>
                <Text style={globalStyles.h2}>Plats sélectionnés</Text>
                <ScrollView style={styles.scrollView}>
                    {plats.map((plat, index) => (
                        <Pressable key={index} 
                        style={styles.platItem}
                        onPress={() => supprimerPlat(plat.plat)} >
                        
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
                <Pressable onPress={() => commandesParTable && validerCommande(commandesParTable)}>
                    <Text>Envoyer la commande</Text>
                </Pressable>
                <Pressable onPress={() => router.replace({
                    pathname: "/service/commande/encaissement",
                    params: { tableId: tableId }
                    })}>
                    <Text>Encaissement</Text>
                </Pressable>

            </View>

            <View style={styles.section2}>
                <Text style={globalStyles.h2}>Liste des plats</Text>
                <ScrollView style={styles.scrollView}>
                    {listPlats.map((plat, index) => (
                        <Pressable 
                            key={plat.id} 
                            style={styles.platItem}
                            onPress={() => ajouterPlat(plat)}
                        >
                            <View style={styles.platInfo}>
                                <Text style={styles.nomPlat}>{plat.name}</Text>
                                <Text style={styles.description}>{plat.category}</Text>
                            </View> 
                            <Text style={styles.prixPlat}>{plat.price} €</Text>
                        </Pressable>
                    ))}
                </ScrollView>
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
