import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./features/dashboard/Dashboard";
import { ContextIngestionPanel } from "./features/context-ingestion/ContextIngestionPanel";
import { StudySession } from "./features/study-session/StudySession";
import { SessionResults } from "./features/study-session/SessionResults";

export function App() {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        <div className="page-container">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/ingest" element={<ContextIngestionPanel />} />
            <Route path="/study/:topic" element={<StudySession />} />
            <Route path="/results" element={<SessionResults />} />
          </Routes>
        </div>
      </main>
    </div>
  );
}
