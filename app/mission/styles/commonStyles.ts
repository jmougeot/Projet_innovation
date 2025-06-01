import { StyleSheet } from 'react-native';

/**
 * Styles communs utilisés dans toute l'application mission
 */
export const commonStyles = StyleSheet.create({
  // Containers
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Headers
  headerControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  
  // Buttons
  actionButton: {
    backgroundColor: '#1890ff',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  
  secondaryButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  secondaryButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    gap: 4,
  },
  
  controlButtonActive: {
    backgroundColor: '#ff4d4f',
    borderColor: '#ff4d4f',
  },
  
  controlButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  
  controlButtonTextActive: {
    color: '#fff',
  },
  
  // Text styles
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  
  bodyText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  
  mutedText: {
    fontSize: 14,
    color: '#999',
  },
  
  // Loading states
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  
  // Empty states
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 12,
    marginBottom: 20,
    textAlign: 'center',
  },
  
  // Warning banners
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff2f0',
    borderColor: '#ffccc7',
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 6,
    gap: 8,
  },
  
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#ff4d4f',
    fontWeight: '500',
  },
  
  // List styles
  listContainer: {
    padding: 16,
  },
  
  // Filtres
  filterContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },

  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  pickerContainer: {
    flex: 1,
    marginHorizontal: 4,
  },

  pickerLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 4,
  },

  picker: {
    backgroundColor: '#f9f9f9',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
  },

  clearFiltersButton: {
    backgroundColor: '#ff4757',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    alignSelf: 'center',
    marginTop: 12,
  },

  clearFiltersText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  // Recherche
  searchContainer: {
    backgroundColor: '#fff',
    padding: 16,
    margin: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingHorizontal: 12,
    minHeight: 44,
  },

  searchInputFocused: {
    borderColor: '#1890ff',
    backgroundColor: '#fff',
  },
  
  searchIcon: {
    marginRight: 8,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 8,
  },
  
  clearSearchButton: {
    padding: 4,
    marginLeft: 8,
  },
  
  searchResultsText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },

  // Formulaires
  formContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },

  formContent: {
    padding: 16,
  },

  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 24,
    textAlign: 'center',
  },

  inputGroup: {
    marginBottom: 16,
  },

  label: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },

  inputError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },

  textArea: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
  },

  errorText: {
    color: '#ff4757',
    fontSize: 14,
    marginTop: 4,
  },

  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  dateButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },

  dateButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },

  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    backgroundColor: '#1890ff',
  },

  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },
  
  // Shadow
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});

// Modal styles for dialogs and overlays
export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },

  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxWidth: 400,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },

  content: {
    marginBottom: 24,
  },

  message: {
    fontSize: 16,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },

  missionInfo: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },

  missionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },

  missionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },

  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B6B',
  },

  warningText: {
    fontSize: 14,
    color: '#856404',
    marginLeft: 8,
    flex: 1,
    lineHeight: 18,
  },

  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },

  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },

  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },

  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '500',
  },

  confirmButton: {
    backgroundColor: '#FF6B6B',
  },

  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default commonStyles;
