import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import {Plat, get_plats} from '@/app/firebase/firebaseMenu';
import { auth } from '@/app/firebase/firebaseConfig';
import { LinearGradient } from 'expo-linear-gradient';
import { useFonts } from 'expo-font';
import { createCommande, CommandeData, PlatQuantite, getCommandeByTableId, updateCommande} from '@/app/firebase/firebaseCommandeOptimized';
import Reglage from '@/app/components/reglage';
import { getMissionPlatsForUser } from '@/app/firebase/firebaseMissionOptimized';
import { PlatItem } from '@/app/service/components/Plats';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getPlanDeSalleMenuItems } from '../components/ServiceNavigation';
import { useRestaurantSelection } from '@/app/firebase/RestaurantSelectionContext';

export default function Commande() {
    const { tableId } = useLocalSearchParams();
    const { tablenumber} = useLocalSearchParams();
    const { selectedRestaurant } = useRestaurantSelection();
    const [Idcommande, setIdcommande] = useState<string>("");
    const [plats, setPlats] = useState<PlatQuantite[]>([]);  
    const [commandeExistante, setCommandeExistante] = useState<boolean>(false);
    const [commandesParTable, setCommandesParTable] = useState<CommandeData | null>(null);
    const [listPlats, setListPlats] = useState<Plat[]>([]);
    const [missionPlatsIds, setMissionPlatsIds] = useState<string[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    
// Définition des éléments du menu personnalisé
    const customMenuItems = getPlanDeSalleMenuItems();

// Chargement des polices personnalisées
    const [fontsLoaded] = useFonts({
        'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
    });

// Vérification de la connexion de l'utilisateur
    useEffect(() => {
        const user = auth.currentUser;
        if (user) {
            setCurrentUserId(user.uid);
        } else {
            console.error("Aucun utilisateur connecté");
        }
    }, []);

// Chargement des plats depuis Firebase
    useEffect(() => {
        const fetchPlats = async () => {
            if (!selectedRestaurant) {
                console.warn('Aucun restaurant sélectionné pour charger les plats');
                return;
            }
            
            try {
                const platsData = await get_plats(true, selectedRestaurant.id);
                setListPlats(platsData);
            } catch (error) {
                console.error('Erreur lors du chargement des plats:', error);
                Alert.alert('Erreur', 'Impossible de charger le menu');
            }
        };
        fetchPlats();
    }, [selectedRestaurant]);

// Chargement des plats avec missions pour l'utilisateur actuel
    useEffect(() => {
        const fetchMissionPlats = async () => {
            if (!currentUserId || !selectedRestaurant) return;
            
            try {
                const platIds = await getMissionPlatsForUser(currentUserId, selectedRestaurant.id);
                console.log("Plats avec missions:", platIds); // Ajout de log pour déboguer
                setMissionPlatsIds(platIds);
            } catch (error) {
                console.error("Erreur lors du chargement des plats avec mission:", error);
            }
        };
        
        fetchMissionPlats();
    }, [currentUserId, selectedRestaurant]);

// Chargement de la commande existante pour la table
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

    // Marquer les plats avec missions - Logique améliorée
    useEffect(() => {
        if (listPlats.length > 0) {
            console.log("Liste des plats avant mise à jour:", listPlats.map(p => p.id));
            console.log("Liste des IDs des plats avec mission:", missionPlatsIds);
            const updatedPlats = listPlats.map(plat => {
                const hasMission = plat.id ? missionPlatsIds.includes(plat.id) : false;
                console.log(`Plat ${plat.name} (${plat.id}) a une mission: ${hasMission}`);
                return {
                    ...plat,
                    mission: hasMission
                };
            });
            setListPlats(updatedPlats);
        }
    }, [missionPlatsIds, listPlats]); 

    if (!fontsLoaded) {
        return null;
    }

// Fonction pour ajouter un plat à la commande
    const ajouterPlat = (plat: Plat) => {
        setPlats(prevPlats => {
            const platIndex = prevPlats.findIndex(p => p.plat.id === plat.id);
            if (platIndex >= 0) {
                const updatedPlats = [...prevPlats];
                updatedPlats[platIndex].quantite += 1;
                return updatedPlats;
            }
            return [...prevPlats, { plat, quantite: 1, status: "en_attente", tableId: Number(tableId) }];
        });
        
        setCommandesParTable((prevCommande) => {
            // Si aucune commande n'existe, en créer une nouvelle
            if (!prevCommande) {
                const newCommande: CommandeData = {
                    id: Date.now().toString(),
                    employeeId: "default",
                    plats: [{ plat, quantite: 1, status: "en_attente", tableId: Number(tableId) }],
                    totalPrice: plat.price,
                    status: "en_attente",
                    timestamp: new Date(),
                    tableId: Number(tableId)
                };
                setIdcommande(newCommande.id);
                return newCommande;
            }
            
            // Si une commande existe
            const commande = { ...prevCommande };
            const platIndex = commande.plats.findIndex(p => p.plat.id === plat.id);

            if (platIndex >= 0) {
                const updatedCommande = { ...commande };
                updatedCommande.plats[platIndex].quantite += 1;
                updatedCommande.totalPrice = commande.plats.reduce((total, p) => total + p.plat.price * p.quantite, 0);
                return updatedCommande;
            }
            
            const updatedCommande = { ...commande };
            updatedCommande.plats = [...commande.plats, { plat, quantite: 1, status: "en_attente", tableId: Number(tableId) }];
            updatedCommande.totalPrice = updatedCommande.plats.reduce((total, p) => total + p.plat.price * p.quantite, 0);
            return updatedCommande;
        });
    }

// Fonction pour supprimer un plat de la commande
    const supprimerPlat = (plat: Plat) => {
        setPlats(prevPlats => {
            const platIndex = prevPlats.findIndex(p => p.plat.id === plat.id);
            if (platIndex < 0) return prevPlats;
            
            const updatedPlats = [...prevPlats];
            
            // Si la quantité est déjà à 1, supprimez le plat directement
            if (updatedPlats[platIndex].quantite === 1) {
                return updatedPlats.filter(p => p.plat.id !== plat.id);
            }
            
            // Sinon, réduisez la quantité
            updatedPlats[platIndex].quantite -= 1;
            return updatedPlats;
        });
        
        setCommandesParTable(prevCommandes => {
            if (!prevCommandes || !prevCommandes.plats) return prevCommandes;
            
            const commande = { ...prevCommandes };
            const platIndex = commande.plats.findIndex(p => p.plat.id === plat.id);
            
            if (platIndex < 0) {
                return prevCommandes;
            }
            
            const updatedCommande = { ...commande };
            updatedCommande.plats = [...commande.plats];
            
            // Si la quantité est déjà à 1, supprimez le plat directement
            if (updatedCommande.plats[platIndex].quantite === 1) {
                updatedCommande.plats = updatedCommande.plats.filter(p => p.plat.id !== plat.id);
            } else {
                // Sinon, réduisez la quantité
                updatedCommande.plats[platIndex].quantite -= 1;
            }
            
            updatedCommande.totalPrice = updatedCommande.plats.reduce((total, p) => total + p.plat.price * p.quantite, 0);
            return updatedCommande;
        });
    }

// Fonction pour valider la commande
    const validerCommande = async (commandesParTable: CommandeData) => {
        if (!commandesParTable || !commandesParTable.plats || commandesParTable.plats.length === 0) {
            alert('Veuillez ajouter des plats à la commande');
            return;
        }

        if (!selectedRestaurant) {
            Alert.alert('Erreur', 'Aucun restaurant sélectionné');
            return;
        }
        
        try {
            if (commandeExistante) {
                await updateCommande(Idcommande, commandesParTable, selectedRestaurant.id);
            } else {
                // ✅ CORRECTION: Capturer l'ID Firebase réel et mettre à jour l'état local
                // Exclure l'ID temporaire avant d'envoyer à Firebase
                const { id, ...commandeDataSansId } = commandesParTable;
                const firebaseCommandeId = await createCommande(commandeDataSansId, selectedRestaurant.id);
                console.log(`🔄 [SYNC] ID local remplacé: ${Idcommande} → ${firebaseCommandeId}`);
                setIdcommande(firebaseCommandeId);
                setCommandeExistante(true);
                
                // Mettre à jour l'ID dans l'objet commande local aussi
                setCommandesParTable(prev => prev ? { ...prev, id: firebaseCommandeId } : null);
            }
            alert('Commande envoyée');
            router.replace("../(tabs)/plan_de_salle");
        } catch (error) {
            console.error("Erreur lors de la validation de la commande:", error);
            alert('Erreur lors de l\'envoi de la commande');
        }
    }

// Affichage du composant principal
    return (
        <SafeAreaView style={styles.container}>
            <Reglage position={{ top: 0, right: 15 }} menuItems={customMenuItems} />
            
            <View style={styles.headerSquare}>
                <Text style={styles.headerSquareText}> Table {tablenumber}</Text>
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
                        style={[
                            styles.buttonEncaissement,
                            (!commandesParTable || !commandesParTable.plats || commandesParTable.plats.length === 0) ? 
                            { opacity: 0.5 } : {}
                        ]}
                        onPress={() => commandesParTable && validerCommande(commandesParTable)}>
                        <Text style={styles.buttonText}>Envoyer</Text>
                    </Pressable>
                    <Pressable 
                        style={styles.buttonEnvoyer}
                        onPress={() => router.replace({
                        pathname: "./encaissement",
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
                                {platsInCategory.map((plat) => (
                                    <PlatItem 
                                        key={plat.id}
                                        plat={plat}
                                        onPress={ajouterPlat}
                                    />
                                ))}
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </View>
        </SafeAreaView>
    );
}
// Styles pour le composant Commande
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
        flex: 0.35,
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
        flex: 0.5,  // Modifié de 0.70 à 0.5 pour occuper 50% de l'écran
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
