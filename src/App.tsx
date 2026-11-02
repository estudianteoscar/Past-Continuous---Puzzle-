/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useGameSocket } from './hooks/useGameSocket';
import { Header } from './components/Header';
import { Lobby } from './components/Lobby';
import { PuzzleBoard } from './components/PuzzleBoard';
import { ResultsScreen } from './components/ResultsScreen';
import { TeacherDashboard } from './components/TeacherDashboard';
import { GrammarGuide } from './components/GrammarGuide';
import { GAME_LEVELS } from './data/levels';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'game' | 'rules' | 'teacher'>('game');
  
  const {
    roomState,
    currentPlayer,
    errorMsg,
    setErrorMsg,
    registerPlayer,
    startGame,
    submitAnswer,
    resetRoom,
    seedDemoPlayers,
    logoutLocalPlayer,
  } = useGameSocket({ roomId: 'classroom' });

  const players = roomState?.players || {};
  const maxPlayers = roomState?.maxPlayers || 23;
  const playerCount = Object.keys(players).length;

  const handleAnswerSubmit = async (payload: {
    levelNumber: number;
    isCorrect: boolean;
    timeSpentSeconds: number;
    studentAnswer: string;
    correctAnswer: string;
  }) => {
    await submitAnswer(payload);
  };

  const handlePlayAgain = async () => {
    // If the room was completed or player wants to join next round
    logoutLocalPlayer();
    setCurrentTab('game');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 selection:bg-indigo-500 selection:text-white">
      {/* Top Bar with Top Bar Contract */}
      <Header
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        playerCount={playerCount}
        maxPlayers={maxPlayers}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col justify-start">
        {currentTab === 'rules' && (
          <GrammarGuide onBackToGame={() => setCurrentTab('game')} />
        )}

        {currentTab === 'teacher' && (
          <TeacherDashboard
            roomState={roomState}
            onStartGame={startGame}
            onResetRoom={resetRoom}
            onSeedDemo={seedDemoPlayers}
            onBackToGame={() => setCurrentTab('game')}
          />
        )}

        {currentTab === 'game' && (
          <>
            {/* If room is in waiting phase OR player is not yet registered */}
            {(!roomState || roomState.status === 'waiting' || !currentPlayer) && (
              <Lobby
                players={players}
                currentPlayer={currentPlayer}
                maxPlayers={maxPlayers}
                onRegister={registerPlayer}
                onStartGame={startGame}
                onOpenTeacher={() => setCurrentTab('teacher')}
                errorMsg={errorMsg}
                onClearError={() => setErrorMsg(null)}
              />
            )}

            {/* If room is in progress AND player is registered and actively playing */}
            {roomState?.status === 'in-progress' && currentPlayer && !currentPlayer.isFinished && (
              (() => {
                const levelIndex = Math.min(currentPlayer.currentLevel - 1, GAME_LEVELS.length - 1);
                const currentLevelData = GAME_LEVELS[levelIndex];

                return (
                  <PuzzleBoard
                    key={currentLevelData.id}
                    level={currentLevelData}
                    totalLevels={GAME_LEVELS.length}
                    player={currentPlayer}
                    onAnswerSubmit={handleAnswerSubmit}
                  />
                );
              })()
            )}

            {/* If player has finished the 10 levels OR room is marked completed */}
            {((currentPlayer && currentPlayer.isFinished) ||
              (roomState?.status === 'completed' && currentPlayer)) && (
              <ResultsScreen
                player={currentPlayer}
                roomState={roomState}
                onPlayAgain={handlePlayAgain}
                onOpenTeacher={() => setCurrentTab('teacher')}
              />
            )}
          </>
        )}
      </main>

      {/* Subtle Footer */}
      <footer className="w-full py-4 border-t border-slate-200/80 bg-white text-center text-xs text-slate-500">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Past Continuous Tense · Educational Gamified Assessment Platform</span>
          <span className="text-slate-400">Capacidad: 23 Estudiantes Simultáneos · 10 Niveles</span>
        </div>
      </footer>
    </div>
  );
}
