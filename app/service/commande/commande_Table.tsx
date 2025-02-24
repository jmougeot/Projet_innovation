import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {Plat, get_plats} from '@/app/firebase/firebaseMenu';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';

import { addCommande, CommandeData, PlatQuantite, getCommandeByTableId, updateCommande} from '@/app/firebase/firebaseCommande';

export default function Commande() {
    const { tableId } = useLocalSearchParams();
    const [Idcommande, setIdcommande] = useState<string>("");
    const [plats, setPlats] = useState<PlatQuantite[]>([]);  
    const [commandeExistante, setCommandeExistante] = useState<boolean>(false);
    const [commandesParTable, setCommandesParTable] = useState<CommandeData | null>(null);
    const [listPlats, setListPlats] = useState<Plat[]>([]);

    const [fontsLoaded] = useFonts({
        'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
    });

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
                }
            } catch (error) {
                console.error("Erreur lors du chargement de la commande:", error);
            }
        };
        
        if (tableId) {
            fetchCommande();
        }
    }, [tableId]);

    if (!fontsLoaded) {
        return null;
    }

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
            <View style={styles.headerSquare}>
                <Text style={styles.headerSquareText}> Table {tableId}</Text>
            </View>            
            <View style={styles.sectionCommande}>
                <ScrollView style={styles.scrollView}>
                    {plats.map((plat, index) => (
                        <Pressable key={index} 
                            style={styles.platItem}
                            onPress={() => supprimerPlat(plat.plat)} >
                            <View style={styles.platInfo}>
                                <Text style={styles.nomPlat}>{plat.plat.name}</Text>
                            </View>
                            <Text style={styles.prixPlat}>{plat.quantite} x {plat.plat.price} €</Text>
                        </Pressable>
                        ))}

                </ScrollView>
                <View style={styles.buttonContainer}>
                    <Pressable
                        style={styles.buttonEncaissement}
                        onPress={() => commandesParTable && validerCommande(commandesParTable)}>
                        <Text style={styles.buttonText}>Envoyer</Text>
                    </Pressable>
                    <Pressable 
                        style={styles.buttonEnvoyer}
                        onPress={() => router.replace({
                        pathname: "/service/commande/encaissement",
                        params: { tableId: tableId }
                        })}>
                        <Text style={styles.buttonText}>Encaissement</Text>
                    </Pressable>
                    <View style={styles.totalSection}>
                            <Text style={styles.buttonText}>Total: {commandesParTable?.totalPrice || 0} €</Text>
                    </View>
                </View>
            </View>

            <View style={styles.sectionPlat}>
                <ScrollView style={styles.scrollView2}>
                    {Object.entries(
                        listPlats.reduce((acc, plat) => {
                            acc[plat.category] = acc[plat.category] || [];
                            acc[plat.category].push(plat);
                            return acc;
                        }, {} as Record<string, Plat[]>)
                    ).map(([category, platsInCategory]) => (
                        <View key={category} style={styles.category}>
                            <View style={styles.categoryHeader}>
                                <Text style={styles.categoryTitle}>{category}</Text>
                                <View style={styles.categorySeparatorContainer}>
                                    <LinearGradient
                                        colors={['transparent', '#CAE1EF', 'transparent']}
                                        start={{ x: 0, y: 0.5 }}
                                        end={{ x: 1, y: 0.5 }}
                                        style={styles.categorySeparator}
                                    />
                                </View>
                            </View>
                            <View style={styles.platsContainer}>
                                {platsInCategory.map((plat, index) => (
                                    <Pressable
                                        key={plat.id} 
                                        style={{ width: '49%' }}
                                        onPress={() => ajouterPlat(plat)}
                                    >
                                        {plat.mission ? (
                                            <LinearGradient
                                                colors={['#F8EDCF', '#EFBC51']}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                                style={styles.platMission}
                                            >
                                                <Text style={[styles.nomPlat, { color: '#8B4513' }]}>{plat.name} {plat.price} €</Text>
                                            </LinearGradient>
                                        ) : (
                                            <View style={styles.platItem2}>
                                                <Text style={styles.nomPlat}>{plat.name} {plat.price} €</Text>
                                            </View>
                                        )}
                                    </Pressable>
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    // 1. Container principal et header
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#194A8D',
    },
    headerSquare: {
        alignSelf: 'center',
        backgroundColor: '#CAE1EF',
        width: 150,
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

    // 2. Section commande (partie supérieure)
    sectionCommande: {
        flex: 0.30,
        marginBottom: 10,
        backgroundColor: '#F3EFEF',
        borderRadius: 20,
        overflow: 'hidden'
    },
    scrollView: {
        backgroundColor: '#F3EFEF',
        padding: 10,
    },
    platItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 5,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    platInfo: {
        flex: 1,
    },
    prixPlat: {
        fontSize: 16,
        fontWeight: '500',
        color: '#2196F3',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        padding: 5,
        backgroundColor: '#F3EFEF',
    },
    buttonEncaissement: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#CAE1EF',
        borderRadius: 25,
        height: 30,
        flex: 0.3,
    },
    buttonEnvoyer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#CAE1EF',
        borderRadius: 25,
        height: 30,
        flex: 0.3,
    },
    totalSection: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#CAE1EF',
        fontSize: 16,
        borderRadius: 20,
        height: 30,
        flex: 0.3,
    },
    buttonText: {
        color: '#083F8C',
        fontSize: 13,
        fontWeight: 'bold'
    },

    // 3. Section plats (partie inférieure)
    sectionPlat: {
        flex: 0.70,
        marginBottom: 20,
        backgroundColor: '#F3EFEF',
        borderRadius: 20,
        overflow: 'hidden'
    },
    scrollView2: {
        backgroundColor: '#194A8D',
        padding: 10,
    },
    category: {},
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
        color: 'white',
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
        height: 4,
        width: '100%',
    },
    platsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 7
    },
    platItem2: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
        backgroundColor: '#CAE1EF',
        borderRadius: 30,
        height: 40,
    },
    platMission: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 5,
        borderRadius: 30,
        height: 40,
        width: '100%',
    },

    // 4. Éléments communs
    nomPlat: {
        fontSize: 16,
        fontWeight: '500',
        color: '#194A8D',
    },
    description: {
        fontSize: 14,
        color: '#666',
        marginTop: 4,
    },
    platSelectionne: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        borderBottomWidth: 1,
    },
    searchInput: {
        paddingHorizontal: 15,
        paddingVertical: 10,
        fontSize: 16,
    },
});
