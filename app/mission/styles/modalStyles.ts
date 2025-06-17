import { StyleSheet } from 'react-native';

/**
 * Styles pour les modals et boîtes de dialogue
 */
export const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxWidth: 400,
    width: '100%',
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
    elevation: 8,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  
  modalMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
    lineHeight: 22,
  },
  
  modalWarning: {
    fontSize: 14,
    color: '#ff4d4f',
    fontWeight: '600',
    marginBottom: 12,
  },
  
  warningList: {
    marginBottom: 16,
    paddingLeft: 8,
  },
  
  warningItem: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
    lineHeight: 20,
  },
  
  modalFinalWarning: {
    fontSize: 14,
    color: '#ff4d4f',
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    padding: 8,
    backgroundColor: '#fff2f0',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffccc7',
  },
  
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  
  cancelButton: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  
  confirmButton: {
    backgroundColor: '#1890ff',
  },
  
  dangerButton: {
    backgroundColor: '#ff4d4f',
  },
  
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  
  confirmButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  
  dangerButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
});

export default modalStyles;
