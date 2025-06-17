import { StyleSheet } from 'react-native';

export const baseStyles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: '#194A8D',
  },
  contentContainer: {
    flex: 1,
    backgroundColor: '#F3EFEF',
    borderRadius: 20,
    overflow: 'hidden',
    marginTop: 5,
  },
  legende: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    backgroundColor: '#F3EFEF',
  },
  legendeItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendeCarre: {
    width: 14,
    height: 14,
    marginRight: 6,
    borderRadius: 3,
  },
  legendeText: {
    color: '#083F8C',
    fontSize: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3EFEF',
  },
  loadingText: {
    marginTop: 10,
    color: '#194A8D',
    fontSize: 16,
  },
  editModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#CAE1EF',
    marginHorizontal: 15,
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    elevation: 2,
    boxShadow: '0px 2px 3.84px rgba(0, 0, 0, 0.25)',
  },
  editModeButtonActive: {
    backgroundColor: '#EFBC51',
  },
  editModeText: {
    color: '#194A8D',
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  editModeTextActive: {
    color: '#194A8D',
  },
});

export const tableShapeStyles = StyleSheet.create({
  tableText: {
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    zIndex: 2,
  },
  placesIndicator: {
    position: 'absolute',
    backgroundColor: '#194A8D',
    borderRadius: 8,
    minWidth: 12,
    minHeight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  placesText: {
    color: '#CAE1EF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export const tableModalStyles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#194A8D',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingVertical: 15,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#CAE1EF',
    fontFamily: 'AlexBrush',
  },
  closeButton: {
    padding: 5,
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#194A8D',
    marginBottom: 10,
  },
  shapesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    marginBottom: 15,
  },
  shapeContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  shapeName: {
    fontSize: 12,
    color: '#194A8D',
    textAlign: 'center',
    marginTop: 5,
  },
  selectedShapeName: {
    fontWeight: 'bold',
    color: '#194A8D',
  },
  shapeInfo: {
    backgroundColor: '#F8F9FA',
    padding: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#194A8D',
  },
  shapeDescription: {
    fontSize: 14,
    color: '#194A8D',
    marginBottom: 5,
  },
  shapeCapacity: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  input: {
    borderWidth: 1,
    borderColor: '#CAE1EF',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#194A8D',
    backgroundColor: '#F8F9FA',
  },
  coversContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coversButton: {
    backgroundColor: '#CAE1EF',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  coversInput: {
    borderWidth: 1,
    borderColor: '#CAE1EF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#194A8D',
    backgroundColor: '#F8F9FA',
    marginHorizontal: 15,
    minWidth: 60,
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    paddingTop: 10,
    justifyContent: 'space-between',
  },
  cancelButton: {
    backgroundColor: '#E0E0E0',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginRight: 10,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: '#194A8D',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
    flex: 1,
    marginLeft: 10,
  },
  saveButtonText: {
    color: '#CAE1EF',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

export default {
  baseStyles,
  tableModalStyles,
  tableShapeStyles,
};
