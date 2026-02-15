
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PlayIcon, PauseIcon, ArrowPathIcon } from './Icons';

interface FocusTimerProps {
  currentTaskTitle?: string;
}

const PRESETS = [
  { label: 'Focus', minutes: 25 },
  { label: 'Short Break', minutes: 5 },
  { label: 'Long Break', minutes: 15 },
];

const FocusTimer: React.FC<FocusTimerProps> = ({ currentTaskTitle }) => {
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [totalTime, setTotalTime] = useState(25 * 60);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let interval: number | undefined;

    if (isActive && timeLeft > 0) {
      interval = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Play a subtle notification if possible
      try {
        if (!audioRef.current) {
          audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
        }
        audioRef.current.play();
      } catch (e) {
        console.log('Audio feedback blocked');
      }
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
  };

  const setPreset = (minutes: number) => {
    setIsActive(false);
    setTotalTime(minutes * 60);
    setTimeLeft(minutes * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((totalTime - timeLeft) / totalTime) * 100;

  return (
    <div className="w-full flex flex-col items-center space-y-8 animate-slideIn">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-black text-slate-900">Focus Mode</h2>
        <p className="text-slate-500 font-medium">
          {isActive ? 'Keep going, you got this!' : 'Ready to dive in?'}
        </p>
      </div>

      {/* Timer Display */}
      <div className="relative w-72 h-72 flex items-center justify-center">
        {/* Progress Ring Background */}
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className="text-slate-100"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeDasharray="282.7"
            strokeDashoffset={282.7 - (282.7 * progress) / 100}
            strokeLinecap="round"
            className="text-indigo-600 transition-all duration-1000 ease-linear"
          />
        </svg>

        <div className="text-center z-10">
          <div className="text-6xl font-black text-slate-900 tabular-nums">
            {formatTime(timeLeft)}
          </div>
          {currentTaskTitle && (
            <div className="mt-4 px-4 py-1.5 bg-indigo-50 text-indigo-600 text-xs font-black uppercase rounded-full max-w-[200px] truncate mx-auto">
              {currentTaskTitle}
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6">
        <button
          onClick={resetTimer}
          className="p-4 bg-white border border-slate-200 text-slate-400 rounded-2xl hover:text-indigo-600 hover:border-indigo-600 transition-all active:scale-95"
          title="Reset"
        >
          <ArrowPathIcon />
        </button>

        <button
          onClick={toggleTimer}
          className={`w-20 h-20 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 ${
            isActive ? 'bg-slate-900' : 'bg-indigo-600'
          }`}
        >
          {isActive ? <PauseIcon /> : <PlayIcon />}
        </button>

        <div className="w-14" /> {/* Spacer to center the play button slightly more */}
      </div>

      {/* Presets */}
      <div className="flex gap-2 w-full">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => setPreset(preset.minutes)}
            className={`flex-1 py-3 px-2 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border-2 ${
              totalTime === preset.minutes * 60
                ? 'bg-indigo-50 border-indigo-600 text-indigo-600'
                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default FocusTimer;
