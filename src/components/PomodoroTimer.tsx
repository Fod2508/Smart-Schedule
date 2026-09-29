import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Coffee,
  Flame,
  Volume2,
  VolumeX,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ScheduleItem } from '../types/schedule';

interface PomodoroTimerProps {
  isOpen: boolean;
  onClose: () => void;
  activeEvent: ScheduleItem | null;
  onPomodoroComplete?: (eventId?: string) => void;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  isOpen,
  onClose,
  activeEvent,
  onPomodoroComplete,
}) => {
  const [mode, setMode] = useState<'focus' | 'break'>('focus');
  const [focusDuration, setFocusDuration] = useState(25); // 25 mins
  const [breakDuration, setBreakDuration] = useState(5);   // 5 mins
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleTimerFinish();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  const handleTimerFinish = () => {
    setIsRunning(false);
    if (soundEnabled) {
      playBeep();
    }

    if (mode === 'focus') {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
      setCompletedSessions((prev) => prev + 1);
      if (onPomodoroComplete) onPomodoroComplete(activeEvent?.id);
      // Switch to break
      setMode('break');
      setTimeLeft(breakDuration * 60);
    } else {
      // Switch back to focus
      setMode('focus');
      setTimeLeft(focusDuration * 60);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.4);
    } catch (e) {
      console.warn('Audio context unavailable');
    }
  };

  const switchMode = (newMode: 'focus' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'focus' ? focusDuration * 60 : breakDuration * 60);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;

  const progressPercent =
    mode === 'focus'
      ? ((focusDuration * 60 - timeLeft) / (focusDuration * 60)) * 100
      : ((breakDuration * 60 - timeLeft) / (breakDuration * 60)) * 100;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col p-6 text-center">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500 uppercase tracking-wider">
            <Flame className="w-4 h-4 text-amber-500" />
            <span>Đồng hồ Pomodoro</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              title={soundEnabled ? 'Tắt âm báo' : 'Bật âm báo'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Target event */}
        <div className="mt-3 py-1.5 px-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate">
          {activeEvent ? activeEvent.title : 'Phiên tập trung chuyên sâu'}
        </div>

        {/* Mode Selector */}
        <div className="mt-4 flex items-center justify-center p-1 bg-zinc-100 dark:bg-zinc-800/90 rounded-2xl gap-1 text-xs">
          <button
            onClick={() => switchMode('focus')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              mode === 'focus'
                ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-zinc-500'
            }`}
          >
            Tập trung ({focusDuration}m)
          </button>
          <button
            onClick={() => switchMode('break')}
            className={`flex-1 py-1.5 rounded-xl font-bold transition cursor-pointer ${
              mode === 'break'
                ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-zinc-500'
            }`}
          >
            Nghỉ ngắn ({breakDuration}m)
          </button>
        </div>

        {/* Circular Display */}
        <div className="my-6 relative flex flex-col items-center justify-center">
          <div className="w-44 h-44 rounded-full border-8 border-zinc-100 dark:border-zinc-800 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
            {/* Visual fill indicator */}
            <div
              className={`absolute bottom-0 left-0 right-0 opacity-15 transition-all duration-500 ${
                mode === 'focus' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ height: `${progressPercent}%` }}
            />

            <span className="text-4xl font-black text-zinc-900 dark:text-zinc-100 font-mono tracking-tight z-10">
              {timeFormatted}
            </span>
            <span className="text-[11px] font-medium text-zinc-400 mt-1 uppercase tracking-wider z-10">
              {mode === 'focus' ? 'Focus Mode' : 'Rest Mode'}
            </span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handleReset}
            className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            title="Đặt lại thời gian"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl font-bold text-white text-sm shadow-md transition flex items-center gap-2 cursor-pointer ${
              mode === 'focus'
                ? 'bg-amber-500 hover:bg-amber-600 active:bg-amber-700 shadow-amber-500/20'
                : 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-emerald-500/20'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? 'Tạm dừng' : 'Bắt đầu'}</span>
          </button>

          <button
            onClick={handleTimerFinish}
            className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition"
            title="Bỏ qua / Hoàn thành phiên"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Session Count */}
        <div className="mt-5 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-center gap-1.5">
          <Coffee className="w-3.5 h-3.5 text-amber-500" />
          <span>Hôm nay đã hoàn thành:</span>
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {completedSessions} phiên Pomodoro
          </span>
        </div>
      </div>
    </div>
  );
};
