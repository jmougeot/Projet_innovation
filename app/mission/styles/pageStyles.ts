import { StyleSheet } from 'react-native';

/**
 * Styles spécifiques aux pages
 */
export const pageStyles = StyleSheet.create({
  // Filtres
  filterContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  
  filterButtonSelected: {
    backgroundColor: '#1890ff',
    borderColor: '#1890ff',
  },
  
  filterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  filterButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  
  // Form styles
  formContainer: {
    padding: 16,
  },
  
  formGroup: {
    marginBottom: 20,
  },
  
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  
  formInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  
  formInputFocused: {
    borderColor: '#1890ff',
    shadowColor: '#1890ff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  
  formTextArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  
  formError: {
    fontSize: 14,
    color: '#ff4d4f',
    marginTop: 4,
  },
  
  formHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  
  // Section styles
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  
  sectionContent: {
    marginTop: 8,
  },
  
  // Stats styles
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1890ff',
  },
  
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  
  // Tab styles
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
    padding: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  tab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  
  tabActive: {
    backgroundColor: '#1890ff',
  },
  
  tabText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  tabTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default pageStyles;
