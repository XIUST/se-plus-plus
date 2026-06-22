import React from "react";

interface FlashCardProps {
  question: string;
  cardNumber: number;
  totalCards: number;
  difficulty: string;
  isFlipped: boolean;
  children: React.ReactNode;
}

export function FlashCard({ 
  question, 
  cardNumber, 
  totalCards, 
  difficulty, 
  isFlipped, 
  children 
}: FlashCardProps) {
  return (
    <div className="flashcard-container">
      <div className={`flashcard ${isFlipped ? "flipped" : ""}`}>
        
        <div className="flashcard-face flashcard-front">
          <div className="card-meta">
            <span className={`difficulty-badge ${difficulty}`}>
              {difficulty}
            </span>
            <span className="card-number">
              {cardNumber} / {totalCards}
            </span>
          </div>
          <h3 className="card-question">{question}</h3>
        </div>

        <div className="flashcard-face flashcard-back">
          {children}
        </div>
        
      </div>
    </div>
  );
}
