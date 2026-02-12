import React, { useState, useEffect, useRef, useCallback } from 'react';
import Confetti from './Confetti';

const SESSION_KEY = (levelId) => `spellbee_session_${levelId}`;

const saveSession = (levelId, data) => {
  localStorage.setItem(SESSION_KEY(levelId), JSON.stringify(data));
};

const loadSession = (levelId) => {
  try {
    const saved = localStorage.getItem(SESSION_KEY(levelId));
    return saved ? JSON.parse(saved) : null;
  } catch { return null; }
};

const clearSession = (levelId) => {
  localStorage.removeItem(SESSION_KEY(levelId));
};

const SpellingPractice = ({ level, onBack, onComplete, updateProgress }) => {
  const [words, setWords] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [showCorrectWord, setShowCorrectWord] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [streak, setStreak] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [wrongWords, setWrongWords] = useState([]);

  // Speech recognition states
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [micPermission, setMicPermission] = useState('unknown'); // 'unknown', 'granted', 'denied', 'unsupported'
  const [micError, setMicError] = useState('');

  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const fullTranscriptRef = useRef(''); // Keep track of full accumulated transcript

  // Check microphone permission and setup speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setMicPermission('unsupported');
      setMicError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    // Check/request microphone permission
    const checkMicPermission = async () => {
      try {
        // Request microphone access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        // Stop the stream immediately - we just needed permission
        stream.getTracks().forEach(track => track.stop());
        setMicPermission('granted');
        setMicError('');

        // Setup recognition after permission granted
        setupRecognition();
      } catch (err) {
        console.error('Microphone permission error:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setMicPermission('denied');
          setMicError('Microphone access denied. Please allow microphone in browser settings.');
        } else if (err.name === 'NotFoundError') {
          setMicPermission('denied');
          setMicError('No microphone found. Please connect a microphone.');
        } else {
          setMicPermission('denied');
          setMicError(`Microphone error: ${err.message}`);
        }
      }
    };

    const setupRecognition = () => {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        console.log('Recognition started');
        setIsListening(true);
        setMicError('');
      };

      recognition.onend = () => {
        console.log('Recognition ended');
        // Auto-restart if still supposed to be listening (handles pauses)
        // The isListening state might still be true if user didn't press space
        // We use a small delay to check and restart
        setTimeout(() => {
          if (recognitionRef.current && recognitionRef.current._shouldKeepListening) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.log('Could not restart:', e);
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        }, 100);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);

        if (event.error === 'not-allowed') {
          setMicPermission('denied');
          setMicError('Microphone access denied. Please allow microphone access.');
          recognition._shouldKeepListening = false;
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Don't show error for no-speech, just keep listening
          console.log('No speech detected, continuing to listen...');
        } else if (event.error === 'audio-capture') {
          setMicError('No microphone found. Please check your microphone.');
          recognition._shouldKeepListening = false;
          setIsListening(false);
        } else if (event.error === 'network') {
          setMicError('Network error. Please check your internet connection.');
          recognition._shouldKeepListening = false;
          setIsListening(false);
        } else if (event.error !== 'aborted') {
          setMicError(`Error: ${event.error}`);
        }
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        // Accumulate final transcripts
        if (finalTranscript) {
          fullTranscriptRef.current += finalTranscript;
        }

        // Show live transcript (accumulated + current interim)
        const displayTranscript = fullTranscriptRef.current + interimTranscript;
        setLiveTranscript(displayTranscript);

        // Update input with cleaned text (remove spaces for spelling)
        const cleaned = displayTranscript.toLowerCase().replace(/\s+/g, '');
        setUserInput(cleaned);
      };

      recognitionRef.current = recognition;
    };

    checkMicPermission();

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
      }
    };
  }, []);

  // Find the best kid-friendly voice
  useEffect(() => {
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      const preferredVoices = ['Samantha', 'Karen', 'Moira', 'Google US English', 'Microsoft Zira'];

      let bestVoice = null;
      for (const preferred of preferredVoices) {
        bestVoice = voices.find(v => v.name.includes(preferred));
        if (bestVoice) break;
      }

      if (!bestVoice) {
        bestVoice = voices.find(v => v.lang.startsWith('en'));
      }

      if (bestVoice) setSelectedVoice(bestVoice);
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, []);

  // Load session or shuffle words on mount
  useEffect(() => {
    const saved = loadSession(level.id);
    if (saved && saved.words && saved.words.length > 0) {
      setWords(saved.words);
      setCurrentIndex(saved.currentIndex || 0);
      setScore(saved.score || { correct: 0, total: 0 });
      setStreak(saved.streak || 0);
      setWrongWords(saved.wrongWords || []);
    } else {
      const shuffled = [...level.words].sort(() => Math.random() - 0.5);
      setWords(shuffled);
    }
  }, [level]);

  const currentWord = words[currentIndex] || '';

  // Speak the word - slow and clear for kids
  const speakWord = useCallback(() => {
    if ('speechSynthesis' in window && currentWord) {
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(currentWord);
      utterance.rate = 0.75;       // Clear speed for kids
      utterance.pitch = 1.0;       // Natural pitch
      utterance.volume = 1.0;      // Full volume
      utterance.lang = 'en-US';

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);

      window.speechSynthesis.speak(utterance);
    }
  }, [currentWord, selectedVoice]);

  // Auto-speak word when it changes
  useEffect(() => {
    if (currentWord && !showResult) {
      const timer = setTimeout(() => speakWord(), 600);
      return () => clearTimeout(timer);
    }
  }, [currentWord, showResult, speakWord]);

  // Start listening
  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setMicError('Speech recognition not available');
      return;
    }

    if (micPermission !== 'granted') {
      setMicError('Please allow microphone access first');
      return;
    }

    // Reset transcript accumulator
    fullTranscriptRef.current = '';
    setUserInput('');
    setLiveTranscript('');
    setMicError('');

    // Set flag to keep listening through pauses
    recognitionRef.current._shouldKeepListening = true;

    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Start error:', e);
      if (e.message && e.message.includes('already started')) {
        recognitionRef.current._shouldKeepListening = false;
        recognitionRef.current.stop();
        setTimeout(() => {
          try {
            fullTranscriptRef.current = '';
            recognitionRef.current._shouldKeepListening = true;
            recognitionRef.current.start();
          } catch (e2) {
            setMicError('Could not start listening. Please try again.');
          }
        }, 100);
      } else {
        setMicError('Could not start listening. Please try again.');
      }
    }
  }, [micPermission]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Clear the flag so it doesn't auto-restart
      recognitionRef.current._shouldKeepListening = false;
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsListening(false);
  }, []);

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Check spelling
  const checkSpelling = useCallback(() => {
    if (!userInput.trim()) return;

    stopListening();

    const userAnswer = userInput.toLowerCase().trim();
    const correctAnswer = currentWord.toLowerCase();
    const correct = userAnswer === correctAnswer;

    setIsCorrect(correct);
    setShowResult(true);
    setLiveTranscript('');

    let newScore, newStreak, newWrongWords;

    if (correct) {
      newScore = { correct: score.correct + 1, total: score.total + 1 };
      newStreak = streak + 1;
      newWrongWords = wrongWords;
      setScore(newScore);
      setStreak(newStreak);
      updateProgress(level.id, { completed: currentIndex + 1, correct: newScore.correct });

      if (newStreak % 3 === 0) {
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 3000);
      }
    } else {
      newScore = { correct: score.correct, total: score.total + 1 };
      newStreak = 0;
      newWrongWords = [...wrongWords, { word: currentWord, userAnswer }];
      setScore(newScore);
      setStreak(newStreak);
      setWrongWords(newWrongWords);
    }

    // Persist session after each answer
    saveSession(level.id, {
      words,
      currentIndex,
      score: newScore,
      streak: newStreak,
      wrongWords: newWrongWords,
    });

    // Save wrong words in real-time so main page can show them
    if (newWrongWords.length > 0) {
      localStorage.setItem(`spellbee_wrong_${level.id}`, JSON.stringify(newWrongWords));
    }
  }, [userInput, currentWord, currentIndex, score, streak, wrongWords, words, level.id, updateProgress, stopListening]);

  // Next word
  const nextWord = useCallback(() => {
    if (currentIndex < words.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      setUserInput('');
      setShowResult(false);
      setShowCorrectWord(false);
      setLiveTranscript('');
      fullTranscriptRef.current = ''; // Reset accumulated transcript

      // Persist session with advanced index
      saveSession(level.id, {
        words,
        currentIndex: nextIndex,
        score,
        streak,
        wrongWords,
      });
    } else {
      // Practice complete — clear session and save wrong words for level review
      clearSession(level.id);
      if (wrongWords.length > 0) {
        localStorage.setItem(`spellbee_wrong_${level.id}`, JSON.stringify(wrongWords));
      } else {
        localStorage.removeItem(`spellbee_wrong_${level.id}`);
      }
      onComplete({ ...score, wrongWords });
    }
  }, [currentIndex, words, score, streak, wrongWords, level.id, onComplete]);

  // Restart exercise
  const restartExercise = useCallback(() => {
    const shuffled = [...level.words].sort(() => Math.random() - 0.5);
    setWords(shuffled);
    setCurrentIndex(0);
    setUserInput('');
    setShowResult(false);
    setShowCorrectWord(false);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setWrongWords([]);
    setLiveTranscript('');
    fullTranscriptRef.current = ''; // Reset accumulated transcript
    clearSession(level.id);
    localStorage.removeItem(`spellbee_wrong_${level.id}`);
  }, [level.words, level.id]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Spacebar - toggle listening or check/next
      if (e.code === 'Space' && document.activeElement !== inputRef.current) {
        e.preventDefault();

        if (showResult) {
          nextWord();
        } else if (isListening) {
          stopListening();
          // Check after a brief delay to get final transcript
          setTimeout(() => {
            if (userInput.trim()) {
              checkSpelling();
            }
          }, 500);
        } else {
          startListening();
        }
      }

      // Enter - check or next
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!showResult && userInput.trim()) {
          stopListening();
          checkSpelling();
        } else if (showResult) {
          nextWord();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showResult, userInput, isListening, checkSpelling, nextWord, startListening, stopListening]);

  const progressPercent = words.length > 0 ? Math.round((currentIndex / words.length) * 100) : 0;
  const canUseVoice = micPermission === 'granted' && recognitionRef.current;

  return (
    <div className="min-h-screen flex flex-col p-4">
      {showConfetti && <Confetti />}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-white/90 hover:text-white transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <div className="flex items-center gap-2">
          <span className="text-2xl">{level.emoji}</span>
          <span className="text-white font-bold text-lg">{level.name}</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={restartExercise}
            className="bg-white/20 text-white px-3 py-2 rounded-full hover:bg-white/30 transition-colors"
            title="Restart"
          >
            🔄
          </button>

          {streak > 0 && (
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full font-bold">
              🔥 {streak}
            </div>
          )}
          <div className="bg-white/20 text-white px-4 py-2 rounded-full font-bold">
            {score.correct}/{score.total}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="glass-card p-2 mb-6">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${level.color} transition-all duration-500`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-center text-sm text-gray-600 mt-1">
          Word {currentIndex + 1} of {words.length}
        </p>
      </div>

      {/* Main Area */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="glass-card p-8 max-w-xl w-full">

          {/* Listen Button */}
          <div className="text-center mb-8">
            <button
              onClick={speakWord}
              disabled={isSpeaking}
              className={`p-6 rounded-full transition-all duration-200 ${
                isSpeaking
                  ? 'bg-purple-500 text-white pulse-glow scale-110'
                  : 'bg-purple-100 text-purple-600 hover:bg-purple-200 hover:scale-105'
              }`}
            >
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </button>
            <p className="text-gray-600 mt-3 text-lg">
              {isSpeaking ? 'Listen carefully...' : 'Tap to hear the word'}
            </p>
          </div>

          {/* Live Transcription Display */}
          {isListening && (
            <div className="mb-4 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
              <p className="text-sm text-blue-600 mb-1">🎤 Hearing you say:</p>
              <p className="text-2xl font-bold text-blue-800 min-h-[2rem]">
                {liveTranscript || '...'}
              </p>
            </div>
          )}

          {/* Input */}
          <div className="mb-6">
            <input
              ref={inputRef}
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              disabled={showResult}
              placeholder="Click here to type, or press Space to speak..."
              className={`input-spelling ${
                showResult
                  ? isCorrect
                    ? 'border-green-400 bg-green-50'
                    : 'border-red-400 bg-red-50'
                  : 'border-purple-300 focus:border-purple-500'
              }`}
            />
          </div>

          {/* Microphone Error */}
          {micError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-center">
              {micError}
            </div>
          )}

          {/* Voice Input Button */}
          {!showResult && (
            <div className="flex justify-center mb-6">
              {micPermission === 'unsupported' ? (
                <p className="text-gray-500 text-sm">Voice input not supported in this browser</p>
              ) : micPermission === 'denied' ? (
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-3 rounded-full bg-gray-200 text-gray-600"
                >
                  🎤 Microphone blocked - Click to retry
                </button>
              ) : (
                <button
                  onClick={toggleListening}
                  className={`px-8 py-4 rounded-full flex items-center gap-3 transition-all text-lg font-medium ${
                    isListening
                      ? 'bg-red-500 text-white listening-pulse'
                      : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:scale-105'
                  }`}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  {isListening ? '🔴 Listening... Press Space to Check' : '🎤 Press Space to Speak'}
                </button>
              )}
            </div>
          )}

          {/* Result */}
          {showResult && (
            <div className={`text-center p-6 rounded-xl mb-6 ${
              isCorrect ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isCorrect ? (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-5xl">✓</span>
                  <span className="text-2xl font-bold text-green-700">Correct!</span>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <span className="text-5xl">✗</span>
                    <span className="text-2xl font-bold text-red-700">Wrong</span>
                  </div>

                  {!showCorrectWord ? (
                    <button
                      onClick={() => setShowCorrectWord(true)}
                      className="text-red-600 underline hover:text-red-800 text-lg"
                    >
                      Show correct spelling
                    </button>
                  ) : (
                    <div className="mt-4 p-4 bg-white rounded-xl">
                      <p className="text-gray-500 text-sm mb-2">Correct spelling:</p>
                      <p className="text-4xl font-bold text-gray-800 spelling-display">
                        {currentWord}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-center">
            {!showResult ? (
              <button
                onClick={() => { stopListening(); checkSpelling(); }}
                disabled={!userInput.trim()}
                className="btn-primary text-lg px-10 py-4 disabled:opacity-50"
              >
                Check
              </button>
            ) : (
              <button
                onClick={nextWord}
                className="btn-success text-lg px-10 py-4"
              >
                {currentIndex < words.length - 1 ? 'Next' : 'Finish'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Keyboard Hints */}
      <div className="text-center text-white/70 text-sm mt-4 space-y-1">
        <p>
          <kbd className="bg-white/20 px-2 py-1 rounded">Space</kbd>
          {' '}{showResult ? 'Next word' : isListening ? 'Stop & Check' : 'Start speaking'}
        </p>
        <p>
          <kbd className="bg-white/20 px-2 py-1 rounded">Enter</kbd>
          {' '}{showResult ? 'Next word' : 'Check answer'}
        </p>
      </div>

    </div>
  );
};

export default SpellingPractice;
