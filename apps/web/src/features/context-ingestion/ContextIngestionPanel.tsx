import { useMemo, useState } from "react";
import type { ContextIngestionResult, StudySourceKind } from "@se-plus/shared";
import { ingestContext } from "../../shared/api/client";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: ContextIngestionResult }
  | { kind: "error"; message: string };

const sampleText =
  "Paste lecture notes, textbook excerpts, or markdown here. Se++ will split the material into study-sized chunks and store semantic embeddings for later flashcard generation.";

export function ContextIngestionPanel() {
  const [topic, setTopic] = useState("");
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<StudySourceKind>("markdown");
  const [content, setContent] = useState(sampleText);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const characterCount = content.trim().length;
  const canSubmit = topic.trim().length > 0 && characterCount >= 20 && status.kind !== "loading";

  const result = status.kind === "success" ? status.result : undefined;
  const statusMessage = useMemo(() => {
    if (status.kind === "loading") {
      return "Embedding study context...";
    }

    if (status.kind === "success") {
      return "Context is ready for retrieval.";
    }

    if (status.kind === "error") {
      return status.message;
    }

    return "Waiting for study material.";
  }, [status]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    setStatus({ kind: "loading" });

    const trimmedTitle = title.trim();
    const response = await ingestContext({
      topic: topic.trim(),
      ...(trimmedTitle ? { title: trimmedTitle } : {}),
      kind,
      content: content.trim(),
    });

    if (response.ok) {
      setStatus({ kind: "success", result: response.data });
      return;
    }

    setStatus({ kind: "error", message: response.error.message });
  }

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const text = await file.text();
    setContent(text);
    setTitle((current) => current || file.name.replace(/\.(md|markdown|txt)$/i, ""));
    setKind(file.name.match(/\.md|\.markdown/i) ? "markdown" : "text");
  }

  return (
    <div className="ingestion-layout">
      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="field-grid">
          <div className="field">
            <label htmlFor="topic">Topic</label>
            <input
              id="topic"
              maxLength={120}
              onChange={(event) => setTopic(event.target.value)}
              placeholder="e.g. Cellular respiration"
              value={topic}
            />
          </div>

          <div className="field">
            <label htmlFor="title">Source title</label>
            <input
              id="title"
              maxLength={160}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Optional"
              value={title}
            />
          </div>
        </div>

        <div className="field">
          <label htmlFor="kind">Source type</label>
          <select
            id="kind"
            onChange={(event) => setKind(event.target.value as StudySourceKind)}
            value={kind}
          >
            <option value="markdown">Markdown notes</option>
            <option value="text">Plain text</option>
            <option value="topic">Topic outline</option>
          </select>
        </div>

        <div className="file-row">
          <span className="upload-label">Upload notes</span>
          <input accept=".md,.markdown,.txt,text/markdown,text/plain" onChange={handleFileChange} type="file" />
        </div>

        <div className="field">
          <label htmlFor="content">Study material</label>
          <textarea
            id="content"
            onChange={(event) => setContent(event.target.value)}
            value={content}
          />
          <p className="hint">{characterCount.toLocaleString()} characters. Minimum 20 characters.</p>
        </div>

        <div className="actions">
          <button className="primary-button" disabled={!canSubmit} type="submit">
            {status.kind === "loading" ? "Processing..." : "Generate embeddings"}
          </button>
          <button className="secondary-button" onClick={() => setContent("")} type="button">
            Clear text
          </button>
        </div>
      </form>

      <aside className="result-panel" aria-live="polite">
        <p className="panel-label">Ingestion result</p>
        <h2>{statusMessage}</h2>

        <dl className="metric-list">
          <div className="metric-row">
            <dt>Topic</dt>
            <dd>{result?.topic ?? "None"}</dd>
          </div>
          <div className="metric-row">
            <dt>Source</dt>
            <dd>{result?.title ?? "Not ingested"}</dd>
          </div>
          <div className="metric-row">
            <dt>Chunks</dt>
            <dd>{result?.chunkCount ?? 0}</dd>
          </div>
          <div className="metric-row">
            <dt>Source ID</dt>
            <dd>{result?.sourceId ?? "-"}</dd>
          </div>
        </dl>

        {status.kind === "success" ? (
          <p className="notice success">The Worker stored vectors for this source. Flashcard generation can retrieve this context next.</p>
        ) : null}

        {status.kind === "error" ? <p className="notice error">{status.message}</p> : null}
      </aside>
    </div>
  );
}
