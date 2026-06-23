interface FlashCardProps {
  question: string;
  cardNumber: number;
  totalCards: number;
  difficulty: string;
}

export function FlashCard({
  question,
  cardNumber,
  totalCards,
  difficulty,
}: FlashCardProps) {
  return (
    <div className="flashcard">
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
  );
}
