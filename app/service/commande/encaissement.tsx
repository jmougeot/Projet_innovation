import React, { useState, useEffect } from 'react';
import { View, SafeAreaView, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {CommandeData, PlatQuantite, getCommandeByTableId, terminerCommande, diagnosticCommandesByTable} from '@/app/firebase/firebaseCommandeOptimized';
import {distributeAmount} from '@/app/manageur/comptabilité/CAService';
import { auth } from '@/app/firebase/firebaseConfig';
import { updateMissionsProgressFromDishes } from '@/app/firebase/firebaseMissionOptimized';
import Head from '@/app/components/Head';

function Encaissement() {
    const { tableId } = useLocalSearchParams();
    const [idCommande, setIdCommande] = useState<string>("");
    const [plats, setPlats] = useState<PlatQuantite[]>([]);  
    const [commandesParTable, setCommandesParTable] = useState<CommandeData | null>(null);
    const [platsSelectionnes, setPlatsSelectionnes] = useState<PlatQuantite[]>([]);
    const [platsEncaisses, setPlatsEncaisses] = useState<PlatQuantite[]>([]);
    const [totalSelectionnes, setTotalSelectionnes] = useState<number>(0);
    const [totalEncaisses, setTotalEncaisses] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'carte' | 'especes' | 'cheque'>('carte');
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);

    useEffect(() => {
        const user = auth.currentUser;
        
        if (user) {
            setCurrentUserId(user.uid);
            console.log("Utilisateur connecté:", user.uid);
        } else {
            console.log("Aucun utilisateur connecté");
        }
    }, []);

    // Fetch commande by tableId when component mounts or tableId changes
    useEffect(() => {
        const fetchCommande = async () => {
            try {
                console.log(`🔍 [ENCAISSEMENT DEBUG] Recherche commande pour table: ${tableId}`);
                
                // Exécuter le diagnostic pour comprendre ce qui se passe
                await diagnosticCommandesByTable(Number(tableId));
                
                const commande = await getCommandeByTableId(Number(tableId));
                console.log(`🔍 [ENCAISSEMENT DEBUG] Commande trouvée:`, commande);
                
                if (commande) {
                    setCommandesParTable(commande);
                    setPlats(commande.plats);
                    setIdCommande(commande.id);
                    console.log(`✅ [ENCAISSEMENT DEBUG] ID commande défini: ${commande.id}`);
                } else {
                    console.log(`❌ [ENCAISSEMENT DEBUG] Aucune commande trouvée pour la table ${tableId}`);
                    alert(`Aucune commande active trouvée pour la table ${tableId}. Vérifiez qu'une commande a été créée pour cette table.`);
                }
            } catch (error) {
                console.error("💰 [ENCAISSEMENT ERROR] Erreur lors du chargement de la commande:", error);
                alert("Erreur lors du chargement de la commande");
            }
        };
        
        if (tableId) {
            fetchCommande();
        }
    }, [tableId]);

    // Update totals when platsSelectionnes changes
    useEffect(() => {
        const total = platsSelectionnes.reduce(
            (sum, item) => sum + (item.plat.price * item.quantite), 
            0
        );
        setTotalSelectionnes(total);
    }, [platsSelectionnes]);

    // Update totals when platsEncaisses changes
    useEffect(() => {
        const total = platsEncaisses.reduce(
            (sum, item) => sum + (item.plat.price * item.quantite), 
            0
        );
        setTotalEncaisses(total);
    }, [platsEncaisses]);

    const selectionnerPlat = (plat: PlatQuantite) => {
        // Retirer le plat des plats à encaisser
        setPlats(prevPlats => {
            return prevPlats.filter(p => p.plat.id !== plat.plat.id);
        });

        // Ajouter le plat aux plats sélectionnés
        setPlatsSelectionnes(prev => {
            const existingPlat = prev.find(p => p.plat.id === plat.plat.id);
            if (existingPlat) {
                return prev.map(p => 
                    p.plat.id === plat.plat.id 
                    ? { ...p, quantite: p.quantite + plat.quantite }
                    : p
                );
            }
            return [...prev, { ...plat, status: 'servi' }];
        });
    };

    const encaisserPlat = (plat: PlatQuantite) => {
        // Retirer le plat des plats sélectionnés
        setPlatsSelectionnes(prev => 
            prev.filter(p => p.plat.id !== plat.plat.id)
        );

        // Ajouter le plat aux plats encaissés
        setPlatsEncaisses(prev => {
            const existingPlat = prev.find(p => p.plat.id === plat.plat.id);
            if (existingPlat) {
                return prev.map(p => 
                    p.plat.id === plat.plat.id 
                    ? { ...p, quantite: p.quantite + plat.quantite }
                    : p
                );
            }
            return [...prev, { ...plat, status: 'servi' }];
        });
    };

    // Fonction pour finaliser l'encaissement
    const finaliserEncaissement = async () => {
        if (plats.length > 0) {
            alert('Veuillez encaisser tous les plats avant de finaliser');
            return;
        }
    
        try {
            if (!currentUserId) {
                alert('Erreur: Utilisateur non connecté');
                return;
            }
            
            const montantTotal = commandesParTable ? commandesParTable.totalPrice : 0;
            
            if (montantTotal > 0) {
                await distributeAmount(currentUserId, montantTotal);
                console.log(`Montant de ${montantTotal}€ ajouté au CA de l'employé ${currentUserId} et du restaurant`);
            }
            
            // Mettre à jour la progression des missions basée sur les plats encaissés
            let missionMessage = '';
            if (commandesParTable && commandesParTable.plats.length > 0) {
                try {
                    console.log(`💰 [ENCAISSEMENT DEBUG] Début mise à jour missions pour userId: ${currentUserId}`);
                    console.log(`💰 [ENCAISSEMENT DEBUG] Plats à traiter:`, commandesParTable.plats.map(p => ({ name: p.plat.name, id: p.plat.id, quantite: p.quantite })));
                    
                    const missionUpdateResult = await updateMissionsProgressFromDishes(currentUserId, commandesParTable.plats);
                    
                    console.log(`💰 [ENCAISSEMENT DEBUG] Résultat mise à jour missions:`, missionUpdateResult);
                    
                    // Préparer un message informatif si des missions ont été mises à jour
                    if (missionUpdateResult.updatedMissions > 0) {
                        missionMessage = `\n🎯 ${missionUpdateResult.updatedMissions} mission(s) mise(s) à jour !`;
                        if (missionUpdateResult.completedMissions && missionUpdateResult.completedMissions > 0) {
                            missionMessage += `\n🏆 ${missionUpdateResult.completedMissions} mission(s) complétée(s) !`;
                        }
                        if (missionUpdateResult.totalPointsAwarded && missionUpdateResult.totalPointsAwarded > 0) {
                            missionMessage += `\n⭐ ${missionUpdateResult.totalPointsAwarded} points gagnés !`;
                        }
                    } else if (missionUpdateResult.processedDishes > 0) {
                        missionMessage = `\n📝 ${missionUpdateResult.processedDishes} plat(s) traité(s), aucune mission correspondante trouvée.`;
                    }
                } catch (missionError) {
                    console.error("💰 [ENCAISSEMENT ERROR] Erreur lors de la mise à jour des missions:", missionError);
                    missionMessage = `\n⚠️ Erreur lors de la mise à jour des missions, mais l'encaissement a réussi.`;
                    // Ne pas bloquer l'encaissement si les missions échouent
                    console.warn("L'encaissement continue malgré l'erreur des missions");
                }
            }
            
            // Replace ID usage with fresh lookup if needed
            // Ensure we have the correct Firebase ID for the command
            let commandeIdToUse = idCommande;
            if (!commandeIdToUse) {
                const fetchedCommande = await getCommandeByTableId(Number(tableId));
                if (!fetchedCommande) {
                    alert('Erreur: Aucune commande active trouvée pour cette table.');
                    return;
                }
                commandeIdToUse = fetchedCommande.id;
                setIdCommande(commandeIdToUse);
            }
             
            console.log(`💰 [ENCAISSEMENT] Finalisation commande ID: ${commandeIdToUse} pour table ${tableId}`);
            await terminerCommande(commandeIdToUse);
            
            // Afficher le message de succès avec les informations sur les missions
            alert(`Encaissement réussi !${missionMessage}`);
            router.replace('../(tabs)/plan_de_salle');
        } catch (error) {
            console.error("Erreur lors de l'encaissement:", error);
            alert(`Erreur lors de l'encaissement: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
        }
    };

    const renderPaymentMethodButton = (
        method: 'carte' | 'especes' | 'cheque', 
        icon: keyof typeof MaterialIcons.glyphMap, 
        label: string
    ) => (
        <Pressable
            style={[
                styles.paymentMethodButton,
                paymentMethod === method ? styles.activePaymentMethod : {}
            ]}
            onPress={() => setPaymentMethod(method)}
        >
            <MaterialIcons name={icon} size={24} color={paymentMethod === method ? "#083F8C" : "#999"} />
            <Text style={[
                styles.paymentMethodText,
                paymentMethod === method ? styles.activePaymentMethodText : {}
            ]}>{label}</Text>
        </Pressable>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Head title={'Encaissement Table'} />
            
            <View style={styles.paymentMethodsContainer}>
                {renderPaymentMethodButton('carte', 'credit-card', 'Carte')}
                {renderPaymentMethodButton('especes', 'attach-money', 'Espèces')}
                {renderPaymentMethodButton('cheque', 'receipt', 'Chèque')}
            </View>

            <View style={styles.sectionsContainer}>
                {/* Section 1: Plats à encaisser */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Plats à encaisser</Text>
                    </View>
                    <ScrollView style={styles.scrollView}>
                        {plats.length > 0 ? (
                            plats.map((plat, index) => (
                                <Pressable 
                                    key={index} 
                                    style={styles.platItem}
                                    onPress={() => selectionnerPlat(plat)}
                                >
                                    <View style={styles.platInfo}>
                                        <Text style={styles.nomPlat}>{plat.plat.name}</Text>
                                    </View>
                                    <View style={styles.quantiteContainer}>
                                        <Text style={styles.quantiteText}>× {plat.quantite}</Text>
                                    </View>
                                    <Text style={styles.prixPlat}>{plat.plat.price * plat.quantite} €</Text>
                                </Pressable>
                            ))
                        ) : (
                            <View style={styles.emptyStateContainer}>
                                <MaterialIcons name="check-circle" size={32} color="#4CAF50" />
                                <Text style={styles.emptyStateText}>Tous les plats sont sélectionnés</Text>
                            </View>
                        )}
                    </ScrollView>
                    {commandesParTable && commandesParTable.totalPrice > 0 && (
                        <View style={styles.totalSection}>
                            <Text style={styles.totalText}>Total: {commandesParTable.totalPrice - totalSelectionnes - totalEncaisses} €</Text>
                        </View>
                    )}
                </View>

                {/* Section 2: Plats sélectionnés */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Plats sélectionnés pour paiement</Text>
                    </View>
                    <ScrollView style={styles.scrollView}>
                        {platsSelectionnes.length > 0 ? (
                            platsSelectionnes.map((plat, index) => (
                                <Pressable 
                                    key={index} 
                                    style={styles.platItem}
                                    onPress={() => encaisserPlat(plat)}
                                >
                                    <View style={styles.platInfo}>
                                        <Text style={styles.nomPlat}>{plat.plat.name}</Text>
                                    </View>
                                    <View style={styles.quantiteContainer}>
                                        <Text style={styles.quantiteText}>× {plat.quantite}</Text>
                                    </View>
                                    <Text style={styles.prixPlat}>{plat.plat.price * plat.quantite} €</Text>
                                </Pressable>
                            ))
                        ) : (
                            <View style={styles.emptyStateContainer}>
                                <MaterialIcons name="shopping-cart" size={32} color="#999" />
                                <Text style={styles.emptyStateText}>Aucun plat sélectionné</Text>
                            </View>
                        )}
                    </ScrollView>
                    {totalSelectionnes > 0 && (
                        <View style={styles.totalSection}>
                            <Text style={styles.totalText}>Sous-total: {totalSelectionnes} €</Text>
                        </View>
                    )}
                </View>
            </View>

            {/* Bottom section with payment actions */}
            <View style={styles.bottomSection}>
                <View style={styles.encaissementInfo}>
                    <View style={styles.encaissementSummary}>
                        <Text style={styles.encaissementLabel}>Encaissé: </Text>
                        <Text style={styles.encaissementValue}>{totalEncaisses} €</Text>
                    </View>
                    <View style={styles.encaissementSummary}>
                        <Text style={styles.encaissementLabel}>Restant: </Text>
                        <Text style={styles.encaissementValue}>
                            {commandesParTable ? (commandesParTable.totalPrice - totalEncaisses) : 0} €
                        </Text>
                    </View>
                </View>
                
                <Pressable
                    style={[
                        styles.finaliserButton,
                        plats.length > 0 ? styles.finaliserButtonDisabled : {}
                    ]}
                    onPress={finaliserEncaissement}
                    disabled={plats.length > 0}
                >
                    <Text style={styles.finaliserButtonText}>
                        {plats.length > 0 ? 'Encaissez tous les plats' : 'Finaliser l\'encaissement'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 10,
        backgroundColor: '#194A8D',
    },
    paymentMethodsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 15,
    },
    paymentMethodButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#CAE1EF',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 25,
        flex: 0.3,
    },
    activePaymentMethod: {
        backgroundColor: '#EFBC51',
    },
    paymentMethodText: {
        marginLeft: 5,
        color: '#999',
        fontWeight: 'bold',
    },
    activePaymentMethodText: {
        color: '#083F8C',
    },
    sectionsContainer: {
        flex: 1,
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    section: {
        flex: 0.48,
        backgroundColor: '#F3EFEF',
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 10,
    },
    sectionHeader: {
        backgroundColor: '#CAE1EF',
        padding: 10,
        alignItems: 'center',
    },
    sectionTitle: {
        color: '#083F8C',
        fontWeight: 'bold',
        fontSize: 16,
    },
    scrollView: {
        flex: 1,
        padding: 10,
    },
    platItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: 'white',
        marginBottom: 5,
        borderRadius: 8,
    },
    platInfo: {
        flex: 1,
    },

    nomPlat: {
        fontSize: 16,
        fontWeight: '500',
        color: '#083F8C',
    },
    quantiteContainer: {
        backgroundColor: '#EFBC51',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        marginRight: 8,
    },
    quantiteText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#083F8C',
    },
    prixPlat: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#083F8C',
        minWidth: 60,
        textAlign: 'right',
    },
    totalSection: {
        backgroundColor: '#CAE1EF',
        padding: 10,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    totalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#083F8C',
        textAlign: 'right',
    },
    emptyStateContainer: {
        padding: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyStateText: {
        marginTop: 10,
        color: '#999',
        fontSize: 14,
    },
    bottomSection: {
        backgroundColor: '#F3EFEF',
        borderRadius: 20,
        padding: 15,
        marginTop: 10,
    },
    encaissementInfo: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 10,
    },
    encaissementSummary: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    encaissementLabel: {
        fontSize: 16,
        color: '#083F8C',
    },
    encaissementValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#083F8C',
    },
    finaliserButton: {
        backgroundColor: '#EFBC51',
        padding: 15,
        borderRadius: 25,
        alignItems: 'center',
    },
    finaliserButtonDisabled: {
        backgroundColor: '#CAE1EF',
    },
    finaliserButtonText: {
        color: '#083F8C',
        fontWeight: 'bold',
        fontSize: 16,
    },
});

export default Encaissement;
