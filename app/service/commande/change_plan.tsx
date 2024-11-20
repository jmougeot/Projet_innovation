import React, { useRef, useState } from 'react';
import { 
  View, 
  Animated, 
  PanResponder,
  StyleSheet,
  Dimensions
} from 'react-native';

export default function ChangePlan() {
  const pan = useRef(new Animated.ValueXY()).current;
  const [position, setPosition] = useState({ x: 0, y: 0 });
  
  const savePosition = (dx: number, dy: number) => {
    const newPosition = {
      x: position.x + dx,
      y: position.y + dy
    };
    setPosition(newPosition);
    pan.setValue({ x: 0, y: 0 });
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
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.draggable,
          {
            transform: [
              { translateX: Animated.add(pan.x, new Animated.Value(position.x)) },
              { translateY: Animated.add(pan.y, new Animated.Value(position.y)) }
            ]
          }
        ]}
        {...panResponder.panHandlers}/>
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
  draggable: {
    width: 100,
    height: 100,
    backgroundColor: '#2196F3',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  }
});