import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { globalStyles } from '../../styles/globalStyles';

const Cuisine = () => {
  return (
    <ScrollView>
          <View style={styles.header}>
            <Text style={globalStyles.h2}>Commande prète </Text>
          </View>
          <View style={styles.content}>
          </View>

          <View style={styles.header}>
          <Text style={globalStyles.h2}>Commande en cours  </Text>
            </View>
            <View style={styles.content}>
            </View>
          <View style={styles.header}>
          <Text style={globalStyles.h2}>Commande en attente  </Text>
          </View>
          <View style={styles.content}>
          </View>



          
          <View style={styles.footer}>
              <Text style={styles.footerText}>Pied de page</Text>
          </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 60,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8e8',
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  footer: {
    height: 40,
    backgroundColor: '#f8f8f8',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e8e8e8',
  },
  footerText: {
    fontSize: 16,
  },
});

export default Cuisine;
