import React, { useState } from 'react';
import { Volume2, VolumeX, Sparkles, BookOpen, Users, Presentation } from 'lucide-react';
import { sounds } from '../utils/audio';

interface HeaderProps {
  currentTab: 'game' | 'rules' | 'teacher';
  onSelectTab: (tab: 'game' | 'rules' | 'teacher') => void;
  playerCount: number;
  maxPlayers: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onSelectTab,
  playerCount,
  maxPlayers,
}) => {
  const [isMuted, setIsMuted] = useState(sounds.getIsMuted());

  const handleToggleSound = () => {
    const muted = sounds.toggleMute();
    setIsMuted(muted);
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        
        {/* Zone 1: Wordmark (Single element) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-sm shadow-indigo-100">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg sm:text-xl text-slate-900 tracking-tight whitespace-nowrap">
            Past Continuous <span className="text-indigo-600 font-normal">·</span> Puzzle Challenge
          </span>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
          <button
            onClick={() => onSelectTab('game')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 py-1 ${
              currentTab === 'game' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Juego & Desafío</span>
          </button>

          <button
            onClick={() => onSelectTab('rules')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 py-1 ${
              currentTab === 'rules' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Grammar Guide</span>
          </button>

          <button
            onClick={() => onSelectTab('teacher')}
            className={`whitespace-nowrap transition-colors flex items-center gap-1.5 py-1 ${
              currentTab === 'teacher' ? 'text-indigo-600 font-semibold' : 'hover:text-slate-900'
            }`}
          >
            <Presentation className="w-4 h-4" />
            <span>Panel Docente</span>
          </button>
        </nav>

        {/* Zone 3: Primary Action & Status */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 tabular-nums">
            <span>Jugadores:</span>
            <span className={`font-semibold ${playerCount >= maxPlayers ? 'text-amber-600' : 'text-slate-800'}`}>
              {playerCount}/{maxPlayers}
            </span>
          </div>

          <button
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Activar sonido' : 'Silenciar sonido'}
            className="p-2 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-slate-400" /> : <Volume2 className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>

      </div>

      {/* Mobile nav subbar */}
      <div className="md:hidden flex items-center justify-around border-t border-slate-100 py-2 bg-slate-50 text-xs font-medium">
        <button
          onClick={() => onSelectTab('game')}
          className={`px-3 py-1 rounded-md ${currentTab === 'game' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
        >
          Juego
        </button>
        <button
          onClick={() => onSelectTab('rules')}
          className={`px-3 py-1 rounded-md ${currentTab === 'rules' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
        >
          Reglas
        </button>
        <button
          onClick={() => onSelectTab('teacher')}
          className={`px-3 py-1 rounded-md ${currentTab === 'teacher' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
        >
          Docente
        </button>
      </div>
    </header>
  );
};
