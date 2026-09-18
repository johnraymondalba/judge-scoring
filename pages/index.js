import { useCallback, useEffect, useState } from "react";
import Head from "next/head";
import AdminPanel from "../components/AdminPanel";
import JudgePanel from "../components/JudgePanel";
import ResultsPanel from "../components/ResultsPanel";
import RoleChooser from "../components/RoleChooser";
import LoginForm from "../components/LoginForm";

const ADMIN_TABS = [
  { id: "admin", label: "Setup" },
  { id: "results", label: "Results" },
];

export default function Home() {
  const [state, setState] = useState(null);
  const [session, setSession] = useState(null);
  const [warnings, setWarnings] = useState(null);
  const [authView, setAuthView] = useState("choose"); // choose | judge | admin
  const [tab, setTab] = useState("admin");
  const [booted, setBooted] = useState(false);
  const [error, setError] = useState(null);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch("/api/state");
      setState(await res.json());
      setError(null);
    } catch (e) {
      setError("Could not reach the server. Retrying…");
    }
  }, []);

  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/session");
      const data = await res.json();
      setSession(data.session);
      setWarnings(data.warnings || null);
      return data.session;
    } catch (e) {
      return null;
    }
  }, []);

  useEffect(() => {
    (async () => {
      await Promise.all([loadSession(), loadState()]);
      setBooted(true);
    })();
  }, [loadSession, loadState]);

  // Only poll once somebody is signed in — there is nothing live to watch on
  // the sign-in screen, and it keeps idle phones off the network.
  useEffect(() => {
    if (!session) return undefined;
    const interval = setInterval(loadState, 6000);
    return () => clearInterval(interval);
  }, [session, loadState]);

  async function handleSignedIn(newSession) {
    setSession(newSession);
    await Promise.all([loadSession(), loadState()]);
  }

  async function signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
    setSession(null);
    setWarnings(null);
    setAuthView("choose");
    await loadState();
  }

  async function patchState(patch) {
    const res = await fetch("/api/state", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) await signOut();
      throw new Error(data.error || "Could not save changes.");
    }
    setState(data);
    return data;
  }

  async function submitScore(participantId, scores) {
    const res = await fetch("/api/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ participantId, scores }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) await signOut();
      throw new Error(data.error || "Could not save that score.");
    }
    setState((s) => ({ ...s, scores: { ...s.scores, [data.key]: data.entry } }));
  }

  const eventName = state ? state.eventName : "Judging Scoresheet";
  const isAdmin = session && session.role === "admin";
  const isJudge = session && session.role === "judge";

  return (
    <>
      <Head>
        <title>{eventName}</title>
      </Head>
      <div className="shell">
        <header className="masthead">
          <div>
            <h1>{booted ? eventName : "Loading…"}</h1>
            <div className="tag">Live scoring &amp; automatic tally</div>
          </div>
          {session && (
            <div className="masthead-meta">
              <div className="who">
                <span className="dot" />
                {isJudge ? `Judging as ${session.judgeName}` : "Organizer"}
              </div>
              <button className="btn-icon" onClick={signOut}>
                Sign out
              </button>
            </div>
          )}
        </header>

        {error && <div className="banner warn">{error}</div>}

        {/* Storage and configuration warnings are organizer business — judges
            shouldn't be shown deployment errata mid-event. */}
        {isAdmin && state && state._fallback && (
          <div className="banner warn">
            Running on local file storage — scores won&apos;t sync between different devices.
            Add a Redis database in your Vercel project settings so every judge shares one live
            scoresheet. See the README for setup steps.
          </div>
        )}
        {isAdmin && warnings && (warnings.defaultAdminPassword || warnings.defaultSessionSecret) && (
          <div className="banner warn">
            This deployment is still using the built-in development credentials. Set{" "}
            {warnings.defaultAdminPassword && <code>ADMIN_PASSWORD</code>}
            {warnings.defaultAdminPassword && warnings.defaultSessionSecret && " and "}
            {warnings.defaultSessionSecret && <code>SESSION_SECRET</code>} as environment variables
            before the real event.
          </div>
        )}

        {!booted && <div className="empty">Loading scoresheet…</div>}

        {booted && !session && authView === "choose" && (
          <RoleChooser eventName={eventName} onChoose={setAuthView} />
        )}

        {booted && !session && authView !== "choose" && (
          <LoginForm
            role={authView}
            judges={state ? state.judges : []}
            onBack={() => setAuthView("choose")}
            onSignedIn={handleSignedIn}
          />
        )}

        {booted && state && isJudge && (
          <JudgePanel state={state} judge={session} onSubmitScore={submitScore} />
        )}

        {booted && state && isAdmin && (
          <>
            <nav className="tabs">
              {ADMIN_TABS.map((t) => (
                <button
                  key={t.id}
                  className={`tab ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            {tab === "admin" && <AdminPanel state={state} onPatch={patchState} />}
            {tab === "results" && <ResultsPanel state={state} />}
          </>
        )}

        <div className="footer-note">
          {session
            ? "scores refresh automatically every 6s"
            : "sign in to continue"}
        </div>
      </div>
    </>
  );
}
