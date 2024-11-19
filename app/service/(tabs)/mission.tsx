import { View, Text, StyleSheet } from 'react-native';

export default function MissionScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Page de missions</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#336',
  }
})