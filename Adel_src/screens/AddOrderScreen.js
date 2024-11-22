import React, { useState, useEffect } from "react";
import { View, Text, Button, FlatList, TouchableOpacity } from "react-native-web";
import { addOrder, getMenuItems } from "../firebase/firebaseDatabase";  // Import des fonctions Firebase
import { auth } from "../firebase/firebaseConfig";  // Import de l'authentification Firebase

const AddOrderScreen = () => {
  const [menu, setMenu] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [totalPrice, setTotalPrice] = useState(0);

  // Charger le menu depuis Firestore
  useEffect(() => {
    const fetchMenu = async () => {
      const menuItems = await getMenuItems();
      setMenu(menuItems);
    };

    fetchMenu();
  }, []);

  // Ajouter un plat à la commande
  const addToOrder = (item) => {
    setSelectedItems([...selectedItems, item]);
    setTotalPrice((prev) => prev + item.price);
  };

  // Soumettre la commande
  const handleSubmitOrder = async () => {
    if (selectedItems.length === 0) {
      alert("Veuillez sélectionner au moins un plat.");
      return;
    }

    try {
      await addOrder(
        auth.currentUser.uid, // Utilisation de l'ID de l'utilisateur connecté
        selectedItems.map((item) => item.name),  // Récupérer les noms des plats sélectionnés
        totalPrice  // Prix total de la commande
      );
      alert("Commande ajoutée avec succès !");
      setSelectedItems([]);  // Réinitialiser les éléments sélectionnés
      setTotalPrice(0);      // Réinitialiser le prix total
    } catch (error) {
      console.error("Erreur lors de l'ajout de la commande :", error);
    }
  };

  return (
    <View>
      <Text>Ajouter une commande</Text>

      {/* Liste des plats */}
      <Text>Plats :</Text>
      <FlatList
        data={menu.filter((item) => item.category === "plat")}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => addToOrder(item)}>
            <Text>{item.name} - {item.price} €</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />

      {/* Liste des desserts */}
      <Text>Desserts :</Text>
      <FlatList
        data={menu.filter((item) => item.category === "dessert")}
        renderItem={({ item }) => (
          <TouchableOpacity onPress={() => addToOrder(item)}>
            <Text>{item.name} - {item.price} €</Text>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
      />

      <Text>Prix total : {totalPrice} €</Text>
      <Button title="Envoyer la commande" onPress={handleSubmitOrder} />
    </View>
  );
};

export default AddOrderScreen;
