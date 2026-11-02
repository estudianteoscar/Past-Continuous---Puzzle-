import React, { useState } from 'react';
import { Player } from '../types/game';
import { UserCheck, ShieldAlert, Sparkles, Play, Users, Clock, Award, CheckCircle2 } from 'lucide-react';
import { sounds } from '../utils/audio';

interface LobbyProps {
  players: Record<string, Player>;
  currentPlayer: Player | null;
  maxPlayers: number;
  onRegister: (name: string, isHost?: boolean) => Promise<{ success: boolean; error?: string }>;
  onStartGame: () => Promise<{ success: boolean; error?: string }>;
  onOpenTeacher: () => void;
  errorMsg: string | null;
  onClearError: () => void;
}

export const Lobby: React.FC<LobbyProps> = ({
  players,
  currentPlayer,
  maxPlayers,
  onRegister,
  onStartGame,
  onOpenTeacher,
  errorMsg,
  onClearError,
}) => {
  const [nameInput, setNameInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [localFeedback, setLocalFeedback] = useState<string | null>(null);

  const playerList = Object.values(players).sort((a, b) => a.registeredAt - b.registeredAt);
  const currentCount = playerList.length;
  const isFull = currentCount >= maxPlayers;

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalFeedback(null);
    onClearError();

    const trimmed = nameInput.trim();
    if (!trimmed) {
      setLocalFeedback('Por favor, ingresa tu nombre.');
      return;
    }

    if (isFull) {
      setLocalFeedback(`La sala está completa (${maxPlayers} jugadores máximo).`);
      return;
    }

    // Check duplicate
    const exists = playerList.some((p) => p.name.toLowerCase() === trimmed.toLowerCase());
    if (exists) {
      setLocalFeedback(`El nombre "${trimmed}" ya está registrado. Elige otro nombre.`);
      return;
    }

    setIsSubmitting(true);
    sounds.playClick();
    const result = await onRegister(trimmed, playerList.length === 0);
    setIsSubmitting(false);

    if (result.success) {
      setNameInput('');
      sounds.playCorrect();
    } else if (result.error) {
      setLocalFeedback(result.error);
    }
  };

  const handleStart = async () => {
    sounds.playClick();
    await onStartGame();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Welcome Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 mb-8 text-center relative overflow-hidden">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full mb-4">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Evaluación Interactiva en Tiempo Real</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 font-display">
          Past Continuous <span className="text-indigo-600">·</span> Puzzle Challenge
        </h1>

        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-6">
          Pon a prueba tus conocimientos sobre la estructura <strong className="text-slate-900">was/were + verb-ing</strong>.
          Resuelve 10 niveles de rompecabezas gramaticales interactivos compitiendo en vivo con tus compañeros de clase.
        </p>

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Users className="w-4 h-4 text-indigo-500" />
            <span>Hasta {maxPlayers} jugadores simultáneos</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Clock className="w-4 h-4 text-indigo-500" />
            <span>20 segundos por nivel</span>
          </div>
          <span className="text-slate-300">·</span>
          <div className="flex items-center gap-1.5 font-medium text-slate-700">
            <Award className="w-4 h-4 text-indigo-500" />
            <span>10 niveles progresivos (1,000 pts max)</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Registration Form (or Registered Badge) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 font-display">Registro de Jugadores</h2>
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                isFull ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
              }`}>
                {currentCount} / {maxPlayers} registrados
              </span>
            </div>

            {currentPlayer ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2 font-bold text-lg">
                  {currentPlayer.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-sm text-emerald-800 font-semibold mb-1 flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>¡Ya estás registrado!</span>
                </div>
                <p className="text-base font-bold text-slate-900 mb-2">{currentPlayer.name}</p>
                <p className="text-xs text-slate-600">
                  Esperando que el docente o administrador inicie la partida para comenzar con los 10 niveles.
                </p>
              </div>
            ) : isFull ? (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center">
                <ShieldAlert className="w-8 h-8 text-amber-600 mx-auto mb-2" />
                <h3 className="text-sm font-bold text-amber-900 mb-1">Capacidad Máxima Alcanzada</h3>
                <p className="text-xs text-amber-700">
                  Se ha completado el límite de 23 estudiantes para esta partida. Consulta con tu profesor.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label htmlFor="student-name" className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1.5">
                    Ingresa tu Nombre y Apellido
                  </label>
                  <input
                    id="student-name"
                    type="text"
                    value={nameInput}
                    onChange={(e) => {
                      setNameInput(e.target.value);
                      if (localFeedback) setLocalFeedback(null);
                      if (errorMsg) onClearError();
                    }}
                    placeholder="Ej. Sofia Rodriguez"
                    maxLength={32}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm transition-all"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    No se permiten nombres duplicados. Máximo 23 participantes.
                  </span>
                </div>

                {(localFeedback || errorMsg) && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5 flex items-start gap-2">
                    <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{localFeedback || errorMsg}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || !nameInput.trim()}
                  className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold text-sm rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Registrando...' : 'Registrarme en el Juego'}</span>
                </button>
              </form>
            )}

            {/* Quick teacher dashboard shortcut */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>¿Eres el docente?</span>
              <button
                type="button"
                onClick={onOpenTeacher}
                className="text-indigo-600 font-semibold hover:text-indigo-800 transition-colors"
              >
                Abrir Panel Docente →
              </button>
            </div>
          </div>

          {/* Quick rules recap card */}
          <div className="bg-slate-50 rounded-2xl border border-slate-200/80 p-5 text-xs text-slate-600 space-y-2">
            <h3 className="font-bold text-slate-800 text-sm font-display mb-1">Reglas Rápidas de la Partida</h3>
            <p>1. Cada nivel tiene un rompecabezas con límite de <strong className="text-slate-800">20 segundos</strong>.</p>
            <p>2. Cada acierto suma <strong className="text-emerald-700">+100 puntos</strong>. Errores o tiempo agotado: 0 pts.</p>
            <p>3. Arrastra las fichas o tócalas para colocarlas en el espacio vacío.</p>
            <p>4. El juego inicia para todos cuando el docente dé la señal de partida.</p>
          </div>
        </div>

        {/* Right Column: Live Players List */}
        <div className="lg:col-span-7 flex flex-col">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 font-display">
                  Participantes en la Sala ({currentCount}/{maxPlayers})
                </h2>
                <p className="text-xs text-slate-500">
                  Esta lista se actualiza automáticamente en tiempo real.
                </p>
              </div>

              {currentCount > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>Sincronizado en vivo</span>
                </div>
              )}
            </div>

            {currentCount === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-center">
                <Users className="w-10 h-10 text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700 mb-1">Aún no hay participantes registrados</p>
                <p className="text-xs text-slate-500 max-w-sm">
                  Ingresa tu nombre a la izquierda para unirte a la partida. La plataforma admite hasta 23 estudiantes.
                </p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-2">
                {playerList.map((player, index) => {
                  const isCurrent = currentPlayer?.id === player.id;
                  return (
                    <div
                      key={player.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-indigo-50/80 border-indigo-200 ring-1 ring-indigo-200'
                          : 'bg-white border-slate-100 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-400 w-5 tabular-nums">
                          {index + 1}.
                        </span>
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                          {player.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            {player.name}
                            {isCurrent && (
                              <span className="text-[10px] bg-indigo-600 text-white font-medium px-1.5 py-0.2 rounded">
                                Tú
                              </span>
                            )}
                          </p>
                          <span className="text-[11px] text-slate-400">
                            Listo para comenzar · Nivel 1
                          </span>
                        </div>
                      </div>

                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                        Preparado
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Start Game Bottom Action Bar */}
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={handleStart}
                disabled={currentCount === 0}
                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white text-base font-extrabold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2.5 cursor-pointer disabled:cursor-not-allowed uppercase tracking-wider"
              >
                <Play className="w-5 h-5 fill-current" />
                <span>EMPEZAR JUEGO</span>
              </button>

              <p className="text-center text-[11px] text-slate-500 mt-2">
                El juego iniciará de forma simultánea cuando el docente o los participantes confirmen estar preparados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
