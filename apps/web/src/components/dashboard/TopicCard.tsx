import type { TopicSummary } from "@se-plus/shared";
import { useState } from "react";

interface TopicCardProps {
  topic: TopicSummary;
  onStudy: (topic: string) => void;
  onDelete: (topic: string) => void;
}

export function TopicCard({ topic, onStudy, onDelete }: TopicCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    if (showConfirm) {
      onDelete(topic.topic);
    } else {
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
    }
  };

  return (
    <div className="topic-card">
      <div className="topic-card-header">
        <h3>{topic.topic}</h3>
        <button 
          className="btn-danger" 
          onClick={handleDelete}
          title={showConfirm ? "Click again to confirm" : "Delete topic"}
        >
          {showConfirm ? (
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Sure?</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
            </svg>
          )}
        </button>
      </div>
      
      <div className="topic-card-meta">
        <span>{topic.chunkCount} chunks</span>
      </div>
      
      <div className="topic-card-actions">
        <button className="btn-primary" onClick={() => onStudy(topic.topic)}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="5 3 19 12 5 21 5 3"></polygon>
          </svg>
          Study
        </button>
      </div>
    </div>
  );
}
