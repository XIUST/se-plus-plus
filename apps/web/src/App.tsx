import { ContextIngestionPanel } from "./features/context-ingestion/ContextIngestionPanel";

export function App() {
  return (
    <main className="app-shell">
      <section className="workspace">
        <header className="workspace-header">
          <div>
            <p className="eyebrow">Session++</p>
            <h1>Study context ingestion</h1>
          </div>
          <div className="status-strip" aria-label="Pipeline status">
            <span>Notes</span>
            <span>Chunks</span>
            <span>Embeddings</span>
            <span>Review</span>
          </div>
        </header>

        <ContextIngestionPanel />
      </section>
    </main>
  );
}

