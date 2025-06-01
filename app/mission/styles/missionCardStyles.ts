import { StyleSheet } from 'react-native';

/**
 * Styles spécifiques aux cartes de mission
 */
export const missionCardStyles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
    marginRight: 8,
  },
  
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  
  detailsContainer: {
    marginBottom: 16,
  },
  
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  
  actionsContainer: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  
  assignButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    flex: 1,
    alignItems: 'center',
  },
  
  assignButtonFull: {
    flex: 1,
  },
  
  assignButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  
  deleteButton: {
    backgroundColor: '#ff4d4f',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 6,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  deleteButtonLoading: {
    opacity: 0.7,
  },
  
  pointsBadge: {
    backgroundColor: '#fff7e6',
    borderColor: '#ffd666',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  pointsText: {
    fontSize: 12,
    color: '#d48806',
    fontWeight: '600',
  },
  
  frequencyBadge: {
    backgroundColor: '#f6ffed',
    borderColor: '#b7eb8f',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  
  frequencyText: {
    fontSize: 12,
    color: '#52c41a',
    fontWeight: '500',
  },
});

export default missionCardStyles;
