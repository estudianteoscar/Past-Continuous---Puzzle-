import React, { useEffect, useState } from 'react';
import { Player, RoomState } from '../types/game';
import { GAME_LEVELS } from '../data/levels';
import { Trophy, Award, Clock, CheckCircle2, XCircle, RotateCcw, ChevronDown, ChevronUp, Users, Medal } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

interface ResultsScreenProps {
  player: Player;
  roomState: RoomState | null;
  onPlayAgain: () => void;
  onOpenTeacher: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  player,
  roomState,
  onPlayAgain,
  onOpenTeacher,
}) => {
  const [showReview, setShowReview] = useState(false);

  // Trigger celebration fanfare and confetti on mount
  useEffect(() => {
    sounds.playVictory();
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Confetti fallback
    }
  }, []);

  // Performance message based on score
  const getMotivationalFeedback = (score: number) => {
    if (score >= 900) {
      return {
        tier: 'Master',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        message: 'Excellent! You are a Past Continuous Master!',
        emoji: '🏆',
      };
    }
    if (score >= 700) {
      return {
        tier: 'Avanzado',
        badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-300',
        message: 'Great job! Keep practicing!',
        emoji: '⭐',
      };
    }
    if (score >= 400) {
      return {
        tier: 'En progreso',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        message: 'Good effort! You can improve!',
        emoji: '💪',
      };
    }
    return {
      tier: 'Principiante',
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
      message: "Don't give up! Practice makes perfect!",
      emoji: '🌱',
    };
  };

  const feedback = getMotivationalFeedback(player.score);
  const accuracy = Math.round((player.correctCount / 10) * 100);

  // Leaderboard ranking: sorted by score desc, then totalTimeSeconds asc (tiebreaker)
  const allPlayers = Object.values(roomState?.players || { [player.id]: player });
  const sortedPlayers = [...allPlayers].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.totalTimeSeconds - b.totalTimeSeconds;
  });

  const playerRank = sortedPlayers.findIndex((p) => p.id === player.id) + 1;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* Hero Performance Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-10 text-center mb-8 relative overflow-hidden">
        <div className="text-5xl sm:text-6xl mb-3">{feedback.emoji}</div>
        
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-bold uppercase tracking-wider mb-3 bg-slate-50 border-slate-200 text-slate-700">
          <span>{player.name}</span>
          <span className="text-slate-300">·</span>
          <span>Puesto #{playerRank} de {sortedPlayers.length}</span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight font-display mb-2">
          {feedback.message}
        </h1>

        <p className="text-slate-500 text-sm max-w-lg mx-auto mb-8">
          Has completado los 10 niveles de evaluación sobre el Past Continuous Tense.
        </p>

        {/* 4 Quantitative Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
          
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-500 block mb-1">Puntaje Total</span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-indigo-600 tabular-nums">
              {player.score}
            </div>
            <span className="text-[11px] text-slate-400">de 1,000 pts</span>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-2xl p-4 text-center">
            <span className="text-xs text-emerald-700 block mb-1 flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Correctas</span>
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-emerald-700 tabular-nums">
              {player.correctCount}
            </div>
            <span className="text-[11px] text-emerald-600/80">{accuracy}% precisión</span>
          </div>

          <div className="bg-rose-50/60 border border-rose-200/80 rounded-2xl p-4 text-center">
            <span className="text-xs text-rose-700 block mb-1 flex items-center justify-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              <span>Incorrectas</span>
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-rose-700 tabular-nums">
              {player.incorrectCount}
            </div>
            <span className="text-[11px] text-rose-600/80">de 10 niveles</span>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-center">
            <span className="text-xs text-slate-500 block mb-1 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Tiempo Total</span>
            </span>
            <div className="font-display font-extrabold text-2xl sm:text-3xl text-slate-800 tabular-nums font-mono">
              {player.totalTimeSeconds}s
            </div>
            <span className="text-[11px] text-slate-400">criterio desempate</span>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-8 pt-6 border-t border-slate-100">
          <button
            onClick={() => setShowReview(!showReview)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer"
          >
            {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            <span>{showReview ? 'Ocultar Revisión' : 'Revisar Mis Respuestas y Reglas'}</span>
          </button>

          <button
            onClick={onPlayAgain}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:shadow"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Volver a la Sala de Espera</span>
          </button>
        </div>
      </div>

      {/* Answer Review Section (Toggleable) */}
      {showReview && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 mb-8 animate-in fade-in duration-200">
          <h2 className="text-lg font-bold text-slate-900 font-display mb-1">
            Revisión Pedagógica Nivel por Nivel
          </h2>
          <p className="text-xs text-slate-500 mb-6">
            Consulta la regla gramatical y la explicación de cada ejercicio para reforzar tu aprendizaje.
          </p>

          <div className="space-y-4">
            {GAME_LEVELS.map((lvl) => {
              const answer = player.answers.find((a) => a.levelNumber === lvl.levelNumber);
              const isCorrect = answer?.isCorrect;

              return (
                <div
                  key={lvl.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isCorrect
                      ? 'bg-emerald-50/40 border-emerald-200'
                      : answer
                      ? 'bg-rose-50/40 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        Nivel {lvl.levelNumber} · {lvl.category}
                      </span>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {lvl.prompt}
                      </h3>
                    </div>

                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-md shrink-0 flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                      <span>{isCorrect ? '+100 pts' : '0 pts'}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-3">
                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Tu respuesta:</span>
                      <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {answer ? answer.studentAnswer : 'Sin respuesta'}
                      </span>
                    </div>

                    <div className="bg-white/80 p-2.5 rounded-xl border border-slate-200">
                      <span className="text-slate-400 block mb-0.5">Respuesta correcta:</span>
                      <span className="font-semibold text-indigo-700">
                        {lvl.correctAnswerText}
                      </span>
                    </div>
                  </div>

                  <div className="bg-white/90 p-3 rounded-xl border border-slate-200/80 text-xs text-slate-600">
                    <strong className="text-slate-800 font-semibold block mb-0.5">
                      Regla: {lvl.grammarRule}
                    </strong>
                    <p>{lvl.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Leaderboard (Clasificación General en Tiempo Real) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h2 className="text-xl font-bold text-slate-900 font-display">
                Clasificación General (Leaderboard)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Participantes ordenados por puntaje. Criterio de desempate: menor tiempo total de respuesta.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <Users className="w-4 h-4 text-indigo-500" />
            <span className="font-semibold">{sortedPlayers.length} participantes</span>
          </div>
        </div>

        {/* Podium for Top 3 */}
        {sortedPlayers.length >= 3 && (
          <div className="grid grid-cols-3 gap-3 sm:gap-6 mb-8 max-w-2xl mx-auto pt-4 text-center items-end">
            
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-slate-100 border-2 border-slate-300 text-slate-600 flex items-center justify-center font-bold text-base shadow-sm mb-2">
                🥈
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[100px] sm:max-w-none">
                {sortedPlayers[1].name}
              </span>
              <span className="text-xs font-semibold text-indigo-600 tabular-nums">
                {sortedPlayers[1].score} pts
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sortedPlayers[1].totalTimeSeconds}s
              </span>
              <div className="w-full bg-slate-100 h-16 rounded-t-xl mt-2 flex items-center justify-center text-xs font-bold text-slate-500">
                #2
              </div>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-50 border-2 border-amber-400 text-amber-600 flex items-center justify-center font-bold text-xl shadow-md mb-2">
                👑
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[110px] sm:max-w-none">
                {sortedPlayers[0].name}
              </span>
              <span className="text-xs sm:text-sm font-extrabold text-amber-600 tabular-nums">
                {sortedPlayers[0].score} pts
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sortedPlayers[0].totalTimeSeconds}s
              </span>
              <div className="w-full bg-amber-100/70 border-t-2 border-amber-400 h-24 rounded-t-xl mt-2 flex items-center justify-center text-sm font-extrabold text-amber-800">
                #1 CAMPEÓN
              </div>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-100/50 border-2 border-amber-700/40 text-amber-800 flex items-center justify-center font-bold text-base shadow-sm mb-2">
                🥉
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-900 truncate max-w-[100px] sm:max-w-none">
                {sortedPlayers[2].name}
              </span>
              <span className="text-xs font-semibold text-indigo-600 tabular-nums">
                {sortedPlayers[2].score} pts
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                {sortedPlayers[2].totalTimeSeconds}s
              </span>
              <div className="w-full bg-orange-50 h-12 rounded-t-xl mt-2 flex items-center justify-center text-xs font-bold text-amber-800">
                #3
              </div>
            </div>

          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold uppercase text-slate-400">
                <th className="py-3 px-3">Pos</th>
                <th className="py-3 px-3">Estudiante</th>
                <th className="py-3 px-3 text-center">Aciertos</th>
                <th className="py-3 px-3 text-right">Tiempo</th>
                <th className="py-3 px-3 text-right">Puntaje</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sortedPlayers.map((p, idx) => {
                const isCurrent = p.id === player.id;
                return (
                  <tr
                    key={p.id}
                    className={`transition-colors ${
                      isCurrent
                        ? 'bg-indigo-50/80 font-bold'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="py-3 px-3 tabular-nums font-mono">
                      {idx === 0 ? '🥇 1' : idx === 1 ? '🥈 2' : idx === 2 ? '🥉 3' : `${idx + 1}`}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-900">{p.name}</span>
                        {isCurrent && (
                          <span className="text-[10px] bg-indigo-600 text-white font-medium px-1.5 py-0.2 rounded">
                            Tú
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-slate-600">
                      {p.correctCount}/10
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-mono text-slate-500">
                      {p.totalTimeSeconds}s
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-extrabold text-indigo-600">
                      {p.score} pts
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
