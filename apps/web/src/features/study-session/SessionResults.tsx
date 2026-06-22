import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { SessionResult } from "@se-plus/shared";
import { ProgressRing } from "../../components/progress/ProgressRing";

export function SessionResults() {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state as SessionResult | undefined;

  useEffect(() => {
    if (!result) {
      navigate("/");
      return;
    }

    try {
      const savedStatsStr = localStorage.getItem("se-plus-stats");
      const savedStats = savedStatsStr 
        ? JSON.parse(savedStatsStr) 
        : { totalStudied: 0, totalCards: 0, totalCorrect: 0 };
      
      localStorage.setItem("se-plus-stats", JSON.stringify({
        totalStudied: savedStats.totalStudied + 1,
        totalCards: savedStats.totalCards + result.totalCards,
        totalCorrect: savedStats.totalCorrect + result.correct,
      }));
    } catch (e) {
      console.error("Failed to save stats", e);
    }
  }, [result, navigate]);

  if (!result) return null;

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="results-page">
      <div className="results-card">
        <div className="results-header">
          <h2>Session Complete</h2>
          <p style={{ color: "var(--text-secondary)" }}>{result.topic}</p>
        </div>

        <ProgressRing percentage={result.averageScore} size={160} strokeWidth={12} />

        <div className="results-breakdown">
          <div className="breakdown-item correct">
            <span className="count">{result.correct}</span>
            <span className="label">Correct</span>
          </div>
          <div className="breakdown-item partial">
            <span className="count">{result.partial}</span>
            <span className="label">Partial</span>
          </div>
          <div className="breakdown-item incorrect">
            <span className="count">{result.incorrect}</span>
            <span className="label">Incorrect</span>
          </div>
        </div>

        {result.weakSpots.length > 0 && (
          <div className="weak-spots-section">
            <h4>Areas to Review</h4>
            <div className="weak-spots-list">
              {result.weakSpots.map((spot, idx) => (
                <span key={idx} className="weak-spot-item">{spot}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          Duration: {formatDuration(result.durationSeconds)}
        </div>

        <div className="results-actions">
          <button className="btn-secondary" onClick={() => navigate('/')}>
            Back to Dashboard
          </button>
          <button className="btn-primary" onClick={() => navigate(`/study/${encodeURIComponent(result.topic)}`)}>
            Study Again
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-9.21l-5.45-5.04"></path></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
