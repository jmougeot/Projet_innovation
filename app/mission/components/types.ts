// types.ts

export interface Mission {
    id: number;
    title: string;
    description: string;
    state: 'à faire' | 'en cours' | 'fait'; // Limiter les états aux trois options
    onStateChange: (id: number, newState: string) => void;
    onDelete: (id: number) => void;
  }
  