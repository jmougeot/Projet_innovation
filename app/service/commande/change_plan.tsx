import React, { useRef } from 'react';
import { 
  View, 
  Animated, 
  PanResponder,
  StyleSheet 
} from 'react-native';

export default function ChangePlan() {
  const pan = useRef(new Animated.ValueXY()).current;
  
  const savePosition = (dx: number, dy: number) => {
    pan.setValue({ x: dx, y: dy });
    console.log('Position enregistrée:', dx, dy);
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
>      <Animated.View
        style={[
          styles.square,
          {
            transform: [
              { translateX: pan.x },
              { translateY: pan.y },
            ]
          }
        ]}
        {...panResponder.panHandlers}
        
      />
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
  square: {
    width: 100,
    height: 100,
    backgroundColor: '#2196F3',
    borderRadius: 8,
  }
});