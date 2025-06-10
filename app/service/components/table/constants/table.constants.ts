import { TableShapeOption } from '../types/table.types';

// Constantes communes
export const TABLE_SIZE = 50;
export const EDIT_TABLE_WIDTH = 80;
export const EDIT_TABLE_HEIGHT = 80;

// Configuration des formes de tables
export const TABLE_SHAPES: TableShapeOption[] = [
  {
    shape: 'round',
    name: 'Ronde',
    icon: 'radio-button-unchecked',
    description: 'Table ronde traditionnelle',
    minCovers: 2,
    maxCovers: 8
  },
  {
    shape: 'square',
    name: 'Carrée',
    icon: 'crop-square',
    description: 'Table carrée 4 places',
    minCovers: 2,
    maxCovers: 4
  },
  {
    shape: 'rectangle',
    name: 'Rectangulaire',
    icon: 'crop-landscape',
    description: 'Table rectangulaire',
    minCovers: 4,
    maxCovers: 12
  },
  {
    shape: 'oval',
    name: 'Ovale',
    icon: 'panorama-horizontal',
    description: 'Table ovale élégante',
    minCovers: 4,
    maxCovers: 10
  }
];
