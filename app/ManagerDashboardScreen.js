import React, { useEffect, useState } from "react";
import { View, Text, Button, TextInput, FlatList, TouchableOpacity } from "react-native-web";
import { calculateRevenue, addMenuItem, getMenuItems } from "./firebase/firebaseDatabase";  // Import des fonctions Firebase

const ManagerDashboardScreen = () => {
  const [revenue, setRevenue] = useState(0);  // État pour stocker le chiffre d'affaires total
  const [menu, setMenu] = useState([]);       // État pour stocker les articles du menu
  const [newItem, setNewItem] = useState({ name: "", category: "", price: "" });  // État pour stocker les nouveaux détails d'article

  // Charger les données nécessaires (chiffre d'affaires et menu)
  useEffect(() => {
    const fetchData = async () => {
      const totalRevenue = await calculateRevenue();  // Calculer le chiffre d'affaires
      setRevenue(totalRevenue);

      const menuItems = await getMenuItems();  // Récupérer les articles du menu
      setMenu(menuItems);
    };

    fetchData();
  }, []);

  // Ajouter un nouvel article au menu
  const handleAddMenuItem = async () => {
    if (!newItem.name || !newItem.category || !newItem.price) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    try {
      await addMenuItem(newItem.name, newItem.category, parseFloat(newItem.price));  // Ajouter l'article au menu en utilisant Firebase
      setNewItem({ name: "", category: "", price: "" });  // Réinitialiser les champs du nouvel article
      alert("Article ajouté au menu !");
    } catch (error) {
      console.error("Erreur lors de l'ajout de l'article :", error);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>Tableau de bord du gérant</Text>
      <Text style={{ fontSize: 18, marginBottom: 20 }}>Chiffre d'affaires total : {revenue} €</Text>

      {/* Formulaire pour ajouter un nouvel article au menu */}
      <Text style={{ fontSize: 16, marginBottom: 10 }}>Ajouter un nouvel article au menu :</Text>
      <TextInput
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
        placeholder="Nom de l'article"
        value={newItem.name}
        onChangeText={(text) => setNewItem({ ...newItem, name: text })}
      />
      <TextInput
        style={{ borderWidth: 1, marginBottom: 10, padding: 8 }}
        placeholder="Catégorie (plat ou dessert)"
        value={newItem.category}
        onChangeText={(text) => setNewItem({ ...newItem, category: text })}
      />
      <TextInput
        style={{ borderWidth: 1, marginBottom: 20, padding: 8 }}
        placeholder="Prix (€)"
        value={newItem.price}
        onChangeText={(text) => setNewItem({ ...newItem, price: text })}
        keyboardType="numeric"
      />
      <Button title="Ajouter au menu" onPress={handleAddMenuItem} />

      {/* Liste des articles du menu */}
      <Text style={{ fontSize: 16, marginTop: 20 }}>Menu actuel :</Text>
      <FlatList
        data={menu}
        renderItem={({ item }) => (
          <TouchableOpacity style={{ padding: 10, borderBottomWidth: 1 }}>
            <Text>{item.name} - {item.category} - {item.price} €</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}  // Utilisation de l'ID pour la clé d'extraction
      />
    </View>
  );
};

export default ManagerDashboardScreen;