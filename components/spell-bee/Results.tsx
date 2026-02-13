"use client";

import React from "react";
import Confetti from "./Confetti";

interface ResultsProps {
  level: any;
  score: { correct: number; total: number };
  onBack: () => void;
  onRestart: () => void;
}

const Results = ({ level, score, onBack, onRestart }: ResultsProps) => {
  const percentage =
    score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;

  const getGrade = () => {
    if (percentage >= 90)
      return { text: "Spelling Champion!", emoji: "\u{1F3C6}", color: "text-yellow-500" };
    if (percentage >= 80)
      return { text: "Excellent!", emoji: "\u{1F31F}", color: "text-green-500" };
    if (percentage >= 70)
      return { text: "Great Job!", emoji: "\u{1F44F}", color: "text-blue-500" };
    if (percentage >= 60)
      return { text: "Good Effort!", emoji: "\u{1F4AA}", color: "text-purple-500" };
    return { text: "Keep Practicing!", emoji: "\u{1F4DA}", color: "text-orange-500" };
  };

  const grade = getGrade();

  const getMessage = () => {
    if (percentage >= 90) return "Wow! You're an amazing speller!";
    if (percentage >= 80)
      return "Great work! You've mastered most of these words!";
    if (percentage >= 70)
      return "Nice job! A little more practice and you'll be a pro!";
    if (percentage >= 60) return "Good effort! Keep practicing!";
    return "Don't give up! Practice makes perfect!";
  };

  const starCount = Math.ceil(percentage / 20);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      {percentage >= 80 && <Confetti />}

      <div className="glass-card p-8 max-w-lg w-full text-center">
        {/* Trophy/Badge */}
        <div className="text-8xl mb-4 bee-bounce">{grade.emoji}</div>

        {/* Grade Title */}
        <h1
          className={`text-4xl font-bold mb-3 text-kid-title ${grade.color}`}
        >
          {grade.text}
        </h1>

        {/* Level Badge */}
        <div
          className={`inline-flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r ${level.color} text-white font-semibold mb-6 text-lg`}
        >
          <span>{level.emoji}</span>
          <span>{level.name} Complete!</span>
        </div>

        {/* Score Display */}
        <div className="bg-gray-100 rounded-2xl p-6 mb-6">
          <div className="text-6xl font-bold text-purple-600 mb-2 text-kid-title">
            {percentage}%
          </div>
          <p className="text-gray-600 text-lg text-kid-body">
            You spelled{" "}
            <span className="font-bold text-green-600">{score.correct}</span>{" "}
            out of <span className="font-bold">{score.total}</span> words
            correctly!
          </p>
        </div>

        {/* Stars */}
        <div className="flex justify-center gap-3 mb-6">
          {[...Array(5)].map((_, i) => (
            <span
              key={i}
              className={`text-5xl ${
                i < starCount ? "star-spin" : "opacity-30"
              }`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              {"\u2B50"}
            </span>
          ))}
        </div>

        {/* Message */}
        <p className="text-gray-600 text-xl mb-8 text-kid-body">
          {getMessage()}
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button onClick={onRestart} className="btn-primary text-lg px-8 py-4">
            Practice Again
          </button>
          <button onClick={onBack} className="btn-secondary text-lg px-8 py-4">
            Choose Level
          </button>
        </div>

        {/* Stats Summary */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-base font-semibold text-gray-500 mb-4 text-kid-title">
            Your Stats
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-600">
                {score.correct}
              </div>
              <div className="text-sm text-green-600 font-medium">Correct</div>
            </div>
            <div className="bg-red-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-red-500">
                {score.total - score.correct}
              </div>
              <div className="text-sm text-red-500 font-medium">Incorrect</div>
            </div>
            <div className="bg-purple-50 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-600">
                {score.total}
              </div>
              <div className="text-sm text-purple-600 font-medium">Total</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Results;
