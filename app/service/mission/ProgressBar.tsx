import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProgressBarProps {
  state: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ state }) => {
  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < state) return styles.completed;
    if (stepIndex === state) return styles.current;
    return styles.waiting;
  };

  return (
    <View style={styles.container}>
      <View style={styles.stepsContainer}>
        {[0, 1, 2].map((step) => (
          <View key={step} style={styles.stepWrapper}>
            <View style={[styles.step, getStepStatus(step)]}>
              <Text style={styles.stepText}>{step + 1}</Text>
            </View>
            <Text style={styles.stepTitle}>Étape {step + 1}</Text>
          </View>
        ))}
      </View>
      <View style={styles.progressLine} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    position: 'relative',
  },
  stepsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepWrapper: {
    alignItems: 'center',
  },
  step: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepText: {
    color: 'white',
    fontSize: 16,
  },
  stepTitle: {
    marginTop: 5,
    fontSize: 12,
  },
  waiting: {
    backgroundColor: '#d9d9d9',
  },
  current: {
    backgroundColor: '#1890ff',
  },
  completed: {
    backgroundColor: '#52c41a',
  },
  progressLine: {
    position: 'absolute',
    top: 35,
    left: 50,
    right: 50,
    height: 2,
    backgroundColor: '#d9d9d9',
    zIndex: -1,
  },
});

export default ProgressBar;
