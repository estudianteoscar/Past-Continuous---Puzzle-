import React, { useState, useEffect, useRef } from 'react';
import { LevelData, PuzzlePiece, Player } from '../types/game';
import { Clock, Award, HelpCircle, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/audio';

interface PuzzleBoardProps {
  level: LevelData;
  totalLevels: number;
  player: Player;
  onAnswerSubmit: (payload: {
    levelNumber: number;
    isCorrect: boolean;
    timeSpentSeconds: number;
    studentAnswer: string;
    correctAnswer: string;
  }) => void;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  level,
  totalLevels,
  player,
  onAnswerSubmit,
}) => {
  // Timer state (20 seconds per level)
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [feedbackState, setFeedbackState] = useState<'idle' | 'correct' | 'incorrect' | 'timeout'>('idle');
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');

  // Interaction states based on level type
  // For fill-blank & time-expression:
  const [selectedOption, setSelectedOption] = useState<PuzzlePiece | null>(null);

  // For error correction:
  const [identifiedErrorWordId, setIdentifiedErrorWordId] = useState<string | null>(null);
  const [selectedCorrection, setSelectedCorrection] = useState<PuzzlePiece | null>(null);

  // For unscramble tasks:
  const [placedPieces, setPlacedPieces] = useState<PuzzlePiece[]>([]);
  const [availablePieces, setAvailablePieces] = useState<PuzzlePiece[]>([]);

  // Drag-and-drop state
  const [draggedPiece, setDraggedPiece] = useState<PuzzlePiece | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  // Time tracker
  const timerRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const hasAnsweredRef = useRef<boolean>(false);

  // Reset state when level changes
  useEffect(() => {
    setTimeLeft(20);
    setIsSubmitting(false);
    setFeedbackState('idle');
    setFeedbackMessage('');
    setSelectedOption(null);
    setIdentifiedErrorWordId(null);
    setSelectedCorrection(null);
    hasAnsweredRef.current = false;
    startTimeRef.current = Date.now();

    if (level.availablePieces) {
      // Shuffle available pieces slightly so they are not already in order
      const shuffled = [...level.availablePieces].sort(() => Math.random() - 0.5);
      setAvailablePieces(shuffled);
      setPlacedPieces([]);
    } else {
      setAvailablePieces([]);
      setPlacedPieces([]);
    }

    // Start 20-second countdown
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeOut();
          return 0;
        }
        if (prev <= 5) {
          sounds.playTick(true);
        } else if (prev <= 10 && prev % 2 === 0) {
          sounds.playTick(false);
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [level.levelNumber]);

  // Handle timeout (0 points, auto advance)
  const handleTimeOut = () => {
    if (hasAnsweredRef.current) return;
    hasAnsweredRef.current = true;
    setIsSubmitting(true);
    setFeedbackState('timeout');
    setFeedbackMessage("Time's up! 0 points.");
    sounds.playIncorrect();

    const timeSpent = 20;
    setTimeout(() => {
      onAnswerSubmit({
        levelNumber: level.levelNumber,
        isCorrect: false,
        timeSpentSeconds: timeSpent,
        studentAnswer: 'Timeout (No answer)',
        correctAnswer: level.correctAnswerText || '',
      });
    }, 1800);
  };

  // Evaluate student answer
  const evaluateAnswer = (isCorrect: boolean, studentAnswerText: string) => {
    if (hasAnsweredRef.current) return;
    hasAnsweredRef.current = true;
    if (timerRef.current) clearInterval(timerRef.current);
    setIsSubmitting(true);

    const timeSpent = Number(((Date.now() - startTimeRef.current) / 1000).toFixed(1));

    if (isCorrect) {
      setFeedbackState('correct');
      setFeedbackMessage('¡Excelente! +100 puntos');
      sounds.playCorrect();
    } else {
      setFeedbackState('incorrect');
      setFeedbackMessage(`Respuesta incorrecta. Era: "${level.correctAnswerText}"`);
      sounds.playIncorrect();
    }

    setTimeout(() => {
      onAnswerSubmit({
        levelNumber: level.levelNumber,
        isCorrect,
        timeSpentSeconds: timeSpent,
        studentAnswer: studentAnswerText,
        correctAnswer: level.correctAnswerText || '',
      });
    }, 1800);
  };

  // Handlers for Fill-in-the-blank & Time-expression
  const handleSelectOption = (piece: PuzzlePiece) => {
    if (isSubmitting || hasAnsweredRef.current) return;
    sounds.playClick();
    setSelectedOption(piece);

    const isCorrect = piece.id === level.correctOptionId ||
      piece.text.trim().toLowerCase() === (level.correctAnswerText || '').trim().toLowerCase();

    evaluateAnswer(isCorrect, piece.text);
  };

  // Handlers for Error Correction
  const handleSelectErrorWord = (word: { id: string; text: string; isError?: boolean }) => {
    if (isSubmitting || hasAnsweredRef.current) return;
    sounds.playClick();
    setIdentifiedErrorWordId(word.id);

    // If they clicked the wrong word (not the error word)
    if (word.id !== level.errorWordId) {
      evaluateAnswer(false, `Identified "${word.text}" as error (wrong word)`);
    }
  };

  const handleSelectCorrectionPiece = (piece: PuzzlePiece) => {
    if (isSubmitting || hasAnsweredRef.current) return;
    sounds.playClick();
    setSelectedCorrection(piece);

    const isCorrect = piece.id === level.correctCorrectionId ||
      piece.text.trim().toLowerCase() === (level.correctAnswerText || '').trim().toLowerCase();

    evaluateAnswer(isCorrect, piece.text);
  };

  // Handlers for Unscramble (drag or tap pieces into order)
  const handlePieceClick = (piece: PuzzlePiece) => {
    if (isSubmitting || hasAnsweredRef.current) return;
    sounds.playClick();

    // Move from available to placed
    setAvailablePieces((prev) => prev.filter((p) => p.id !== piece.id));
    const nextPlaced = [...placedPieces, piece];
    setPlacedPieces(nextPlaced);

    // If all pieces placed, auto evaluate
    if (nextPlaced.length === (level.availablePieces?.length || 0)) {
      checkUnscrambleSequence(nextPlaced);
    }
  };

  const handlePlacedPieceClick = (piece: PuzzlePiece) => {
    if (isSubmitting || hasAnsweredRef.current) return;
    sounds.playClick();

    // Return from placed to available
    setPlacedPieces((prev) => prev.filter((p) => p.id !== piece.id));
    setAvailablePieces((prev) => [...prev, piece]);
  };

  const checkUnscrambleSequence = (sequence: PuzzlePiece[]) => {
    const studentWords = sequence.map((p) => p.text.trim().toLowerCase());
    const targetWords = (level.correctSequence || []).map((t) => t.trim().toLowerCase());

    const isCorrect = studentWords.length === targetWords.length &&
      studentWords.every((w, i) => w === targetWords[i]);

    const studentSentence = sequence.map((p) => p.text).join(' ');
    evaluateAnswer(isCorrect, studentSentence);
  };

  // HTML5 Drag & Drop handlers
  const handleDragStart = (e: React.DragEvent, piece: PuzzlePiece) => {
    if (isSubmitting || hasAnsweredRef.current) return;
    setDraggedPiece(piece);
    e.dataTransfer.setData('text/plain', piece.id);
  };

  const handleDropOnSlot = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverTarget(null);
    if (!draggedPiece || isSubmitting || hasAnsweredRef.current) return;

    if (level.type === 'fill-blank' || level.type === 'time-expression') {
      handleSelectOption(draggedPiece);
    } else if (level.type === 'error-correction') {
      handleSelectCorrectionPiece(draggedPiece);
    } else {
      handlePieceClick(draggedPiece);
    }
    setDraggedPiece(null);
  };

  // Timer color indicator
  const timerPercentage = (timeLeft / 20) * 100;
  const isUrgent = timeLeft <= 5;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Top Bar: Level, Exercise, Score, Timer */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
          
          {/* Level Info */}
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md">
                Nivel {level.levelNumber} de {totalLevels}
              </span>
              <span className="text-xs font-semibold text-slate-500">
                · {level.category}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1 font-display">
              {level.title}
            </h2>
          </div>

          {/* Stats Cluster: Score & Timer */}
          <div className="flex items-center gap-4">
            
            {/* Score */}
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-1.5 rounded-xl">
              <Award className="w-4 h-4 text-amber-500" />
              <div className="text-xs">
                <span className="text-slate-500 block leading-none">Puntaje</span>
                <span className="font-extrabold text-slate-900 text-sm tabular-nums">
                  {player.score} pts
                </span>
              </div>
            </div>

            {/* 20-Second Countdown Timer */}
            <div
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border transition-all ${
                isUrgent
                  ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                  : 'bg-indigo-50/70 border-indigo-200 text-indigo-900'
              }`}
            >
              <Clock className={`w-4 h-4 ${isUrgent ? 'text-rose-600 animate-spin' : 'text-indigo-600'}`} />
              <div className="text-xs">
                <span className="text-slate-500 block leading-none">Tiempo</span>
                <span className="font-mono font-extrabold text-sm tabular-nums">
                  {timeLeft}s
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* Linear Progress Bar for 20s Countdown */}
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ease-linear rounded-full ${
              isUrgent ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-sky-500'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>

        {/* Level Instruction */}
        <p className="text-sm text-slate-600 mt-3 flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4 text-indigo-500 shrink-0" />
          <span>{level.instruction}</span>
        </p>
      </div>

      {/* Main Puzzle Canvas / Interactive Stage */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-10 mb-6 relative overflow-hidden min-h-[280px] flex flex-col justify-center items-center">
        
        {/* Visual Feedback Overlay (😊 / 😞 / Time's up) */}
        {feedbackState !== 'idle' && (
          <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-30 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {feedbackState === 'correct' && (
              <>
                <div className="text-6xl sm:text-7xl mb-3 animate-bounce">😊</div>
                <div className="text-2xl font-black text-emerald-600 font-display mb-1">
                  ¡CORRECTO!
                </div>
                <div className="text-sm font-bold text-slate-700 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-200 mb-2">
                  +100 Puntos
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  {level.explanation}
                </p>
              </>
            )}

            {feedbackState === 'incorrect' && (
              <>
                <div className="text-6xl sm:text-7xl mb-3 animate-pulse">😞</div>
                <div className="text-2xl font-black text-rose-600 font-display mb-1">
                  RESPUESTA INCORRECTA
                </div>
                <div className="text-sm font-semibold text-slate-800 bg-rose-50 px-4 py-1.5 rounded-lg border border-rose-200 mb-2">
                  Solución: <strong className="text-indigo-700">{level.correctAnswerText}</strong>
                </div>
                <p className="text-xs text-slate-500 max-w-md">
                  {level.explanation}
                </p>
              </>
            )}

            {feedbackState === 'timeout' && (
              <>
                <div className="w-16 h-16 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mb-3">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="text-2xl font-black text-rose-600 font-display mb-1">
                  TIME'S UP!
                </div>
                <p className="text-sm text-slate-600 max-w-md">
                  Se agotaron los 20 segundos para este ejercicio. Pasando al siguiente nivel...
                </p>
              </>
            )}
          </div>
        )}

        {/* Activity 1 & 7: Fill in the blank (Sentence with Puzzle Slot) */}
        {(level.type === 'fill-blank' || level.type === 'time-expression') && (
          <div className="w-full max-w-2xl text-center py-6">
            <div className="text-xl sm:text-2xl md:text-3xl font-medium text-slate-800 leading-relaxed flex flex-wrap items-center justify-center gap-2 sm:gap-3">
              {level.sentenceTemplate?.split('{blank}').map((part, index, arr) => (
                <React.Fragment key={index}>
                  <span>{part}</span>
                  {index < arr.length - 1 && (
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setDragOverTarget('slot');
                      }}
                      onDragLeave={() => setDragOverTarget(null)}
                      onDrop={handleDropOnSlot}
                      className={`min-w-[130px] sm:min-w-[160px] h-12 sm:h-14 rounded-2xl border-2 border-dashed flex items-center justify-center px-4 transition-all puzzle-slot ${
                        dragOverTarget === 'slot'
                          ? 'border-indigo-500 bg-indigo-50 scale-105'
                          : selectedOption
                          ? 'border-indigo-500 bg-indigo-50/50'
                          : 'border-slate-300 bg-slate-50/80 hover:border-indigo-400'
                      }`}
                    >
                      {selectedOption ? (
                        <span className="font-bold text-indigo-700 text-lg sm:text-xl">
                          {selectedOption.text}
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                          Arrastra o toca aquí
                        </span>
                      )}
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        )}

        {/* Activity 3 & 8: Error Correction */}
        {level.type === 'error-correction' && (
          <div className="w-full max-w-2xl text-center py-6">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">
              Paso 1: Haz clic en la palabra que tiene el error gramatical
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-6">
              {level.sentenceWords?.map((word) => {
                const isSelected = identifiedErrorWordId === word.id;
                const isIdentifiedError = word.isError && isSelected;

                return (
                  <button
                    key={word.id}
                    onClick={() => handleSelectErrorWord(word)}
                    disabled={isSubmitting || (identifiedErrorWordId !== null && isIdentifiedError)}
                    className={`px-4 py-2.5 rounded-xl text-lg sm:text-xl font-semibold border-2 transition-all cursor-pointer ${
                      isSelected
                        ? isIdentifiedError
                          ? 'bg-rose-50 border-rose-400 text-rose-700 line-through'
                          : 'bg-amber-50 border-amber-400 text-amber-700'
                        : 'bg-white border-slate-200 hover:border-indigo-400 hover:shadow-sm text-slate-800'
                    }`}
                  >
                    {word.text}
                  </button>
                );
              })}
            </div>

            {/* Correction Slot appears when error is identified */}
            {identifiedErrorWordId && (
              <div className="animate-in fade-in duration-200 pt-4 border-t border-slate-100">
                <p className="text-xs uppercase font-bold text-indigo-600 tracking-wider mb-3">
                  Paso 2: Selecciona la pieza correcta para reemplazar el error
                </p>
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverTarget('error-slot');
                  }}
                  onDragLeave={() => setDragOverTarget(null)}
                  onDrop={handleDropOnSlot}
                  className={`inline-flex items-center justify-center min-w-[160px] h-12 rounded-2xl border-2 border-dashed px-4 ${
                    dragOverTarget === 'error-slot'
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-indigo-300 bg-indigo-50/40'
                  }`}
                >
                  {selectedCorrection ? (
                    <span className="font-bold text-indigo-700 text-lg">
                      {selectedCorrection.text}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold text-indigo-600">
                      Reemplazo de "{level.sentenceWords?.find((w) => w.id === identifiedErrorWordId)?.text}"
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Activity 4, 5, 6, 9, 10: Sentence Construction (Unscramble) */}
        {(level.type === 'unscramble-affirmative' ||
          level.type === 'unscramble-negative' ||
          level.type === 'unscramble-interrogative' ||
          level.type === 'complex-challenge') && (
          <div className="w-full max-w-3xl text-center py-4">
            <p className="text-xs uppercase font-bold text-slate-400 tracking-wider mb-4">
              Rompecabezas: Coloca las fichas en orden
            </p>

            {/* Target Slots Track */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverTarget('track');
              }}
              onDragLeave={() => setDragOverTarget(null)}
              onDrop={handleDropOnSlot}
              className={`min-h-[72px] p-3 rounded-2xl border-2 border-dashed flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-4 transition-all ${
                dragOverTarget === 'track'
                  ? 'border-indigo-500 bg-indigo-50/60'
                  : placedPieces.length > 0
                  ? 'border-indigo-200 bg-slate-50/50'
                  : 'border-slate-300 bg-slate-50/80'
              }`}
            >
              {placedPieces.length === 0 ? (
                <span className="text-xs font-semibold text-slate-400 py-3">
                  Toca las fichas inferiores o arrástralas aquí para armar la oración
                </span>
              ) : (
                placedPieces.map((piece, index) => (
                  <button
                    key={piece.id}
                    onClick={() => handlePlacedPieceClick(piece)}
                    title="Toca para remover"
                    className="group relative px-4 py-2.5 bg-indigo-600 text-white font-bold text-base sm:text-lg rounded-xl shadow-sm hover:bg-rose-600 transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>{piece.text}</span>
                    <span className="text-[10px] opacity-70 group-hover:opacity-100">✕</span>
                  </button>
                ))
              )}
            </div>

            {placedPieces.length > 0 && (
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    sounds.playClick();
                    setAvailablePieces(level.availablePieces || []);
                    setPlacedPieces([]);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 underline transition-colors cursor-pointer"
                >
                  Reiniciar fichas
                </button>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Bottom Area: Puzzle Word Tiles / Options Deck */}
      <div className="bg-slate-50/90 rounded-2xl border border-slate-200/80 p-5 sm:p-6 text-center">
        <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 flex items-center justify-center gap-1.5">
          <span>Fichas Disponibles</span>
          <span className="text-slate-300">·</span>
          <span className="text-[11px] font-normal text-slate-400">Toca o arrastra</span>
        </div>

        {/* Options for Fill-in-the-blank & Time expressions */}
        {(level.type === 'fill-blank' || level.type === 'time-expression') && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {level.options?.map((option) => (
              <button
                key={option.id}
                draggable={!isSubmitting}
                onDragStart={(e) => handleDragStart(e, option)}
                onClick={() => handleSelectOption(option)}
                disabled={isSubmitting}
                className="px-5 py-3 rounded-xl bg-white text-slate-800 font-bold text-base sm:text-lg border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        {/* Options for Error Correction */}
        {level.type === 'error-correction' && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
            {level.errorCorrectionOptions?.map((option) => (
              <button
                key={option.id}
                draggable={!isSubmitting && Boolean(identifiedErrorWordId)}
                onDragStart={(e) => handleDragStart(e, option)}
                onClick={() => handleSelectCorrectionPiece(option)}
                disabled={isSubmitting || !identifiedErrorWordId}
                className={`px-5 py-3 rounded-xl font-bold text-base sm:text-lg border-2 transition-all ${
                  identifiedErrorWordId
                    ? 'bg-white border-indigo-400 text-indigo-700 hover:bg-indigo-50 hover:shadow-md active:scale-95 cursor-pointer'
                    : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60'
                }`}
              >
                {option.text}
              </button>
            ))}
          </div>
        )}

        {/* Options for Sentence Unscramble Tasks */}
        {(level.type === 'unscramble-affirmative' ||
          level.type === 'unscramble-negative' ||
          level.type === 'unscramble-interrogative' ||
          level.type === 'complex-challenge') && (
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 min-h-[56px]">
            {availablePieces.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                Todas las fichas han sido colocadas arriba
              </span>
            ) : (
              availablePieces.map((piece) => (
                <button
                  key={piece.id}
                  draggable={!isSubmitting}
                  onDragStart={(e) => handleDragStart(e, piece)}
                  onClick={() => handlePieceClick(piece)}
                  disabled={isSubmitting}
                  className="px-5 py-3 rounded-xl bg-white text-slate-800 font-bold text-base sm:text-lg border-2 border-slate-200 hover:border-indigo-500 hover:text-indigo-600 hover:shadow-md active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {piece.text}
                </button>
              ))
            )}
          </div>
        )}

      </div>
    </div>
  );
};
