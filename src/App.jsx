import React, { useState, useEffect } from 'react';
import LevelSelection from './components/LevelSelection';
import SpellingPractice from './components/SpellingPractice';
import Results from './components/Results';
import { spellingLevels } from './data/words';

// App states
const SCREENS = {
  LEVEL_SELECT: 'level_select',
  PRACTICE: 'practice',
  RESULTS: 'results'
};

function App() {
  const [currentScreen, setCurrentScreen] = useState(SCREENS.LEVEL_SELECT);
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [finalScore, setFinalScore] = useState({ correct: 0, total: 0, wrongWords: [] });
  const [progress, setProgress] = useState({});

  // Load progress and restore session from localStorage
  useEffect(() => {
    const savedProgress = localStorage.getItem('spellbee_progress');
    if (savedProgress) {
      setProgress(JSON.parse(savedProgress));
    }

    // Restore active session (screen + level) if one exists
    try {
      const savedSession = localStorage.getItem('spellbee_app_session');
      if (savedSession) {
        const { screen, levelId } = JSON.parse(savedSession);
        if (screen === SCREENS.PRACTICE && levelId) {
          const level = spellingLevels.find(l => l.id === levelId);
          if (level) {
            // Only resume if there's actually saved practice data
            const practiceData = localStorage.getItem(`spellbee_session_${levelId}`);
            if (practiceData) {
              setSelectedLevel(level);
              setCurrentScreen(SCREENS.PRACTICE);
            }
          }
        }
      }
    } catch {}
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
    localStorage.setItem('spellbee_app_session', JSON.stringify({ screen: SCREENS.PRACTICE, levelId: level.id }));
  };

  // Handle going back to level selection
  const handleBack = () => {
    setSelectedLevel(null);
    setCurrentScreen(SCREENS.LEVEL_SELECT);
    localStorage.removeItem('spellbee_app_session');
  };

  // Handle practice completion
  const handleComplete = (score) => {
    setFinalScore(score);
    setCurrentScreen(SCREENS.RESULTS);
    localStorage.removeItem('spellbee_app_session');
  };

  // Handle restart practice
  const handleRestart = () => {
    setCurrentScreen(SCREENS.PRACTICE);
    localStorage.setItem('spellbee_app_session', JSON.stringify({ screen: SCREENS.PRACTICE, levelId: selectedLevel.id }));
  };

  // Reset all progress
  const handleResetProgress = () => {
    if (window.confirm('Are you sure you want to reset all your progress?')) {
      setProgress({});
      localStorage.removeItem('spellbee_progress');
      // Also clear all session and wrong words data
      spellingLevels.forEach(level => {
        localStorage.removeItem(`spellbee_session_${level.id}`);
        localStorage.removeItem(`spellbee_wrong_${level.id}`);
      });
      localStorage.removeItem('spellbee_app_session');
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
          wrongWords={finalScore.wrongWords || []}
          onBack={handleBack}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
