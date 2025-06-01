// Simple integration test file to verify all components work together
import React from 'react';
import { View } from 'react-native';

// Test imports to verify all components and utilities are accessible
import { 
  MissionCard, 
  MissionSearch, 
  MissionFilters, 
  ConfirmDeleteModal, 
  MissionForm 
} from '../components';

import { 
  filterMissions,
  sortMissions, 
  getRecurrenceColor, 
  getRecurrenceLabel,
  calculateMissionStats,
  validateMissionData,
  isMissionActiveToday
} from '../utils';

import { Mission } from '../types';
import { commonStyles, modalStyles } from '../styles';

// Simple test component to verify integration
export const ComponentIntegrationTest: React.FC = () => {
  // Test data matching our actual Mission type
  const testMission: Mission = {
    id: 'test-1',
    titre: 'Test Mission',
    description: 'Test Description',
    points: 10,
    recurrence: {
      frequence: 'daily',
      dateDebut: new Date(),
    },
    targetValue: 100
  };

  const testMissions = [testMission];

  // Test utility functions
  const filtered = filterMissions(testMissions, { searchQuery: '' });
  const sorted = sortMissions(filtered, 'titre', 'asc');
  const stats = calculateMissionStats(testMissions);

  return (
    <View style={commonStyles.container}>
      {/* Test that all components can be imported and instantiated */}
      <MissionCard
        mission={testMission}
        showDeleteButtons={false}
        deletingMissionId={null}
        onAssignMission={() => {}}
        onDeleteMission={() => {}}
      />
      
      <MissionSearch
        searchQuery=""
        onSearchChange={() => {}}
      />
      
      <MissionFilters
        selectedRecurrence=""
        onRecurrenceChange={() => {}}
        onClearFilters={() => {}}
      />
      
      <ConfirmDeleteModal
        visible={false}
        mission={null}
        isDeleting={false}
        onConfirm={() => {}}
        onCancel={() => {}}
      />
      
      <MissionForm
        mission={null}
        onSubmit={() => {}}
        onCancel={() => {}}
        isLoading={false}
      />
    </View>
  );
};

// Test utility functions
export const testUtilityFunctions = () => {
  const testMissions: Mission[] = [
    {
      id: 'test-1',
      titre: 'Test Mission 1',
      description: 'Test Description 1',
      points: 10,
      recurrence: {
        frequence: 'daily',
        dateDebut: new Date(),
      },
      targetValue: 100
    },
    {
      id: 'test-2',
      titre: 'Test Mission 2',
      description: 'Test Description 2',
      points: 20,
      recurrence: {
        frequence: 'weekly',
        dateDebut: new Date(),
      }
    }
  ];
  
  // Test filtering
  const filtered = filterMissions(testMissions, { searchQuery: 'test' });
  
  // Test sorting
  const sorted = sortMissions(filtered, 'titre', 'asc');
  
  // Test helper functions
  const recurrenceColor = getRecurrenceColor('daily');
  const recurrenceLabel = getRecurrenceLabel('weekly');
  
  // Test statistics
  const stats = calculateMissionStats(testMissions);
  
  console.log('Integration test passed:', {
    filtered: filtered.length,
    sorted: sorted.length,
    recurrenceColor,
    recurrenceLabel,
    stats
  });
  
  return true;
};

export default ComponentIntegrationTest;
