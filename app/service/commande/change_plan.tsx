import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text,
  Animated, 
  PanResponder,
  StyleSheet,
  Platform
} from 'react-native';
import { useFonts } from 'expo-font';

// Mock data for tables - in a real app this would come from your database
const tables = Array.from({ length: 15 }, (_, i) => ({
  id: i + 1,
  x: Math.random() * 200,
  y: Math.random() * 200,
  status: Math.random() > 0.5 ? 'occupied' : 'available'
}));

export default function ChangePlan() {
  const [tablePositions, setTablePositions] = useState(tables);
  
  const [fontsLoaded] = useFonts({
    'AlexBrush': require('../../../assets/fonts/AlexBrush-Regular.ttf'),
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerSquare}>
        <Text style={styles.headerSquareText}>Gestion des Tables</Text>
      </View>
      
      <View style={styles.contentContainer}>
        <View style={styles.floorPlanContainer}>
          {tablePositions.map((table) => {
            const pan = useRef(new Animated.ValueXY()).current;
            
            const panResponder = PanResponder.create({
              onStartShouldSetPanResponder: () => true,
              onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false }
              ),
              onPanResponderRelease: (e, gestureState) => {
                // Update the table position when dragging ends
                setTablePositions(prevPositions => 
                  prevPositions.map(t => 
                    t.id === table.id 
                      ? { ...t, x: t.x + gestureState.dx, y: t.y + gestureState.dy }
                      : t
                  )
                );
                
                // Reset the animated value
                pan.setValue({ x: 0, y: 0 });
              }
            });
            
            return (
              <Animated.View
                key={table.id}
                style={[
                  styles.tableItem,
                  { 
                    backgroundColor: table.status === 'occupied' ? '#EFBC51' : '#CAE1EF',
                    transform: [
                      { translateX: Animated.add(pan.x, new Animated.Value(table.x)) },
                      { translateY: Animated.add(pan.y, new Animated.Value(table.y)) }
                    ]
                  }
                ]}
                {...panResponder.panHandlers}
              >
                <Text style={styles.tableNumber}>{table.id}</Text>
              </Animated.View>
            );
          })}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
    backgroundColor: '#194A8D',
  },
  headerSquare: {
    alignSelf: 'center',
    backgroundColor: '#CAE1EF',
    width: 200,
    height: 35,
    marginBottom: 15,
    borderRadius: 80,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        marginTop: 45,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  headerSquareText: {
    color: '#083F8C',
    fontWeight: 'bold',
    fontSize: 18,
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
    padding: 10,
  },
  floorPlanContainer: {
    flex: 1,
    position: 'relative',
  },
  tableItem: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tableNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#083F8C',
  }
});