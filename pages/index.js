import { useEffect, useState, useCallback } from "react";
import Head from "next/head";
import AdminPanel from "../components/AdminPanel";
import JudgePanel from "../components/JudgePanel";
import ResultsPanel from "../components/ResultsPanel";
import PasswordGate from "../components/PasswordGate";

const TABS = [
  { id: "judge", label: "Judge" },
  { id: "results", label: "Results" },
  { id: "admin", label: "Admin" },
];

export default function Home() {
  const [state, setState] = useState(null);
  const [tab, setTab] = useState("judge");
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      const data = await res.json();
      setState(data);
      setError(null);
    } catch (e) {
      setError("Could not reach the server. Retrying…");
    }
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 6000);
    return () => clearInterval(interval);
  }, [load]);

  async function patchState(patch) {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    setState(data);
  }

  async function submitScore(judgeId, participantId, scores) {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ judgeId, participantId, scores }),
    });
    const data = await res.json();
    setState((s) => ({ ...s, scores: data.scores }));
  }

  return (
    <>
      <Head>
        <title>{state ? state.eventName : "Judging Scoresheet"}</title>
      </Head>
      <div className="shell">
        <header className="masthead">
          <div>
            <h1>{state ? state.eventName : "Loading…"}</h1>
            <div className="tag">Live scoring &amp; automatic tally</div>
          </div>
          <div className="masthead-meta">
            <div>
              <span className={`dot ${state?._fallback ? "warn" : ""}`} />
              {state?._fallback ? "local storage (dev mode)" : "shared live database"}
            </div>
            <div>{state ? `${state.participants.length} participants · ${state.judges.length} judges` : ""}</div>
          </div>
        </header>

        {error && <div className="banner warn">{error}</div>}

        {state?._fallback && (
          <div className="banner warn">
            Running on local file storage — scores won&apos;t sync between different devices.
            Add the Vercel KV integration in your Vercel project settings so all judges share one
            live scoresheet. See the README for setup steps.
          </div>
        )}

        <nav className="tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`tab ${tab === t.id ? "active" : ""}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {!state && <div className="empty">Loading scoresheet…</div>}

        {state && tab === "admin" && (
          <PasswordGate
            storageKey="judging_admin_unlocked"
            title="Admin access"
            hint="This tab manages criteria, participants and judges. Enter the admin password to continue."
          >
            <AdminPanel state={state} onPatch={patchState} />
          </PasswordGate>
        )}
        {state && tab === "judge" && <JudgePanel state={state} onSubmitScore={submitScore} />}
        {state && tab === "results" && (
          <PasswordGate
            storageKey="judging_results_unlocked"
            title="Results access"
            hint="Live scores and rankings are password-protected. Enter the password to view them."
          >
            <ResultsPanel state={state} />
          </PasswordGate>
        )}

        <div className="footer-note">
          scores refresh automatically every 6s · export results as CSV from the Results tab
        </div>
      </div>
    </>
  );
}
