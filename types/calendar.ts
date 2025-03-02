export interface Event {
  id: string | number;
  title: string;
  date: Date;
  type: 'work' | 'personal';
} 