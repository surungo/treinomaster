export enum TimerMode {
  WORK = 'WORK',
  PAUSE = 'PAUSE',
  FREE = 'FREE' // Just counting up without rounds
}

export interface TrainingGoal {
  id: string;
  timeSeconds: number;
  label: string;
  reached: boolean;
}

export interface TimerSettings {
  roundSeconds: number;
  pauseSeconds: number;
  numRounds: number;
  voiceIntervalSeconds: number; // e.g., 15 or 60
  voiceAnnounceGoals: boolean;
  voiceAnnounceMinutes: boolean;
  voiceAnnounceRounds: boolean;
  musicEnabled: boolean;
  musicVolume: number;
  voiceVolume: number;
}
