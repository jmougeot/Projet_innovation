import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ConsignePage() {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <View style={styles.content}>
                    <Text style={styles.title}>Consignes de cuisine</Text>
                    
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Hygiène</Text>
                        <Text style={styles.text}>
                            • Se laver les mains régulièrement{'\n'}
                            • Porter une toque ou un filet à cheveux{'\n'}
                            • Maintenir le plan de travail propre{'\n'}
                            • Utiliser des ustensiles propres
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Sécurité</Text>
                        <Text style={styles.text}>
                            • Vérifier les températures de cuisson{'\n'}
                            • Manipuler les couteaux avec précaution{'\n'}
                            • Porter des gants pour les plats chauds{'\n'}
                            • Signaler tout incident
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Organisation</Text>
                        <Text style={styles.text}>
                            • Suivre l'ordre des commandes{'\n'}
                            • Respecter les temps de préparation{'\n'}
                            • Communiquer avec l'équipe{'\n'}
                            • Maintenir le stock à jour
                        </Text>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    section: {
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#2E7D32',
    },
    text: {
        fontSize: 16,
        lineHeight: 24,
        color: '#333',
    },
});