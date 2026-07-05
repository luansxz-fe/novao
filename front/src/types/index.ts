export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  createdAt: string;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  unit: string;
  frequency: string;
  times: string[];
  startDate: string;
  endDate?: string;
  instructions?: string;
  color: string;
  icon: string;
  category: string;
  stock: number;
  stockMax: number;
  reminderEnabled: boolean;
  active: boolean;
  imageUrl?: string;
  notes?: string;
  prescribedBy?: string;
  sideEffects?: string;
  createdAt: string;
}

export interface MedicationLog {
  id: string;
  medicationId: string;
  userId: string;
  scheduledTime: string;
  takenAt?: string;
  status: 'pending' | 'taken' | 'missed' | 'skipped';
  date: string;
  notes?: string;
}

export interface Reminder {
  id: string;
  medicationId: string;
  userId: string;
  time: string;
  enabled: boolean;
  days: number[];
}
