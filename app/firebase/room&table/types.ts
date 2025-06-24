export interface Table {
  id: number;
  numero: string;
  places: number;
  status: 'libre' | 'occupee' | 'reservee';
  position: { 
    x: number; 
    y: number; 
    shape?: 'round' | 'square' | 'rectangle' | 'oval';
  };
}

export interface Room {
  id?: string;
  name: string;
  description?: string;
}
