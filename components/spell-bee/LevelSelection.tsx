"use client";

import React from "react";
import { spellingLevels } from "./words";

interface LevelSelectionProps {
  onSelectLevel: (level: any) => void;
  progress: Record<string, any>;
  onResetProgress: () => void;
}

const LevelSelection = ({
  onSelectLevel,
  progress,
  onResetProgress,
}: LevelSelectionProps) => {
  const totalCompleted = Object.values(progress).reduce(
    (sum: number, p: any) => sum + (p.completed || 0),
    0
  );
  const totalCorrect = Object.values(progress).reduce(
    (sum: number, p: any) => sum + (p.correct || 0),
    0
  );

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="bee-bounce text-9xl mb-6">
          {"\u{1F41D}"}
        </div>
        <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg text-kid-title">
          Spell Bee!
        </h1>
        <p className="text-2xl text-white/90 text-kid-body">
          Pick a level and start practicing
        </p>
      </div>

      {/* Level List */}
      <div className="w-full max-w-md space-y-4 mb-8">
        {spellingLevels.map((level) => {
          const levelProgress = progress[level.id] || {
            completed: 0,
            correct: 0,
          };
          const totalLevelWords = level.words.length;
          const progressPercent = Math.round(
            (levelProgress.completed / totalLevelWords) * 100
          );

          return (
            <button
              key={level.id}
              onClick={() => onSelectLevel(level)}
              className={`w-full glass-card p-5 flex items-center gap-4 transform transition-all duration-200
                         hover:scale-102 hover:shadow-xl active:scale-98 cursor-pointer group`}
            >
              <div className="text-5xl flex-shrink-0">{level.emoji}</div>

              <div className="flex-1 text-left">
                <h2 className="text-xl font-bold text-gray-800 text-kid-title">
                  {level.name}
                </h2>
                <p className="text-gray-500 text-sm text-kid-body">
                  {totalLevelWords} words &bull; {level.description}
                </p>

                {levelProgress.completed > 0 && (
                  <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${level.color}`}
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </button>
          );
        })}
      </div>

      {/* Stats & Reset */}
      {totalCompleted > 0 && (
        <div className="glass-card p-6 w-full max-w-md text-center mb-6">
          <div className="flex justify-around mb-4">
            <div>
              <div className="text-3xl font-bold text-purple-600">
                {totalCompleted}
              </div>
              <div className="text-sm text-gray-500">Practiced</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-green-600">
                {totalCorrect}
              </div>
              <div className="text-sm text-gray-500">Correct</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600">
                {totalCompleted > 0
                  ? Math.round((totalCorrect / totalCompleted) * 100)
                  : 0}
                %
              </div>
              <div className="text-sm text-gray-500">Accuracy</div>
            </div>
          </div>

          <button
            onClick={onResetProgress}
            className="text-red-500 hover:text-red-700 text-sm font-medium underline transition-colors"
          >
            Reset All Progress
          </button>
        </div>
      )}

      <p className="text-white/70 text-center text-lg max-w-sm">
        {"Listen \u{1F50A} \u2192 Speak \u{1F3A4} or Type \u2192 Check \u2713"}
      </p>
    </div>
  );
};

export default LevelSelection;
