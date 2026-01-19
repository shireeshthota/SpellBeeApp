import React, { useEffect, useState } from 'react';

const Confetti = () => {
  const [pieces, setPieces] = useState([]);

  useEffect(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#E91E63'];
    const shapes = ['circle', 'square', 'triangle'];

    const newPieces = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: Math.random() * 10 + 5,
      delay: Math.random() * 0.5,
      duration: Math.random() * 2 + 2,
      rotation: Math.random() * 360
    }));

    setPieces(newPieces);

    // Clean up after animation
    const timer = setTimeout(() => {
      setPieces([]);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  const getShapeStyle = (piece) => {
    const baseStyle = {
      position: 'absolute',
      left: `${piece.left}%`,
      top: '-20px',
      width: `${piece.size}px`,
      height: `${piece.size}px`,
      backgroundColor: piece.color,
      animationDelay: `${piece.delay}s`,
      animationDuration: `${piece.duration}s`,
      transform: `rotate(${piece.rotation}deg)`
    };

    if (piece.shape === 'circle') {
      return { ...baseStyle, borderRadius: '50%' };
    } else if (piece.shape === 'triangle') {
      return {
        ...baseStyle,
        width: 0,
        height: 0,
        backgroundColor: 'transparent',
        borderLeft: `${piece.size / 2}px solid transparent`,
        borderRight: `${piece.size / 2}px solid transparent`,
        borderBottom: `${piece.size}px solid ${piece.color}`
      };
    }

    return baseStyle;
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {pieces.map((piece) => (
        <div
          key={piece.id}
          className="confetti-piece"
          style={getShapeStyle(piece)}
        />
      ))}
    </div>
  );
};

export default Confetti;
