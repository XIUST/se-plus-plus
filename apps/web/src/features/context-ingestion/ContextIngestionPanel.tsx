import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import type { ContextIngestionResult, StudySourceKind } from "@se-plus/shared";
import { ingestContext } from "../../shared/api/client";

type SourceMode = "text" | "file";

export function ContextIngestionPanel() {
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [sourceMode, setSourceMode] = useState<SourceMode>("text");
  const [content, setContent] = useState("");
  const [fileKind, setFileKind] = useState<StudySourceKind | null>(null);
  const [fileName, setFileName] = useState("");

  type Status =
    | { type: "idle" }
    | { type: "loading" }
    | { type: "success"; data: ContextIngestionResult }
    | { type: "error"; message: string };

  const [status, setStatus] = useState<Status>({ type: "idle" });
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isValid = topic.trim().length > 0 && content.trim().length >= 20;

  const resetMode = (mode: SourceMode) => {
    setSourceMode(mode);
    setContent("");
    setFileKind(null);
    setFileName("");
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    setStatus({ type: "loading" });

    const kind: StudySourceKind = sourceMode === "file" ? (fileKind ?? "text") : "text";

    const response = await ingestContext({
      topic: topic.trim(),
      ...(title.trim() ? { title: title.trim() } : {}),
      kind,
      content: content.trim(),
    });

    if (response.ok) {
      setStatus({ type: "success", data: response.data });
      setTopic("");
      setTitle("");
      resetMode("text");
    } else {
      setStatus({ type: "error", message: response.error.message });
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file) return;

    if (!title) {
      setTitle(file.name);
    }

    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext === "md" || ext === "markdown") {
      setFileKind("markdown");
    } else {
      setFileKind("text");
    }
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text) setContent(text);
    };
    reader.readAsText(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const onDragLeave = () => {
    setIsDragOver(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="ingestion-page">
      <div className="ingestion-card">
        <h2 style={{ marginBottom: '2rem' }}>Ingest Study Material</h2>

        {status.type === "error" && (
          <div className="notice error">{status.message}</div>
        )}

        {status.type === "success" && (
          <div className="ingestion-result">
            <h3 style={{ color: "var(--success-color)", marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
              Material Ingested Successfully
            </h3>
            <p><strong>Topic:</strong> {status.data.topic}</p>
            <p><strong>Chunks generated:</strong> {status.data.chunkCount}</p>
            <p className="notice info" style={{ marginTop: '1.25rem' }}>
              Your notes are being indexed and will be ready to study in a few moments. If the topic does not appear on the Dashboard right away, please wait up to a minute.
            </p>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/" className="btn-primary">Return to Dashboard</Link>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: status.type === 'success' ? 'none' : 'block' }}>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="topic">Topic (Required)</label>
              <input
                id="topic"
                type="text"
                className="form-input"
                placeholder="e.g. Cellular Biology"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                disabled={status.type === "loading"}
                maxLength={120}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="sourceMode">Input Source</label>
              <select
                id="sourceMode"
                className="form-select"
                value={sourceMode}
                onChange={(e) => resetMode(e.target.value as SourceMode)}
                disabled={status.type === "loading"}
              >
                <option value="text">Plain Text</option>
                <option value="file">File</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="title">Source Title (Optional)</label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g. Chapter 4 Notes"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={status.type === "loading"}
              maxLength={160}
            />
          </div>

          {sourceMode === "file" && (
            <div className="form-group">
              <label className="form-label">Upload File</label>
              <div
                className={`file-drop-zone ${isDragOver ? 'dragover' : ''}`}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                <p style={{ margin: 0 }}>Drag and drop a .txt or .md file here, or click to browse</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".txt,.md,.markdown"
                  onChange={(e) => {
                    if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
                  }}
                />
              </div>
              {fileName && (
                <span className="char-count">Loaded: {fileName}</span>
              )}
            </div>
          )}

          {sourceMode === "text" && (
            <div className="form-group">
              <label className="form-label" htmlFor="content">Study Material</label>
              <textarea
                id="content"
                className="form-textarea"
                placeholder="Paste your study notes here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={status.type === "loading"}
              />
              <span className="char-count">{content.length} characters (min 20)</span>
            </div>
          )}

          {status.type === "loading" && (
            <div className="ingestion-progress">
              <div className="ingestion-progress-bar"></div>
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              className="btn-primary"
              disabled={!isValid || status.type === "loading"}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
              {status.type === "loading" ? "Processing & Embedding..." : "Generate Embeddings"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setContent("")}
              disabled={content.length === 0 || status.type === "loading"}
            >
              Clear Text
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
