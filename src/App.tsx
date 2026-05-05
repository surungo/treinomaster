/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Settings as SettingsIcon, 
  Trophy, 
  Plus, 
  Trash2,
  Clock,
  LayoutGrid,
  Volume2,
  VolumeX,
  Target
} from 'lucide-react';
import { useTimer } from './hooks/useTimer';
import { useSpeech } from './hooks/useSpeech';
import { TimerMode, TimerSettings, TrainingGoal } from './types';

const DEFAULT_SETTINGS: TimerSettings = {
  roundSeconds: 60,
  pauseSeconds: 15,
  numRounds: 3,
  voiceIntervalSeconds: 15,
  voiceAnnounceGoals: true,
  voiceAnnounceMinutes: true,
  voiceAnnounceRounds: true,
  musicEnabled: false,
  musicVolume: 0.5,
  voiceVolume: 1.0
};

const DEFAULT_GOALS: TrainingGoal[] = [
  { id: '1', timeSeconds: 60, label: '1 Minuto', reached: false },
  { id: '2', timeSeconds: 300, label: '5 Minutos', reached: false }
];

export default function App() {
  const [settings, setSettings] = useState<TimerSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [newGoalTime, setNewGoalTime] = useState('');
  const [newGoalLabel, setNewGoalLabel] = useState('');
  const { speak } = useSpeech();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
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
  } = useTimer(settings, DEFAULT_GOALS);

  useEffect(() => {
    if (audioRef.current) {
      if (isRunning && settings.musicEnabled) {
        audioRef.current.play().catch(e => console.log("Audio play failed, user interaction needed", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isRunning, settings.musicEnabled]);

  // Audio volume and ducking handling
  useEffect(() => {
    if (audioRef.current) {
      const targetVolume = isSpeaking ? settings.musicVolume * 0.3 : settings.musicVolume;
      audioRef.current.volume = targetVolume;
    }
  }, [isSpeaking, settings.musicVolume]);

  const testVoice = () => {
    speak("Teste de voz do Treino Master ativado.", settings.voiceVolume);
  };

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTime || !newGoalLabel) return;
    const timeInSeconds = parseInt(newGoalTime);
    if (isNaN(timeInSeconds)) return;

    const newGoal: TrainingGoal = {
      id: Date.now().toString(),
      timeSeconds: timeInSeconds,
      label: newGoalLabel,
      reached: false
    };

    setGoals(prev => [...prev, newGoal].sort((a, b) => a.timeSeconds - b.timeSeconds));
    setNewGoalTime('');
    setNewGoalLabel('');
  };

  const removeGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  };

  const currentModeLabel = useMemo(() => {
    switch (mode) {
      case TimerMode.WORK: return `ROUND ${currentRound}`;
      case TimerMode.PAUSE: return 'PAUSA';
      case TimerMode.FREE: return 'CRONÔMETRO';
      default: return '';
    }
  }, [mode, currentRound]);

  return (    <div className="min-h-screen bg-[#050608] text-[#E5E7EB] font-sans selection:bg-emerald-500 selection:text-black flex flex-col items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 pointer-events-none opacity-30 bg-[radial-gradient(circle_at_50%_-20%,#10B98122,transparent_70%)]" />
      <div className="fixed inset-0 bg-emerald-500/5 rounded-full blur-[120px] -z-10 pointer-events-none" />
      
      <div className="w-full max-w-6xl relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Sidebar - Visible on Desktop */}
        <aside className="lg:col-span-3 hidden lg:flex flex-col gap-6 glass rounded-3xl p-6 shadow-2xl">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/40">
                <Clock className="w-5 h-5 text-emerald-500" />
             </div>
             <h1 className="text-xl font-bold tracking-tight">VocalTimer Pro</h1>
          </div>
          
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Rounds</label>
              <div className="grid grid-cols-1 gap-2">
                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center">
                  <span className="text-sm text-zinc-400">Total</span>
                  <span className="text-lg font-semibold">{settings.numRounds}</span>
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <button 
                onClick={() => setShowSettings(true)}
                className="w-full bg-emerald-500 text-black py-3 rounded-2xl font-bold text-xs uppercase tracking-[0.2em] hover:scale-[1.02] transition-transform shadow-lg shadow-emerald-500/20"
              >
                Abrir Configurações
              </button>
            </div>
          </div>

          <div className="mt-auto">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-black">
              <p className="text-xs font-bold uppercase mb-1">Status de Voz</p>
              <p className="text-[10px] font-medium leading-tight opacity-90">Anúncios ativos {settings.voiceIntervalSeconds}s</p>
            </div>
          </div>
        </aside>

        {/* Central Timer Area */}
        <main className="lg:col-span-6 flex flex-col items-center">
          {/* Header Mobile Only */}
          <header className="flex lg:hidden justify-between items-center w-full mb-8 px-2">
            <div className="flex items-center gap-2">
              <Clock className="w-6 h-6 text-emerald-500" />
              <h1 className="text-xl font-bold tracking-tighter uppercase">Treino Master</h1>
            </div>
            <button 
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 glass rounded-full hover:bg-white/10 transition-colors"
            >
              <SettingsIcon className="w-6 h-6" />
            </button>
          </header>

          {/* Status Pills */}
          <div className="flex items-center gap-4 mb-8">
            <div className="px-4 py-2 rounded-full glass border-emerald-500/30 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-emerald-500 ${isRunning ? 'animate-pulse' : ''}`} />
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                {mode === TimerMode.WORK ? `ROUND ${currentRound} / ${settings.numRounds}` : mode}
              </span>
            </div>
          </div>

          {/* Timer Display */}
          <div className="relative aspect-square w-full max-w-[400px] flex flex-col items-center justify-center mb-12">
            {/* Immersive Rings */}
            <div className="absolute inset-0 rounded-full border-8 border-white/5" />
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <motion.circle
                cx="50%"
                cy="50%"
                r="45%"
                fill="transparent"
                stroke="#10B981"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray="283"
                initial={{ strokeDashoffset: 283 }}
                animate={{ 
                  strokeDashoffset: isRunning 
                    ? 0 
                    : 283 
                }}
                transition={{ duration: 1, ease: "linear", repeat: isRunning ? Infinity : 0 }}
                className="opacity-40 glow-border"
              />
            </svg>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentModeLabel}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-emerald-500 font-bold text-sm tracking-[0.4em] mb-4 uppercase glow-emerald"
              >
                {currentModeLabel}
              </motion.div>
            </AnimatePresence>

            <div className="timer-font text-8xl lg:text-9xl font-bold tracking-tighter glow-emerald flex items-baseline">
              {formatTime(time)}
            </div>

            {/* Sub-stat */}
            <div className="mt-4 flex items-center gap-2">
               <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/10 flex items-center gap-2">
                 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                 <span className="text-[10px] font-bold uppercase tracking-widest">Total: {formatTime(totalTime)}</span>
               </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-8 mb-12">
            <button 
              onClick={reset}
              className="w-16 h-16 flex items-center justify-center rounded-full glass border-white/20 hover:bg-white/10 transition-all group"
              title="Resetar"
            >
              <RotateCcw className="w-6 h-6 text-zinc-400 group-hover:text-white transition-colors" />
            </button>

            <button 
              onClick={toggle}
              className={`w-24 h-24 flex items-center justify-center rounded-full transition-all transform active:scale-95 ${
                isRunning 
                ? 'glass border-emerald-500/50 shadow-[0_0_40px_#10B98122]' 
                : 'bg-white text-black shadow-2xl shadow-white/10 hover:scale-105'
              }`}
            >
              {isRunning 
                ? <Pause className="w-10 h-10 fill-current text-white" /> 
                : <Play className="w-10 h-10 fill-current ml-1" />
              }
            </button>

            <div 
              className="w-16 h-16 flex items-center justify-center rounded-full glass border-white/20"
              title="Status de Áudio"
            >
              {settings.voiceIntervalSeconds > 0 
                ? <Volume2 className="w-6 h-6 text-emerald-500" /> 
                : <VolumeX className="w-6 h-6 text-zinc-500" />
              }
            </div>
          </div>
        </main>

        {/* Goals Sidebar - Visible on Desktop */}
        <aside className="lg:col-span-3 space-y-6">
          <section className="glass rounded-3xl p-6 shadow-2xl border border-white/5 flex flex-col h-full lg:min-h-[500px]">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-emerald-500" /> Metas do Treino
            </h3>
            
            <div className="space-y-3 overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
              {goals.map((goal) => (
                <div 
                  key={goal.id} 
                  className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                    goal.reached 
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' 
                      : 'bg-white/5 border-white/10 text-zinc-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <span className={`text-[10px] font-bold uppercase tracking-widest ${goal.reached ? 'text-emerald-500' : 'text-zinc-500'}`}>
                      {goal.reached ? 'CONCLUÍDO' : 'PENDENTE'}
                    </span>
                    <span className="text-sm font-semibold">{goal.label}</span>
                  </div>
                  <span className="timer-font text-sm font-bold opacity-60">
                    {formatTime(goal.timeSeconds)}
                  </span>
                </div>
              ))}
              {goals.length === 0 && (
                <p className="text-center text-zinc-500 text-xs py-10 italic">Defina metas nas configurações</p>
              )}
            </div>

            <div className="mt-auto pt-6">
               <div className="h-24 w-full bg-white/5 rounded-2xl p-4 relative flex flex-col justify-end">
                  <p className="text-[8px] font-bold text-zinc-500 uppercase mb-2">Engajamento</p>
                  <div className="flex items-end gap-1.5 h-full pt-1">
                    {[30, 60, 90, 70, 100, 40, 10].map((h, i) => (
                      <div 
                        key={i}
                        className={`w-full rounded-t-sm transition-all duration-500 ${isRunning ? 'animate-pulse bg-emerald-500' : 'bg-white/10'}`}
                        style={{ height: `${isRunning ? h : 10}%`, opacity: 0.2 + (h/100) }}
                      />
                    ))}
                  </div>
               </div>
            </div>
          </section>
        </aside>
      </div>

      {/* Settings Modal (Always Keep Existing Logic) */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSettings(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass w-full max-w-md rounded-3xl overflow-hidden relative z-10"
            >
              <div className="p-6 border-b border-white/10 flex justify-between items-center">
                <h3 className="text-lg font-bold uppercase tracking-tight text-white">Configurações</h3>
                <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <Plus className="w-6 h-6 rotate-45 text-zinc-400" />
                </button>
              </div>
              
              <div className="p-6 max-h-[70vh] overflow-y-auto space-y-8">
                {/* Timer Config */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                    <LayoutGrid className="w-4 h-4" /> Parâmetros do Treino
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Rounds</label>
                      <input 
                        type="number" 
                        value={settings.numRounds}
                        onChange={(e) => setSettings({ ...settings, numRounds: parseInt(e.target.value) || 1 })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 timer-font text-sm focus:border-emerald-500 outline-none transition-colors"
                        min="1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Aviso de Voz (s)</label>
                      <input 
                        type="number" 
                        value={settings.voiceIntervalSeconds}
                        onChange={(e) => setSettings({ ...settings, voiceIntervalSeconds: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 timer-font text-sm focus:border-emerald-500 outline-none transition-colors"
                        min="0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Tempo Round (s)</label>
                      <input 
                        type="number" 
                        value={settings.roundSeconds}
                        onChange={(e) => setSettings({ ...settings, roundSeconds: parseInt(e.target.value) || 30 })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 timer-font text-sm focus:border-emerald-500 outline-none transition-colors"
                        min="1"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase text-zinc-500 font-bold">Pausa (s)</label>
                      <input 
                        type="number" 
                        value={settings.pauseSeconds}
                        onChange={(e) => setSettings({ ...settings, pauseSeconds: parseInt(e.target.value) || 0 })}
                        className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 timer-font text-sm focus:border-emerald-500 outline-none transition-colors"
                        min="0"
                      />
                    </div>
                  </div>
                </div>

                {/* Voice Toggles */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                      <Volume2 className="w-4 h-4" /> Voz & Feedback
                    </div>
                    <button 
                      onClick={testVoice}
                      className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest underline decoration-wavy underline-offset-4"
                    >
                      Testar Voz
                    </button>
                  </div>
                  <label className="flex items-center justify-between text-sm cursor-pointer p-4 glass rounded-2xl hover:bg-white/5 transition-colors">
                    <span className="text-zinc-300 font-medium">Anunciar Minutos</span>
                    <input 
                      type="checkbox" 
                      checked={settings.voiceAnnounceMinutes} 
                      onChange={(e) => setSettings({...settings, voiceAnnounceMinutes: e.target.checked})}
                      className="w-5 h-5 accent-emerald-500"
                    />
                  </label>
                  <label className="flex items-center justify-between text-sm cursor-pointer p-4 glass rounded-2xl hover:bg-white/5 transition-colors">
                    <span className="text-zinc-300 font-medium">Anunciar Rounds</span>
                    <input 
                      type="checkbox" 
                      checked={settings.voiceAnnounceRounds} 
                      onChange={(e) => setSettings({...settings, voiceAnnounceRounds: e.target.checked})}
                      className="w-5 h-5 accent-emerald-500"
                    />
                  </label>
                  <label className="flex items-center justify-between text-sm cursor-pointer p-4 glass rounded-2xl hover:bg-white/5 transition-colors">
                    <span className="text-zinc-300 font-medium">Anunciar Metas</span>
                    <input 
                      type="checkbox" 
                      checked={settings.voiceAnnounceGoals} 
                      onChange={(e) => setSettings({...settings, voiceAnnounceGoals: e.target.checked})}
                      className="w-5 h-5 accent-emerald-500"
                    />
                  </label>
                  <label className="flex items-center justify-between text-sm cursor-pointer p-4 glass rounded-2xl hover:bg-white/5 transition-colors">
                    <span className="text-zinc-300 font-medium">Música de Fundo (Tabata)</span>
                    <input 
                      type="checkbox" 
                      checked={settings.musicEnabled} 
                      onChange={(e) => setSettings({...settings, musicEnabled: e.target.checked})}
                      className="w-5 h-5 accent-emerald-500"
                    />
                  </label>

                  <div className="space-y-4 px-2">
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] items-center text-zinc-500 font-bold uppercase tracking-widest">
                        <span>Volume da Música</span>
                        <span>{Math.round(settings.musicVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={settings.musicVolume}
                        onChange={(e) => setSettings({...settings, musicVolume: parseFloat(e.target.value)})}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-[10px] items-center text-zinc-500 font-bold uppercase tracking-widest">
                        <span>Volume da Voz</span>
                        <span>{Math.round(settings.voiceVolume * 100)}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05" 
                        value={settings.voiceVolume}
                        onChange={(e) => setSettings({...settings, voiceVolume: parseFloat(e.target.value)})}
                        className="w-full accent-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Add Goal */}
                <form onSubmit={handleAddGoal} className="space-y-4 pt-6 border-t border-white/10">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 uppercase tracking-widest">
                    <Target className="w-4 h-4" /> Gerenciar Metas
                  </div>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Nome p.ex: Sprint"
                      value={newGoalLabel}
                      onChange={(e) => setNewGoalLabel(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/10 rounded-2xl p-4 text-sm focus:border-emerald-500 outline-none"
                    />
                    <input 
                      type="number" 
                      placeholder="Seg"
                      value={newGoalTime}
                      onChange={(e) => setNewGoalTime(e.target.value)}
                      className="w-24 bg-white/5 border border-white/10 rounded-2xl p-4 timer-font text-sm text-center focus:border-emerald-500 outline-none"
                    />
                    <button 
                      type="submit"
                      className="bg-emerald-500 text-black rounded-2xl px-5 hover:scale-105 transition-transform"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                  
                  {/* Goals inline removal in settings too for convenience */}
                  <div className="space-y-2 mt-4">
                    {goals.map(goal => (
                      <div key={goal.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                        <span className="text-xs">{goal.label} ({formatTime(goal.timeSeconds)})</span>
                        <button onClick={() => removeGoal(goal.id)} className="text-red-500/70 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </form>
              </div>
              
              <div className="p-6 bg-black/40">
                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 py-4 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-500/20 transition-colors"
                >
                  Confirmar Alterações
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <audio 
        ref={audioRef} 
        loop 
        src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" 
        style={{ display: 'none' }} 
      />
    </div>
  );
}
