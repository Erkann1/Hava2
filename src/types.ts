export interface AlarmSetting {
  id: string;
  time: string; // "HH:MM" format
  days: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  enabled: boolean;
  label: string;
  locationMode: 'current' | 'custom';
  customCity?: string;
  lat?: number;
  lon?: number;
  personality: 'standard' | 'poetic' | 'humorous' | 'energetic' | 'futuristic';
  voiceRate: number; // 0.8 to 1.5
  voicePitch: number; // 0.5 to 1.5
}

export interface WeatherData {
  city: string;
  temp: number;
  condition: string;
  conditionCode: number;
  humidity: number;
  windSpeed: number;
  tempMin: number;
  tempMax: number;
}

export interface AlarmLog {
  id: string;
  timestamp: string;
  alarmLabel: string;
  weatherSummary: string;
  spokenText: string;
}
