import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import type { Flashcard, AnswerEvaluationResult, SessionResult } from "@se-plus/shared";
import { generateFlashcards, evaluateAnswer } from "../../shared/api/client";
import { FlashCard } from "../../components/flashcards/FlashCard";
import { VoiceInput } from "../../components/voice-input/VoiceInput";

export function StudySession() {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();

  const [cards, setCards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<AnswerEvaluationResult | null>(null);
  const [results, setResults] = useState<{ flashcard: Flashcard; evaluation: AnswerEvaluationResult }[]>([]);

  const [phase, setPhase] = useState<'loading' | 'answering' | 'evaluating' | 'reviewed'>('loading');
  const [startTime, setStartTime] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isNotReady, setIsNotReady] = useState(false);

  useEffect(() => {
    if (!topic) return;
    loadCards();
  }, [topic]);

  const loadCards = async () => {
    setPhase('loading');
    setError(null);
    setErrorCode(null);
    setIsNotReady(false);
    setEvaluation(null);

    const res = await generateFlashcards({ topic: topic!, count: 10 });
    if (res.ok) {
      setCards(res.data.cards);
      setStartTime(Date.now());
      setPhase('answering');
    } else {
      setIsNotReady(res.error.code === "no_content");
      setErrorCode(res.error.code ?? null);
      setError(res.error.message);
    }
  };

  const handleTranscript = (text: string) => {
    setUserAnswer(prev => prev + (prev ? " " : "") + text);
  };

  const handleSubmit = async () => {
    if (!userAnswer.trim()) return;
    setPhase('evaluating');
    setError(null);
    setErrorCode(null);

    const card = cards[currentIndex];
    if (!card) return;

    const res = await evaluateAnswer({
      flashcardId: card.id,
      question: card.question,
      expectedAnswer: card.expectedAnswer,
      userAnswer: userAnswer.trim(),
      topic: topic!,
    });

    if (res.ok) {
      setEvaluation(res.data);
      setPhase('reviewed');
    } else {
      setErrorCode(res.error.code ?? null);
      setError(res.error.message);
      setPhase('answering');
    }
  };

  const handleRetry = () => {
    setError(null);
    setErrorCode(null);

    if (errorCode === "evaluation_failed") {
      handleSubmit();
    } else {
      loadCards();
    }
  };

  const handleNext = () => {
    if (!evaluation || !cards[currentIndex]) return;

    const newResults = [...results, { flashcard: cards[currentIndex]!, evaluation }];
    setResults(newResults);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setUserAnswer("");
      setEvaluation(null);
      setPhase('answering');
    } else {
      finishSession(newResults);
    }
  };

  const finishSession = (finalResults: { flashcard: Flashcard; evaluation: AnswerEvaluationResult }[]) => {
    let correct = 0;
    let partial = 0;
    let incorrect = 0;
    let totalScore = 0;
    const weakSpotsSet = new Set<string>();

    finalResults.forEach(({ evaluation: ev }) => {
      if (ev.verdict === 'correct') correct++;
      else if (ev.verdict === 'partial') partial++;
      else incorrect++;

      totalScore += ev.score;
      if (ev.keyMissed) {
        ev.keyMissed.forEach(m => weakSpotsSet.add(m));
      }
    });

    const averageScore = finalResults.length > 0 ? totalScore / finalResults.length : 0;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);

    const sessionResult: SessionResult = {
      topic: topic!,
      totalCards: cards.length,
      correct,
      partial,
      incorrect,
      averageScore,
      weakSpots: Array.from(weakSpotsSet).slice(0, 5),
      durationSeconds,
    };

    navigate('/results', { state: sessionResult });
  };

  if (error) {
    return (
      <div className="study-page">
        <div className={`notice ${isNotReady ? 'info' : 'error'}`}>
          {isNotReady ? (
            <>
              <strong>{topic}</strong> is still being prepared. Your notes were uploaded, but the vector index needs a minute or two to make them searchable. Please try again shortly.
            </>
          ) : error}
        </div>
        {(isNotReady || errorCode === "generation_failed" || errorCode === "evaluation_failed") && (
          <button className="btn-primary" onClick={handleRetry} style={{ marginBottom: '0.75rem' }}>Try again</button>
        )}
        <button className="btn-secondary" onClick={() => navigate('/')}>Back to Dashboard</button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="study-page" style={{ alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div className="loading-spinner"></div>
        <p>Generating flashcards for {topic}...</p>
      </div>
    );
  }

  const card = cards[currentIndex];
  if (!card) return null;

  const progressPercentage = ((currentIndex) / cards.length) * 100;

  return (
    <div className="study-page">
      <div className="study-header">
        <div className="study-header-top">
          <h2>{topic}</h2>
          <span style={{ color: 'var(--text-secondary)' }}>Card {currentIndex + 1} of {cards.length}</span>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }}></div>
        </div>
      </div>

      <FlashCard
        question={card.question}
        cardNumber={currentIndex + 1}
        totalCards={cards.length}
        difficulty={card.difficulty}
      />

      {phase === 'reviewed' && evaluation ? (
        <div className="evaluation-card">
          <div className="eval-header">
            <span className={`verdict-badge verdict-${evaluation.verdict}`}>
              {evaluation.verdict === 'correct' && '✓ Correct'}
              {evaluation.verdict === 'partial' && '~ Partial'}
              {evaluation.verdict === 'incorrect' && '✗ Incorrect'}
            </span>
            <span className="score-display">{evaluation.score}%</span>
          </div>

          <div className="eval-body">
            <div className="eval-section">
              <h4>Expected Answer</h4>
              <p>{card.expectedAnswer}</p>
            </div>
            <div className="eval-section">
              <h4>AI Feedback</h4>
              <p className="explanation-text">{evaluation.explanation}</p>
            </div>

            {evaluation.keyMissed && evaluation.keyMissed.length > 0 && (
              <div className="eval-section">
                <h4>Key Points Missed</h4>
                <ul className="missed-points">
                  {evaluation.keyMissed.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <button className="btn-primary" style={{ marginTop: 'auto' }} onClick={handleNext}>
            {currentIndex < cards.length - 1 ? 'Next Card' : 'Finish Session'}
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </div>
      ) : (
        <div className="answer-section slide-up">
          <h3 style={{ margin: 0, fontSize: '1rem' }}>Your Answer</h3>
          <div className="answer-input-wrapper">
            <textarea
              className="form-textarea answer-textarea"
              placeholder="Type your answer here, or use the microphone..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={phase === 'evaluating'}
            />
            <VoiceInput onTranscript={handleTranscript} disabled={phase === 'evaluating'} />
          </div>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!userAnswer.trim() || phase === 'evaluating'}
          >
            {phase === 'evaluating' ? 'Evaluating...' : 'Submit Answer'}
          </button>
        </div>
      )}
    </div>
  );
}
