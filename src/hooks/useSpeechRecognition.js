import { useState, useEffect, useCallback, useRef } from 'react';

const useSpeechRecognition = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();

      const recognition = recognitionRef.current;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event) => {
        setError(event.error);
        setIsListening(false);
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let currentInterim = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            // For spelling, we want to capture letter-by-letter
            finalTranscript += result[0].transcript;
          } else {
            currentInterim += result[0].transcript;
          }
        }

        if (finalTranscript) {
          // Process the transcript to extract letters for spelling
          const processed = processSpellingInput(finalTranscript);
          setTranscript(prev => prev + processed);
        }

        setInterimTranscript(currentInterim);
      };
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Process spoken input to extract individual letters
  const processSpellingInput = (input) => {
    // Clean up common speech recognition patterns
    let processed = input.toLowerCase().trim();

    // Handle spelled out letters like "a b c" or "a, b, c"
    // Also handle phonetic alphabet
    const letterMappings = {
      'alpha': 'a', 'bravo': 'b', 'charlie': 'c', 'delta': 'd',
      'echo': 'e', 'foxtrot': 'f', 'golf': 'g', 'hotel': 'h',
      'india': 'i', 'juliet': 'j', 'kilo': 'k', 'lima': 'l',
      'mike': 'm', 'november': 'n', 'oscar': 'o', 'papa': 'p',
      'quebec': 'q', 'romeo': 'r', 'sierra': 's', 'tango': 't',
      'uniform': 'u', 'victor': 'v', 'whiskey': 'w', 'xray': 'x',
      'yankee': 'y', 'zulu': 'z',
      'space': ' ', 'dash': '-', 'hyphen': '-'
    };

    // Replace phonetic words with letters
    Object.entries(letterMappings).forEach(([word, letter]) => {
      processed = processed.replace(new RegExp(word, 'gi'), letter);
    });

    // Remove common filler words and punctuation
    processed = processed
      .replace(/\b(um|uh|like|and|then)\b/gi, '')
      .replace(/[.,!?]/g, ' ')
      .replace(/\s+/g, '');

    return processed;
  };

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setTranscript('');
      setInterimTranscript('');
      try {
        recognitionRef.current.start();
      } catch (err) {
        // Already started
        console.log('Recognition already started');
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript
  };
};

export default useSpeechRecognition;
