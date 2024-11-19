import React, { useRef, useState } from 'react';
import { 
  View, 
  Animated, 
  PanResponder,
  StyleSheet 
} from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';

export default function ChangePlan() {
  const pan = useRef(new Animated.ValueXY()).current;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const savePosition = (dx: number, dy: number) => {
    const newPosition = {
      x: position.x + dx,
      y: position.y + dy
    };
    setPosition(newPosition);
    pan.setValue({ x: 0, y: 0 }); // Réinitialiser les valeurs d'animation
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event(
        [
          null,
          { dx: pan.x, dy: pan.y }
        ],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e, gestureState) => {
        savePosition(gestureState.dx, gestureState.dy);
      }
    })
  ).current;

  return (
    <ScrollView>
      <Animated.View
        style={[
          styles.square,
          {
            transform: [
              { translateX: Animated.add(pan.x, new Animated.Value(position.x)) },
              { translateY: Animated.add(pan.y, new Animated.Value(position.y)) },
            ]
          }
        ]}
        {...panResponder.panHandlers}
        
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  square: {
    width: 100,
    height: 100,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  }
});