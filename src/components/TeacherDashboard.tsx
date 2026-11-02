import React, { useState } from 'react';
import { RoomState, Player } from '../types/game';
import { Play, RotateCcw, UserPlus, Users, Trophy, Monitor, Clock, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface TeacherDashboardProps {
  roomState: RoomState | null;
  onStartGame: () => Promise<{ success: boolean; error?: string }>;
  onResetRoom: () => Promise<void>;
  onSeedDemo: (count?: number) => Promise<void>;
  onBackToGame: () => void;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  roomState,
  onStartGame,
  onResetRoom,
  onSeedDemo,
  onBackToGame,
}) => {
  const [isStarting, setIsStarting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isProjectorMode, setIsProjectorMode] = useState(false);

  const players = Object.values(roomState?.players || {});
  const maxPlayers = roomState?.maxPlayers || 23;
  const currentCount = players.length;

  const sortedPlayers = [...players].sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.totalTimeSeconds - b.totalTimeSeconds;
  });

  const handleStart = async () => {
    sounds.playClick();
    setIsStarting(true);
    await onStartGame();
    setIsStarting(false);
  };

  const handleSeed = async () => {
    sounds.playClick();
    setIsSeeding(true);
    await onSeedDemo(22);
    setIsSeeding(false);
  };

  const handleReset = async () => {
    if (window.confirm('¿Deseas reiniciar la sala y borrar todos los puntajes actuales?')) {
      sounds.playClick();
      setIsResetting(true);
      await onResetRoom();
      setIsResetting(false);
    }
  };

  return (
    <div className={`max-w-6xl mx-auto px-4 sm:px-6 py-8 ${isProjectorMode ? 'bg-slate-900 text-white min-h-screen' : ''}`}>
      {/* Top Banner / Mode Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className={`text-xs font-bold uppercase tracking-wider ${isProjectorMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Panel de Control Docente · Sesión en Vivo
            </span>
          </div>
          <h1 className={`text-2xl sm:text-3xl font-extrabold tracking-tight font-display ${isProjectorMode ? 'text-white' : 'text-slate-900'}`}>
            Supervisión de Aula ({currentCount} / {maxPlayers} Estudiantes)
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsProjectorMode(!isProjectorMode)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isProjectorMode
                ? 'bg-slate-800 text-indigo-400 border border-slate-700'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Monitor className="w-4 h-4" />
            <span>{isProjectorMode ? 'Salir Modo Proyector' : 'Modo Proyector Aula'}</span>
          </button>

          <button
            onClick={onBackToGame}
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
          >
            Volver a la Pantalla de Juego
          </button>
        </div>
      </div>

      {/* Control Actions Strip */}
      <div className={`p-4 sm:p-6 rounded-2xl border mb-8 ${isProjectorMode ? 'bg-slate-800/80 border-slate-700' : 'bg-white border-slate-200'}`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
              isProjectorMode ? 'bg-slate-700 text-indigo-400' : 'bg-indigo-50 text-indigo-700'
            }`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className={`text-sm font-bold ${isProjectorMode ? 'text-white' : 'text-slate-900'}`}>
                Estado de la Partida: <span className="uppercase text-indigo-500">{roomState?.status || 'Esperando'}</span>
              </p>
              <p className="text-xs text-slate-400">
                Límite de tiempo: 20s/nivel · Total: 10 niveles · Máx 23 participantes
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Start Game Button */}
            <button
              onClick={handleStart}
              disabled={isStarting || currentCount === 0 || roomState?.status === 'in-progress'}
              className="py-2.5 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-sm rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>{roomState?.status === 'in-progress' ? 'Partida en Curso' : 'Autorizar e Iniciar Juego'}</span>
            </button>

            {/* Seed 20-22 Demo Students */}
            <button
              onClick={handleSeed}
              disabled={isSeeding || currentCount >= maxPlayers}
              title="Añadir estudiantes de prueba para demostrar la sala llena con 23 participantes"
              className={`py-2.5 px-4 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isProjectorMode
                  ? 'border-slate-700 hover:bg-slate-700 text-slate-300'
                  : 'border-slate-300 hover:bg-slate-50 text-slate-700'
              }`}
            >
              <UserPlus className="w-4 h-4 text-indigo-500" />
              <span>{isSeeding ? 'Generando...' : 'Llenar Aula Demo (hasta 23)'}</span>
            </button>

            {/* Reset Room */}
            <button
              onClick={handleReset}
              disabled={isResetting || currentCount === 0}
              className={`py-2.5 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all cursor-pointer text-rose-600 hover:bg-rose-50 ${
                isProjectorMode ? 'border-slate-700' : 'border-rose-200'
              }`}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reiniciar Sala</span>
            </button>
          </div>

        </div>
      </div>

      {/* Live Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {sortedPlayers.map((player, idx) => {
          const isDone = player.isFinished;

          return (
            <div
              key={player.id}
              className={`p-4 rounded-2xl border transition-all ${
                isProjectorMode
                  ? 'bg-slate-800/90 border-slate-700'
                  : isDone
                  ? 'bg-white border-emerald-200 ring-1 ring-emerald-100'
                  : 'bg-white border-slate-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    #{idx + 1}
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`text-sm font-bold truncate max-w-[140px] ${isProjectorMode ? 'text-white' : 'text-slate-900'}`}>
                    {player.name}
                  </span>
                </div>

                <span className="text-xs font-extrabold text-indigo-600 tabular-nums">
                  {player.score} pts
                </span>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-slate-700">
                <span className="flex items-center gap-1">
                  {isDone ? (
                    <span className="text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Completado
                    </span>
                  ) : (
                    <span>Nivel {player.currentLevel} de 10</span>
                  )}
                </span>

                <span className="font-mono text-slate-400">
                  {player.totalTimeSeconds}s
                </span>
              </div>
            </div>
          );
        })}

        {players.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 rounded-2xl">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 mb-1">No hay alumnos conectados aún</p>
            <p className="text-xs text-slate-400 max-w-md mx-auto mb-4">
              Pide a tus estudiantes que ingresen su nombre en la pantalla de inicio, o pulsa "Llenar Aula Demo" para probar con 23 estudiantes simulados.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
