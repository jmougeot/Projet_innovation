import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, Platform } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import {Plat} from '@/app/firebase/firebaseMenu';
import {CommandeData, PlatQuantite, getCommandeByTableId, CommandeEncaisse} from '@/app/firebase/firebaseCommande';

export default function Encaissement() {
    const { tableId } = useLocalSearchParams();
    const [idCommande, setIdCommande] = useState<string>("");
    const [plats, setPlats] = useState<PlatQuantite[]>([]);  
    const [commandesParTable, setCommandesParTable] = useState<CommandeData | null>(null);
    const [platsSelectionnes, setPlatsSelectionnes] = useState<PlatQuantite[]>([]);
    const [platsEncaisses, setPlatsEncaisses] = useState<PlatQuantite[]>([]);
    const [totalSelectionnes, setTotalSelectionnes] = useState<number>(0);
    const [totalEncaisses, setTotalEncaisses] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<'carte' | 'especes' | 'cheque'>('carte');

    useEffect(() => {
        const fetchCommande = async () => {
            try {
                const commande = await getCommandeByTableId(Number(tableId));
                if (commande) {
                    setCommandesParTable(commande);
                    setPlats(commande.plats);
                    setIdCommande(commande.id);
                }
            } catch (error) {
                console.error("Erreur lors du chargement de la commande:", error);
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
            return [...prev, { ...plat, status: 'en attente de paiement' }];
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
            return [...prev, { ...plat, status: 'encaissé' }];
        });
    };

    const finaliserEncaissement = () => {
        if (plats.length > 0) {
            alert('Veuillez encaisser tous les plats avant de finaliser');
            return;
        }
        
        CommandeEncaisse(Number(tableId));
        alert('Encaissement réussi !');
        router.replace('../(tabs)/plan_de_salle');
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
        <View style={styles.container}>
            <View style={styles.headerSquare}>
                <Text style={styles.headerSquareText}>Encaissement Table {tableId}</Text>
            </View>
            
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
        width: 250,
        height: 35,
        marginBottom: 15,
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
