import React, { useState, useEffect } from 'react';
import LevelSelection from './components/LevelSelection';
import SpellingPractice from './components/SpellingPractice';
import Results from './components/Results';

// App states
const SCREENS = {
  LEVEL_SELECT: 'level_select',
  PRACTICE: 'practice',
  RESULTS: 'results'
};

function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.LEVEL_SELECT);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0 });
  const [progress, setProgress] = useState({});

  // Load progress from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('spellbee_progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }
  }, []);

  // Save progress to localStorage
  const updateProgress = (levelId, data) => {
    setProgress(prev => {
      const updated = {
        ...prev,
        [levelId]: {
          completed: Math.max(prev[levelId]?.completed || 0, data.completed),
          correct: Math.max(prev[levelId]?.correct || 0, data.correct)
        }
      };
      localStorage.setItem('spellbee_progress', JSON.stringify(updated));
      return updated;
    });
  };

  // Handle level selection
  const handleSelectLevel = (level) => {
    setSelectedLevel(level);
    setCurrentScreen(SCREENS.PRACTICE);
  };

  // Handle going back to level selection
  const handleBack = () => {
    setSelectedLevel(null);
    setCurrentScreen(SCREENS.LEVEL_SELECT);
  };

  // Handle practice completion
  const handleComplete = (score) => {
    setFinalScore(score);
    setCurrentScreen(SCREENS.RESULTS);
  };

  // Handle restart practice
  const handleRestart = () => {
    setCurrentScreen(SCREENS.PRACTICE);
  };

  // Reset all progress
  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all your progress?')) {
      setProgress({});
      localStorage.removeItem('spellbee_progress');
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

export default App;
