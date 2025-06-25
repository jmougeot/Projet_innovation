import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTicketsRealtimeSync, useTicketsCacheStatus } from './hooks';

// ====== INTERFACE PROPS ======

export interface TicketsSyncStatusProps {
  restaurantId: string;
  showDetails?: boolean;
  compact?: boolean;
}

// ====== COMPOSANT DE MONITORING ======

/**
 * 📊 Composant de monitoring du statut de synchronisation des tickets
 */
export const TicketsSyncStatus: React.FC<TicketsSyncStatusProps> = ({
  restaurantId,
  showDetails = false,
  compact = false
}) => {
  const { isActive, error, listenerCount, startSync, stopSync, restart } = useTicketsRealtimeSync(restaurantId);
  const { globalCache, tableCache, refresh, debug } = useTicketsCacheStatus();

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={[styles.statusIndicator, isActive ? styles.statusActive : styles.statusInactive]} />
        <Text style={styles.compactText}>
          Tickets: {isActive ? 'Sync' : 'Off'} • Cache: {globalCache.itemsCount}
        </Text>
        {error && <Text style={styles.errorText}>!</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* En-tête */}
      <View style={styles.header}>
        <Text style={styles.title}>🎫 Synchronisation Tickets</Text>
        <View style={[styles.statusIndicator, isActive ? styles.statusActive : styles.statusInactive]} />
      </View>

      {/* Statut principal */}
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Statut: {isActive ? '✅ Active' : '❌ Inactive'}
        </Text>
        <Text style={styles.statusText}>
          Listeners: {listenerCount}
        </Text>
        <Text style={styles.statusText}>
          Cache: {globalCache.itemsCount} tickets ({globalCache.timeLeftFormatted})
        </Text>
      </View>

      {/* Erreur si présente */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>❌ Erreur: {error}</Text>
        </View>
      )}

      {/* Détails du cache des tables */}
      {showDetails && tableCache.totalTablesCached > 0 && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>📋 Cache Tables ({tableCache.totalTablesCached})</Text>
          {tableCache.tablesInfo.slice(0, 5).map((table) => (
            <Text key={table.tableId} style={styles.detailsText}>
              Table {table.tableId}: {table.hasTicket ? `Ticket ${table.ticketId}` : 'Libre'} ({table.timeLeftFormatted})
            </Text>
          ))}
          {tableCache.totalTablesCached > 5 && (
            <Text style={styles.detailsText}>... et {tableCache.totalTablesCached - 5} autres</Text>
          )}
        </View>
      )}

      {/* Boutons d'action */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity 
          style={[styles.button, isActive ? styles.stopButton : styles.startButton]} 
          onPress={isActive ? stopSync : startSync}
        >
          <Text style={styles.buttonText}>
            {isActive ? '🛑 Arrêter' : '🚀 Démarrer'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={restart}>
          <Text style={styles.buttonText}>🔄 Redémarrer</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={refresh}>
          <Text style={styles.buttonText}>🔄 Actualiser</Text>
        </TouchableOpacity>

        {showDetails && (
          <TouchableOpacity style={styles.button} onPress={debug}>
            <Text style={styles.buttonText}>🐛 Debug</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// ====== STYLES ======

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    margin: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  compactContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    padding: 8,
    margin: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#343a40',
  },
  statusContainer: {
    marginBottom: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusActive: {
    backgroundColor: '#28a745',
  },
  statusInactive: {
    backgroundColor: '#dc3545',
  },
  errorContainer: {
    backgroundColor: '#f8d7da',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  errorText: {
    color: '#721c24',
    fontSize: 12,
  },
  detailsContainer: {
    backgroundColor: '#e7f3ff',
    borderRadius: 4,
    padding: 8,
    marginBottom: 12,
  },
  detailsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0056b3',
    marginBottom: 4,
  },
  detailsText: {
    fontSize: 12,
    color: '#0056b3',
    marginBottom: 2,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  button: {
    backgroundColor: '#007bff',
    borderRadius: 4,
    padding: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  startButton: {
    backgroundColor: '#28a745',
  },
  stopButton: {
    backgroundColor: '#dc3545',
  },
  buttonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  compactText: {
    fontSize: 12,
    color: '#6c757d',
    marginLeft: 8,
  },
});
