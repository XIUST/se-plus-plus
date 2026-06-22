import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { TopicSummary } from "@se-plus/shared";
import { fetchTopics, deleteTopic } from "../../shared/api/client";
import { TopicCard } from "../../components/dashboard/TopicCard";

export function Dashboard() {
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Stats
  const [stats, setStats] = useState({ totalStudied: 0, totalCards: 0, totalCorrect: 0 });

  useEffect(() => {
    loadTopics();
    
    // Load stats from localStorage
    try {
      const savedStats = localStorage.getItem("se-plus-stats");
      if (savedStats) {
        setStats(JSON.parse(savedStats));
      }
    } catch (e) {
      console.error("Failed to load stats", e);
    }
  }, []);

  const loadTopics = async () => {
    setLoading(true);
    setError(null);
    const result = await fetchTopics();
    if (result.ok) {
      setTopics(result.data.topics);
    } else {
      setError(result.error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (topic: string) => {
    const result = await deleteTopic(topic);
    if (result.ok) {
      setTopics((prev) => prev.filter((t) => t.topic !== topic));
    } else {
      alert(`Failed to delete topic: ${result.error.message}`);
    }
  };

  const accuracy = stats.totalCards > 0 
    ? Math.round((stats.totalCorrect / stats.totalCards) * 100) 
    : 0;

  return (
    <div className="dashboard-page fade-in">
      <div className="dashboard-hero">
        <h1>Welcome to <span className="gradient-text">Se++</span></h1>
        <p style={{ color: "var(--text-secondary)" }}>Your AI-powered study trainer.</p>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path></svg>
            Topics Available
          </div>
          <div className="stat-value">{topics.length}</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
            Cards Studied
          </div>
          <div className="stat-value">{stats.totalCards}</div>
        </div>

        <div className="stat-card">
          <div className="stat-card-header">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="16 12 12 8 8 12"></polyline><line x1="12" y1="16" x2="12" y2="8"></line></svg>
            Average Accuracy
          </div>
          <div className="stat-value">{accuracy}%</div>
        </div>
      </div>

      <div className="topics-section">
        <h2>Your Study Topics</h2>
        
        {loading ? (
          <div className="loading-spinner"></div>
        ) : error ? (
          <div className="notice error">{error}</div>
        ) : topics.length === 0 ? (
          <div className="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="12" y1="18" x2="12" y2="12"></line><line x1="9" y1="15" x2="15" y2="15"></line></svg>
            <p>You haven't uploaded any study materials yet.</p>
            <button className="btn-primary" style={{ marginTop: '1rem' }} onClick={() => navigate('/ingest')}>
              Ingest Notes
            </button>
          </div>
        ) : (
          <div className="topics-grid">
            {topics.map((topic) => (
              <TopicCard 
                key={topic.topic} 
                topic={topic} 
                onStudy={(t) => navigate(`/study/${encodeURIComponent(t)}`)}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
