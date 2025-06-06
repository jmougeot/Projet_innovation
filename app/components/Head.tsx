import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HeadProps {
  title?: string;
}

const Head: React.FC<HeadProps> = ({ title = "Title" }) => {
  return (
    <View style={styles.headerSquare}>
      <Text style={styles.headerSquareText}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    minWidth: 100,
    paddingHorizontal :20,
    height: 35,
    marginBottom: 20,
    borderRadius: 80,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 20,
  },
});

export default Head;