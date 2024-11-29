import { View, Text, StyleSheet, Image, Pressable } from "react-native";
import { Link } from "expo-router";

export default function Index() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Le Challenge</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Link href="./service/plan_de_salle" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Plan de Salle</Text>
          </Pressable>
        </Link>

        <Link href="./service/commande/change_plan" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Modifier le Plan</Text>
          </Pressable>
        </Link>

        <Link href="./cuisine/cuisine" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Cuisine</Text>
          </Pressable>
        </Link>

        <Link href="./connexion" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}>Login</Text>
          </Pressable>
        </Link>

        <Link href="./manageur/gestion_menu/gestion_menu" asChild>
          <Pressable style={styles.button}>
            <Text style={styles.buttonText}> Gestion du menu</Text>
          </Pressable>
        </Link>
        
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
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  buttonContainer: {
    width: '80%',
    gap: 20,
  },
  button: {
    backgroundColor: '#2196F3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
