import React, { useState } from 'react';
import { View, Text, TextInput, Button, Platform, Alert, StyleSheet } from 'react-native';
import { ajout_plat } from '@/app/firebase/firebaseDatabase.js';

const AjouterPlat: React.FC = () => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');

  const showMessage = (msg: string) => {
    if (Platform.OS === 'web') {
      setMessage(msg); // Affiche le message dans le composant
      setTimeout(() => setMessage(''), 3000); // Efface le message après 3 secondes
    } else {
      Alert.alert('Information', msg);
    }
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called'); // Debug
    
    // Validation
    if (!name || !category || !price) {
      showMessage('Tous les champs sont requis');
      return;
    }

    try {
      console.log('Tentative d\'ajout:', { name, category, price }); // Debug
      await ajout_plat(name, category, parseFloat(price));
      showMessage('Plat ajouté avec succès');
      setName('');
      setCategory('');
      setPrice('');
    } catch (error) {
      console.error('Erreur lors de l\'ajout du plat :', error);
      showMessage('Erreur lors de l\'ajout du plat');
    }
  };

  return (
    <View style={styles.container}>
      {message ? (
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
      <View style={styles.inputContainer}>
        <Text>Nom du plat:</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Entrez le nom"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text>Catégorie:</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Entrez la catégorie"
        />
      </View>
      <View style={styles.inputContainer}>
        <Text>Prix:</Text>
        <TextInput
          style={styles.input}
          value={price}
          onChangeText={setPrice}
          keyboardType="numeric"
          placeholder="Entrez le prix"
        />
      </View>
      <Button 
        title="Ajouter le plat" 
        onPress={() => {
          console.log('Button pressed'); // Debug
          handleSubmit();
        }} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  messageContainer: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  messageText: {
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 5,
    marginTop: 5,
  },
});

export default AjouterPlat;