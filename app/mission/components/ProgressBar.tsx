import React from 'react';
import { Steps } from 'antd';

const { Step } = Steps;

// Définir les types des props pour ProgressBar
interface ProgressBarProps {
  state: number; // L'état actuel, représente l'étape en cours (0, 1, ou 2)
}

const ProgressBar: React.FC<ProgressBarProps> = ({ state }) => {
  // Fonction pour déterminer le statut d'une étape en fonction de l'état actuel
  const getStepStatus = (stepIndex: number): 'wait' | 'process' | 'finish' => {
    if (stepIndex < state) return 'finish'; // Étape "fait"
    if (stepIndex === state) return 'process'; // Étape "en cours"
    return 'wait'; // Étape "à faire"
  };

  return (
    <Steps current={state}>
      <Step title="Étape 1" status={getStepStatus(0)} />
      <Step title="Étape 2" status={getStepStatus(1)} />
      <Step title="Étape 3" status={getStepStatus(2)} />
    </Steps>
  );
};

export default ProgressBar;
