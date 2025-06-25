import { Table as TableType } from '@/app/firebase/room&table/types';
import { MaterialIcons } from '@expo/vector-icons';

// Types de formes de tables disponibles
export type TableShape = 'round' | 'square' | 'rectangle' | 'oval';

// Interface pour les propriétés du TableShapeRenderer
export interface TableShapeRendererProps {
  table: TableType;
  size?: number;
  showText?: boolean;
  textColor?: string;
  backgroundColor?: string;
}

// Interface pour les props du composant modal
export interface TableComponentProps {
  visible: boolean;
  onClose: () => void;
  onSave: (table: Omit<TableType, 'id' | 'status'>) => void;
  initialTable?: Partial<TableType>;
  isEditing?: boolean;
  tableStatus?: TableType['status']; // Nouveau prop pour le statut de la table
}

export interface TableShapeOption {
  shape: TableShape;
  name: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  description: string;
  maxCovers: number;
  minCovers: number;
}

// Interface pour les props du TableShapePreview
export interface TableShapePreviewProps {
  shape: TableShape;
  isSelected: boolean;
  onSelect: () => void;
  option: TableShapeOption;
  tableStatus?: TableType['status'];
}

export default {};
