
import { StyleSheet, Dimensions,Platform, StatusBar} from 'react-native';

const windowWidth = Dimensions.get('window').width;
const fontSize = Math.min(windowWidth * 0.08, 40); // 10% de la largeur, max 40
const STATUSBAR_HEIGHT = Platform.OS === 'ios' ? 44 : StatusBar.currentHeight || 0;


const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: STATUSBAR_HEIGHT,
    backgroundColor: '#f5f5f5',
  },
  h1: {
    fontSize: fontSize,
    fontWeight: 'bold',
    color: '#1a1a1a', // Couleur plus foncée pour un meilleur contraste
    marginTop: STATUSBAR_HEIGHT + 10,
    marginBottom: fontSize * 0.3, // Espacement proportionnel
    textAlign: 'center',
    paddingHorizontal: 10,
    letterSpacing: 0.5, // Meilleure lisibilité
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  h2: {
    fontSize: 32, // équivalent à 2em
    fontWeight: 'bold',
    color: '#444',
    marginBottom: 8,
  },
  h3: {
    fontSize: 28, // équivalent à 1.75em
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 8,
  },
});

export default globalStyles;