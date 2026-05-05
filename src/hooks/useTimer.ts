import { useState, useEffect, useRef, useCallback } from 'react';
import { TimerMode, TimerSettings, TrainingGoal } from '../types';
import { useSpeech } from './useSpeech';
import confetti from 'canvas-confetti';

export function useTimer(settings: TimerSettings, initialGoals: TrainingGoal[]) {
  const [time, setTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<TimerMode>(TimerMode.FREE);
  const [currentRound, setCurrentRound] = useState(1);
  const [goals, setGoals] = useState<TrainingGoal[]>(initialGoals);
  
  const { speak, isSpeaking } = useSpeech();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use refs to avoid interval restarts
  const settingsRef = useRef(settings);
  const modeRef = useRef(mode);
  const roundRef = useRef(currentRound);

  useEffect(() => {
    settingsRef.current = settings;
    modeRef.current = mode;
    roundRef.current = currentRound;
  }, [settings, mode, currentRound]);

  const reset = useCallback(() => {
    setIsRunning(false);
    setTime(0);
    setTotalTime(0);
    setCurrentRound(1);
    setMode(settings.numRounds > 1 ? TimerMode.WORK : TimerMode.FREE);
    setGoals(prev => prev.map(g => ({ ...g, reached: false })));
    if (timerRef.current) clearInterval(timerRef.current);
  }, [settings.numRounds]);

  const toggle = useCallback(() => {
    setIsRunning(prev => !prev);
  }, []);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatTimeForSpeech = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hrs > 0) parts.push(`${hrs} ${hrs === 1 ? 'hora' : 'horas'}`);
    if (mins > 0) parts.push(`${mins} ${mins === 1 ? 'minuto' : 'minutos'}`);
    if (secs > 0 || seconds === 0) parts.push(`${secs} ${secs === 1 ? 'segundo' : 'segundos'}`);

    if (parts.length === 0) return '0 segundos';
    if (parts.length === 1) return parts[0];
    const last = parts.pop();
    return `${parts.join(', ')} e ${last}`;
  };

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        const s = settingsRef.current;
        
        setTotalTime(prevTotal => {
          const nextTotal = prevTotal + 1;
          
          // Unified Voice Announcement logic
          const isAtMinute = nextTotal % 60 === 0;
          const isAtInterval = s.voiceIntervalSeconds > 0 && nextTotal % s.voiceIntervalSeconds === 0;

          if ((s.voiceAnnounceMinutes && isAtMinute) || isAtInterval) {
            speak(formatTimeForSpeech(nextTotal), s.voiceVolume);
          }

          // Goal Check
          setGoals(currentGoals => {
            let changed = false;
            const updated = currentGoals.map(goal => {
              if (!goal.reached && nextTotal >= goal.timeSeconds) {
                if (s.voiceAnnounceGoals) {
                  speak(`Meta ${goal.label} atingida!`, s.voiceVolume);
                }
                confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
                });
                changed = true;
                return { ...goal, reached: true };
              }
              return goal;
            });
            return changed ? updated : currentGoals;
          });

          return nextTotal;
        });

        setTime(prevTime => {
          const next = prevTime + 1;
          const currentMode = modeRef.current;
          const currentR = roundRef.current;
          
          if (currentMode !== TimerMode.FREE) {
            if (currentMode === TimerMode.WORK && next >= s.roundSeconds) {
              if (s.pauseSeconds > 0) {
                setMode(TimerMode.PAUSE);
                speak('Pausa', s.voiceVolume);
                return 0;
              } else if (currentR < s.numRounds) {
                const nextR = currentR + 1;
                setCurrentRound(nextR);
                if (s.voiceAnnounceRounds) {
                  speak(`Round ${nextR}`, s.voiceVolume);
                }
                return 0;
              } else {
                setIsRunning(false);
                speak('Treino finalizado', s.voiceVolume);
                return next;
              }
            } else if (currentMode === TimerMode.PAUSE && next >= s.pauseSeconds) {
              if (currentR < s.numRounds) {
                const nextR = currentR + 1;
                setCurrentRound(nextR);
                setMode(TimerMode.WORK);
                if (s.voiceAnnounceRounds) {
                  speak(`Round ${nextR}`, s.voiceVolume);
                }
                return 0;
              } else {
                setIsRunning(false);
                speak('Treino finalizado', s.voiceVolume);
                return next;
              }
            }
          }

          return next;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, speak]); // Minimal dependencies to prevent skips

  // Handle settings change - re-initialize mode
  useEffect(() => {
    if (!isRunning && totalTime === 0) {
       setMode(settings.numRounds > 0 ? TimerMode.WORK : TimerMode.FREE);
    }
  }, [settings.numRounds, isRunning, totalTime]);

  return {
    time,
    totalTime,
    isRunning,
    mode,
    currentRound,
    goals,
    toggle,
    reset,
    formatTime,
    setGoals,
    isSpeaking
  };
}
