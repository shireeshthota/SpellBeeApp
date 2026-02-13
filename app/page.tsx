"use client";

import React, { useState, useEffect } from "react";
import LevelSelection from "@/components/spell-bee/LevelSelection";
import SpellingPractice from "@/components/spell-bee/SpellingPractice";
import Results from "@/components/spell-bee/Results";

const SCREENS = {
  LEVEL_SELECT: "level_select",
  PRACTICE: "practice",
  RESULTS: "results",
} as const;

type Screen = (typeof SCREENS)[keyof typeof SCREENS];

export default function Home() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(
    SCREENS.LEVEL_SELECT
  );
  const [selectedLevel, setSelectedLevel] = useState<any>(null);
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0 });
  const [progress, setProgress] = useState<Record<string, any>>({});

  useEffect(() => {
    const savedProgress = localStorage.getItem("spellbee_progress");
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  const updateProgress = (levelId: string, data: any) => {
    setProgress((prev) => {
      const updated = {
        ...prev,
        [levelId]: {
          completed: Math.max(prev[levelId]?.completed || 0, data.completed),
          correct: Math.max(prev[levelId]?.correct || 0, data.correct),
        },
      };
      localStorage.setItem("spellbee_progress", JSON.stringify(updated));
      return updated;
    });
  };

  const handleSelectLevel = (level: any) => {
    setSelectedLevel(level);
    setCurrentScreen(SCREENS.PRACTICE);
  };

  const handleBack = () => {
    setSelectedLevel(null);
    setCurrentScreen(SCREENS.LEVEL_SELECT);
  };

  const handleComplete = (score: { correct: number; total: number }) => {
    setFinalScore(score);
    setCurrentScreen(SCREENS.RESULTS);
  };

  const handleRestart = () => {
    setCurrentScreen(SCREENS.PRACTICE);
  };

  const handleResetProgress = () => {
    if (window.confirm("Are you sure you want to reset all your progress?")) {
      setProgress({});
      localStorage.removeItem("spellbee_progress");
    }
  };

  return (
    <div className="min-h-screen">
      {currentScreen === SCREENS.LEVEL_SELECT && (
        <LevelSelection
          onSelectLevel={handleSelectLevel}
          progress={progress}
          onResetProgress={handleResetProgress}
        />
      )}

      {currentScreen === SCREENS.PRACTICE && selectedLevel && (
        <SpellingPractice
          level={selectedLevel}
          onBack={handleBack}
          onComplete={handleComplete}
          updateProgress={updateProgress}
        />
      )}

      {currentScreen === SCREENS.RESULTS && selectedLevel && (
        <Results
          level={selectedLevel}
          score={finalScore}
          onBack={handleBack}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}
